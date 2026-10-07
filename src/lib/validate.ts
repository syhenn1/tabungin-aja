// Aturan validasi form akun. Dipakai di browser (pesan langsung di bawah kolom)
// dan di server action (pemeriksaan ulang), jadi pesannya selalu sama.
// Sengaja tanpa atribut HTML (required/minLength/type email): form memakai noValidate.

export type AuthMode = "login" | "register" | "forgot" | "reset";
export type FieldErrors = Partial<Record<"name" | "email" | "password" | "confirm", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuth(mode: AuthMode, f: FormData): FieldErrors {
  const v = (k: string) => String(f.get(k) ?? "").trim();
  const password = String(f.get("password") ?? "");
  const e: FieldErrors = {};

  if (mode === "register") {
    const name = v("name");
    if (!name) e.name = "Nama wajib diisi.";
    else if (name.length < 2 || name.length > 50) e.name = "Nama harus 2 sampai 50 karakter.";
  }
  if (mode !== "reset") {
    const email = v("email");
    if (!email) e.email = "Email wajib diisi.";
    else if (!EMAIL.test(email)) e.email = "Format email tidak valid, contoh: nama@gmail.com.";
  }
  if (mode !== "forgot") {
    if (!password) e.password = "Kata sandi wajib diisi.";
    else if (mode !== "login" && password.length < 8) e.password = "Kata sandi minimal 8 karakter.";
  }
  if (mode === "reset" && !e.password && String(f.get("confirm") ?? "") !== password) {
    e.confirm = "Konfirmasi kata sandi tidak sama.";
  }
  return e;
}

/** Pesan error pertama, untuk server action. */
export const firstError = (e: FieldErrors) => Object.values(e)[0];
