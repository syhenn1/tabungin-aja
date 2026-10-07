"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, CircleHelp } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { ParrotSvg } from "./PatRot";

type Step = { path: string; target?: string; title: string; text: string };

// Tur keliling semua halaman. target = nilai atribut data-tour pada elemen yang disorot.
const STEPS: Step[] = [
  { path: "/", title: "Halo, aku PatRot!", text: "Aku antar keliling Tabungin, ya. Ketuk Lanjut untuk mulai, atau Lewati kapan saja." },
  { path: "/", target: "balance", title: "Total saldo", text: "Jumlah uang dari semua dompetmu. Ketuk ikon mata untuk menyembunyikan saldo saat di tempat umum." },
  { path: "/", target: "quick-actions", title: "Catat cepat", text: "Masuk untuk pemasukan, Keluar untuk pengeluaran, dan Transfer untuk memindahkan uang antar dompet, misalnya isi saldo GoPay dari BCA." },
  { path: "/", target: "wallet-strip", title: "Dompet kamu", text: "Geser untuk melihat saldo tiap dompet. Ketuk kartunya untuk melihat riwayat dompet itu." },
  { path: "/", target: "period-summary", title: "Ringkasan periode", text: "Pemasukan, pengeluaran, dan uang yang berhasil ditabung hari ini, bulan ini, atau tahun ini." },
  { path: "/", target: "fab", title: "Tombol tambah", text: "Ada di setiap halaman. Ketuk untuk mencatat transaksi kapan saja." },
  { path: "/", target: "nav-transaksi", title: "Menu Transaksi", text: "Sekarang kita lihat halaman Transaksi." },
  { path: "/transaksi", target: "tx-month", title: "Riwayat per bulan", text: "Pakai panah untuk pindah bulan. Di bawahnya ada total masuk, keluar, dan yang ditabung bulan itu." },
  { path: "/transaksi", target: "tx-filter", title: "Filter", text: "Tampilkan semua transaksi, atau hanya pemasukan, pengeluaran, atau transfer." },
  { path: "/transaksi", target: "tx-list", title: "Daftar transaksi", text: "Dikelompokkan per hari. Ketuk sebuah transaksi untuk mengubah atau menghapusnya." },
  { path: "/dompet", target: "wallet-total", title: "Halaman Dompet", text: "Total uangmu, dirinci per kelompok: tunai, bank, e-wallet, dan lainnya." },
  { path: "/dompet", target: "wallet-add", title: "Tambah dompet", text: "Punya rekening atau e-wallet baru? Tambahkan di sini lengkap dengan saldo awalnya." },
  { path: "/dompet", target: "wallet-list", title: "Kelola dompet", text: "Ketuk dompet untuk melihat riwayatnya. Ketuk ikon pensil untuk mengubah, mengarsipkan, atau menghapus." },
  { path: "/laporan", target: "report-tabs", title: "Halaman Laporan", text: "Pilih tampilan harian, bulanan, atau tahunan." },
  { path: "/laporan", target: "report-chart", title: "Grafik dan rincian", text: "Bandingkan pemasukan dan pengeluaran, lengkap dengan jumlah yang ditabung di setiap periode." },
  { path: "/laporan", target: "report-categories", title: "Uangmu ke mana?", text: "Pengeluaran bulan ini per kategori. Di bawahnya ada rincian per dompet. Cocok untuk mencari pos paling boros." },
  { path: "/profil", target: "profile-help", title: "Profil", text: "Ulangi tur ini dari sini atau dari tombol tanda tanya di Beranda. Tombol Keluar juga ada di halaman ini." },
  { path: "/", target: "patrot", title: "Selesai, kwak!", text: "Ketuk aku kapan saja untuk tips menabung. Selamat mencatat!" },
];

const TourCtx = createContext<{ start: () => void } | null>(null);

export function useTour() {
  const ctx = use(TourCtx);
  if (!ctx) throw new Error("useTour harus di dalam <TourProvider>");
  return ctx;
}

export function TourProvider({ children }: { children: ReactNode }) {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  // ?tur=1 dikirim setelah onboarding memilih "Mulai tur".
  const [step, setStep] = useState<number | null>(() => (params.get("tur") === "1" ? 0 : null));

  useEffect(() => {
    if (params.get("tur") === "1") router.replace(path);
  }, [params, path, router]);

  return (
    <TourCtx value={{ start: () => setStep(0) }}>
      {children}
      <AnimatePresence>{step !== null && <Overlay key="tour" step={step} setStep={setStep} />}</AnimatePresence>
    </TourCtx>
  );
}

type Rect = { top: number; left: number; width: number; height: number };
const PAD = 8;

function Overlay({ step, setStep }: { step: number; setStep: (s: number | null) => void }) {
  const s = STEPS[step];
  const router = useRouter();
  const path = usePathname();
  const [rect, setRect] = useState<Rect | null>(null);
  const scrolled = useRef(-1);
  const last = step === STEPS.length - 1;
  const here = path === s.path;

  const next = () => setStep(last ? null : step + 1);
  const back = () => setStep(Math.max(0, step - 1));

  useEffect(() => {
    if (!here) router.push(s.path);
  }, [here, s.path, router]);

  // Ikuti posisi elemen tiap frame: data masih dimuat, kartu masih beranimasi, halaman bisa di-scroll.
  // Kalau elemennya tidak ada, balon tampil di tengah tanpa sorotan.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = here && s.target ? document.querySelector(`[data-tour="${s.target}"]`) : null;
      if (el && scrolled.current !== step) {
        scrolled.current = step;
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      const r = el?.getBoundingClientRect();
      setRect((prev) => {
        if (!r) return prev === null ? prev : null;
        const nextRect = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
        return prev && Math.abs(prev.top - nextRect.top) < 0.5 && Math.abs(prev.left - nextRect.left) < 0.5 && prev.width === nextRect.width && prev.height === nextRect.height ? prev : nextRect;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [here, s.target, step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStep(null);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Balon di bawah kalau sorotan ada di separuh atas layar, sebaliknya di atas.
  const bubbleAtTop = rect !== null && rect.top + rect.height / 2 > window.innerHeight / 2;

  return (
    <motion.div className="fixed inset-0 z-[80]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* penangkap ketukan: halaman di belakang tidak bisa disentuh selama tur */}
      <div className={`absolute inset-0 ${rect ? "" : "bg-[#0b1232]/70"}`} onClick={next} />
      {rect && (
        <motion.div
          className="pointer-events-none absolute rounded-3xl"
          // box-shadow raksasa = layar gelap di luar sorotan; outline mint = bingkai sorotan.
          style={{ boxShadow: "0 0 0 9999px rgba(11,18,50,0.78)", outline: "3px solid #15d8b3" }}
          initial={false}
          animate={rect}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      <motion.div
        key={step}
        role="dialog"
        aria-live="polite"
        aria-label={s.title}
        initial={{ opacity: 0, y: bubbleAtTop ? -20 : 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className={`absolute inset-x-4 mx-auto max-w-md rounded-3xl bg-surface p-4 shadow-2xl ${
          !rect ? "top-1/2 -translate-y-1/2" : bubbleAtTop ? "top-[max(1rem,env(safe-area-inset-top))]" : "bottom-[max(1rem,env(safe-area-inset-bottom))]"
        }`}
      >
        <div className="flex gap-3">
          <span className="size-14 shrink-0"><ParrotSvg mood={last ? "happy" : "normal"} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-muted">{step + 1} / {STEPS.length}</p>
            <h2 className="font-extrabold">{s.title}</h2>
            <p className="mt-1 text-sm text-muted">{s.text}</p>
          </div>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-soft">
          <motion.div className="h-full rounded-full bg-mint" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <div className="mt-3 flex items-center gap-2">
          {!last && (
            <button onClick={() => setStep(null)} className="mr-auto rounded-full px-3 py-2 text-sm font-semibold text-muted hover:bg-soft">
              Lewati
            </button>
          )}
          {step > 0 && (
            <button onClick={back} className={`rounded-2xl bg-soft px-4 py-2.5 text-sm font-bold text-muted ${last ? "mr-auto" : ""}`}>
              Kembali
            </button>
          )}
          <motion.button whileTap={{ scale: 0.93 }} onClick={next} className="rounded-2xl bg-navy px-5 py-2.5 text-sm font-extrabold text-white">
            {last ? "Selesai" : "Lanjut"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Tombol "?" untuk mengulang tur. */
export function TourButton({ className = "" }: { className?: string }) {
  const { start } = useTour();
  return (
    <motion.button whileTap={{ scale: 0.85 }} onClick={start} aria-label="Lihat tutorial" className={className}>
      <CircleHelp size={22} />
    </motion.button>
  );
}

/** Item menu Profil untuk mengulang tur. */
export function TourMenuItem() {
  const { start } = useTour();
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={start} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-soft">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky text-white"><CircleHelp size={22} /></span>
      <span className="flex-1">
        <span className="block font-semibold">Lihat tutorial lagi</span>
        <span className="block text-sm text-muted">PatRot antar keliling semua halaman</span>
      </span>
      <ChevronRight size={18} className="text-muted" />
    </motion.button>
  );
}
