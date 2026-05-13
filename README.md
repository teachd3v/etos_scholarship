# Etos ID 2026 — Portal Seleksi Beasiswa

Portal pendaftaran beasiswa Etos ID 2026 berbasis web. Dirancang untuk memberikan pengalaman pendaftaran yang mudah bagi calon peserta dan kemudahan manajemen data bagi administrator, dengan arsitektur yang siap dimigrasi ke backend Supabase.

---

## ✨ Fitur

### Pendaftar
- **Skrining Eligibilitas (Onboarding)** — Cek syarat awal sebelum formulir dibuka: tahun lulus, kampus tujuan, program studi, agama, dan upload ijazah + bukti SNBP/SNBT
- **Formulir Multi-Step (6 Langkah)** — Data Pribadi, Keluarga, Kondisi Ekonomi, Prestasi, Organisasi, dan Esai
- **Auto-save & Review** — Data tersimpan otomatis, bisa ditinjau ulang sebelum submit final
- **Dashboard Pendaftar** — Progres pengisian, status verifikasi real-time, jadwal seleksi dinamis, dan kartu inspirasi bergilir
- **Form Terkunci Otomatis** — Setelah dinyatakan lolos atau ditolak, formulir tidak bisa diubah lagi

### Admin (`/admin`)
- **Manajemen Pendaftar** — Lihat semua pendaftar, filter berdasarkan status, klik detail untuk melihat data lengkap
- **Halaman Detail Independen** — Menampilkan semua data pendaftar per seksi: Verifikasi Awal, Data Pribadi, Keluarga, Kondisi Ekonomi, Prestasi, Organisasi, dan Esai
- **Ceklis Verifikasi Inline** — Setiap seksi dilengkapi checklist verifikasi dengan fitur coret & catatan opsional, tersimpan otomatis per pendaftar
- **Tindakan Verifikasi** — Loloskan atau tolak pendaftar langsung dari halaman detail; status langsung sync ke dashboard user
- **Konfigurasi Form** — Atur timeline pendaftaran (mulai & tutup) dan jadwal tahapan seleksi yang tampil di dashboard user

---

## 🛠️ Teknologi

| Layer | Stack |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS — custom design system (glassmorphism, dark mode) |
| Data layer (sekarang) | `localStorage` — cocok untuk demo & development |
| Data layer (produksi) | Supabase (PostgreSQL + Auth + Storage) — sudah disiapkan, tinggal disambungkan |
| Deployment | Vercel (konfigurasi SPA routing sudah ada) |

---

## 🚀 Menjalankan Secara Lokal

### Tanpa Supabase (mode demo / localStorage)

```bash
git clone https://github.com/teachd3v/etos_scholarship.git
cd etos_scholarship
npm install
npm run dev
```

Aplikasi langsung berjalan tanpa konfigurasi tambahan. Semua data tersimpan di `localStorage` browser.

Akses admin di: `http://localhost:5173/admin`
Password default: `etosadmin2026`

### Dengan Supabase (mode produksi)

1. Buat project di [supabase.com](https://supabase.com)
2. Buat file `.env` di root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Jalankan `npm run dev` — aplikasi otomatis mendeteksi Supabase dan beralih dari localStorage

---

## 📂 Struktur Proyek

```
src/
├── App.jsx              # Root app, routing, state utama
├── Auth.jsx             # Halaman login
├── Onboarding.jsx       # Skrining eligibilitas awal
├── Dashboard.jsx        # Dashboard pendaftar
├── FormShell.jsx        # Wrapper stepper form
├── FormSteps.jsx        # 6 langkah formulir
├── FormState.jsx        # BLANK_FORM, validasi per-step
├── Review.jsx           # Halaman tinjauan sebelum submit
├── Admin.jsx            # Panel admin lengkap
├── Primitives.jsx       # Komponen UI dasar (Button, GlassCard, Stepper, dll)
├── Icons.jsx            # Icon set custom (SVG)
└── lib/
    ├── supabase.js          # Supabase client
    ├── defaultConfig.js     # Konfigurasi default (timeline, jadwal, esai)
    └── FormConfigContext.jsx # Context provider konfigurasi form
styles.css               # Design system utama
styles-proto.css         # Komponen dashboard & proto
```

---

## 🗺️ Rencana Selanjutnya

- [ ] Migrasi data layer dari `localStorage` ke Supabase (tabel `applicants`, `form_config`)
- [ ] Supabase Storage untuk upload berkas (foto profil, KK, ijazah, dll)
- [ ] Logika enrollment gate berdasarkan `registration_start` / `registration_end`
- [ ] Sistem scoring seleksi awal

---

*Dibuat untuk memajukan kualitas sumber daya manusia daerah.*
