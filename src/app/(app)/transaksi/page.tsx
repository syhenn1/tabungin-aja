import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { getMonthTx, getWallets } from "@/lib/data";
import { addMonths, formatDate, formatRp, today } from "@/lib/format";
import { PageHeader, TxGroups, WalletIcon } from "@/components/ui";

export const metadata = { title: "Transaksi" };

export default function TransaksiPage({ searchParams }: PageProps<"/transaksi">) {
  return (
    <>
      <PageHeader title="Riwayat transaksi" subtitle="Semua catatan keuanganmu" />
      <div className="mx-auto -mt-10 max-w-xl px-4">
        <Suspense fallback={<ListSkeleton />}>
          <MonthView searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function MonthView({ searchParams }: { searchParams: PageProps<"/transaksi">["searchParams"] }) {
  const { bulan, dompet } = await searchParams;
  const current = today().slice(0, 7);
  const month = typeof bulan === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(bulan) && bulan <= current ? bulan : current;
  const wallet = (await getWallets()).find((w) => String(w.id) === dompet);
  const rows = await getMonthTx(month, wallet?.id);
  const href = (m: string) => `/transaksi?bulan=${m}${wallet ? `&dompet=${wallet.id}` : ""}`;

  const income = rows.filter((r) => r.type === "income").reduce((a, r) => a + r.amount, 0);
  const expense = rows.filter((r) => r.type === "expense").reduce((a, r) => a + r.amount, 0);
  const prev = addMonths(month + "-01", -1).slice(0, 7);
  const next = addMonths(month + "-01", 1).slice(0, 7);

  return (
    <>
      {wallet && (
        <div className="mb-3 flex items-center gap-3 rounded-3xl border border-line bg-surface p-3 shadow-lg shadow-navy/5">
          <WalletIcon kind={wallet.kind} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{wallet.name}</p>
            <p className="text-sm tabular-nums text-muted">Saldo {formatRp(wallet.balance)}</p>
          </div>
          <Link href={`/transaksi?bulan=${month}`} aria-label="Tampilkan semua dompet" className="rounded-full bg-soft p-2 text-muted">
            <X size={18} />
          </Link>
        </div>
      )}
      <div data-tour="tx-month" className="rounded-3xl border border-line bg-surface p-4 shadow-lg shadow-navy/5">
        <div className="flex items-center justify-between">
          <Link href={href(prev)} aria-label="Bulan sebelumnya" className="grid size-10 place-items-center rounded-full bg-soft text-ocean active:scale-90 dark:text-sky">
            <ChevronLeft size={20} />
          </Link>
          <span className="text-lg font-extrabold">{formatDate(month + "-01", { month: "long", year: "numeric" })}</span>
          {next <= current ? (
            <Link href={href(next)} aria-label="Bulan berikutnya" className="grid size-10 place-items-center rounded-full bg-soft text-ocean active:scale-90 dark:text-sky">
              <ChevronRight size={20} />
            </Link>
          ) : (
            <span className="size-10" />
          )}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Mini label="Masuk" value={income} className="text-income" />
          <Mini label="Keluar" value={expense} className="text-expense" />
          <Mini label="Ditabung" value={income - expense} className={income >= expense ? "text-ocean dark:text-sky" : "text-expense"} />
        </div>
      </div>
      <div className="mt-5">
        <TxGroups rows={rows} walletId={wallet?.id} />
      </div>
    </>
  );
}

function Mini({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-2xl bg-soft px-2 py-2.5">
      <div className="text-[11px] font-semibold text-muted">{label}</div>
      <div className={`truncate text-sm font-extrabold tabular-nums ${className}`}>{formatRp(value)}</div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-36 rounded-3xl" />
      <div className="skeleton h-10 w-64 rounded-full" />
      <div className="skeleton h-52 rounded-3xl" />
    </div>
  );
}
