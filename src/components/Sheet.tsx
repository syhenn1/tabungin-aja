"use client";

import { motion, useDragControls } from "motion/react";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

/** Kerangka bottom sheet: backdrop, geser ke bawah untuk tutup, Escape, kunci scroll. */
export function SheetShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const drag = useDragControls();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-[#0b1232]/50 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-x-0 bottom-0 z-[60] mx-auto max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] bg-surface pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
        drag="y"
        dragListener={false}
        dragControls={drag}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, i) => (i.offset.y > 120 || i.velocity.y > 600) && onClose()}
      >
        <div className="sticky top-0 z-10 cursor-grab touch-none bg-surface px-5 pt-3" onPointerDown={(e) => drag.start(e)}>
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">{title}</h2>
            <button onClick={onClose} aria-label="Tutup" className="rounded-full p-2 text-muted hover:bg-soft">
              <X size={20} />
            </button>
          </div>
        </div>
        {children}
      </motion.div>
    </>
  );
}

export const groupDigits = (s: string) => s.replace(/\D/g, "").replace(/^0+/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
