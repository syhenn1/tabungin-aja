"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, CircleCheck, CircleAlert, Coins, Plus, Trash2 } from "lucide-react";
import { createContext, use, useActionState, useEffect, useState, useTransition, type ReactNode } from "react";
import { deleteTx, saveTx, type FormState } from "@/app/actions";
import { CATEGORIES, formatRp, today, type Tx, type TxType, type Wallet } from "@/lib/format";
import { CategoryIcon, WalletIcon } from "./ui";
import { WalletSheet } from "./WalletSheet";
import { groupDigits, SheetShell } from "./Sheet";

type Draft = Partial<Tx> & { type: TxType };
type Ctx = {
  wallets: Wallet[];
  open: (tx?: Draft) => void;
  editWallet: (w?: Partial<Wallet>) => void;
  toast: (msg: string, error?: boolean) => void;
};
const SheetCtx = createContext<Ctx | null>(null);

export function useTxSheet() {
  const ctx = use(SheetCtx);
  if (!ctx) throw new Error("useTxSheet harus di dalam <TxSheetProvider>");
  return ctx;
}

export function TxSheetProvider({ wallets, children }: { wallets: Wallet[]; children: ReactNode }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [walletDraft, setWalletDraft] = useState<Partial<Wallet> | null>(null);
  const [toastMsg, setToastMsg] = useState<{ id: number; text: string; error?: boolean } | null>(null);
  const [coins, setCoins] = useState<Coin[]>([]);

  const ctx: Ctx = {
    wallets,
    open: (tx) => setDraft(tx ?? { type: "expense" }),
    editWallet: (w) => setWalletDraft(w ?? {}),
    toast: (text, error) => setToastMsg({ id: Date.now(), text, error }),
  };

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2600);
    return () => clearTimeout(t);
  }, [toastMsg]);

  return (
    <SheetCtx value={ctx}>
      {children}
      <AnimatePresence>
        {draft && (
          <Sheet
            key="tx"
            draft={draft}
            wallets={wallets}
            onClose={() => setDraft(null)}
            onAddWallet={() => {
              setDraft(null);
              setWalletDraft({});
            }}
            onDone={(msg, income) => {
              setDraft(null);
              ctx.toast(msg);
              if (income) {
                setCoins(makeCoins());
                setTimeout(() => setCoins([]), 1600);
              }
            }}
            onError={(msg) => ctx.toast(msg, true)}
          />
        )}
        {walletDraft && (
          <WalletSheet
            key="wallet"
            draft={walletDraft}
            onClose={() => setWalletDraft(null)}
            onDone={(msg) => {
              setWalletDraft(null);
              ctx.toast(msg);
            }}
            onError={(msg) => ctx.toast(msg, true)}
          />
        )}
      </AnimatePresence>
      <CoinBurst coins={coins} />
      <div className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[70] flex justify-center px-4" aria-live="polite">
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              key={toastMsg.id}
              initial={{ y: -40, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -30, opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white shadow-xl ${toastMsg.error ? "bg-expense" : "bg-navy"}`}
            >
              {toastMsg.error ? <CircleAlert size={18} /> : <CircleCheck size={18} className="text-mint" />}
              {toastMsg.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SheetCtx>
  );
}

const QUICK = [10_000, 50_000, 100_000];
const TYPES: [TxType, string, string][] = [
  ["income", "Pemasukan", "bg-income"],
  ["expense", "Pengeluaran", "bg-expense"],
  ["transfer", "Transfer", "bg-ocean"],
];

function Sheet({ draft, wallets, onClose, onAddWallet, onDone, onError }: {
  draft: Draft;
  wallets: Wallet[];
  onClose: () => void;
  onAddWallet: () => void;
  onDone: (msg: string, income: boolean) => void;
  onError: (msg: string) => void;
}) {
  // Dompet arsip disembunyikan, kecuali yang sedang dipakai transaksi yang diedit.
  const options = wallets.filter((w) => !w.archived || w.id === draft.wallet_id || w.id === draft.to_wallet_id);
  const [type, setType] = useState<TxType>(draft.type);
  const [amount, setAmount] = useState(draft.amount ? groupDigits(String(draft.amount)) : "");
  const [category, setCategory] = useState(draft.category ?? "");
  const [walletId, setWalletId] = useState(draft.wallet_id ?? options[0]?.id ?? 0);
  const [toWalletId, setToWalletId] = useState(draft.to_wallet_id ?? options.find((w) => w.id !== walletId)?.id ?? 0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [state, action, saving] = useActionState<FormState, FormData>(saveTx, null);
  const [deleting, startDelete] = useTransition();
  const editing = Boolean(draft.id);
  const transfer = type === "transfer";

  useEffect(() => {
    if (state?.ok) onDone(state.ok, type === "income");
    else if (state?.error) onError(state.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function switchType(t: TxType) {
    setType(t);
    if (!CATEGORIES[t].includes(category)) setCategory("");
  }

  function pickFrom(id: number) {
    setWalletId(id);
    if (id === toWalletId) setToWalletId(options.find((w) => w.id !== id)?.id ?? 0);
  }

  function addQuick(n: number) {
    const cur = Number(amount.replace(/\D/g, "")) || 0;
    setAmount(groupDigits(String(cur + n)));
  }

  function remove() {
    if (!confirmDelete) return setConfirmDelete(true);
    startDelete(async () => {
      const r = await deleteTx(draft.id!);
      if (r.error) onError(r.error);
      else onDone(r.ok!, false);
    });
  }

  const needsSecondWallet = transfer && options.length < 2;
  const ready = amount && walletId && (transfer ? toWalletId && toWalletId !== walletId : category);
  const accent = { income: "border-income", expense: "border-expense", transfer: "border-ocean" }[type];

  return (
    <SheetShell title={editing ? "Ubah transaksi" : "Catat transaksi"} onClose={onClose}>
      <form action={action} className="space-y-5 px-5 pt-3">
        {draft.id && <input type="hidden" name="id" value={draft.id} />}
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="category" value={category} />
        <input type="hidden" name="wallet_id" value={walletId} />
        {transfer && <input type="hidden" name="to_wallet_id" value={toWalletId} />}

        <div className="grid grid-cols-3 rounded-2xl bg-soft p-1">
          {TYPES.map(([t, label, bg]) => (
            <button key={t} type="button" onClick={() => switchType(t)} className={`relative rounded-xl py-2.5 text-sm font-bold ${type === t ? "text-white" : "text-muted"}`}>
              {type === t && <motion.span layoutId="type-pill" className={`absolute inset-0 rounded-xl ${bg}`} />}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-muted">Nominal</span>
          <div className={`mt-1 flex items-center gap-2 border-b-2 pb-1 transition-colors ${accent}`}>
            <span className="text-2xl font-bold text-muted">Rp</span>
            <input
              name="amount"
              inputMode="numeric"
              autoComplete="off"
              autoFocus={!editing}
              required
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(groupDigits(e.target.value))}
              className="w-full bg-transparent text-3xl font-extrabold tabular-nums outline-none placeholder:text-line"
            />
          </div>
          <div className="mt-2 flex gap-2">
            {QUICK.map((n) => (
              <motion.button key={n} type="button" whileTap={{ scale: 0.88 }} onClick={() => addQuick(n)} className="rounded-full bg-soft px-3 py-1.5 text-xs font-bold text-ocean dark:text-sky">
                +{n / 1000}rb
              </motion.button>
            ))}
          </div>
        </label>

        {needsSecondWallet ? (
          <div className="rounded-2xl bg-soft p-4 text-center text-sm">
            <p className="font-semibold text-muted">Transfer butuh minimal 2 dompet aktif.</p>
            <button type="button" onClick={onAddWallet} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 font-bold text-white">
              <Plus size={16} /> Tambah dompet
            </button>
          </div>
        ) : (
          <>
            <WalletPicker label={transfer ? "Dari dompet" : type === "income" ? "Masuk ke dompet" : "Bayar pakai"} wallets={options} value={walletId} onChange={pickFrom} onAdd={onAddWallet} />
            {transfer && (
              <>
                <div className="-my-2 flex justify-center text-ocean dark:text-sky"><ArrowDown size={20} /></div>
                <WalletPicker label="Ke dompet" wallets={options.filter((w) => w.id !== walletId)} value={toWalletId} onChange={setToWalletId} onAdd={onAddWallet} />
              </>
            )}
          </>
        )}

        {!transfer && (
          <fieldset>
            <legend className="text-sm font-semibold text-muted">Kategori</legend>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {CATEGORIES[type].map((c, i) => (
                <motion.button
                  key={type + c}
                  type="button"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: category === c ? 1.06 : 1, opacity: 1 }}
                  transition={{ delay: i * 0.025, type: "spring", stiffness: 500, damping: 20 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2 text-[11px] font-semibold ${category === c ? "border-navy bg-navy/5 dark:border-sky" : "border-transparent"}`}
                >
                  <CategoryIcon name={c} size={38} />
                  <span className="w-full truncate text-center">{c}</span>
                </motion.button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-muted">Tanggal</span>
            <input type="date" name="occurred_on" required defaultValue={draft.occurred_on ?? today()} max={today()} className="mt-1 w-full rounded-xl border border-line bg-soft px-3 py-2.5 outline-none focus:border-sky" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-muted">Catatan (opsional)</span>
            <input name="note" maxLength={200} defaultValue={draft.note ?? ""} placeholder={transfer ? "Misal: isi saldo GoPay" : "Misal: makan siang"} className="mt-1 w-full rounded-xl border border-line bg-soft px-3 py-2.5 outline-none focus:border-sky" />
          </label>
        </div>

        <div className="flex gap-3 pt-1">
          {editing && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={remove}
              disabled={deleting}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 font-bold transition-colors ${confirmDelete ? "bg-expense text-white" : "bg-expense/10 text-expense"}`}
            >
              <Trash2 size={18} /> {confirmDelete ? "Yakin?" : ""}
            </motion.button>
          )}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            disabled={saving || !ready}
            className="flex-1 rounded-2xl bg-navy py-3.5 font-extrabold text-white shadow-lg shadow-navy/30 transition-opacity disabled:opacity-40"
          >
            {saving ? "Menyimpan..." : editing ? "Simpan perubahan" : "Simpan"}
          </motion.button>
        </div>
      </form>
    </SheetShell>
  );
}

function WalletPicker({ label, wallets, value, onChange, onAdd }: { label: string; wallets: Wallet[]; value: number; onChange: (id: number) => void; onAdd: () => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-muted">{label}</legend>
      <div className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1">
        {wallets.map((w) => (
          <motion.button
            key={w.id}
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => onChange(w.id)}
            aria-pressed={value === w.id}
            className={`flex shrink-0 items-center gap-2 rounded-2xl border-2 py-2 pl-2 pr-3 text-left ${value === w.id ? "border-navy bg-navy/5 dark:border-sky" : "border-line"}`}
          >
            <WalletIcon kind={w.kind} size={34} />
            <span>
              <span className="block max-w-32 truncate text-xs font-bold">{w.name}</span>
              <span className="block text-[11px] tabular-nums text-muted">{formatRp(w.balance)}</span>
            </span>
          </motion.button>
        ))}
        <button type="button" onClick={onAdd} aria-label="Tambah dompet" className="grid w-12 shrink-0 place-items-center rounded-2xl border-2 border-dashed border-line text-muted">
          <Plus size={18} />
        </button>
      </div>
    </fieldset>
  );
}

type Coin = { id: string; x: number; r: number; d: number };
const makeCoins = (): Coin[] =>
  Array.from({ length: 14 }, (_, i) => ({ id: `${Date.now()}-${i}`, x: (Math.random() - 0.5) * 320, r: (Math.random() - 0.5) * 540, d: Math.random() * 0.2 }));

/** Hujan koin kecil saat pemasukan tercatat. */
function CoinBurst({ coins }: { coins: Coin[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[65] flex justify-center" aria-hidden>
      {coins.map((c) => (
        <motion.span
          key={c.id}
          className="absolute text-[#ffb830]"
          initial={{ y: 0, x: 0, scale: 0, rotate: 0, opacity: 1 }}
          animate={{ y: [0, -260 - Math.abs(c.x) / 2, 40], x: c.x, scale: [0, 1.2, 1], rotate: c.r, opacity: [1, 1, 0] }}
          transition={{ duration: 1.3, delay: c.d, ease: "easeOut" }}
        >
          <Coins size={28} fill="#ffd36b" strokeWidth={2} />
        </motion.span>
      ))}
    </div>
  );
}
