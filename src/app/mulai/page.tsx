import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase";
import { getWallets } from "@/lib/data";
import { Onboarding } from "@/components/Onboarding";

export const metadata = { title: "Mulai" };

export default function MulaiPage() {
  return (
    <Suspense fallback={<div className="hero min-h-dvh" />}>
      <Loader />
    </Suspense>
  );
}

async function Loader() {
  const { user } = await requireUser();
  if (user.onboarded) redirect("/");
  const wallets = await getWallets();
  return (
    <Onboarding
      name={user.name.split(" ")[0]}
      owned={wallets.filter((w) => w.kind !== "cash").map((w) => `${w.kind}|${w.provider}`)}
      cashBalance={wallets.find((w) => w.kind === "cash")?.initial_balance ?? 0}
    />
  );
}
