import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { AuthCard } from "../card";

export const metadata = { title: "Lupa kata sandi" };

export default function LupaPasswordPage() {
  return (
    <AuthCard title="Lupa kata sandi?" subtitle="Masukkan email akunmu. Kami kirim tautan untuk membuat kata sandi baru.">
      <Suspense>
        <AuthForm mode="forgot" />
      </Suspense>
    </AuthCard>
  );
}
