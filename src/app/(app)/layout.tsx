import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { TxSheetProvider } from "@/components/TxSheet";
import { TourProvider } from "@/components/Tour";
import { getWallets } from "@/lib/data";
import { requireUser } from "@/lib/supabase";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="hero h-56 rounded-b-[2.5rem]" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}

// Dompet dibutuhkan form transaksi dan setiap baris transaksi, jadi dimuat sekali di sini.
// refresh() dari server action ikut memperbarui saldo di sini.
async function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser();
  if (!user.onboarded) redirect("/mulai");
  const wallets = await getWallets();
  return (
    <TxSheetProvider wallets={wallets}>
      <TourProvider>
        <Nav />
        <main className="pb-32">{children}</main>
      </TourProvider>
    </TxSheetProvider>
  );
}
