-- Security Fix: Row-Level Security (RLS) Consolidation
-- Perbaikan untuk mengatasi peringatan keamanan Supabase per 31 Mei 2026
-- Fokus: Mengaktifkan RLS pada semua tabel publik dan membatasi akses sesuai role.

-- 1. Tabel master_had_kifayah (Data Referensi Ekonomi)
ALTER TABLE public.master_had_kifayah ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read master_had_kifayah" ON public.master_had_kifayah;
CREATE POLICY "Authenticated users can read master_had_kifayah" 
ON public.master_had_kifayah FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Admins can manage master_had_kifayah" ON public.master_had_kifayah;
CREATE POLICY "Admins can manage master_had_kifayah" 
ON public.master_had_kifayah FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));


-- 2. Tabel admin_users (Daftar Akun Administrator)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users" 
ON public.admin_users FOR SELECT 
TO authenticated 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));


-- 3. Tabel profiles (User Profiles & Roles)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- 4. Tabel verification_items (Checklist Verifikasi)
ALTER TABLE public.verification_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view verification_items" ON public.verification_items;
CREATE POLICY "Authenticated users can view verification_items" 
ON public.verification_items FOR SELECT 
TO authenticated 
USING (is_active = true OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage verification_items" ON public.verification_items;
CREATE POLICY "Admins can manage verification_items" 
ON public.verification_items FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));


-- 5. Tabel verification_results (Hasil Verifikasi Dokumen)
ALTER TABLE public.verification_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own verification_results" ON public.verification_results;
CREATE POLICY "Users can view own verification_results" 
ON public.verification_results FOR SELECT 
TO authenticated 
USING (applicant_id = auth.uid() OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage verification_results" ON public.verification_results;
CREATE POLICY "Admins can manage verification_results" 
ON public.verification_results FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));


-- 6. Tabel applicants (Data Pendaftar Utama)
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own application" ON public.applicants;
CREATE POLICY "Users can view own application" 
ON public.applicants FOR SELECT 
TO authenticated 
USING (auth.uid() = id OR auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own application" ON public.applicants;
CREATE POLICY "Users can insert own application" 
ON public.applicants FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own application" ON public.applicants;
CREATE POLICY "Users can update own application" 
ON public.applicants FOR UPDATE 
TO authenticated 
USING (auth.uid() = id OR auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
WITH CHECK (auth.uid() = id OR auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));


-- 7. Tabel achievements (Data Prestasi)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own achievements" ON public.achievements;
CREATE POLICY "Users can manage own achievements" 
ON public.achievements FOR ALL 
TO authenticated 
USING (auth.uid() = id_applicant OR auth.uid() = applicant_id OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));


-- 8. Tabel organizations (Data Organisasi)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own organizations" ON public.organizations;
CREATE POLICY "Users can manage own organizations" 
ON public.organizations FOR ALL 
TO authenticated 
USING (auth.uid() = id_applicant OR auth.uid() = applicant_id OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));


-- 9. Tabel form_config (Konfigurasi Form & Timeline)
ALTER TABLE public.form_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read form_config" ON public.form_config;
CREATE POLICY "Public can read form_config" 
ON public.form_config FOR SELECT 
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage form_config" ON public.form_config;
CREATE POLICY "Admins can manage form_config" 
ON public.form_config FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));


-- Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';
