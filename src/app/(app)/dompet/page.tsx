import { Suspense } from "react";
import { getWallets } from "@/lib/data";
import { formatRp, WALLET_KINDS, type WalletKind } from "@/lib/format";
import { AddWalletButton, PageHeader, WalletRow } from "@/components/ui";

export const metadata = { title: "Dompet" };

export default function DompetPage() {
  return (
    <>
      <PageHeader title="Dompet" subtitle="Semua sumber dana kamu">
        <AddWalletButton />
      </PageHeader>
      <div className="mx-auto -mt-10 max-w-xl space-y-4 px-4">
        <Suspense fallback={<><div className="skeleton h-28 rounded-3xl" /><div className="skeleton h-48 rounded-3xl" /></>}>
          <WalletList />
        </Suspense>
      </div>
    </>
  );
}

async function WalletList() {
  const wallets = await getWallets();
  const active = wallets.filter((w) => !w.archived);
  const archived = wallets.filter((w) => w.archived);
  const total = wallets.reduce((a, w) => a + w.balance, 0);
  const kinds = (Object.keys(WALLET_KINDS) as WalletKind[]).filter((k) => active.some((w) => w.kind === k));

  return (
    <>
      <section data-tour="wallet-total" className="rounded-3xl border border-line bg-surface p-5 shadow-lg shadow-navy/5">
        <p className="text-sm font-semibold text-muted">Total semua dompet</p>
        <p className={`text-3xl font-extrabold tabular-nums ${total < 0 ? "text-expense" : ""}`}>{formatRp(total)}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {kinds.map((k) => (
            <div key={k} className="rounded-2xl bg-soft px-3 py-2">
              <p className="text-[11px] font-semibold text-muted">{WALLET_KINDS[k].label}</p>
              <p className="truncate text-sm font-extrabold tabular-nums">{formatRp(active.filter((w) => w.kind === k).reduce((a, w) => a + w.balance, 0))}</p>
            </div>
          ))}
        </div>
      </section>

      <div data-tour="wallet-list" className="space-y-4">
      {kinds.map((k) => (
        <section key={k} className="rounded-3xl border border-line bg-surface p-2 shadow-sm">
          <h2 className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-muted">{WALLET_KINDS[k].label}</h2>
          {active.filter((w) => w.kind === k).map((w, i) => <WalletRow key={w.id} wallet={w} index={i} />)}
        </section>
      ))}
      </div>

      {archived.length > 0 && (
        <section className="rounded-3xl border border-dashed border-line p-2 opacity-80">
          <h2 className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-muted">Diarsipkan</h2>
          {archived.map((w, i) => <WalletRow key={w.id} wallet={w} index={i} />)}
        </section>
      )}
    </>
  );
}
