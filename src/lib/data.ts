import "server-only";
import { cache } from "react";
import { requireUser } from "./supabase";
import { addDays, addMonths, monthEnd, monthStart, today, yearStart, type Tx, type Wallet } from "./format";

export type Unit = "day" | "month" | "year";
export type Bucket = { bucket: string; income: number; expense: number };

const TX_COLUMNS = "id, type, amount, category, note, occurred_on, wallet_id, to_wallet_id";

async function cashflow(from: string, to: string, unit: Unit): Promise<Bucket[]> {
  const { db } = await requireUser();
  const { data, error } = await db.rpc("cashflow", { p_from: from, p_to: to, p_unit: unit });
  if (error) throw error;
  return data;
}

// Isi bucket kosong supaya grafik tetap berurutan tanpa celah.
function fill(rows: Bucket[], keys: string[]): Bucket[] {
  const map = new Map(rows.map((r) => [r.bucket, r]));
  return keys.map((k) => map.get(k) ?? { bucket: k, income: 0, expense: 0 });
}

// Semua dompet + saldonya. cache(): layout dan halaman berbagi satu query per request.
export const getWallets = cache(async (): Promise<Wallet[]> => {
  const { db } = await requireUser();
  const [wallets, balances] = await Promise.all([
    db.from("wallets").select("id, name, kind, provider, initial_balance, archived").order("archived").order("id"),
    db.rpc("wallet_balances"),
  ]);
  if (wallets.error) throw wallets.error;
  if (balances.error) throw balances.error;
  const bal = new Map((balances.data as { wallet_id: number; balance: number }[]).map((b) => [b.wallet_id, b.balance]));
  return wallets.data.map((w) => ({ ...w, balance: bal.get(w.id) ?? w.initial_balance }) as Wallet);
});

export async function getDashboard() {
  const { db, user } = await requireUser();
  const t = today();
  const [wallets, months, days, recent] = await Promise.all([
    getWallets(),
    cashflow(yearStart(t), t, "month"),
    cashflow(addDays(t, -6), t, "day"),
    db.from("transactions").select(TX_COLUMNS).order("occurred_on", { ascending: false }).order("id", { ascending: false }).limit(5),
  ]);
  if (recent.error) throw recent.error;

  const sum = (rows: Bucket[]) => rows.reduce((a, r) => ({ income: a.income + r.income, expense: a.expense + r.expense }), { income: 0, expense: 0 });
  const week = fill(days, Array.from({ length: 7 }, (_, i) => addDays(t, i - 6)));

  return {
    user,
    wallets,
    balance: wallets.reduce((a, w) => a + w.balance, 0),
    periods: {
      today: sum(days.filter((r) => r.bucket === t)),
      month: sum(months.filter((r) => r.bucket === monthStart(t))),
      year: sum(months),
    },
    week,
    recent: recent.data as Tx[],
  };
}

export async function getMonthTx(month: string, walletId?: number) {
  const { db } = await requireUser();
  const from = month + "-01";
  let q = db.from("transactions").select(TX_COLUMNS).gte("occurred_on", from).lte("occurred_on", monthEnd(from));
  if (walletId) q = q.or(`wallet_id.eq.${walletId},to_wallet_id.eq.${walletId}`);
  const { data, error } = await q.order("occurred_on", { ascending: false }).order("id", { ascending: false });
  if (error) throw error;
  return data as Tx[];
}

// Laporan: 14 hari terakhir, 12 bulan terakhir, atau 5 tahun terakhir.
export async function getReport(unit: Unit) {
  const t = today();
  let keys: string[];
  if (unit === "day") keys = Array.from({ length: 14 }, (_, i) => addDays(t, i - 13));
  else if (unit === "month") keys = Array.from({ length: 12 }, (_, i) => addMonths(t, i - 11));
  else keys = Array.from({ length: 5 }, (_, i) => `${Number(t.slice(0, 4)) - 4 + i}-01-01`);
  return fill(await cashflow(keys[0], t, unit), keys);
}

// Total pengeluaran dikelompokkan per kunci (kategori atau dompet), terbesar dulu.
export function expenseBy<K>(rows: Tx[], key: (r: Tx) => K) {
  const map = new Map<K, number>();
  for (const r of rows) if (r.type === "expense") map.set(key(r), (map.get(key(r)) ?? 0) + r.amount);
  return [...map].map(([k, amount]) => ({ key: k, amount })).sort((a, b) => b.amount - a.amount);
}
