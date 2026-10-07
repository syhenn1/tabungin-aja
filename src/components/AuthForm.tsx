"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CircleAlert, CircleCheck, Eye, EyeOff, LockKeyhole, Mail, UserRound, type LucideIcon } from "lucide-react";
import { useActionState, useState, type FormEvent } from "react";
import { login, register, requestPasswordReset, updatePassword, type FormState } from "@/app/actions";
import { validateAuth, type AuthMode, type FieldErrors } from "@/lib/validate";

const ACTIONS = { login, register, forgot: requestPasswordReset, reset: updatePassword };
const SUBMIT = { login: "Masuk", register: "Buat akun", forgot: "Kirim tautan", reset: "Simpan kata sandi baru" };
const QUERY_ERRORS: Record<string, string> = {
  confirm: "Tautan konfirmasi tidak valid atau kedaluwarsa.",
  expired: "Tautan atur ulang kata sandi sudah kedaluwarsa. Minta tautan baru di bawah.",
};

type Key = keyof FieldErrors;

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [state, action, pending] = useActionState<FormState, FormData>(ACTIONS[mode], null);
  // Input dikontrol supaya isian tidak hilang saat server mengembalikan error.
  const [values, setValues] = useState<Record<Key, string>>({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [show, setShow] = useState(false);
  const params = useSearchParams();
  const queryError = params.get("confirm") === "failed" ? QUERY_ERRORS.confirm : params.get("expired") ? QUERY_ERRORS.expired : undefined;
  const error = state?.error ?? (!state ? queryError : undefined);

  // Validasi di browser dulu; kalau ada yang salah, form tidak dikirim ke server.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const found = validateAuth(mode, new FormData(e.currentTarget));
    setErrors(found);
    if (Object.keys(found).length) e.preventDefault();
  }

  const field = (key: Key) => ({
    name: key,
    value: values[key],
    error: errors[key],
    onChange: (v: string) => {
      setValues((s) => ({ ...s, [key]: v }));
      if (errors[key]) setErrors((s) => ({ ...s, [key]: undefined }));
    },
  });

  const eye = (
    <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} className="p-1 text-muted">
      {show ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  return (
    <form action={action} onSubmit={onSubmit} noValidate className="space-y-4">
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

      {mode === "register" && <Field icon={UserRound} label="Nama lengkap" autoComplete="name" maxLength={50} {...field("name")} />}
      {mode !== "reset" && <Field icon={Mail} label="Email" inputMode="email" autoComplete="email" {...field("email")} />}
      {mode !== "forgot" && (
        <Field
          icon={LockKeyhole}
          label={mode === "reset" ? "Kata sandi baru" : "Kata sandi"}
          type={show ? "text" : "password"}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          trailing={eye}
          hint={mode === "login" ? undefined : "Minimal 8 karakter."}
          {...field("password")}
        />
      )}
      {mode === "reset" && <Field icon={LockKeyhole} label="Ulangi kata sandi baru" type={show ? "text" : "password"} autoComplete="new-password" {...field("confirm")} />}

      {mode === "login" && (
        <div className="-mt-1 text-right">
          <Link href="/lupa-password" className="text-sm font-bold text-ocean dark:text-sky">
            Lupa kata sandi?
          </Link>
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        disabled={pending}
        className="w-full rounded-2xl bg-navy py-3.5 font-extrabold text-white shadow-lg shadow-navy/30 disabled:opacity-60"
      >
        {pending ? "Sebentar..." : SUBMIT[mode]}
      </motion.button>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? "Belum punya akun? " : mode === "register" ? "Sudah punya akun? " : "Ingat kata sandimu? "}
        <Link href={mode === "login" ? "/register" : "/login"} className="font-bold text-ocean dark:text-sky">
          {mode === "login" ? "Daftar sekarang" : "Masuk"}
        </Link>
      </p>
    </form>
  );
}

function Field({ icon: Icon, label, trailing, hint, error, value, onChange, ...props }: {
  icon: LucideIcon;
  label: string;
  trailing?: React.ReactNode;
  hint?: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const id = `f-${props.name}`;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-muted">{label}</label>
      <span className={`mt-1 flex items-center gap-2 rounded-2xl border-2 bg-soft px-3 transition-colors ${error ? "border-expense" : "border-line focus-within:border-sky"}`}>
        <Icon size={18} className={`shrink-0 ${error ? "text-expense" : "text-sky"}`} />
        <input
          id={id}
          {...props}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-err` : undefined}
          className="w-full bg-transparent py-3 outline-none"
        />
        {trailing}
      </span>
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p key="err" id={`${id}-err`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-1 flex items-center gap-1 text-xs font-semibold text-expense">
            <CircleAlert size={13} /> {error}
          </motion.p>
        ) : (
          hint && <p className="mt-1 text-xs text-muted">{hint}</p>
        )}
      </AnimatePresence>
    </div>
  );
}
