-- 1. Pastikan SEMUA Kolom Utama yang dibutuhkan Aplikasi ada di tabel applicants
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50);
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS is_submitted BOOLEAN DEFAULT FALSE;

-- 2. Pastikan UNIQUE constraint untuk user_id (agar UPSERT frontend jalan)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='applicants_user_id_key') THEN
        ALTER TABLE public.applicants ADD CONSTRAINT applicants_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 3. Update Fungsi Trigger (Pastikan Logic Berjalan)
CREATE OR REPLACE FUNCTION public.handle_submission()
RETURNS TRIGGER AS $$
DECLARE
    new_reg_number TEXT;
    seq_val INT;
BEGIN
    -- Jika is_submitted berubah jadi TRUE
    IF NEW.is_submitted = TRUE AND (OLD.is_submitted = FALSE OR OLD.is_submitted IS NULL) THEN
        NEW.submitted_at := NOW();
        
        IF NEW.registration_number IS NULL THEN
            SELECT count(*) + 1 INTO seq_val FROM public.applicants WHERE is_submitted = TRUE;
            new_reg_number := 'ETOS-2026-' || LPAD(seq_val::text, 5, '0');
            NEW.registration_number := new_reg_number;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_handle_submission ON public.applicants;
CREATE TRIGGER tr_handle_submission
    BEFORE UPDATE ON public.applicants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_submission();

-- 4. PAKSA RELOAD SCHEMA CACHE (PENTING!)
-- Ini memberitahu Supabase API bahwa ada perubahan kolom
NOTIFY pgrst, 'reload schema';
