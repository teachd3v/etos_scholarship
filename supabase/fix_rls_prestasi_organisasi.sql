-- Fix RLS untuk tabel achievements dan organizations
-- Masalah: Kolom applicant_id di tabel ini mereferensikan applicants(id), 
-- yang mungkin berupa UUID acak (bukan auth.uid()). 
-- Jadi kita harus mengecek apakah applicant_id tersebut milik user yang sedang login.

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 1. Hapus policy lama agar tidak bentrok
DROP POLICY IF EXISTS "Users can manage their own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Admins can view all achievements" ON public.achievements;

DROP POLICY IF EXISTS "Users can manage their own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can view all organizations" ON public.organizations;

-- 2. Buat policy baru untuk Pendaftar (Bisa INSERT, SELECT, UPDATE, DELETE milik sendiri)
CREATE POLICY "Users can manage their own achievements"
ON public.achievements FOR ALL
USING (
  applicant_id IN (SELECT id FROM public.applicants WHERE user_id = auth.uid() OR id = auth.uid())
)
WITH CHECK (
  applicant_id IN (SELECT id FROM public.applicants WHERE user_id = auth.uid() OR id = auth.uid())
);

CREATE POLICY "Users can manage their own organizations"
ON public.organizations FOR ALL
USING (
  applicant_id IN (SELECT id FROM public.applicants WHERE user_id = auth.uid() OR id = auth.uid())
)
WITH CHECK (
  applicant_id IN (SELECT id FROM public.applicants WHERE user_id = auth.uid() OR id = auth.uid())
);

-- 3. Buat policy untuk Admin (Hanya bisa SELECT semua data)
CREATE POLICY "Admins can view all achievements"
ON public.achievements FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can view all organizations"
ON public.organizations FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND role = 'admin')
);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';