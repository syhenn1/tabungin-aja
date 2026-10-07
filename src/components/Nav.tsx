"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ChartColumn, House, Plus, ReceiptText, WalletCards, type LucideIcon } from "lucide-react";
import { useTxSheet } from "./TxSheet";

const ITEMS: [string, string, LucideIcon][] = [
  ["/", "Beranda", House],
  ["/transaksi", "Transaksi", ReceiptText],
  ["/dompet", "Dompet", WalletCards],
  ["/laporan", "Laporan", ChartColumn],
];

/** Bar navigasi bawah ala aplikasi m-banking, dengan tombol tambah di tengah. */
export function Nav() {
  const path = usePathname();
  const { open } = useTxSheet();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg">
      <div className="mx-auto grid max-w-xl grid-cols-5 items-end px-2">
        {ITEMS.slice(0, 2).map((it) => <NavItem key={it[0]} item={it} active={active(it[0])} />)}
        <div className="flex justify-center">
          <motion.button
            onClick={() => open()}
            aria-label="Catat transaksi"
            data-tour="fab"
            whileTap={{ scale: 0.85, rotate: 90 }}
            whileHover={{ scale: 1.08 }}
            className="-mt-7 mb-2 grid size-16 place-items-center rounded-full border-4 border-bg bg-mint text-[#063a30] shadow-lg shadow-mint/40"
          >
            <Plus size={30} strokeWidth={3} />
          </motion.button>
        </div>
        {ITEMS.slice(2).map((it) => <NavItem key={it[0]} item={it} active={active(it[0])} />)}
      </div>
    </nav>
  );
}

function NavItem({ item: [href, label, Icon], active }: { item: [string, string, LucideIcon]; active: boolean }) {
  return (
    <Link href={href} data-tour={`nav-${label.toLowerCase()}`} className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${active ? "text-navy dark:text-mint" : "text-muted"}`}>
      {active && <motion.span layoutId="bottom-dot" className="absolute top-0 h-1 w-8 rounded-b-full bg-navy dark:bg-mint" />}
      <motion.span animate={{ y: active ? -2 : 0, scale: active ? 1.15 : 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
        <Icon size={22} strokeWidth={active ? 2.6 : 2} />
      </motion.span>
      {label}
    </Link>
  );
}
