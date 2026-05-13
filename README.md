# Etos ID 2026 - Portal Pendaftaran Seleksi Beasiswa

Portal pendaftaran digital untuk beasiswa Etos ID 2026. Aplikasi ini dirancang untuk memberikan pengalaman pendaftaran yang mulus bagi calon peserta dan sistem manajemen data yang efisien bagi administrator melalui integrasi real-time.

## ✨ Fitur Utama

- **Formulir Multi-Step Interaktif**: 6 Tahap pendaftaran yang mencakup Data Pribadi, Keluarga, Ekonomi, Prestasi, Organisasi, dan Esai.
- **Penyimpanan Berkas Nyata**: Integrasi dengan Supabase Storage untuk mengunggah Pas Foto dan Kartu Keluarga secara aman.
- **Strategi Skoring "Black Box"**: Sistem penilaian otomatis (Scoring Engine) di sisi server untuk membantu seleksi awal secara objektif.
- **Dashboard Pendaftar**: Antarmuka adaptif yang menampilkan progres pengisian, status verifikasi, dan linimasa jadwal seleksi.
- **Panel Admin Real-time**: Dashboard khusus admin untuk memantau pendaftar masuk secara langsung (tanpa refresh), melihat detail lengkap, serta melakukan verifikasi/persetujuan.
- **Keamanan Data**: Penguncian data (Immutable) setelah pendaftar menekan tombol submisi final.

## 🛠️ Teknologi

- **Frontend**: React.js & Vite
- **Styling**: Vanilla CSS (Custom Glassmorphism Design)
- **Backend & Database**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Icons**: Lucide React / Custom SVG

## 🚀 Cara Menjalankan Secara Lokal

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd etos-scholarship
   ```

2. **Instalasi Dependensi**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**
   Buat file `.env` di root direktori dan masukkan kunci API Supabase Anda:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Menjalankan Aplikasi**
   ```bash
   npm run dev
   ```

## 📂 Struktur Proyek

- `/src`: Berisi seluruh logika komponen React.
- `/src/lib`: Konfigurasi klien Supabase.
- `/supabase`: Berisi file `schema.sql` untuk inisialisasi database.

---
*Dibuat untuk memajukan kualitas sumber daya manusia daerah.*
