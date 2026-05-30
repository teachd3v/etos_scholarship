-- Menambahkan kolom komposisi keluarga dasar ke tabel applicants
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS family_count_self INT DEFAULT 1;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS family_count_father INT DEFAULT 0;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS family_count_mother INT DEFAULT 0;

-- Memberitahu Supabase API bahwa ada perubahan skema
NOTIFY pgrst, 'reload schema';