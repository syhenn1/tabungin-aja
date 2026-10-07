"use client";

import { motion } from "motion/react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatRp, formatShort } from "@/lib/format";

export type Point = { label: string; income: number; expense: number };

export function CashflowChart({ data, height = 220 }: { data: Point[]; height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={formatShort} width={44} />
          <Tooltip
            cursor={{ fill: "var(--line)", opacity: 0.5, radius: 8 }}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, color: "var(--ink)", fontSize: 12 }}
            formatter={(v, name) => [formatRp(Number(v)), name === "income" ? "Pemasukan" : "Pengeluaran"]}
          />
          <Bar dataKey="income" fill="#15d8b3" radius={[6, 6, 0, 0]} maxBarSize={22} animationDuration={900} />
          <Bar dataKey="expense" fill="var(--chart-expense)" radius={[6, 6, 0, 0]} maxBarSize={22} animationDuration={900} animationBegin={150} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartLegend() {
  return (
    <div className="flex gap-4 text-xs font-semibold text-muted">
      <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-mint" /> Pemasukan</span>
      <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-navy dark:bg-sky" /> Pengeluaran</span>
    </div>
  );
}

/** Batang persentase; icon dikirim sebagai elemen (kategori atau dompet). */
export function ShareBars({ rows }: { rows: { label: string; amount: number; icon: React.ReactNode }[] }) {
  const total = rows.reduce((a, r) => a + r.amount, 0);
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => {
        const pct = total ? (r.amount / total) * 100 : 0;
        return (
          <li key={r.label} className="flex items-center gap-3">
            {r.icon}
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2 text-sm">
                <span className="truncate font-semibold">{r.label}</span>
                <span className="shrink-0 font-bold tabular-nums">{formatRp(r.amount)}</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-soft">
                <motion.div
                  className="h-full rounded-full bg-sky"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.1 + i * 0.07, type: "spring", stiffness: 120, damping: 18 }}
                />
              </div>
            </div>
            <span className="w-10 text-right text-xs font-semibold text-muted">{Math.round(pct)}%</span>
          </li>
        );
      })}
    </ul>
  );
}
