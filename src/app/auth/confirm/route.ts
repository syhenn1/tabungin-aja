import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

// Tautan konfirmasi email. Mendukung template bawaan (?code=) dan template token_hash (lintas perangkat).
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const db = await supabase();
  const code = q.get("code");
  const token_hash = q.get("token_hash");

  const { error } = code
    ? await db.auth.exchangeCodeForSession(code)
    : token_hash
      ? await db.auth.verifyOtp({ type: (q.get("type") as EmailOtpType) ?? "email", token_hash })
      : { error: true };

  return NextResponse.redirect(new URL(error ? "/login?confirm=failed" : "/", request.url));
}
