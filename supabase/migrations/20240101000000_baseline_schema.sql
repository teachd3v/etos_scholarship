-- Schema untuk Seleksi Etos ID 2026

-- Tabel referensi Had Kifayah per kampus mitra
-- Sumber: BAZNAS 2024. hk_per_keluarga & hk_per_kapita dalam Rupiah/bulan.
CREATE TABLE IF NOT EXISTS master_had_kifayah (
    id_kampus       SERIAL PRIMARY KEY,
    universitas     VARCHAR(200) NOT NULL,
    provinsi        VARCHAR(100) NOT NULL,
    hk_per_keluarga BIGINT NOT NULL,
    hk_per_kapita   BIGINT NOT NULL
);

INSERT INTO master_had_kifayah (id_kampus, universitas, provinsi, hk_per_keluarga, hk_per_kapita) VALUES
    (1, 'Universitas Jambi',     'Jambi',            4433993, 899390),
    (2, 'Universitas Tadulako',  'Sulawesi Tengah',  4515970, 815157),
    (3, 'Universitas Andalas',   'Sumatera Barat',   4651274, 848773),
    (4, 'Universitas Pattimura', 'Maluku',           4695675, 762285),
    (5, 'Universitas Gadjah Mada', 'DI Yogyakarta',  4351646, 1007325)
ON CONFLICT (id_kampus) DO NOTHING;

CREATE TABLE IF NOT EXISTS applicants (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Data Sistem
    status_email_notif VARCHAR(50) DEFAULT 'Pending',
    registration_number VARCHAR(50) UNIQUE,

    -- Data Pribadi
    province VARCHAR(100),
    full_name VARCHAR(150),
    nik VARCHAR(16),
    no_kk VARCHAR(16),
    birth_place VARCHAR(100),
    birth_date DATE,
    gender VARCHAR(20),
    religion VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(150),
    address TEXT,
    city VARCHAR(100),
    foto_profil TEXT,

    -- Data Keluarga
    father_name VARCHAR(150),
    father_job VARCHAR(100),
    father_income VARCHAR(100),
    mother_name VARCHAR(150),
    mother_job VARCHAR(100),
    mother_income VARCHAR(100),
    siblings INT,
    family_status VARCHAR(100),

    -- Data Ekonomi dan Tempat Tinggal
    house_status VARCHAR(100),
    house_area INT,
    monthly_expense VARCHAR(100),
    electricity_bill VARCHAR(100),
    water_source VARCHAR(100),
    vehicle VARCHAR(50),
    dtks_status VARCHAR(50),
    kip_status VARCHAR(50),

    -- Data Essay
    motivation TEXT,
    future_plan TEXT,
    contribution TEXT,
    consent BOOLEAN,

    -- Scoring Columns (Hidden from user input)
    skor_ekonomi INT DEFAULT 0,
    skor_prestasi INT DEFAULT 0,
    skor_organisasi INT DEFAULT 0,
    grand_score INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    is_submitted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS achievements (
    id_prestasi UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_applicant UUID REFERENCES applicants(id) ON DELETE CASCADE,
    title VARCHAR(200),
    level VARCHAR(100),
    rank VARCHAR(100),
    year VARCHAR(10),
    issuer VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS organizations (
    id_organisasi UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_applicant UUID REFERENCES applicants(id) ON DELETE CASCADE,
    name VARCHAR(200),
    role VARCHAR(100),
    period VARCHAR(100),
    description TEXT
);

-- Row Level Security (RLS)
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Ensure new columns exist on older tables
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS no_kk VARCHAR(16);
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS kk_file TEXT;
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS rank VARCHAR(100);

-- Kolom baru: onboarding kampus
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS study_program VARCHAR(200);
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS admission_proof_file TEXT;

-- Kolom baru: pekerjaan lainnya orang tua
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS father_job_other VARCHAR(200);
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS mother_job_other VARCHAR(200);

-- Kolom baru: dimensi kesehatan had kifayah
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS bpjs_status VARCHAR(50);

-- Drop old policies to prevent collision
DROP POLICY IF EXISTS "Users can insert their own application" ON applicants;
DROP POLICY IF EXISTS "Users can view their own application" ON applicants;
DROP POLICY IF EXISTS "Users can update their own application" ON applicants;
DROP POLICY IF EXISTS "Users can manage their own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can manage their own organizations" ON organizations;

CREATE POLICY "Users can insert their own application" 
ON applicants FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own application" 
ON applicants FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own application" 
ON applicants FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can manage their own achievements" 
ON achievements FOR ALL 
USING (auth.uid() = id_applicant);

CREATE POLICY "Users can manage their own organizations" 
ON organizations FOR ALL 
USING (auth.uid() = id_applicant);

-- RLS untuk public signup/login (auth schema implicitly handled by Supabase)

-- Scoring ditangani sepenuhnya oleh client (FormState.jsx calculateScores()).
-- Skor ditulis ke kolom skor_ekonomi / skor_prestasi / skor_organisasi / grand_score
-- saat pendaftar menekan Submit di halaman Review (App.jsx handleSubmit).
-- Trigger DB sebelumnya dihapus karena menggunakan formula yang berbeda dari JS
-- sehingga nilai yang tersimpan di DB tidak konsisten dengan yang ditampilkan admin.
DROP TRIGGER IF EXISTS trigger_skoring_pendaftar ON applicants;
DROP FUNCTION IF EXISTS hitung_skor_siluman();

-- ==========================================
-- FORM CONFIG — runtime form configuration
-- ==========================================

CREATE TABLE IF NOT EXISTS form_config (
    key        TEXT PRIMARY KEY,
    label      TEXT,
    grp        TEXT,
    value      JSONB NOT NULL,
    is_active  BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE form_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read form config" ON form_config;
DROP POLICY IF EXISTS "Admins can manage form config" ON form_config;

CREATE POLICY "Public can read form config"
ON form_config FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage form config"
ON form_config FOR ALL
USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Seed default config (idempotent)
INSERT INTO form_config (key, label, grp, value) VALUES

('timeline', 'Timeline Pendaftaran', 'system', '{
  "registration_start": "2026-05-01T00:00:00",
  "registration_end":   "2026-05-23T00:00:00",
  "verification_end":   "2026-05-30T00:00:00",
  "announcement_date":  "2026-06-05T00:00:00"
}'::jsonb),

('target_universities', 'Universitas Target', 'system',
  '["Universitas Jambi","Universitas Tadulako","Universitas Andalas","Universitas Pattimura","Universitas Gadjah Mada"]'::jsonb),

('scoring_weights', 'Bobot Scoring Global', 'scoring',
  '{"eco":0.70,"ach":0.15,"org":0.15}'::jsonb),

('had_kifayah_dimensions', 'Dimensi Had Kifayah', 'scoring', '[
  {"id":"makanan",       "label":"Makanan",       "weight":0.30},
  {"id":"pakaian",       "label":"Pakaian",        "weight":0.10},
  {"id":"tempatTinggal", "label":"Tempat Tinggal", "weight":0.20},
  {"id":"ibadah",        "label":"Ibadah",         "weight":0.05},
  {"id":"pendidikan",    "label":"Pendidikan",     "weight":0.15},
  {"id":"kesehatan",     "label":"Kesehatan",      "weight":0.10},
  {"id":"transportasi",  "label":"Transportasi",   "weight":0.10}
]'::jsonb),

('income_options', 'Opsi Penghasilan Orang Tua', 'step2', '[
  {"label":"Tidak berpenghasilan",         "score":90},
  {"label":"< Rp 1.500.000",               "score":75},
  {"label":"Rp 1.500.000 – Rp 3.000.000","score":55},
  {"label":"Rp 3.000.000 – Rp 5.000.000","score":35},
  {"label":"> Rp 5.000.000",              "score":15}
]'::jsonb),

('job_options', 'Opsi Pekerjaan Orang Tua', 'step2',
  '["Tidak Bekerja","Ojek Online","Kurir Barang","Sopir Angkot","Kernet","Cleaning Service","ART & Pengasuh","Petugas Sampah","Pedagang Kaki Lima","Juru Parkir","Buruh Harian Lepas","Porter","Buruh Tani","Nelayan","Lainnya"]'::jsonb),

('family_status_options', 'Opsi Status Keluarga', 'step2', '[
  {"label":"Kedua orang tua masih hidup","score":75},
  {"label":"Yatim (ayah meninggal)",     "score":100},
  {"label":"Piatu (ibu meninggal)",      "score":100},
  {"label":"Yatim piatu",               "score":100},
  {"label":"Orang tua bercerai",        "score":100}
]'::jsonb),

('expense_options', 'Opsi Pengeluaran Bulanan', 'step3', '[
  {"label":"< Rp 1.000.000",               "score":100},
  {"label":"Rp 1.000.000 – Rp 2.500.000","score":75},
  {"label":"Rp 2.500.000 – Rp 4.000.000","score":50},
  {"label":"Rp 4.000.000 – Rp 5.000.000","score":35},
  {"label":"> Rp 5.000.000",              "score":25}
]'::jsonb),

('house_options', 'Opsi Status Rumah', 'step3', '[
  {"label":"Milik sendiri",      "score":70},
  {"label":"Sewa/kontrak",       "score":95},
  {"label":"Menumpang keluarga", "score":95}
]'::jsonb),

('vehicle_options', 'Opsi Kendaraan', 'step3', '[
  {"label":"Tidak ada","score":100},
  {"label":"Sepeda",   "score":85},
  {"label":"Motor",    "score":70},
  {"label":"Mobil",    "score":40}
]'::jsonb),

('kip_options', 'Opsi Status KIP', 'step3', '[
  {"label":"Ya, penerima PIP",     "score":100},
  {"label":"Terdaftar KIP-Kuliah", "score":100},
  {"label":"Bukan penerima",       "score":60}
]'::jsonb),

('bpjs_options', 'Opsi Status BPJS', 'step3', '[
  {"label":"PBI (Gratis dari Pemerintah)","score":100},
  {"label":"Ya, terdaftar dan aktif",     "score":80},
  {"label":"Ya, terdaftar tapi nonaktif", "score":60},
  {"label":"Tidak terdaftar",             "score":40}
]'::jsonb),

('achievement_config', 'Konfigurasi Scoring Prestasi', 'step4', '{
  "level_weight":    0.6,
  "rank_weight":     0.4,
  "bonus_per_extra": 5,
  "max_items":       10,
  "levels": [
    {"label":"Internasional",  "score":90},
    {"label":"Nasional",       "score":78},
    {"label":"Provinsi",       "score":63},
    {"label":"Kabupaten/Kota", "score":48},
    {"label":"Kecamatan",      "score":33},
    {"label":"Sekolah",        "score":18}
  ],
  "ranks": [
    {"label":"Juara 1 / Medali Emas",   "score":90},
    {"label":"Juara 2 / Perak",         "score":80},
    {"label":"Juara 3 / Perunggu",      "score":70},
    {"label":"Finalis / Juara Favorit", "score":60}
  ]
}'::jsonb),

('organization_config', 'Konfigurasi Scoring Organisasi', 'step5', '{
  "bonus_per_extra":       5,
  "description_bonus":     8,
  "description_min_chars": 100,
  "max_items":             10,
  "roles": [
    {"label":"Ketua / Wakil Ketua","score":90},
    {"label":"Pengurus Inti",      "score":80},
    {"label":"Anggota / Staff",    "score":70}
  ]
}'::jsonb),

('essay_config', 'Konfigurasi Esai', 'step6', '[
  {
    "id":          "motivation",
    "title":       "Motivasi",
    "label":       "Apa motivasi Anda mendaftar Beasiswa Etos ID?",
    "placeholder": "Ceritakan latar belakang dan alasan Anda…",
    "min":         50,
    "max":         400
  },
  {
    "id":          "futurePlan",
    "title":       "Rencana Studi & Karir",
    "label":       "Rencana studi & karir 5 tahun ke depan",
    "placeholder": "Program studi yang dituju, kampus tujuan, serta rencana setelah lulus…",
    "min":         50,
    "max":         400
  },
  {
    "id":          "contribution",
    "title":       "Kontribusi Daerah",
    "label":       "Kontribusi apa yang akan Anda berikan untuk daerah asal?",
    "placeholder": "Fokus pada masalah konkret di daerah Anda dan peran yang bisa Anda ambil…",
    "min":         50,
    "max":         400
  }
]'::jsonb)

ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- VERIFICATION — ceklis verifikasi dokumen
-- ==========================================

CREATE TABLE IF NOT EXISTS verification_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step        TEXT NOT NULL,
    label       TEXT NOT NULL,
    description TEXT,
    is_active   BOOLEAN DEFAULT true,
    sort_order  INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS verification_results (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    item_id      UUID NOT NULL REFERENCES verification_items(id) ON DELETE CASCADE,
    status       TEXT CHECK (status IN ('valid','invalid','needs_clarification')),
    notes        TEXT,
    verified_by  UUID REFERENCES auth.users(id),
    verified_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (applicant_id, item_id)
);

ALTER TABLE verification_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read verification items" ON verification_items;
DROP POLICY IF EXISTS "Admins can manage verification items" ON verification_items;
DROP POLICY IF EXISTS "Admins can manage verification results" ON verification_results;
DROP POLICY IF EXISTS "Applicants can read own verification results" ON verification_results;

CREATE POLICY "Public can read verification items"
ON verification_items FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage verification items"
ON verification_items FOR ALL
USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage verification results"
ON verification_results FOR ALL
USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Applicants can read own verification results"
ON verification_results FOR SELECT
USING (applicant_id = auth.uid());

-- Seed default verification checklist items
INSERT INTO verification_items (step, label, description, sort_order)
SELECT step, label, description, sort_order FROM (VALUES
  ('dokumen',       'Foto profil jelas dan menampilkan wajah langsung',             'Foto tidak blur, wajah terlihat penuh, rasio 3:4 atau 4:6', 1),
  ('dokumen',       'Kartu Keluarga asli, jelas, dan tidak terpotong',               'Semua nama anggota keluarga dan nomor KK terlihat jelas',    2),
  ('dokumen',       'Bukti SNBP/SNBT sesuai nama dan universitas pendaftar',         'Nama di dokumen harus identik dengan yang didaftarkan',      3),
  ('data_pribadi',  'NIK 16 digit valid dan sesuai dengan yang tertera di KK',      NULL, 4),
  ('data_pribadi',  'Nama lengkap sesuai dokumen kependudukan (KTP/KK)',             NULL, 5),
  ('data_pribadi',  'Nomor HP dapat dihubungi (WhatsApp aktif)',                    NULL, 6),
  ('data_keluarga', 'Data pekerjaan orang tua konsisten dengan penghasilan',        'Verifikasi kesesuaian antara jenis pekerjaan dan rentang penghasilan yang dipilih', 7),
  ('data_keluarga', 'Jumlah saudara kandung sesuai yang tertera di KK',             NULL, 8),
  ('kondisi_ekonomi','Status kepemilikan rumah dapat diverifikasi',                 NULL, 9),
  ('kondisi_ekonomi','Status KIP/PIP/KIP-Kuliah dapat dibuktikan dengan dokumen',   'Minta unggah surat keterangan KIP jika diperlukan', 10),
  ('kondisi_ekonomi','Status BPJS sesuai dengan kondisi ekonomi yang dilaporkan',   NULL, 11),
  ('prestasi',      'Prestasi yang dicantumkan dapat diverifikasi penyelenggaranya', NULL, 12),
  ('prestasi',      'Tingkat dan peringkat prestasi konsisten dan masuk akal',       NULL, 13),
  ('esai',          'Esai motivasi ditulis secara personal dan tidak mengandung plagiarisme', NULL, 14),
  ('esai',          'Rencana studi realistis, terperinci, dan sesuai jurusan tujuan',         NULL, 15),
  ('esai',          'Kontribusi daerah spesifik, konkret, dan dapat dilaksanakan',            NULL, 16)
) AS v(step, label, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM verification_items LIMIT 1);

-- ==========================================
-- STORAGE BUCKETS & POLICIES
-- ==========================================

-- Create the public bucket for applicant uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Drop old policies to prevent collision
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their files" ON storage.objects;

-- Allow public read access to uploaded files (so Admin can see them)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'uploads' );

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'uploads' AND auth.uid() = owner );

-- Allow authenticated users to update/delete their own files
CREATE POLICY "Users can manage their files"
ON storage.objects FOR ALL
USING ( bucket_id = 'uploads' AND auth.uid() = owner );

-- ==========================================
-- ADMIN ACCESS
-- ==========================================

-- Table to register admin users by their Supabase Auth UUID
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admins can read & update all applicant records
DROP POLICY IF EXISTS "Admins can view all applications" ON applicants;
DROP POLICY IF EXISTS "Admins can update all applications" ON applicants;

CREATE POLICY "Admins can view all applications"
ON applicants FOR SELECT
USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);

CREATE POLICY "Admins can update all applications"
ON applicants FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);

-- Admins can read achievements and organizations of all applicants
DROP POLICY IF EXISTS "Admins can view all achievements" ON achievements;
DROP POLICY IF EXISTS "Admins can view all organizations" ON organizations;

CREATE POLICY "Admins can view all achievements"
ON achievements FOR SELECT
USING (
    auth.uid() = id_applicant
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);

CREATE POLICY "Admins can view all organizations"
ON organizations FOR SELECT
USING (
    auth.uid() = id_applicant
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);
