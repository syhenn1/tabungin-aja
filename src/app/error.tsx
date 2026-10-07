"use client";

import { motion } from "motion/react";
import { RotateCw } from "lucide-react";
import { useEffect } from "react";
import { PatRot } from "@/components/PatRot";

// Menangkap error di halaman mana pun (termasuk layout aplikasi), mis. koneksi ke Supabase putus.
// Tanpa ini, error data membuat halaman gagal total dan dev server memuat ulang terus.
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="hero flex min-h-dvh flex-col items-center justify-center px-6 text-center text-white">
      <PatRot mood="worried" size={140} message="Kwak... sinyalnya lagi susah. Coba lagi, ya!" />
      <h1 className="mt-4 text-2xl font-extrabold">Gagal memuat data</h1>
      <p className="mt-2 max-w-xs text-white/75">Koneksi ke server sedang lambat atau terputus. Periksa internetmu, lalu coba lagi.</p>
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={retry}
        className="mt-6 flex items-center gap-2 rounded-2xl bg-mint px-6 py-3.5 font-extrabold text-[#063a30] shadow-lg"
      >
        <RotateCw size={18} strokeWidth={2.6} /> Coba lagi
      </motion.button>
    </div>
  );
}
