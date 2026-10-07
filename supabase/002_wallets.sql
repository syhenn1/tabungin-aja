-- Tabungin: dompet / sumber dana. Jalankan SETELAH schema.sql, sekali saja, di SQL Editor.

create table public.wallets (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  kind text not null check (kind in ('cash', 'bank', 'ewallet', 'other')),
  provider text not null check (char_length(provider) between 1 and 40),
  -- ponytail: saldo awal >= 0; utang kartu kredit awal belum bisa dicatat, longgarkan kalau dibutuhkan.
  initial_balance bigint not null default 0 check (initial_balance between 0 and 1000000000000),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, user_id) -- target FK komposit: transaksi hanya boleh memakai dompet pemiliknya sendiri
);

create index wallets_user_idx on public.wallets (user_id);

alter table public.wallets enable row level security;
revoke all on public.wallets from anon;
grant select, insert, update, delete on public.wallets to authenticated;

create policy "select own" on public.wallets for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "insert own" on public.wallets for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "update own" on public.wallets for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "delete own" on public.wallets for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Setiap pengguna selalu punya dompet "Tunai": pengguna lama diisi sekarang, pengguna baru lewat trigger.
insert into public.wallets (user_id, name, kind, provider)
select u.id, 'Tunai', 'cash', 'Tunai' from auth.users u;

create schema if not exists private;

create function private.create_default_wallet()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.wallets (user_id, name, kind, provider) values (new.id, 'Tunai', 'cash', 'Tunai');
  return new;
end;
$$;

revoke execute on function private.create_default_wallet() from public, anon, authenticated;

create trigger on_auth_user_created_wallet
  after insert on auth.users
  for each row execute function private.create_default_wallet();

-- Transaksi: sumber dana + jenis transfer (dari wallet_id ke to_wallet_id).
alter table public.transactions
  add column wallet_id bigint,
  add column to_wallet_id bigint;

update public.transactions t
set wallet_id = w.id
from public.wallets w
where w.user_id = t.user_id and w.kind = 'cash';

alter table public.transactions
  alter column wallet_id set not null,
  drop constraint transactions_type_check,
  add constraint transactions_type_check check (type in ('income', 'expense', 'transfer')),
  add constraint transactions_wallet_fk foreign key (wallet_id, user_id) references public.wallets (id, user_id),
  add constraint transactions_to_wallet_fk foreign key (to_wallet_id, user_id) references public.wallets (id, user_id),
  add constraint transactions_transfer_shape check (
    (type = 'transfer') = (to_wallet_id is not null) and to_wallet_id is distinct from wallet_id
  );

create index transactions_wallet_idx on public.transactions (wallet_id);
create index transactions_to_wallet_idx on public.transactions (to_wallet_id) where to_wallet_id is not null;

-- Saldo per dompet: saldo awal + pemasukan - pengeluaran - transfer keluar + transfer masuk.
create function public.wallet_balances()
returns table (wallet_id bigint, balance bigint)
language sql stable security invoker set search_path = ''
as $$
  select w.id,
         (w.initial_balance + coalesce(sum(
           case
             when t.to_wallet_id = w.id then t.amount
             when t.type = 'income' then t.amount
             else -t.amount
           end), 0))::bigint
  from public.wallets w
  left join public.transactions t on t.wallet_id = w.id or t.to_wallet_id = w.id
  where w.user_id = (select auth.uid())
  group by w.id
$$;

revoke execute on function public.wallet_balances() from public, anon;
grant execute on function public.wallet_balances() to authenticated;

-- Saldo total kini dari wallet_balances(); totals() tidak dipakai lagi.
drop function public.totals();
