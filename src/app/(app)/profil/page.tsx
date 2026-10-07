import { Suspense } from "react";
import { LogOut, Mail, UserRound } from "lucide-react";
import { requireUser } from "@/lib/supabase";
import { logout } from "@/app/actions";
import { PageHeader } from "@/components/ui";
import { PatRot } from "@/components/PatRot";
import { TourMenuItem } from "@/components/Tour";
import { AppVersion } from "@/components/AppVersion";

export const metadata = { title: "Profil" };

export default function ProfilPage() {
  return (
    <>
      <PageHeader title="Profil" subtitle="Akun kamu" />
      <div className="mx-auto -mt-10 max-w-xl space-y-4 px-4">
        <Suspense fallback={<div className="skeleton h-40 rounded-3xl" />}>
          <Account />
        </Suspense>
        <section data-tour="profile-help" className="rounded-3xl border border-line bg-surface p-2 shadow-sm">
          <TourMenuItem />
        </section>
        <section className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-5 shadow-sm">
          <PatRot mood="happy" size={84} message="Aku PatRot, teman menabungmu!" />
          <div>
            <h2 className="font-extrabold">Kenalan dengan PatRot</h2>
            <p className="text-sm text-muted">Burung beo yang selalu mengingatkanmu untuk mencatat setiap rupiah. Ketuk dia untuk tips menabung.</p>
          </div>
        </section>
        <AppVersion className="pt-2 text-muted" />
      </div>
    </>
  );
}

async function Account() {
  const { user } = await requireUser();
  return (
    <section className="rounded-3xl border border-line bg-surface p-5 shadow-lg shadow-navy/5">
      <div className="flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-full bg-mint text-2xl font-extrabold text-[#063a30]">{user.name.charAt(0).toUpperCase()}</span>
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold">{user.name}</p>
          <p className="truncate text-sm text-muted">{user.email}</p>
        </div>
      </div>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-center gap-3"><UserRound size={18} className="text-sky" /><dt className="sr-only">Nama</dt><dd>{user.name}</dd></div>
        <div className="flex items-center gap-3"><Mail size={18} className="text-sky" /><dt className="sr-only">Email</dt><dd className="truncate">{user.email}</dd></div>
      </dl>
      <form action={logout} noValidate className="mt-5">
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-expense/10 py-3 font-bold text-expense transition-transform active:scale-95">
          <LogOut size={18} /> Keluar
        </button>
      </form>
    </section>
  );
}
