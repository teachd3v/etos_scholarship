-- 1. Tambahkan Kolom submitted_at yang Hilang
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- 2. Fungsi untuk Generate Nomor Registrasi Otomatis
CREATE OR REPLACE FUNCTION public.handle_submission()
RETURNS TRIGGER AS $$
DECLARE
    new_reg_number TEXT;
    seq_val INT;
BEGIN
    -- Hanya jalankan jika is_submitted berubah dari FALSE ke TRUE
    IF NEW.is_submitted = TRUE AND (OLD.is_submitted = FALSE OR OLD.is_submitted IS NULL) THEN
        -- Set waktu submit
        NEW.submitted_at := NOW();
        
        -- Generate nomor registrasi jika belum ada (ETOS-2026-XXXXX)
        IF NEW.registration_number IS NULL THEN
            -- Ambil angka urut sederhana berdasarkan jumlah pendaftar yang sudah submit
            SELECT count(*) + 1 INTO seq_val FROM public.applicants WHERE is_submitted = TRUE;
            new_reg_number := 'ETOS-2026-' || LPAD(seq_val::text, 5, '0');
            NEW.registration_number := new_reg_number;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Pasang Trigger ke Tabel Applicants
DROP TRIGGER IF EXISTS tr_handle_submission ON public.applicants;
CREATE TRIGGER tr_handle_submission
    BEFORE UPDATE ON public.applicants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_submission();
