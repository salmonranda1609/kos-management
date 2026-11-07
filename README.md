# 🏠 Aplikasi Manajemen Kos (PWA)

Aplikasi manajemen kos dengan **Next.js + Supabase + Tailwind**, siap deploy ke **Vercel** sebagai PWA.

## Roles
- **Penjaga**: input tamu, checkout, lihat kamar
- **Pemilik**: dashboard read-only (lihat jumlah kamar terisi)

## Setup

### 1. Install
```bash
npm install
```

### 2. Setup Supabase
1. Buat project di https://supabase.com
2. Buka SQL Editor, jalankan isi file `supabase/schema.sql`
3. Buka **Authentication → Users → Add user** dan buat 2 user:
   - `penjaga@kos.com` / `password123` — metadata: `{"role":"penjaga","full_name":"Pak Penjaga"}`
   - `pemilik@kos.com` / `password123` — metadata: `{"role":"pemilik","full_name":"Pak Pemilik"}`
4. Copy `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dari **Settings → API**

### 3. Buat file `.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 4. Jalankan
```bash
npm run dev
```

Buka http://localhost:3000

## Deploy ke Vercel
1. Push ke GitHub
2. Import ke vercel.com
3. Tambahkan 2 env var di atas
4. Deploy ✅

## PWA
Buka URL Vercel di Chrome mobile → menu → "Add to Home Screen"
