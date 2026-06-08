# Etos ID Scholarship Portal - Architecture Index

Buku peta ini berfungsi sebagai referensi utama untuk memahami arsitektur dan struktur file proyek Etos ID. Gunakan dokumen ini untuk mencari lokasi komponen, fungsi, atau tabel database dengan cepat.

## 1. Frontend Core & Routing (`src/`)
Aplikasi ini dibangun menggunakan React (Vite). Tidak menggunakan pustaka *routing* eksternal seperti `react-router`; semua transisi layar diatur via *state* di `App.jsx`.

- **`src/App.jsx`**: Titik masuk utama aplikasi (Main Entry Point). Mengatur *routing* manual (`screen` state: `landing`, `auth`, `dashboard`, `form`, dsb.), mengecek sesi pengguna, dan memuat data pendaftar.
- **`src/main.jsx`**: Bootstrapping React DOM.
- **`src/Landing.jsx`**: Halaman Landing Page (Beranda) yang berisi informasi beasiswa dan tombol Call-to-Action (CTA).
- **`src/Auth.jsx`**: Halaman Login/Register menggunakan integrasi Supabase Auth (Google & Email/Password).
- **`src/Dashboard.jsx`**: Halaman utama pendaftar setelah login. Menampilkan status aplikasi, progres pengisian, dan tombol aksi (Lanjut, Ubah, dll).
- **`src/Onboarding.jsx`**: Modal "Verifikasi Awal" untuk memilih kampus, memasukkan bukti ijazah/lulus, dll. (Datanya sekarang bisa diedit di Step 1 Form).
- **`src/Primitives.jsx`**: Komponen UI dasar yang dapat digunakan ulang (Button, Input, Card, dll.).

## 2. Form Engine (`src/`)
Sistem formulir multi-langkah (Multi-step form) untuk pendaftaran.

- **`src/FormSteps.jsx`**: Berisi implementasi UI untuk setiap langkah formulir (Step 1 hingga Step 6), termasuk komponen `useFileUpload`, `ProofUpload`, dan integrasi unggah *file*.
- **`src/FormState.jsx`**: Otak dari formulir. Berisi:
  - Definisi struktur data awal (`BLANK_FORM`).
  - Fungsi validasi (`validateStep`).
  - Logika perhitungan **Skor Had Kifayah** (`calculateHadKifayah`).
  - Kalkulator total skor (`calculateScores`).
- **`src/FormShell.jsx`**: *Wrapper* komponen form yang menangani navigasi antar langkah (Next/Prev), *auto-save* (*debounced*), dan *submit*.
- **`src/Review.jsx`**: Halaman peninjauan akhir sebelum *submit*.

## 3. Library & Utilities (`src/lib/`)
Berisi fungsi-fungsi pembantu (*helpers*) dan koneksi ke layanan pihak ketiga.

- **`src/lib/supabase.js`**: Inisialisasi *client* Supabase.
- **`src/lib/auth.js`**: Fungsi utilitas untuk login, registrasi, reset password, dan mengambil data profil pengguna (`profiles`).
- **`src/lib/applicant.js`**: Pusat manajemen data pendaftar. 
  - Menyediakan *hook* `useApplicant`.
  - Fungsi konversi *camelCase* (React) ke *snake_case* (DB).
  - Menyimpan (*upsert*) dan memuat data utama, prestasi, dan organisasi dari database.
- **`src/lib/storage.js`**: Manajemen penyimpanan *file* (Supabase Storage Bucket).
  - Konfigurasi batas ukuran & *mime-type* unggahan (`UPLOAD_LIMITS`).
  - Fungsi `uploadDocument`, `getSignedUrl`.
  - Sinkronisasi dengan tabel `documents` (`upsertDocumentRow`).
- **`src/lib/verification.js`**: Skrip utilitas untuk pengecekan data verifikasi (*backend/admin use*).
- **`src/lib/FormConfigContext.jsx`** & **`src/lib/defaultConfig.js`**: Manajemen konfigurasi dinamis (opsi pekerjaan, pertanyaan esai) dari database.

## 4. Admin Module (`src/admin/`)
Modul terpisah untuk manajemen seleksi oleh administrator. Akses lewat `/admin`.

- **`src/admin/useSubmissions.js`**: *Hook* untuk mengambil seluruh data pendaftar dari tabel `applicants` (dengan fitur *chunked fetching* untuk *bypass* limit PostgREST).
- **`src/admin/adminUtils.js`**: Fungsi *mapping* data dari DB ke format tabel Admin, serta definisi konstanta *status* pendaftar (Draft, Menunggu, dll).
- **`src/Admin.jsx`**: Komponen utama Admin Dashboard.
- **`src/admin/PendaftarPanel.jsx`**: Tabel *listing* semua pendaftar dengan filter.
- **`src/admin/AdminDetailPage.jsx`**: Halaman detail untuk verifikasi dan penilaian per pendaftar (akses skor ekonomi, berkas, esai).
- **`src/admin/KonfigurasiPanel.jsx`**: Panel untuk mengubah konfigurasi form (batas pendaftaran, dll) yang tersimpan di tabel `form_config`.

## 5. Database & Schema (`supabase/`)
Repositori ini menganut sistem "Database-as-Code". 

- **`supabase/schema.sql`** (dan folder `migrations/`): Definisi lengkap tabel, relasi, fungsi, dan *Row-Level Security* (RLS).
  **Tabel Utama:**
  - `profiles`: Data otentikasi dan *role* (admin/user). Relasi 1:1 dengan Supabase Auth.
  - `applicants`: Menyimpan seluruh data teks formulir pendaftaran dan status seleksi.
  - `documents`: Metadata dari *file* yang diunggah ke Storage (Path, *size*, *doc_type*). Memiliki `CHECK constraint` yang ketat.
  - `achievements` & `organizations`: Tabel relasional *one-to-many* untuk daftar prestasi dan organisasi pendaftar.
  - `master_had_kifayah`: Tabel referensi standar kemiskinan BAZNAS per daerah.
- **File SQL Lainnya**: Skrip utilitas yang pernah dijalankan untuk *hot-fix* (e.g. `add_family_composition.sql`, dll). Saat instalasi baru, ikuti urutan migrasi di `supabase/migrations/`.

## 6. Scripts & Tools (`scripts/`)
Kumpulan skrip bantuan (non-UI) untuk kebutuhan operasional (*tools* yang tidak *di-deploy* ke server *frontend*).

- **`scripts/blast_allpendaftar.js`**: Skrip Node.js untuk mengirimkan *email broadcast* secara massal melalui API Resend.
- **`scripts/*.csv`**: Data *dump* (hasil *query* SQL) yang digunakan oleh skrip. (Dikecualikan di `.gitignore`).
- **`scripts/*.html`**: *Template* email HTML untuk pengiriman *blast*.