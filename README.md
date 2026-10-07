# Tabungin

Aplikasi pencatat tabungan (pemasukan dan pengeluaran) dengan maskot PatRot. Dibangun dengan Next.js 16, Supabase (Postgres + Auth), Tailwind CSS 4, Motion, dan Recharts.

## Fitur

- Daftar, masuk, dan lupa kata sandi dengan email (Supabase Auth); validasi form lewat kode, tanpa popup bawaan browser
- Dompet / sumber dana: Tunai, Bank, E-Wallet, dan Lainnya, masing-masing dengan saldo awal
- Transfer antar dompet (isi saldo e-wallet, tarik tunai) yang tidak dihitung sebagai pemasukan/pengeluaran
- Total saldo semua dompet ala m-banking, bisa disembunyikan
- Ringkasan hari ini, bulan ini, dan tahun ini
- Laporan harian (14 hari), bulanan (12 bulan), dan tahunan (5 tahun), plus pengeluaran per kategori dan per sumber dana
- Riwayat transaksi per bulan, dikelompokkan per hari, dengan filter jenis dan per dompet
- Tambah, ubah, dan hapus transaksi lewat bottom sheet
- Maskot PatRot dengan ekspresi sesuai kondisi keuangan bulan ini
- Bisa dipasang di layar utama iPhone/Android seperti aplikasi (PWA)
- Tampilan satu kolom ala aplikasi dengan bottom nav, mengikuti mode gelap sistem

## Setup lokal

1. Buat project di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, lalu jalankan berurutan, masing-masing sekali:
   1. [`supabase/schema.sql`](supabase/schema.sql)
   2. [`supabase/002_wallets.sql`](supabase/002_wallets.sql)
3. Salin `.env.example` menjadi `.env.local`, lalu isi:
   - `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dari **Project Settings > API Keys**
   - `NEXT_PUBLIC_SITE_URL` diisi `http://localhost:3000`
4. Jalankan:
   ```bash
   npm install
   npm run dev
   ```

## Konfigurasi Auth di Supabase

Buka **Authentication > URL Configuration**:

- **Site URL**: URL produksi, misalnya `https://nama-project-anda.vercel.app`
- **Redirect URLs**: tambahkan `http://localhost:3000/**` dan `https://nama-project-anda.vercel.app/**`

Konfirmasi email (**Authentication > Sign In / Providers > Email > Confirm email**):

- **Aktif (disarankan untuk produksi)**: pengguna harus mengklik tautan di email sebelum bisa masuk. Supaya tautannya juga berfungsi kalau dibuka di perangkat lain, ubah template **Authentication > Emails > Confirm signup** menjadi:
  ```html
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Konfirmasi email</a>
  ```
- **Nonaktif**: pengguna langsung masuk setelah mendaftar.

Lupa kata sandi: ubah template **Authentication > Emails > Reset Password** menjadi:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Buat kata sandi baru</a>
```

Tanpa perubahan ini tautan bawaan tetap bekerja, tetapi hanya jika dibuka di browser yang sama dengan tempat meminta tautan.

Server email bawaan Supabase hanya mengirim beberapa email per jam. Untuk produksi, pasang SMTP sendiri (misalnya Resend atau Brevo) di **Authentication > Emails > SMTP Settings**.

## Pasang di HP (PWA)

Setelah aplikasi sudah di-deploy (alamat `https://`):

- **iPhone, Safari**: buka alamat aplikasi, ketuk **Share**, pilih **Tambah ke Layar Utama**.
- **iPhone, Chrome** (iOS 16.4+): ketuk **Share** di address bar, pilih **Tambah ke Layar Utama**.
- **Android, Chrome**: ketuk menu titik tiga, pilih **Instal aplikasi** atau **Tambahkan ke layar utama**.

Ikon PatRot muncul di layar utama dan aplikasi terbuka layar penuh tanpa address bar. Pembaruan kode otomatis ikut setelah deploy ulang.

## Deploy ke Vercel

1. Push repo ke GitHub, lalu import project di [vercel.com/new](https://vercel.com/new).
2. Isi Environment Variables yang sama seperti `.env.local`, dengan `NEXT_PUBLIC_SITE_URL` diisi domain Vercel.
3. Deploy, lalu pastikan domain tersebut sudah ada di Site URL dan Redirect URLs Supabase.

## Struktur

```
supabase/schema.sql          Tabel transaksi, RLS, fungsi ringkasan cashflow()
supabase/002_wallets.sql     Dompet, transfer, saldo per dompet wallet_balances()
src/proxy.ts                 Menyegarkan sesi dan mengarahkan pengguna yang belum login
src/lib/supabase.ts          Client server dan requireUser() (Data Access Layer)
src/lib/data.ts              Query dashboard, transaksi, dan laporan
src/app/actions.ts           Server actions: auth, transaksi, dan dompet
src/app/(app)/               Beranda, Transaksi, Dompet, Laporan, Profil
src/app/manifest.ts          Manifest PWA; ikon dibuat dari src/lib/appIcon.tsx
src/app/(auth)/              Masuk dan Daftar
src/components/              PatRot, TxSheet, WalletSheet, Nav, Charts, dan komponen UI
```

## Keamanan data

- Setiap baris transaksi terikat ke `user_id`. Kebijakan RLS memastikan pengguna hanya bisa membaca dan mengubah datanya sendiri.
- Role `anon` tidak punya akses ke tabel maupun fungsi.
- Nominal disimpan sebagai `bigint` rupiah, bukan float, supaya tidak ada pembulatan yang salah.
- Saldo selalu dihitung dari saldo awal dompet + transaksi, bukan disimpan terpisah, jadi angkanya tidak bisa melenceng.
- Foreign key komposit `(wallet_id, user_id)` memastikan transaksi hanya bisa memakai dompet milik pengguna yang sama.
