import "server-only";
import { createServerClient } from "@supabase/ssr";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Satu client per request (aturan @supabase/ssr).
export async function supabase() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Dipanggil dari Server Component (read-only); proxy.ts yang menyegarkan sesi.
        }
      },
    },
  });
}

export type User = { id: string; email: string; name: string; onboarded: boolean };

// Data Access Layer: semua data milik pengguna lewat sini.
// cache(): sekali per request walau dipanggil banyak komponen.
export const requireUser = cache(async () => {
  // Data pengguna selalu per request. connection() wajib di Cache Components karena
  // getClaims() memanggil Date.now(); tanpa ini dev server error lalu memuat ulang terus.
  await connection();
  const db = await supabase();
  const { data, error } = await db.auth.getClaims();
  // Jaringan bermasalah bukan berarti belum login: tampilkan halaman "coba lagi" (error.tsx), jangan logout.
  if (isAuthRetryableFetchError(error)) throw new Error("Tidak bisa terhubung ke server.");
  const c = data?.claims;
  if (!c) redirect("/login");
  const user: User = {
    id: c.sub,
    email: c.email ?? "",
    name: (c.user_metadata?.full_name as string) || (c.email ?? "").split("@")[0],
    // Penanda UI saja (bukan otorisasi), jadi aman di user_metadata.
    onboarded: c.user_metadata?.onboarded === true,
  };
  return { db, user };
});
