import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

// Tautan dari email (konfirmasi daftar & atur ulang kata sandi).
// Mendukung template bawaan (?code=) dan template token_hash (lintas perangkat).
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  // Hanya path internal, cegah open redirect ke situs lain (mis. "//situs-jahat.com").
  const nextParam = q.get("next") ?? "/";
  const next = /^\/(?![/\\])/.test(nextParam) ? nextParam : "/";
  const failed = next === "/reset-password" ? "/lupa-password?expired=1" : "/login?confirm=failed";
  const db = await supabase();
  const code = q.get("code");
  const token_hash = q.get("token_hash");

  const { error } = code
    ? await db.auth.exchangeCodeForSession(code)
    : token_hash
      ? await db.auth.verifyOtp({ type: (q.get("type") as EmailOtpType) ?? "email", token_hash })
      : { error: true };

  return NextResponse.redirect(new URL(error ? failed : next, request.url));
}
