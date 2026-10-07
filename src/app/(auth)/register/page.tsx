import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { AuthCard } from "../card";

export const metadata = { title: "Daftar" };

export default function RegisterPage() {
  return (
    <AuthCard title="Buat akun baru" subtitle="Gratis, cuma butuh semenit.">
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </AuthCard>
  );
}
