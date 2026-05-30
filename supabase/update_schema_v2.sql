-- 1. Bersihkan tabel lama jika ada (untuk menghindari konflik kolom)
DROP TABLE IF EXISTS public.verification_results CASCADE;
DROP TABLE IF EXISTS public.verification_items CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Tabel Profil & Role
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Fungsi & Trigger untuk Otomatis buat Profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Tabel Verifikasi Admin
CREATE TABLE public.verification_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE public.verification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES public.applicants(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.verification_items(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('valid', 'invalid')),
  notes TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (applicant_id, item_id)
);

-- 5. Isi Data Checklist Awal
INSERT INTO public.verification_items (step, label, sort_order) VALUES
('dokumen', 'Bukti Ijazah SMA/MA valid', 1),
('dokumen', 'Bukti SNBP/SNBT valid', 2),
('data_pribadi', 'Foto Profil sopan & jelas', 1),
('data_pribadi', 'Username Instagram valid', 2),
('data_keluarga', 'Scan Kartu Keluarga jelas', 1),
('kondisi_ekonomi', 'Foto Rumah tampak depan valid', 1),
('kondisi_ekonomi', 'Foto Dapur valid', 2),
('esai', 'Esai terlihat orisinil', 1),
('esai', 'Konten esai relevan dengan visi Etos', 2);
