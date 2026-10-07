"use client";

import { motion } from "motion/react";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="w-full max-w-md rounded-[2rem] bg-surface p-6 shadow-2xl sm:p-8"
    >
      <h2 className="text-2xl font-extrabold">{title}</h2>
      <p className="mb-6 text-sm text-muted">{subtitle}</p>
      {children}
    </motion.div>
  );
}
