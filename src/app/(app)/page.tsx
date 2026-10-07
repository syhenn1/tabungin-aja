import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { getDashboard } from "@/lib/data";
import { formatDate, greeting } from "@/lib/format";
import { PatRot, type Mood } from "@/components/PatRot";
import { BalanceCard, EmptyState, PeriodSummary, TxRow, WalletStrip } from "@/components/ui";
import { CashflowChart, ChartLegend } from "@/components/Charts";

export default function HomePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const d = await getDashboard();
  const m = d.periods.month;
  const mood: Mood = m.income === 0 && m.expense === 0 ? "normal" : m.income >= m.expense ? "happy" : "worried";
  const message = {
    happy: "Mantap! Bulan ini kamu masih surplus, kwak!",
    normal: "Halo! Catat transaksi pertamamu bulan ini, yuk.",
    worried: "Waduh, pengeluaran bulan ini lebih besar. Pelan-pelan ya!",
  }[mood];

  return (
    <>
      <header className="hero rounded-b-[2.5rem] px-5 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))] text-white">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <Link href="/profil" aria-label="Profil" className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-white/40 bg-mint text-xl font-extrabold text-[#063a30]">
              {d.user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <span className="block text-sm text-white/70">{greeting()},</span>
              <h1 className="truncate text-2xl font-extrabold tracking-tight">{d.user.name}</h1>
            </div>
          </Link>
          <span data-tour="patrot" className="shrink-0">
            <PatRot mood={mood} size={96} message={message} />
          </span>
        </div>
      </header>

      <div className="mx-auto -mt-24 grid max-w-xl grid-cols-1 gap-4 px-4">
        <BalanceCard balance={d.balance} />

        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="font-extrabold">Dompet kamu</h2>
            <Link href="/dompet" className="flex items-center text-sm font-bold text-ocean dark:text-sky">
              Kelola <ChevronRight size={16} />
            </Link>
          </div>
          <WalletStrip wallets={d.wallets} />
        </section>
        <PeriodSummary periods={d.periods} />

        <section className="rounded-3xl border border-line bg-surface p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-extrabold">7 hari terakhir</h2>
            <ChartLegend />
          </div>
          <CashflowChart data={d.week.map((w) => ({ label: formatDate(w.bucket, { weekday: "short" }), income: w.income, expense: w.expense }))} height={190} />
        </section>

        <section className="rounded-3xl border border-line bg-surface p-2 shadow-sm">
          <div className="flex items-center justify-between px-3 pt-2">
            <h2 className="font-extrabold">Transaksi terakhir</h2>
            <Link href="/transaksi" className="flex items-center text-sm font-bold text-ocean dark:text-sky">
              Lihat semua <ChevronRight size={16} />
            </Link>
          </div>
          {d.recent.length ? d.recent.map((tx, i) => <TxRow key={tx.id} tx={tx} index={i} />) : <EmptyState text="Belum ada transaksi." />}
        </section>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="hero h-56 rounded-b-[2.5rem]" />
      <div className="mx-auto -mt-24 grid max-w-xl grid-cols-1 gap-4 px-4">
        <div className="skeleton h-48 rounded-3xl" />
        <div className="skeleton h-48 rounded-3xl" />
        <div className="skeleton h-64 rounded-3xl" />
        <div className="skeleton h-64 rounded-3xl" />
      </div>
    </>
  );
}
