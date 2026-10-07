import { createServerClient } from "@supabase/ssr";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Manifest harus bisa diambil sebelum login (dipakai saat "Tambah ke Layar Utama"); ikon .png sudah dilewati matcher.
const PUBLIC = ["/login", "/register", "/auth", "/manifest.webmanifest"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const db = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list, headers) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
        },
      },
    },
  );

  // Menyegarkan token yang kedaluwarsa. Jangan taruh kode di antara createServerClient dan baris ini.
  const { data, error } = await db.auth.getClaims();
  // Saat jaringan bermasalah jangan mengarahkan ke /login; halaman yang menampilkan pesan error.
  if (isAuthRetryableFetchError(error)) return response;
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC.some((p) => path.startsWith(p));

  if (!data?.claims && !isPublic) return redirectWithCookies(request, response, "/login");
  if (data?.claims && (path === "/login" || path === "/register")) return redirectWithCookies(request, response, "/");

  return response;
}

function redirectWithCookies(request: NextRequest, from: NextResponse, to: string) {
  const res = NextResponse.redirect(new URL(to, request.url));
  from.cookies.getAll().forEach((c) => res.cookies.set(c));
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
