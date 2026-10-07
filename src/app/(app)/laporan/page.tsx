import Link from "next/link";
import { Suspense } from "react";
import { expenseBy, getMonthTx, getReport, getWallets, type Unit } from "@/lib/data";
import { formatDate, formatRp, today } from "@/lib/format";
import { CategoryIcon, PageHeader, WalletIcon } from "@/components/ui";
import { CashflowChart, ChartLegend, ShareBars } from "@/components/Charts";

export const metadata = { title: "Laporan" };

const UNITS: [Unit, string, string][] = [
  ["day", "Harian", "14 hari terakhir"],
  ["month", "Bulanan", "12 bulan terakhir"],
  ["year", "Tahunan", "5 tahun terakhir"],
];

const label = (b: string, unit: Unit, long = false) =>
  unit === "day"
    ? formatDate(b, long ? { weekday: "long", day: "numeric", month: "long" } : { day: "numeric", month: "short" })
    : unit === "month"
      ? formatDate(b, { month: long ? "long" : "short", year: long ? "numeric" : "2-digit" })
      : b.slice(0, 4);

export default function LaporanPage({ searchParams }: PageProps<"/laporan">) {
  return (
    <>
      <PageHeader title="Laporan tabungan" subtitle="Pantau perkembanganmu" />
      <div className="mx-auto -mt-10 max-w-xl px-4">
        <Suspense fallback={<div className="grid grid-cols-1 gap-4"><div className="skeleton h-96 rounded-3xl" /><div className="skeleton h-96 rounded-3xl" /></div>}>
          <Report searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Report({ searchParams }: { searchParams: PageProps<"/laporan">["searchParams"] }) {
  const { unit: u } = await searchParams;
  const unit: Unit = u === "day" || u === "year" ? u : "month";
  const [rows, monthTx, wallets] = await Promise.all([getReport(unit), getMonthTx(today().slice(0, 7)), getWallets()]);
  const cats = expenseBy(monthTx, (r) => r.category).map((c) => ({ label: c.key, amount: c.amount, icon: <CategoryIcon name={c.key} size={38} /> }));
  const bySource = expenseBy(monthTx, (r) => r.wallet_id).flatMap((c) => {
    const w = wallets.find((x) => x.id === c.key);
    return w ? [{ label: w.name, amount: c.amount, icon: <WalletIcon kind={w.kind} size={38} /> }] : [];
  });
  const total = rows.reduce((a, r) => ({ income: a.income + r.income, expense: a.expense + r.expense }), { income: 0, expense: 0 });
  const saved = total.income - total.expense;
  const caption = UNITS.find((x) => x[0] === unit)![2];

  return (
    <div className="grid grid-cols-1 gap-4">
      <section className="rounded-3xl border border-line bg-surface p-4 shadow-lg shadow-navy/5">
        <nav data-tour="report-tabs" className="flex rounded-2xl bg-soft p-1">
          {UNITS.map(([key, name]) => (
            <Link
              key={key}
              href={`/laporan?unit=${key}`}
              className={`flex-1 rounded-xl py-2 text-center text-sm font-semibold transition-colors ${key === unit ? "bg-navy text-white shadow" : "text-muted"}`}
            >
              {name}
            </Link>
          ))}
        </nav>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-muted">Total ditabung, {caption}</p>
            <p className={`text-2xl font-extrabold tabular-nums ${saved >= 0 ? "text-income" : "text-expense"}`}>{formatRp(saved)}</p>
          </div>
          <ChartLegend />
        </div>
        <div data-tour="report-chart" className="mt-3">
          <CashflowChart data={rows.map((r) => ({ label: label(r.bucket, unit), income: r.income, expense: r.expense }))} height={240} />
        </div>

        <h3 className="mb-2 mt-5 font-extrabold">Rincian {UNITS.find((x) => x[0] === unit)![1].toLowerCase()}</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[22rem] text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="py-2 font-semibold">Periode</th>
                <th className="py-2 text-right font-semibold">Masuk</th>
                <th className="py-2 text-right font-semibold">Keluar</th>
                <th className="py-2 text-right font-semibold">Ditabung</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {[...rows].reverse().map((r) => {
                const net = r.income - r.expense;
                return (
                  <tr key={r.bucket} className="border-t border-line">
                    <td className="py-2.5 font-semibold">{label(r.bucket, unit, true)}</td>
                    <td className="py-2.5 text-right text-income">{formatRp(r.income)}</td>
                    <td className="py-2.5 text-right text-expense">{formatRp(r.expense)}</td>
                    <td className={`py-2.5 text-right font-bold ${net >= 0 ? "" : "text-expense"}`}>{formatRp(net)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section data-tour="report-categories" className="rounded-3xl border border-line bg-surface p-4 shadow-lg shadow-navy/5">
        <h2 className="font-extrabold">Pengeluaran bulan ini</h2>
        <p className="mb-4 text-xs text-muted">Per kategori, {formatDate(today(), { month: "long", year: "numeric" })}</p>
        {cats.length ? <ShareBars rows={cats} /> : <p className="py-6 text-center text-sm text-muted">Belum ada pengeluaran bulan ini.</p>}
      </section>

      {bySource.length > 0 && (
        <section className="rounded-3xl border border-line bg-surface p-4 shadow-lg shadow-navy/5">
          <h2 className="font-extrabold">Sumber dana pengeluaran</h2>
          <p className="mb-4 text-xs text-muted">Dompet yang paling banyak dipakai bulan ini</p>
          <ShareBars rows={bySource} />
        </section>
      )}
    </div>
  );
}
