"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import {
  ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Banknote, Briefcase, Bus, Ellipsis, Eye, EyeOff, Gamepad2, Gift, GraduationCap,
  HeartPulse, Landmark, Pencil, PiggyBank, Plus, ReceiptText, ShoppingBag, Smartphone, Sparkles, Store, TrendingUp, Utensils, type LucideIcon,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { dayLabel, formatRp, WALLET_KINDS, type Tx, type Wallet, type WalletKind } from "@/lib/format";
import { PatRot } from "./PatRot";
import { useTxSheet } from "./TxSheet";

/** Angka rupiah yang "menghitung" naik/turun saat nilainya berubah. */
export function AnimatedRp({ value, hidden = false }: { value: number; hidden?: boolean }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => formatRp(Math.round(v)));
  useEffect(() => {
    const c = animate(mv, value, { duration: 1.1, ease: [0.16, 1, 0.3, 1] });
    return c.stop;
  }, [mv, value]);
  if (hidden) return <span>Rp &bull;&bull;&bull;&bull;&bull;&bull;</span>;
  return <motion.span>{text}</motion.span>;
}

const ICONS: Record<string, LucideIcon> = {
  Gaji: Briefcase, Bonus: Sparkles, Usaha: Store, Investasi: TrendingUp, Hadiah: Gift,
  Makan: Utensils, Transportasi: Bus, Belanja: ShoppingBag, Tagihan: ReceiptText,
  Hiburan: Gamepad2, Kesehatan: HeartPulse, Pendidikan: GraduationCap, Transfer: ArrowLeftRight,
};
const TINTS = ["#2f39a9", "#2e6fa0", "#49a4bb", "#0fb898"];

export function CategoryIcon({ name, size = 44 }: { name: string; size?: number }) {
  const Icon = ICONS[name] ?? Ellipsis;
  const tint = TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];
  return (
    <span
      className="grid shrink-0 place-items-center rounded-2xl text-white"
      style={{ width: size, height: size, background: tint }}
    >
      <Icon size={size * 0.48} strokeWidth={2.2} />
    </span>
  );
}

const WALLET_STYLE: Record<WalletKind, [LucideIcon, string]> = {
  cash: [Banknote, "#0fb898"],
  bank: [Landmark, "#2f39a9"],
  ewallet: [Smartphone, "#49a4bb"],
  other: [PiggyBank, "#2e6fa0"],
};

export function WalletIcon({ kind, size = 44 }: { kind: WalletKind; size?: number }) {
  const [Icon, bg] = WALLET_STYLE[kind];
  return (
    <span className="grid shrink-0 place-items-center rounded-2xl text-white" style={{ width: size, height: size, background: bg }}>
      <Icon size={size * 0.48} strokeWidth={2.2} />
    </span>
  );
}

/** Satu baris transaksi. walletId = sudut pandang dompet (transfer masuk/keluar diberi tanda). */
export function TxRow({ tx, index = 0, walletId }: { tx: Tx; index?: number; walletId?: number }) {
  const { open, wallets } = useTxSheet();
  const name = (id: number | null) => wallets.find((w) => w.id === id)?.name ?? "Dompet";
  const transfer = tx.type === "transfer";
  const income = tx.type === "income" || (transfer && tx.to_wallet_id === walletId);
  const signed = !transfer || walletId !== undefined;
  const subtitle = transfer ? `${name(tx.wallet_id)} ke ${name(tx.to_wallet_id)}` : [name(tx.wallet_id), tx.note].filter(Boolean).join(" · ");
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ delay: Math.min(index, 10) * 0.04, type: "spring", stiffness: 400, damping: 30 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => open(tx)}
      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-soft"
    >
      <CategoryIcon name={tx.category} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{transfer && tx.note ? tx.note : tx.category}</span>
        <span className="block truncate text-sm text-muted">{subtitle}</span>
      </span>
      <span className={`shrink-0 font-bold tabular-nums ${!signed ? "text-ocean dark:text-sky" : income ? "text-income" : "text-expense"}`}>
        {signed && (income ? "+" : "-")}
        {formatRp(tx.amount)}
      </span>
    </motion.button>
  );
}

// Preferensi sembunyikan saldo, disimpan per perangkat.
const HIDE_KEY = "hideBalance";
const subscribeHide = (cb: () => void) => (window.addEventListener("storage", cb), () => window.removeEventListener("storage", cb));
const readHide = () => {
  try {
    return localStorage.getItem(HIDE_KEY) === "1";
  } catch {
    return false;
  }
};

export function BalanceCard({ balance }: { balance: number }) {
  const hidden = useSyncExternalStore(subscribeHide, readHide, () => false);
  const { open } = useTxSheet();
  function toggle() {
    try {
      localStorage.setItem(HIDE_KEY, hidden ? "0" : "1");
    } catch {}
    window.dispatchEvent(new Event("storage"));
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      data-tour="balance"
      className="relative overflow-hidden rounded-3xl bg-ocean p-5 text-white shadow-xl shadow-navy/25"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-sky/50" />
      <div className="pointer-events-none absolute -bottom-12 right-16 size-28 rounded-full bg-mint/40" />
      <div className="relative">
        <div className="flex items-center justify-between text-sm text-white/80">
          <span>Total saldo semua dompet</span>
          <motion.button whileTap={{ scale: 0.8 }} onClick={toggle} aria-label={hidden ? "Tampilkan saldo" : "Sembunyikan saldo"} className="rounded-full p-1.5 hover:bg-white/15">
            {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
          </motion.button>
        </div>
        <div className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
          <AnimatedRp value={balance} hidden={hidden} />
        </div>
        <div data-tour="quick-actions" className="mt-5 grid grid-cols-3 gap-2">
          <QuickAction icon={ArrowDownLeft} label="Masuk" onClick={() => open({ type: "income" })} className="bg-mint text-[#063a30]" />
          <QuickAction icon={ArrowUpRight} label="Keluar" onClick={() => open({ type: "expense" })} className="bg-white text-navy" />
          <QuickAction icon={ArrowLeftRight} label="Transfer" onClick={() => open({ type: "transfer" })} className="bg-white/15 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

function QuickAction({ icon: Icon, label, onClick, className }: { icon: LucideIcon; label: string; onClick: () => void; className: string }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-2xl py-3 text-sm font-bold shadow-md ${className}`}
    >
      <Icon size={18} strokeWidth={2.6} /> {label}
    </motion.button>
  );
}

/** Kartu dompet yang bisa digeser, seperti kartu rekening di m-banking. */
export function WalletStrip({ wallets }: { wallets: Wallet[] }) {
  const { editWallet } = useTxSheet();
  const active = wallets.filter((w) => !w.archived);
  return (
    <div data-tour="wallet-strip" className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
      {active.map((w, i) => (
        <motion.div
          key={w.id}
          initial={{ opacity: 0, x: 30, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.1 + i * 0.06, type: "spring", stiffness: 300, damping: 24 }}
          whileTap={{ scale: 0.95 }}
          className="w-40 shrink-0 snap-start"
        >
          <Link href={`/transaksi?dompet=${w.id}`} className="block rounded-3xl border border-line bg-surface p-3.5 shadow-sm">
            <WalletIcon kind={w.kind} size={36} />
            <p className="mt-3 truncate text-xs font-semibold text-muted">{WALLET_KINDS[w.kind].label}</p>
            <p className="truncate font-bold">{w.name}</p>
            <p className={`mt-1 truncate text-sm font-extrabold tabular-nums ${w.balance < 0 ? "text-expense" : ""}`}>{formatRp(w.balance)}</p>
          </Link>
        </motion.div>
      ))}
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={() => editWallet()}
        className="flex w-28 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-line text-sm font-bold text-muted"
      >
        <Plus size={22} /> Dompet
      </motion.button>
    </div>
  );
}

type Sum = { income: number; expense: number };
const PERIODS = [
  ["today", "Hari ini"],
  ["month", "Bulan ini"],
  ["year", "Tahun ini"],
] as const;

export function PeriodSummary({ periods }: { periods: Record<(typeof PERIODS)[number][0], Sum> }) {
  const [tab, setTab] = useState<(typeof PERIODS)[number][0]>("month");
  const p = periods[tab];
  const saved = p.income - p.expense;
  return (
    <section data-tour="period-summary" className="rounded-3xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex rounded-2xl bg-soft p-1" role="tablist">
        {PERIODS.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`relative flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${tab === key ? "text-white" : "text-muted"}`}
          >
            {tab === key && (
              <motion.span layoutId="period-pill" className="absolute inset-0 rounded-xl bg-navy" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
            )}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Pemasukan" value={p.income} className="text-income" icon={ArrowDownLeft} />
        <Stat label="Pengeluaran" value={p.expense} className="text-expense" icon={ArrowUpRight} />
      </div>
      <motion.div
        key={tab + saved}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className={`mt-3 flex items-center justify-between rounded-2xl px-4 py-3 ${saved >= 0 ? "bg-mint/15" : "bg-expense/10"}`}
      >
        <span className="text-sm font-semibold text-muted">{saved >= 0 ? "Berhasil ditabung" : "Lebih besar pasak"}</span>
        <span className={`font-extrabold tabular-nums ${saved >= 0 ? "text-income" : "text-expense"}`}>
          <AnimatedRp value={saved} />
        </span>
      </motion.div>
    </section>
  );
}

function Stat({ label, value, className, icon: Icon }: { label: string; value: number; className: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-line p-3">
      <div className={`flex items-center gap-1 text-xs font-semibold ${className}`}>
        <Icon size={14} strokeWidth={2.6} /> {label}
      </div>
      <div className="mt-1 truncate text-lg font-bold tabular-nums">
        <AnimatedRp value={value} />
      </div>
    </div>
  );
}

/** Header halaman: strip navy ala m-banking. */
export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <header className="hero rounded-b-[2rem] px-5 pb-16 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
      <div className="mx-auto flex max-w-xl items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
          {subtitle && <p className="text-sm text-white/70">{subtitle}</p>}
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
        </motion.div>
        {children}
      </div>
    </header>
  );
}

export function EmptyState({ text, type }: { text: string; type?: Tx["type"] }) {
  const { open } = useTxSheet();
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <PatRot mood="normal" size={110} message="Kwak! Yuk mulai mencatat." />
      <p className="mt-3 font-semibold text-muted">{text}</p>
      <motion.button whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.04 }} onClick={() => open({ type: type ?? "expense" })} className="mt-4 rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-navy/30">
        Catat transaksi
      </motion.button>
    </div>
  );
}

const FILTERS = [
  ["all", "Semua"],
  ["income", "Pemasukan"],
  ["expense", "Pengeluaran"],
  ["transfer", "Transfer"],
] as const;

/** Daftar transaksi dikelompokkan per hari, dengan filter jenis. */
export function TxGroups({ rows, walletId }: { rows: Tx[]; walletId?: number }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");
  const shown = filter === "all" ? rows : rows.filter((r) => r.type === filter);
  // Bukan Map.groupBy: belum ada di iOS Safari < 17.4.
  const groups = new Map<string, Tx[]>();
  for (const r of shown) groups.set(r.occurred_on, [...(groups.get(r.occurred_on) ?? []), r]);

  return (
    <div>
      <div data-tour="tx-filter" className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${filter === key ? "text-white" : "bg-soft text-muted"}`}
          >
            {filter === key && <motion.span layoutId="filter-pill" className="absolute inset-0 rounded-full bg-navy" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>
      <div data-tour="tx-list">
      {shown.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-line bg-surface"><EmptyState text="Belum ada transaksi di periode ini." type={filter === "all" ? "expense" : filter} /></div>
      ) : (
        <div className="mt-4 space-y-4">
          {[...groups].map(([day, txs]) => {
            // Selisih harian: transfer tidak dihitung, kecuali saat melihat satu dompet.
            const net = txs.reduce((a, t) => {
              if (t.type === "transfer") return walletId === undefined ? a : a + (t.to_wallet_id === walletId ? t.amount : -t.amount);
              return a + (t.type === "income" ? t.amount : -t.amount);
            }, 0);
            return (
              <section key={day} className="rounded-3xl border border-line bg-surface p-2 shadow-sm">
                <div className="flex items-center justify-between px-3 pb-1 pt-2 text-xs font-bold text-muted">
                  <span>{dayLabel(day)}</span>
                  <span className={net >= 0 ? "text-income" : "text-expense"}>{net >= 0 ? "+" : "-"}{formatRp(Math.abs(net))}</span>
                </div>
                {txs.map((tx, i) => <TxRow key={tx.id} tx={tx} index={i} walletId={walletId} />)}
              </section>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}

/** Baris dompet: ketuk untuk riwayat, tombol pensil untuk ubah. */
export function WalletRow({ wallet, index = 0 }: { wallet: Wallet; index?: number }) {
  const { editWallet } = useTxSheet();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 400, damping: 30 }}
      className="flex items-center gap-1 rounded-2xl pr-1 hover:bg-soft"
    >
      <Link href={`/transaksi?dompet=${wallet.id}`} className="flex min-w-0 flex-1 items-center gap-3 p-3">
        <WalletIcon kind={wallet.kind} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{wallet.name}</span>
          <span className="block truncate text-sm text-muted">{wallet.provider}</span>
        </span>
        <span className={`shrink-0 font-bold tabular-nums ${wallet.balance < 0 ? "text-expense" : ""}`}>{formatRp(wallet.balance)}</span>
      </Link>
      <motion.button whileTap={{ scale: 0.85 }} onClick={() => editWallet(wallet)} aria-label={`Ubah ${wallet.name}`} className="rounded-full p-2.5 text-muted hover:bg-line">
        <Pencil size={16} />
      </motion.button>
    </motion.div>
  );
}

export function AddWalletButton() {
  const { editWallet } = useTxSheet();
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.04 }}
      onClick={() => editWallet()}
      data-tour="wallet-add"
      className="flex items-center gap-1.5 rounded-full bg-mint px-4 py-2.5 text-sm font-extrabold text-[#063a30] shadow-lg"
    >
      <Plus size={18} strokeWidth={3} /> Tambah
    </motion.button>
  );
}
