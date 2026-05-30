-- Menambahkan 7 Dimensi Had Kifayah ke tabel applicants
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS dim_ibadah BIGINT DEFAULT 0;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS dim_pangan BIGINT DEFAULT 0;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS dim_pakaian BIGINT DEFAULT 0;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS dim_tempat_tinggal BIGINT DEFAULT 0;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS dim_kesehatan BIGINT DEFAULT 0;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS dim_pendidikan BIGINT DEFAULT 0;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS dim_transportasi BIGINT DEFAULT 0;

-- Refresh Schema Cache
NOTIFY pgrst, 'reload schema';