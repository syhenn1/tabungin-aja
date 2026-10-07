import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { AuthCard } from "../card";

export const metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <AuthCard title="Selamat datang kembali" subtitle="Masuk untuk melihat tabunganmu.">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </AuthCard>
  );
}
