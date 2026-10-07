"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChartColumn, Check, ReceiptText, WalletCards, type LucideIcon } from "lucide-react";
import { useActionState, useState } from "react";
import { finishOnboarding, type FormState } from "@/app/actions";
import { formatRp, WALLET_KINDS, type WalletKind } from "@/lib/format";
import { PatRot } from "./PatRot";
import { groupDigits } from "./Sheet";
import { WalletIcon } from "./ui";

const CASH = "cash|Tunai";
const STEPS = 4;
const PICKABLE = (Object.keys(WALLET_KINDS) as WalletKind[]).filter((k) => k !== "cash");
const parse = (key: string) => {
  const [kind, provider] = key.split("|") as [WalletKind, string];
  return { kind, provider };
};
const digits = (s: string | undefined) => Number((s ?? "").replace(/\D/g, "")) || 0;

/** Onboarding 4 langkah: sambutan, pilih dompet, isi saldo, selesai. Bisa dilewati kapan saja. */
export function Onboarding({ name, owned, cashBalance }: { name: string; owned: string[]; cashBalance: number }) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [balances, setBalances] = useState<Record<string, string>>({ [CASH]: cashBalance ? groupDigits(String(cashBalance)) : "" });
  const [state, action, pending] = useActionState<FormState, FormData>(finishOnboarding, null);

  const chosen = [CASH, ...picked];
  const total = chosen.reduce((a, k) => a + digits(balances[k]), 0);
  const payload = JSON.stringify(chosen.map((k) => ({ ...parse(k), balance: digits(balances[k]) })));
  const toggle = (k: string) => setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const say = [
    `Halo, ${name}! Aku PatRot. Yuk siapkan Tabungin bareng aku!`,
    "Uangmu disimpan di mana saja? Pilih semuanya, ya.",
    "Berapa isi masing-masing dompet sekarang? Boleh dikosongkan.",
    "Siap! Mau aku ajak keliling aplikasi dulu?",
  ][step];

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <div className="hero rounded-b-[2.5rem] px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] text-white">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5" aria-label={`Langkah ${step + 1} dari ${STEPS}`}>
              {Array.from({ length: STEPS }, (_, i) => (
                <motion.span key={i} animate={{ width: i === step ? 28 : 8, opacity: i <= step ? 1 : 0.4 }} className="h-2 rounded-full bg-mint" />
              ))}
            </div>
            {step < STEPS - 1 && (
              <form action={action}>
                <input type="hidden" name="wallets" value="[]" />
                <button disabled={pending} className="rounded-full px-3 py-1.5 text-sm font-bold text-white/80 hover:bg-white/10">
                  Lewati
                </button>
              </form>
            )}
          </div>
          <div className="mt-4 flex items-end gap-3">
            <PatRot mood={step === 3 ? "happy" : "normal"} size={92} />
            <AnimatePresence mode="wait">
              <motion.p
                key={step}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
                className="mb-6 flex-1 origin-bottom-left rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm font-semibold text-[#101a44] shadow-lg"
              >
                {say}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <form
        action={action}
        // Enter di kolom saldo tidak boleh langsung menyelesaikan onboarding.
        onKeyDown={(e) => e.key === "Enter" && step < STEPS - 1 && e.preventDefault()}
        className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6"
      >
        <input type="hidden" name="wallets" value={payload} />
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="flex-1"
          >
            {step === 0 && (
              <div className="space-y-3">
                <h1 className="text-2xl font-extrabold">Selamat datang di Tabungin</h1>
                <p className="text-muted">Satu tempat untuk semua uangmu: tunai, rekening bank, dan e-wallet.</p>
                <Feature icon={WalletCards} title="Semua dompet, satu saldo" text="Lihat total uangmu dari semua sumber sekaligus." />
                <Feature icon={ReceiptText} title="Catat dalam hitungan detik" text="Pemasukan, pengeluaran, dan transfer antar dompet." />
                <Feature icon={ChartColumn} title="Tahu uangmu ke mana" text="Laporan harian, bulanan, dan per kategori." />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-xl font-extrabold">Pilih dompet yang kamu punya</h1>
                  <p className="text-sm text-muted">Bisa ditambah atau diubah kapan saja di menu Dompet.</p>
                </div>
                <Chip label="Tunai" selected locked note="otomatis" />
                {PICKABLE.map((kind) => (
                  <section key={kind}>
                    <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-muted">
                      <WalletIcon kind={kind} size={24} /> {WALLET_KINDS[kind].label}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {WALLET_KINDS[kind].providers.map((p) => {
                        const key = `${kind}|${p}`;
                        const has = owned.includes(key);
                        return <Chip key={key} label={p} selected={has || picked.includes(key)} locked={has} note={has ? "sudah ada" : undefined} onClick={() => toggle(key)} />;
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-xl font-extrabold">Isi saldo saat ini</h1>
                  <p className="text-sm text-muted">Cek aplikasi bank atau e-wallet-mu, lalu salin saldonya ke sini.</p>
                </div>
                {chosen.map((k, i) => {
                  const { kind, provider } = parse(k);
                  return (
                    <motion.label
                      key={k}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 rounded-2xl border border-line p-3"
                    >
                      <WalletIcon kind={kind} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{provider}</span>
                        <span className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-muted">Rp</span>
                          <input
                            inputMode="numeric"
                            placeholder="0"
                            value={balances[k] ?? ""}
                            onChange={(e) => setBalances((b) => ({ ...b, [k]: groupDigits(e.target.value) }))}
                            aria-label={`Saldo ${provider}`}
                            className="w-full bg-transparent text-lg font-extrabold tabular-nums outline-none placeholder:text-line"
                          />
                        </span>
                      </span>
                    </motion.label>
                  );
                })}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 text-center">
                <h1 className="text-2xl font-extrabold">Semua siap!</h1>
                <div className="rounded-3xl bg-soft p-5">
                  <p className="text-sm font-semibold text-muted">Total saldo {chosen.length} dompet</p>
                  <p className="text-3xl font-extrabold tabular-nums text-income">{formatRp(total)}</p>
                </div>
                <p className="text-sm text-muted">Tur singkat akan menunjukkan fungsi setiap halaman. Bisa diulang kapan saja lewat tombol tanda tanya di Beranda.</p>
                {state?.error && <p className="rounded-2xl bg-expense/10 px-4 py-3 text-sm font-semibold text-expense" role="alert">{state.error}</p>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="sticky bottom-0 -mx-5 mt-6 flex gap-3 bg-surface px-5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="rounded-2xl bg-soft px-5 py-3.5 font-bold text-muted">
              Kembali
            </button>
          )}
          {step < STEPS - 1 ? (
            <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => setStep((s) => s + 1)} className="flex-1 rounded-2xl bg-navy py-3.5 font-extrabold text-white shadow-lg shadow-navy/30">
              {step === 0 ? "Mulai" : step === 1 ? `Lanjut (${chosen.length} dompet)` : "Lanjut"}
            </motion.button>
          ) : (
            <>
              <button disabled={pending} className="rounded-2xl bg-soft px-4 py-3.5 text-sm font-bold text-muted">
                Nanti saja
              </button>
              <motion.button name="tour" value="1" whileTap={{ scale: 0.95 }} disabled={pending} className="flex-1 rounded-2xl bg-navy py-3.5 font-extrabold text-white shadow-lg shadow-navy/30 disabled:opacity-60">
                {pending ? "Menyimpan..." : "Mulai tur"}
              </motion.button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

function Feature({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-soft p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy text-white"><Icon size={20} /></span>
      <span>
        <span className="block font-bold">{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
    </div>
  );
}

function Chip({ label, selected, locked, note, onClick }: { label: string; selected: boolean; locked?: boolean; note?: string; onClick?: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={locked ? undefined : { scale: 0.9 }}
      onClick={locked ? undefined : onClick}
      aria-pressed={selected}
      disabled={locked}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${selected ? "bg-navy text-white" : "bg-soft text-ink"} ${locked ? "opacity-70" : ""}`}
    >
      {selected && <Check size={14} strokeWidth={3} />}
      {label}
      {note && <span className="text-[10px] font-normal opacity-80">({note})</span>}
    </motion.button>
  );
}
