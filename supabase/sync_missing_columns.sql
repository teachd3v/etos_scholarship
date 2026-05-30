-- Sinkronisasi Kolom Frontend (React) ke Database (Supabase)
-- Menambahkan semua kolom yang ada di FIELD_MAP tapi belum ada di tabel applicants

ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS graduation_year INT;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS instagram VARCHAR(150);
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS domisili_provinsi VARCHAR(100);
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS domisili_kota VARCHAR(100);
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS domisili_kecamatan VARCHAR(100);
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS father_condition VARCHAR(100);
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS mother_condition VARCHAR(100);
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(150);
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS guardian_job VARCHAR(100);
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS guardian_job_other VARCHAR(200);
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS main_provider VARCHAR(100);
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS father_income_amount BIGINT;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS mother_income_amount BIGINT;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS guardian_income_amount BIGINT;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS adult_siblings_working INT;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS adult_siblings_not_working INT;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS siblings_high_school INT;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS siblings_elementary INT;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS grandparents_count INT;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS electric_power VARCHAR(100);
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS vehicle_bike INT;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS vehicle_car INT;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS vehicle_other INT;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS bpjs_active_count INT;
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS bpjs_inactive_count INT;

-- Memberitahu Supabase API bahwa ada perubahan skema (penting agar PostgREST membaca kolom baru)
NOTIFY pgrst, 'reload schema';