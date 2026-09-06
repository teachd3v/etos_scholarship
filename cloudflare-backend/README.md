# Panduan Deploy Cloudflare Worker & D1 Database

Folder ini berisi backend mandiri berbasis **Cloudflare Worker & Cloudflare D1 Database (SQLite)** untuk mengelola pengaturan hitung mundur dan dokumen Surat Keputusan (SK) Kelulusan Beasiswa Etos ID 2026.

Semua layanan di sini berjalan di **Free Tier Cloudflare** (Gratis 5 juta read/hari & 100 ribu write/hari) tanpa perlu kartu kredit atau domain kustom.

---

## 🚀 Langkah Deploy 2 Menit (Via Terminal)

Buka terminal di folder `cloudflare-backend/`:

```bash
cd cloudflare-backend
npm install
```

### 1. Login ke Akun Cloudflare
```bash
npx wrangler login
```
*(Browser akan terbuka otomatis untuk konfirmasi akun Cloudflare Anda).*

---

### 2. Buat Database Cloudflare D1
Jalankan perintah ini untuk membuat database D1 bernama `etos-d1`:
```bash
npm run d1:create
```
Terminal akan menampilkan output seperti ini:
```text
✅ Successfully created DB 'etos-d1'
[[d1_databases]]
binding = "DB"
database_name = "etos-d1"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Penting:** Salin `database_id` yang muncul ke file `wrangler.toml` pada baris:
```toml
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

---

### 3. Inisialisasi Skema Tabel D1
Jalankan perintah ini untuk membuat tabel `announcements` di database cloud D1:
```bash
npm run d1:init -- --remote
```

---

### 4. Deploy Worker ke Cloudflare
```bash
npm run deploy
```
Terminal akan menampilkan URL Worker publik gratis Anda, contoh:
```text
https://etos-announcement-api.username-anda.workers.dev
```

---

### 5. Hubungkan ke Frontend Vercel
Salin URL worker tersebut ke file `.env` di root project atau di **Vercel Environment Variables**:
```env
VITE_CF_API_URL=https://etos-announcement-api.username-anda.workers.dev
```

Selesai! Sekarang halaman admin `/admin` dan portal publik `beasiswa.etos-id.net` akan langsung membaca dan menulis data pengumuman ke Cloudflare D1.

*(Catatan: Jika Anda belum sempat deploy Worker ini sekarang, frontend tetap berjalan normal dan aman menggunakan sistem local-storage fallback).*
