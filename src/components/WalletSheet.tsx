"use client";

import { motion } from "motion/react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";
import { deleteWallet, saveWallet, setWalletArchived, type FormState } from "@/app/actions";
import { WALLET_KINDS, type Wallet, type WalletKind } from "@/lib/format";
import { groupDigits, SheetShell } from "./Sheet";
import { WalletIcon } from "./ui";

const KINDS = Object.entries(WALLET_KINDS) as [WalletKind, (typeof WALLET_KINDS)[WalletKind]][];

export function WalletSheet({ draft, onClose, onDone, onError }: { draft: Partial<Wallet>; onClose: () => void; onDone: (msg: string) => void; onError: (msg: string) => void }) {
  const [kind, setKind] = useState<WalletKind>(draft.kind ?? "bank");
  const [provider, setProvider] = useState(draft.provider ?? (kind === "cash" ? "Tunai" : ""));
  const [balance, setBalance] = useState(draft.initial_balance ? groupDigits(String(draft.initial_balance)) : "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [state, action, saving] = useActionState<FormState, FormData>(saveWallet, null);
  const [busy, startBusy] = useTransition();
  const editing = Boolean(draft.id);

  useEffect(() => {
    if (state?.ok) onDone(state.ok);
    else if (state?.error) onError(state.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function switchKind(k: WalletKind) {
    setKind(k);
    const list = WALLET_KINDS[k].providers;
    setProvider(list.length === 1 ? list[0] : list.includes(provider) ? provider : "");
  }

  function run(fn: () => Promise<{ ok?: string; error?: string }>) {
    startBusy(async () => {
      const r = await fn();
      if (r.error) onError(r.error);
      else onDone(r.ok!);
    });
  }

  return (
    <SheetShell title={editing ? "Ubah dompet" : "Tambah dompet"} onClose={onClose}>
      <form action={action} className="space-y-5 px-5 pt-3">
        {draft.id && <input type="hidden" name="id" value={draft.id} />}
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="provider" value={provider} />

        <div className="grid grid-cols-4 gap-2">
          {KINDS.map(([k, { label }]) => (
            <motion.button
              key={k}
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => switchKind(k)}
              aria-pressed={kind === k}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2 text-xs font-bold ${kind === k ? "border-navy bg-navy/5 dark:border-sky" : "border-transparent"}`}
            >
              <WalletIcon kind={k} size={40} />
              {label}
            </motion.button>
          ))}
        </div>

        {WALLET_KINDS[kind].providers.length > 1 && (
          <fieldset>
            <legend className="text-sm font-semibold text-muted">Penyedia</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {WALLET_KINDS[kind].providers.map((p, i) => (
                <motion.button
                  key={kind + p}
                  type="button"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.015, type: "spring", stiffness: 500, damping: 22 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setProvider(p)}
                  aria-pressed={provider === p}
                  className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${provider === p ? "bg-navy text-white" : "bg-soft text-ink"}`}
                >
                  {p}
                </motion.button>
              ))}
            </div>
          </fieldset>
        )}

        <label className="block">
          <span className="text-sm font-semibold text-muted">Nama dompet (opsional)</span>
          <input
            name="name"
            maxLength={40}
            defaultValue={draft.name ?? ""}
            placeholder={provider ? `Misal: ${provider} ${kind === "bank" ? "Gaji" : "Harian"}` : "Pilih penyedia dulu"}
            className="mt-1 w-full rounded-xl border border-line bg-soft px-3 py-2.5 outline-none focus:border-sky"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-muted">Saldo awal</span>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-line bg-soft px-3 focus-within:border-sky">
            <span className="font-bold text-muted">Rp</span>
            <input
              name="initial_balance"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              value={balance}
              onChange={(e) => setBalance(groupDigits(e.target.value))}
              className="w-full bg-transparent py-2.5 font-bold tabular-nums outline-none"
            />
          </div>
          <span className="mt-1 block text-xs text-muted">Isi dengan saldo saat ini sebelum mulai mencatat di Tabungin.</span>
        </label>

        <div className="flex gap-3 pt-1">
          {editing && (
            <>
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                disabled={busy}
                onClick={() => run(() => setWalletArchived(draft.id!, !draft.archived))}
                aria-label={draft.archived ? "Aktifkan lagi" : "Arsipkan"}
                className="flex items-center gap-2 rounded-2xl bg-soft px-4 py-3.5 font-bold text-muted"
              >
                {draft.archived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                disabled={busy}
                onClick={() => (confirmDelete ? run(() => deleteWallet(draft.id!)) : setConfirmDelete(true))}
                aria-label="Hapus dompet"
                className={`flex items-center gap-2 rounded-2xl px-4 py-3.5 font-bold transition-colors ${confirmDelete ? "bg-expense text-white" : "bg-expense/10 text-expense"}`}
              >
                <Trash2 size={18} /> {confirmDelete ? "Yakin?" : ""}
              </motion.button>
            </>
          )}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            disabled={saving || !provider}
            className="flex-1 rounded-2xl bg-navy py-3.5 font-extrabold text-white shadow-lg shadow-navy/30 transition-opacity disabled:opacity-40"
          >
            {saving ? "Menyimpan..." : editing ? "Simpan" : "Tambah dompet"}
          </motion.button>
        </div>
      </form>
    </SheetShell>
  );
}
