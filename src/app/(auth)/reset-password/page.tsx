import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { AuthCard } from "../card";

export const metadata = { title: "Kata sandi baru" };

// Dibuka dari tautan email (lewat /auth/confirm), jadi pengguna sudah punya sesi sementara.
export default function ResetPasswordPage() {
  return (
    <AuthCard title="Buat kata sandi baru" subtitle="Setelah disimpan, kamu langsung masuk ke Tabungin.">
      <Suspense>
        <AuthForm mode="reset" />
      </Suspense>
    </AuthCard>
  );
}
