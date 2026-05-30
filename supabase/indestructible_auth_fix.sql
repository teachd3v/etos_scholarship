-- 1. Bersihkan Data Yatim (Orphaned Data)
-- Jika user dihapus dari Auth tapi data di public masih ada, ini bisa bikin PK conflict.
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.applicants WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. Pastikan Kolom user_id di Applicants Benar
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applicants' AND column_name='user_id') THEN
    ALTER TABLE public.applicants ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- Pastikan ada UNIQUE constraint agar ON CONFLICT(user_id) jalan
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='applicants_user_id_key') THEN
    ALTER TABLE public.applicants ADD CONSTRAINT applicants_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 3. Trigger "Indestructible" (Anti-Gagal)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Block 1: Sync ke Profiles
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    -- Jika gagal, abaikan saja biar login tetap bisa lanjut
    RAISE WARNING 'Gagal sync profile untuk user %: %', NEW.id, SQLERRM;
  END;

  -- Block 2: Sync ke Applicants
  BEGIN
    INSERT INTO public.applicants (id, user_id, email, full_name)
    VALUES (
      NEW.id,
      NEW.id,
      NEW.email,
      NULL
    )
    ON CONFLICT (user_id) DO NOTHING;  EXCEPTION WHEN OTHERS THEN
    -- Jika gagal (misal karena constraint window pendaftaran), abaikan. 
    -- Login tetap harus berhasil.
    RAISE WARNING 'Gagal sync applicant untuk user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
