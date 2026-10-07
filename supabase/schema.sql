-- Tabungin: jalankan sekali di Supabase Dashboard > SQL Editor.

create table public.transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount bigint not null check (amount > 0 and amount <= 1000000000000), -- rupiah, tanpa desimal
  category text not null check (char_length(category) between 1 and 40),
  note text check (char_length(note) <= 200),
  occurred_on date not null,
  created_at timestamptz not null default now()
);

create index transactions_user_date_idx on public.transactions (user_id, occurred_on desc, id desc);

alter table public.transactions enable row level security;

-- Tabel baru di schema public tidak otomatis terbuka ke Data API, jadi grant eksplisit.
revoke all on public.transactions from anon;
grant select, insert, update, delete on public.transactions to authenticated;

create policy "select own" on public.transactions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "insert own" on public.transactions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "update own" on public.transactions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "delete own" on public.transactions for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Ringkasan pemasukan/pengeluaran per hari/minggu/bulan/tahun.
-- security invoker: tetap tunduk pada RLS milik pemanggil.
create function public.cashflow(p_from date, p_to date, p_unit text)
returns table (bucket date, income bigint, expense bigint)
language sql stable security invoker set search_path = ''
as $$
  select date_trunc(p_unit, t.occurred_on::timestamp)::date,
         coalesce(sum(t.amount) filter (where t.type = 'income'), 0)::bigint,
         coalesce(sum(t.amount) filter (where t.type = 'expense'), 0)::bigint
  from public.transactions t
  where t.user_id = (select auth.uid())
    and t.occurred_on between p_from and p_to
    and p_unit in ('day', 'week', 'month', 'year')
  group by 1
  order by 1
$$;

-- Total sepanjang waktu (untuk saldo).
create function public.totals()
returns table (income bigint, expense bigint)
language sql stable security invoker set search_path = ''
as $$
  select coalesce(sum(amount) filter (where type = 'income'), 0)::bigint,
         coalesce(sum(amount) filter (where type = 'expense'), 0)::bigint
  from public.transactions
  where user_id = (select auth.uid())
$$;

revoke execute on function public.cashflow(date, date, text), public.totals() from public, anon;
grant execute on function public.cashflow(date, date, text), public.totals() to authenticated;
