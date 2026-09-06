-- Schema D1 untuk Konfigurasi Pengumuman Kelulusan Etos ID
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  announcement_date TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  message TEXT,
  sk_document_url TEXT,
  sk_document_title TEXT,
  is_published INTEGER DEFAULT 0,
  updated_at TEXT
);

-- Seed konfigurasi awal
INSERT OR IGNORE INTO announcements (
  id,
  announcement_date,
  title,
  subtitle,
  message,
  sk_document_url,
  sk_document_title,
  is_published,
  updated_at
) VALUES (
  'main',
  '2026-09-15T10:00:00+07:00',
  'Pengumuman Kelulusan Seleksi Beasiswa Etos ID 2026',
  'Proses Penetapan Akhir Surat Keputusan (SK) Penerima Beasiswa Sedang Berlangsung',
  'Terima kasih atas partisipasi dan perjuangan seluruh calon peserta seleksi Beasiswa Etos ID 2026. Saat ini Tim Seleksi Pusat sedang merampungkan dan mengesahkan dokumen Surat Keputusan (SK) resmi penerima beasiswa.',
  'https://drive.google.com',
  'SK_Kelulusan_Penerima_Beasiswa_Etos_ID_2026.pdf',
  0,
  datetime('now')
);
