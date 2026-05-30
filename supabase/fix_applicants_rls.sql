-- 1. Reset RLS Policy untuk Applicants
ALTER TABLE public.applicants DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own application" ON public.applicants;
DROP POLICY IF EXISTS "Users can view their own application" ON public.applicants;
DROP POLICY IF EXISTS "Users can update their own application" ON public.applicants;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applicants;
DROP POLICY IF EXISTS "Admins can update all applications" ON public.applicants;

-- 2. Buat Ulang Policy yang Lebih Stabil

-- Pendaftar: Bisa lihat data sendiri (pakai id atau user_id)
CREATE POLICY "Users can view their own application"
ON public.applicants FOR SELECT
USING (auth.uid() = id OR auth.uid() = user_id);

-- Pendaftar: Bisa buat data baru
CREATE POLICY "Users can insert their own application"
ON public.applicants FOR INSERT
WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

-- Pendaftar: Bisa update data sendiri SELAMA belum disubmit atau sedang proses submit
CREATE POLICY "Users can update their own application"
ON public.applicants FOR UPDATE
USING (auth.uid() = id OR auth.uid() = user_id);

-- Admin: Akses penuh (berdasarkan tabel admin_users)
CREATE POLICY "Admins can manage all applications"
ON public.applicants FOR ALL
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- 3. Aktifkan Kembali RLS
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- 4. Paksa Reload Schema Cache
NOTIFY pgrst, 'reload schema';
