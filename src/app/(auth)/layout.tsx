import { PatRot } from "@/components/PatRot";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="hero flex min-h-dvh flex-col items-center justify-center px-4 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))] md:flex-row md:gap-16">
      <div className="mb-6 flex flex-col items-center text-center text-white md:mb-0 md:items-start md:text-left">
        <PatRot mood="happy" message="Kwak! Aku PatRot. Yuk menabung bareng!" className="size-[140px] md:size-[220px]" />
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Tabungin</h1>
        <p className="mt-1 max-w-xs text-white/75">Catat pemasukan dan pengeluaran, lihat tabunganmu tumbuh setiap hari.</p>
      </div>
      {children}
    </div>
  );
}
