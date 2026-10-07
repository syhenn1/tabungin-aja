"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CircleAlert, CircleCheck, Eye, EyeOff, LockKeyhole, Mail, UserRound, type LucideIcon } from "lucide-react";
import { useActionState, useState } from "react";
import { login, register, type FormState } from "@/app/actions";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const [state, action, pending] = useActionState<FormState, FormData>(isLogin ? login : register, null);
  const [show, setShow] = useState(false);
  const failedConfirm = useSearchParams().get("confirm") === "failed";
  const error = state?.error ?? (failedConfirm && !state ? "Tautan konfirmasi tidak valid atau kedaluwarsa." : undefined);

  return (
    <form action={action} className="space-y-4">
      <AnimatePresence mode="wait">
        {(error || state?.ok) && (
          <motion.p
            key={error ?? state?.ok}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: error ? [0, -8, 8, -5, 5, 0] : 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className={`flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${error ? "bg-expense/10 text-expense" : "bg-mint/15 text-income"}`}
          >
            {error ? <CircleAlert size={18} className="mt-px shrink-0" /> : <CircleCheck size={18} className="mt-px shrink-0" />}
            {error ?? state?.ok}
          </motion.p>
        )}
      </AnimatePresence>

      {!isLogin && <Field icon={UserRound} name="name" label="Nama lengkap" autoComplete="name" minLength={2} maxLength={50} />}
      <Field icon={Mail} name="email" label="Email" type="email" autoComplete="email" />
      <Field
        icon={LockKeyhole}
        name="password"
        label="Kata sandi"
        type={show ? "text" : "password"}
        autoComplete={isLogin ? "current-password" : "new-password"}
        minLength={isLogin ? undefined : 8}
        trailing={
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} className="p-1 text-muted">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
      />
      {!isLogin && <p className="-mt-2 text-xs text-muted">Minimal 8 karakter.</p>}

      <motion.button
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        disabled={pending}
        className="w-full rounded-2xl bg-navy py-3.5 font-extrabold text-white shadow-lg shadow-navy/30 disabled:opacity-60"
      >
        {pending ? "Sebentar..." : isLogin ? "Masuk" : "Buat akun"}
      </motion.button>

      <p className="text-center text-sm text-muted">
        {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
        <Link href={isLogin ? "/register" : "/login"} className="font-bold text-ocean dark:text-sky">
          {isLogin ? "Daftar sekarang" : "Masuk"}
        </Link>
      </p>
    </form>
  );
}

function Field({ icon: Icon, label, trailing, ...props }: { icon: LucideIcon; label: string; trailing?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-muted">{label}</span>
      <span className="mt-1 flex items-center gap-2 rounded-2xl border-2 border-line bg-soft px-3 transition-colors focus-within:border-sky">
        <Icon size={18} className="shrink-0 text-sky" />
        <input required {...props} className="w-full bg-transparent py-3 outline-none" />
        {trailing}
      </span>
    </label>
  );
}
