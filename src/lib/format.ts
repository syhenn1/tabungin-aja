export type TxType = "income" | "expense" | "transfer";
export type Tx = {
  id: number;
  type: TxType;
  amount: number;
  category: string;
  note: string | null;
  occurred_on: string; // YYYY-MM-DD
  wallet_id: number;
  to_wallet_id: number | null;
};

export const CATEGORIES: Record<TxType, string[]> = {
  income: ["Gaji", "Bonus", "Usaha", "Investasi", "Hadiah", "Lainnya"],
  expense: ["Makan", "Transportasi", "Belanja", "Tagihan", "Hiburan", "Kesehatan", "Pendidikan", "Lainnya"],
  transfer: ["Transfer"],
};

export type WalletKind = "cash" | "bank" | "ewallet" | "other";
export type Wallet = {
  id: number;
  name: string;
  kind: WalletKind;
  provider: string;
  initial_balance: number;
  archived: boolean;
  balance: number;
};

export const WALLET_KINDS: Record<WalletKind, { label: string; providers: string[] }> = {
  cash: { label: "Tunai", providers: ["Tunai"] },
  bank: {
    label: "Bank",
    providers: ["BCA", "BRI", "Mandiri", "BNI", "BSI", "CIMB Niaga", "Permata", "BTN", "Danamon", "OCBC", "Bank Jago", "SeaBank", "blu by BCA Digital", "Jenius", "Allo Bank", "Bank Lainnya"],
  },
  ewallet: { label: "E-Wallet", providers: ["GoPay", "OVO", "DANA", "ShopeePay", "LinkAja", "i.saku", "Flip", "E-Wallet Lainnya"] },
  other: { label: "Lainnya", providers: ["Tabungan / Celengan", "Investasi", "Kartu Kredit", "Lainnya"] },
};

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
export const formatRp = (n: number) => rupiah.format(n);

const compact = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });
export const formatShort = (n: number) => compact.format(n);

// ponytail: zona waktu tetap WIB; jadikan preferensi per pengguna kalau ada pengguna di luar WIB.
export const TZ = "Asia/Jakarta";
export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });

// Aritmetika tanggal di UTC supaya tidak bergeser karena zona waktu server.
const d = (iso: string) => new Date(iso + "T00:00:00Z");
const iso = (x: Date) => x.toISOString().slice(0, 10);

export function addDays(s: string, n: number) {
  const x = d(s);
  x.setUTCDate(x.getUTCDate() + n);
  return iso(x);
}
export function addMonths(s: string, n: number) {
  const x = d(s);
  return iso(new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + n, 1)));
}
export const monthStart = (s: string) => s.slice(0, 8) + "01";
export const yearStart = (s: string) => s.slice(0, 5) + "01-01";
export const monthEnd = (s: string) => addDays(addMonths(s, 1), -1);

export function formatDate(s: string, opts: Intl.DateTimeFormatOptions) {
  return d(s).toLocaleDateString("id-ID", { timeZone: "UTC", ...opts });
}

export function dayLabel(s: string) {
  const t = today();
  if (s === t) return "Hari ini";
  if (s === addDays(t, -1)) return "Kemarin";
  return formatDate(s, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function greeting() {
  const h = Number(new Date().toLocaleString("en-US", { hour: "numeric", hourCycle: "h23", timeZone: TZ }));
  return h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam";
}
