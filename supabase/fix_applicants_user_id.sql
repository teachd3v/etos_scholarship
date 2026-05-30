-- 1. Perbaiki Tabel Profiles (Tambahkan kolom yang mungkin hilang)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- 2. Perbaiki Tabel Applicants (MASALAH UTAMA: Kolom user_id)
-- Aplikasi mencoba melakukan UPSERT dengan on_conflict=user_id
-- Tapi di schema.sql, kolom primernya bernama 'id'.
DO $$ 
BEGIN
  -- Tambahkan kolom user_id jika belum ada
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applicants' AND column_name='user_id') THEN
    ALTER TABLE public.applicants ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    -- Isi user_id dengan nilai id yang sudah ada (untuk data lama)
    UPDATE public.applicants SET user_id = id WHERE user_id IS NULL;
  END IF;

  -- Buat UNIQUE constraint pada user_id agar ON CONFLICT bekerja
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='applicants_user_id_key') THEN
    ALTER TABLE public.applicants ADD CONSTRAINT applicants_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 3. Fungsi Trigger Sinkronisasi User (Perbaikan handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert ke Profiles
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, email_verified)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    'user',
    COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    email_verified = EXCLUDED.email_verified;

  -- Insert/Sync ke Applicants (Opsional, tapi bagus untuk konsistensi)
  -- Ini mencegah error 'applicants_user_id_key' jika app mencoba insert manual
  INSERT INTO public.applicants (id, user_id, email, full_name)
  VALUES (NEW.id, NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
