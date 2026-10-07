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

/** Maskot burung beo Tabungin. Ketuk untuk melihat tips. */
export function PatRot({ mood = "normal", size, message, className = "" }: { mood?: Mood; size?: number; message?: string; className?: string }) {
  const [say, setSay] = useState<string | null>(null);
  const [taps, setTaps] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function tap() {
    setTaps((n) => n + 1);
    setSay(message && taps === 0 ? message : TIPS[taps % TIPS.length]);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSay(null), 3200);
  }

  return (
    <div className={`relative inline-block ${className}`} style={size ? { width: size, height: size } : undefined}>
      <AnimatePresence>
        {say && (
          <motion.div
            key={say}
            initial={{ opacity: 0, scale: 0.6, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="absolute bottom-[92%] right-1/2 z-20 w-44 origin-bottom-right rounded-2xl rounded-br-sm bg-white px-3 py-2 text-xs font-semibold text-[#101a44] shadow-lg"
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
        whileTap={{ scale: 0.85, rotate: -6 }}
        whileHover={{ scale: 1.05 }}
      >
        <ParrotSvg mood={mood} bounce={taps} />
      </motion.button>
    </div>
  );
}

export function ParrotSvg({ mood = "normal", bounce = 0 }: { mood?: Mood; bounce?: number }) {
  return (
    <motion.svg
      viewBox="0 0 120 120"
      className="h-full w-full overflow-visible"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      {/* bayangan */}
      <ellipse cx="60" cy="114" rx="22" ry="3.5" fill="#000" opacity=".12" />
      {/* ekor */}
      <path d="M44 92 L30 116 L42 112 L46 118 L56 96 Z" fill="#2f39a9" />
      <path d="M50 94 L44 118 L54 110 Z" fill="#49a4bb" />
      {/* jambul */}
      <motion.g
        style={{ originX: "56px", originY: "38px" }}
        animate={{ rotate: mood === "happy" ? [0, -8, 8, 0] : 0 }}
        transition={{ duration: 0.8, repeat: mood === "happy" ? Infinity : 0, repeatDelay: 1.5 }}
      >
        <ellipse cx="50" cy="22" rx="5" ry="13" transform="rotate(-30 50 22)" fill="#2f39a9" />
        <ellipse cx="58" cy="18" rx="5" ry="14" transform="rotate(-8 58 18)" fill="#2e6fa0" />
        <ellipse cx="66" cy="21" rx="4.5" ry="12" transform="rotate(18 66 21)" fill="#49a4bb" />
      </motion.g>
      {/* badan */}
      <ellipse cx="60" cy="66" rx="31" ry="37" fill="#15d8b3" />
      <ellipse cx="65" cy="78" rx="18" ry="22" fill="#a6f5e5" />
      {/* sayap: mengepak setiap kali diketuk */}
      <motion.g
        key={bounce}
        style={{ originX: "48px", originY: "56px" }}
        initial={{ rotate: 0 }}
        animate={{ rotate: bounce ? [0, -35, 10, -25, 0] : 0 }}
        transition={{ duration: 0.6 }}
      >
        <ellipse cx="42" cy="74" rx="13" ry="23" transform="rotate(12 42 74)" fill="#2e6fa0" />
        <ellipse cx="40" cy="80" rx="7" ry="15" transform="rotate(12 40 80)" fill="#49a4bb" />
        <ellipse cx="38" cy="88" rx="4" ry="9" transform="rotate(12 38 88)" fill="#2f39a9" />
      </motion.g>
      {/* wajah */}
      <ellipse cx="72" cy="50" rx="14" ry="13" fill="#fff" />
      {mood === "happy" ? (
        <path d="M66 51 Q72 43 78 51" stroke="#101a44" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      ) : (
        <motion.g
          style={{ originX: "73px", originY: "50px" }}
          animate={{ scaleY: [1, 1, 0.1, 1] }}
          transition={{ duration: 4, times: [0, 0.9, 0.95, 1], repeat: Infinity }}
        >
          <circle cx="73" cy="50" r="6" fill="#101a44" />
          <circle cx="75" cy="47.5" r="2.2" fill="#fff" />
        </motion.g>
      )}
      {mood === "worried" && (
        <>
          <path d="M65 40 L79 37" stroke="#101a44" strokeWidth="2.5" strokeLinecap="round" />
          <motion.path
            d="M88 34 Q92 40 88 43 Q84 40 88 34 Z"
            fill="#49a4bb"
            animate={{ y: [0, 6], opacity: [1, 0] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        </>
      )}
      <circle cx="66" cy="60" r="4.5" fill="#ff8fa3" opacity={mood === "worried" ? 0.25 : 0.6} />
      {/* paruh */}
      <path d="M81 52 Q99 50 96 66 Q90 59 81 61 Z" fill="#ffb830" />
      <path d={mood === "happy" ? "M81 62 Q90 63 91 70 Q84 73 80 67 Z" : "M81 61 Q88 61 90 66 Q84 68 80 65 Z"} fill="#e8901a" />
      {/* kaki */}
      <path d="M54 101 v6 m-4 0 h8 M68 101 v6 m-4 0 h8" stroke="#ffb830" strokeWidth="3" strokeLinecap="round" />
    </motion.svg>
  );
}
