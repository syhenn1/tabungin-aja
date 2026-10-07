"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser, supabase } from "@/lib/supabase";
import { CATEGORIES, WALLET_KINDS, type TxType, type WalletKind } from "@/lib/format";

export type FormState = { error?: string; ok?: string } | null;

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function login(_: FormState, f: FormData): Promise<FormState> {
  const db = await supabase();
  const { error } = await db.auth.signInWithPassword({ email: str(f, "email"), password: str(f, "password") });
  if (error) {
    return { error: error.code === "email_not_confirmed" ? "Email belum dikonfirmasi. Cek inbox kamu." : "Email atau kata sandi salah." };
  }
  redirect("/");
}

export async function register(_: FormState, f: FormData): Promise<FormState> {
  const name = str(f, "name");
  const email = str(f, "email");
  const password = str(f, "password");
  if (name.length < 2 || name.length > 50) return { error: "Nama harus 2 sampai 50 karakter." };
  if (password.length < 8) return { error: "Kata sandi minimal 8 karakter." };

  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  const db = await supabase();
  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: { data: { full_name: name }, emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) {
    if (error.code === "user_already_exists") return { error: "Email sudah terdaftar. Silakan masuk." };
    if (error.code === "weak_password") return { error: "Kata sandi terlalu lemah. Gunakan kombinasi huruf dan angka." };
    if (error.code === "over_email_send_rate_limit") return { error: "Terlalu banyak percobaan. Coba lagi beberapa saat lagi." };
    return { error: error.message };
  }
  // Konfirmasi email nonaktif: langsung punya sesi.
  if (data.session) redirect("/");
  return { ok: "Akun dibuat. Cek email kamu untuk konfirmasi, lalu masuk." };
}

export async function logout() {
  const db = await supabase();
  await db.auth.signOut();
  redirect("/login");
}

export async function saveTx(_: FormState, f: FormData): Promise<FormState> {
  const { db } = await requireUser();
  const type = str(f, "type") as TxType;
  const amount = Number(str(f, "amount").replace(/\D/g, ""));
  const category = type === "transfer" ? "Transfer" : str(f, "category");
  const note = str(f, "note").slice(0, 200) || null;
  const occurred_on = str(f, "occurred_on");
  const id = Number(str(f, "id")) || null;
  const wallet_id = Number(str(f, "wallet_id")) || 0;
  const to_wallet_id = type === "transfer" ? Number(str(f, "to_wallet_id")) || 0 : null;

  if (type !== "income" && type !== "expense" && type !== "transfer") return { error: "Jenis transaksi tidak valid." };
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1e12) return { error: "Masukkan nominal yang valid." };
  if (!CATEGORIES[type].includes(category)) return { error: "Pilih kategori." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurred_on)) return { error: "Tanggal tidak valid." };
  if (!wallet_id) return { error: "Pilih dompet." };
  if (to_wallet_id === 0 || to_wallet_id === wallet_id) return { error: "Pilih dompet tujuan yang berbeda." };

  const row = { type, amount, category, note, occurred_on, wallet_id, to_wallet_id };
  // RLS + FK komposit memastikan baris dan dompetnya milik pengguna sendiri.
  const { error } = id ? await db.from("transactions").update(row).eq("id", id) : await db.from("transactions").insert(row);
  if (error) return { error: "Gagal menyimpan. Coba lagi." };
  refresh();
  return { ok: id ? "Transaksi diperbarui" : { income: "Pemasukan tercatat", expense: "Pengeluaran tercatat", transfer: "Transfer tercatat" }[type] };
}

export async function deleteTx(id: number) {
  const { db } = await requireUser();
  const { error } = await db.from("transactions").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus." };
  refresh();
  return { ok: "Transaksi dihapus" };
}

export async function saveWallet(_: FormState, f: FormData): Promise<FormState> {
  const { db } = await requireUser();
  const id = Number(str(f, "id")) || null;
  const kind = str(f, "kind") as WalletKind;
  const provider = str(f, "provider");
  const name = str(f, "name").slice(0, 40) || provider;
  const initial_balance = Number(str(f, "initial_balance").replace(/\D/g, "") || 0);

  if (!Object.hasOwn(WALLET_KINDS, kind)) return { error: "Jenis dompet tidak valid." };
  if (!WALLET_KINDS[kind].providers.includes(provider)) return { error: "Pilih penyedia." };
  if (!Number.isSafeInteger(initial_balance) || initial_balance > 1e12) return { error: "Saldo awal tidak valid." };

  const row = { kind, provider, name, initial_balance };
  const { error } = id ? await db.from("wallets").update(row).eq("id", id) : await db.from("wallets").insert(row);
  if (error) return { error: "Gagal menyimpan dompet." };
  refresh();
  return { ok: id ? "Dompet diperbarui" : "Dompet ditambahkan" };
}

type OnboardingWallet = { kind: WalletKind; provider: string; balance: number };

/** Simpan hasil onboarding (atau lewati, jika daftar kosong) lalu tandai selesai. */
export async function finishOnboarding(_: FormState, f: FormData): Promise<FormState> {
  const { db } = await requireUser();
  let items: OnboardingWallet[];
  try {
    items = JSON.parse(str(f, "wallets") || "[]");
  } catch {
    return { error: "Data dompet tidak valid." };
  }
  const valid =
    Array.isArray(items) &&
    items.length <= 30 &&
    items.every(
      (i) =>
        Object.hasOwn(WALLET_KINDS, i?.kind) &&
        WALLET_KINDS[i.kind].providers.includes(i.provider) &&
        Number.isSafeInteger(i.balance) &&
        i.balance >= 0 &&
        i.balance <= 1e12,
    );
  if (!valid) return { error: "Data dompet tidak valid." };

  // Dompet Tunai bawaan (dibuat trigger) cukup diisi saldonya; sisanya dompet baru.
  const others = items.filter((i) => i.kind !== "cash");
  const cash = items.find((i) => i.kind === "cash");
  if (cash) {
    const { data } = await db.from("wallets").select("id").eq("kind", "cash").order("id").limit(1);
    if (data?.[0]) {
      const { error } = await db.from("wallets").update({ initial_balance: cash.balance }).eq("id", data[0].id);
      if (error) return { error: "Gagal menyimpan saldo tunai." };
    } else others.push(cash);
  }
  if (others.length) {
    const rows = others.map((i) => ({ kind: i.kind, provider: i.provider, name: i.provider, initial_balance: i.balance }));
    const { error } = await db.from("wallets").insert(rows);
    if (error) return { error: "Gagal menyimpan dompet." };
  }

  const { error } = await db.auth.updateUser({ data: { onboarded: true } });
  if (error) return { error: "Gagal menyimpan. Coba lagi." };
  // JWT baru supaya penanda onboarded langsung terbaca oleh getClaims().
  await db.auth.refreshSession();
  redirect(f.get("tour") ? "/?tur=1" : "/");
}

export async function setWalletArchived(id: number, archived: boolean) {
  const { db } = await requireUser();
  const { error } = await db.from("wallets").update({ archived }).eq("id", id);
  if (error) return { error: "Gagal mengubah dompet." };
  refresh();
  return { ok: archived ? "Dompet diarsipkan" : "Dompet diaktifkan lagi" };
}

export async function deleteWallet(id: number) {
  const { db } = await requireUser();
  const { error } = await db.from("wallets").delete().eq("id", id);
  // 23503 = masih dipakai transaksi (FK). Dompet yang punya riwayat cukup diarsipkan.
  if (error) return { error: error.code === "23503" ? "Dompet ini punya transaksi. Arsipkan saja." : "Gagal menghapus dompet." };
  refresh();
  return { ok: "Dompet dihapus" };
}
