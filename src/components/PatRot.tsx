"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

export type Mood = "happy" | "normal" | "worried";

const TIPS = [
  "Sisihkan dulu, baru belanja!",
  "Catat jajan kecil juga ya, lama-lama jadi bukit.",
  "Hemat pangkal kaya, kwak!",
  "Cek laporan bulananmu biar makin paham pola belanja.",
  "Dana darurat itu sahabat terbaik.",
];

const BUBBLE_W = 176; // w-44
const BUBBLE_H = 96; // perkiraan tinggi balon 3 baris + jarak

/** Maskot burung beo Tabungin. Ketuk untuk tips; dia mengepak dan tersenyum. */
export function PatRot({ mood = "normal", size, message, className = "" }: { mood?: Mood; size?: number; message?: string; className?: string }) {
  const [say, setSay] = useState<string | null>(null);
  const [taps, setTaps] = useState(0);
  const [smiling, setSmiling] = useState(false);
  // Posisi balon dihitung saat diketuk supaya tidak keluar layar.
  const [place, setPlace] = useState({ below: false, toRight: false });
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const smileTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function tap() {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPlace({ below: r.top < BUBBLE_H, toRight: r.left + r.width / 2 < BUBBLE_W + 16 });
    setTaps((n) => n + 1);
    setSay(message && taps === 0 ? message : TIPS[taps % TIPS.length]);
    setSmiling(true);
    clearTimeout(timer.current);
    clearTimeout(smileTimer.current);
    timer.current = setTimeout(() => setSay(null), 3200);
    smileTimer.current = setTimeout(() => setSmiling(false), 1100);
  }

  const bubblePos = `${place.below ? "top-[96%]" : "bottom-[96%]"} ${place.toRight ? "left-1/2" : "right-1/2"}`;
  const tail = place.below ? (place.toRight ? "rounded-tl-sm origin-top-left" : "rounded-tr-sm origin-top-right") : place.toRight ? "rounded-bl-sm origin-bottom-left" : "rounded-br-sm origin-bottom-right";

  return (
    <div ref={ref} className={`relative inline-block ${className}`} style={size ? { width: size, height: size } : undefined}>
      <AnimatePresence>
        {say && (
          <motion.div
            key={say}
            initial={{ opacity: 0, scale: 0.6, y: place.below ? -8 : 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className={`absolute z-30 w-44 rounded-2xl bg-white px-3 py-2 text-left text-xs font-semibold text-[#101a44] shadow-lg ${bubblePos} ${tail}`}
            role="status"
          >
            {say}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        onClick={tap}
        aria-label="PatRot, maskot Tabungin. Ketuk untuk tips."
        className="block h-full w-full cursor-pointer"
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.05 }}
      >
        <ParrotSvg mood={mood} flap={taps} smiling={smiling} />
      </motion.button>
    </div>
  );
}

const INK = "#101a44";

/** PatRot menghadap depan. flap: berubah = sayap mengepak. smiling: paruh terbuka tersenyum. */
export function ParrotSvg({ mood = "normal", flap = 0, smiling = false }: { mood?: Mood; flap?: number; smiling?: boolean }) {
  const happyEyes = smiling || mood === "happy";
  // Paruh bawah turun = mulut terbuka. Saat senang sedikit terbuka, saat diketuk lebar.
  const jaw = smiling ? 6 : mood === "happy" ? 2.5 : 0;
  const wing = (dir: 1 | -1) => (flap ? [0, 38 * dir, -8 * dir, 28 * dir, 0] : 0);

  return (
    <motion.svg
      viewBox="0 0 120 120"
      className="h-full w-full overflow-visible"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      {/* bayangan */}
      <ellipse cx="60" cy="115" rx="24" ry="3.5" fill="#000" opacity=".12" />

      {/* ekor di belakang badan */}
      <path d="M52 92 L46 116 L56 108 Z" fill="#2f39a9" />
      <path d="M68 92 L74 116 L64 108 Z" fill="#2f39a9" />
      <path d="M56 94 L60 119 L64 94 Z" fill="#49a4bb" />

      {/* sayap kiri & kanan: mengepak ke luar setiap kali diketuk */}
      <motion.g key={`l${flap}`} style={{ originX: 0.85, originY: 0.12 }} animate={{ rotate: wing(1) }} transition={{ duration: 0.7 }}>
        <ellipse cx="34" cy="74" rx="11" ry="22" transform="rotate(18 34 74)" fill="#2e6fa0" />
        <ellipse cx="32" cy="80" rx="6" ry="14" transform="rotate(18 32 80)" fill="#49a4bb" />
      </motion.g>
      <motion.g key={`r${flap}`} style={{ originX: 0.15, originY: 0.12 }} animate={{ rotate: wing(-1) }} transition={{ duration: 0.7 }}>
        <ellipse cx="86" cy="74" rx="11" ry="22" transform="rotate(-18 86 74)" fill="#2e6fa0" />
        <ellipse cx="88" cy="80" rx="6" ry="14" transform="rotate(-18 88 80)" fill="#49a4bb" />
      </motion.g>

      {/* jambul: bergoyang saat senang */}
      <motion.g
        style={{ originX: 0.5, originY: 1 }}
        animate={{ rotate: happyEyes ? [0, -10, 10, 0] : 0 }}
        transition={{ duration: 0.8, repeat: mood === "happy" ? Infinity : 0, repeatDelay: 1.4 }}
      >
        <ellipse cx="51" cy="22" rx="4.5" ry="12" transform="rotate(-28 51 22)" fill="#2f39a9" />
        <ellipse cx="60" cy="17" rx="5" ry="14" fill="#2e6fa0" />
        <ellipse cx="69" cy="22" rx="4.5" ry="12" transform="rotate(28 69 22)" fill="#49a4bb" />
      </motion.g>

      {/* badan & perut */}
      <ellipse cx="60" cy="68" rx="30" ry="36" fill="#15d8b3" />
      <ellipse cx="60" cy="84" rx="18" ry="19" fill="#a6f5e5" />

      {/* bercak putih di sekitar mata */}
      <ellipse cx="47.5" cy="50" rx="11" ry="11.5" fill="#fff" />
      <ellipse cx="72.5" cy="50" rx="11" ry="11.5" fill="#fff" />

      {/* mata */}
      {happyEyes ? (
        <>
          <path d="M42 52 Q48 44 54 52" stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none" />
          <path d="M66 52 Q72 44 78 52" stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <motion.g
          style={{ originX: 0.5, originY: 0.5 }}
          animate={{ scaleY: [1, 1, 0.1, 1] }}
          transition={{ duration: 4, times: [0, 0.9, 0.95, 1], repeat: Infinity }}
        >
          <circle cx="48.5" cy="50.5" r="5.5" fill={INK} />
          <circle cx="71.5" cy="50.5" r="5.5" fill={INK} />
          <circle cx="50.3" cy="48.3" r="2" fill="#fff" />
          <circle cx="73.3" cy="48.3" r="2" fill="#fff" />
        </motion.g>
      )}

      {mood === "worried" && !smiling && (
        <>
          <path d="M41 42 L54 37.5" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M79 42 L66 37.5" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          <motion.path
            d="M90 30 Q94 36 90 39 Q86 36 90 30 Z"
            fill="#49a4bb"
            animate={{ y: [0, 6], opacity: [1, 0] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        </>
      )}

      {/* pipi merona: lebih merah saat tersenyum */}
      <motion.ellipse cx="40" cy="63" rx="5" ry="3.5" fill="#ff8fa3" animate={{ opacity: smiling ? 0.9 : mood === "worried" ? 0.25 : 0.55, scale: smiling ? 1.25 : 1 }} />
      <motion.ellipse cx="80" cy="63" rx="5" ry="3.5" fill="#ff8fa3" animate={{ opacity: smiling ? 0.9 : mood === "worried" ? 0.25 : 0.55, scale: smiling ? 1.25 : 1 }} />

      {/* mulut di balik paruh: terlihat saat paruh bawah turun */}
      <motion.g style={{ originX: 0.5, originY: 0 }} initial={false} animate={{ scaleY: jaw ? 1 : 0, opacity: jaw ? 1 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
        <ellipse cx="60" cy="66" rx="7" ry="5" fill="#7a2338" />
        <ellipse cx="60" cy="69" rx="4" ry="2.2" fill="#ff8fa3" />
      </motion.g>

      {/* paruh bawah */}
      <motion.path
        d="M53 63 Q60 66.5 67 63 Q65.5 71 60 72.5 Q54.5 71 53 63 Z"
        fill="#e8901a"
        initial={false}
        animate={{ y: jaw }}
        transition={{ type: "spring", stiffness: 500, damping: 16 }}
      />
      {/* paruh atas: sedikit terangkat saat tersenyum */}
      <motion.path
        d="M50.5 55 Q60 49 69.5 55 Q69.5 62.5 60 67 Q50.5 62.5 50.5 55 Z"
        fill="#ffb830"
        initial={false}
        animate={{ y: smiling ? -1.5 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 16 }}
      />
      <path d="M55 56 Q60 54 65 56" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".55" />

      {/* kaki */}
      <path d="M52 102 v6 m-4 0 h8 M68 102 v6 m-4 0 h8" stroke="#ffb830" strokeWidth="3" strokeLinecap="round" />
    </motion.svg>
  );
}
