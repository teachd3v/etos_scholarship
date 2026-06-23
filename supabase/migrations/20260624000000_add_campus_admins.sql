-- Migration: Add Campus-Restricted Admins Configuration and Security Policies
-- Date: 2026-06-24

-- 1. Create campus admins mapping table
CREATE TABLE IF NOT EXISTS public.campus_admins_config (
    email VARCHAR(150) PRIMARY KEY,
    campus VARCHAR(200) NOT NULL
);

-- Seed campus admin accounts (Google Auth emails)
INSERT INTO public.campus_admins_config (email, campus) VALUES
    ('etosambon@gmail.com', 'Universitas Pattimura'),
    ('etosidjambi@gmail.com', 'Universitas Jambi'),
    ('adm.etospadang@gmail.com', 'Universitas Andalas'),
    ('etospalu@gmail.com', 'Universitas Tadulako'),
    ('etosidjogja@gmail.com', 'Universitas Gadjah Mada')
ON CONFLICT (email) DO UPDATE SET campus = EXCLUDED.campus;

-- 2. Add campus column to profiles and admin_users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS campus VARCHAR(200);
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS campus VARCHAR(200);

-- 3. Update trigger function handle_new_user()
-- Assigns role = 'admin' and sets the campus if email matches config or global admins list
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role TEXT := 'user';
    v_campus VARCHAR(200) := NULL;
BEGIN
  -- Fetch campus if pre-authorized
  SELECT campus INTO v_campus FROM public.campus_admins_config WHERE email = NEW.email;
  
  -- Check if they are a campus admin OR global admin
  IF v_campus IS NOT NULL OR NEW.email = 'teach.d3v@gmail.com' OR NEW.email = 'etospusat@gmail.com' THEN
    v_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, campus, email_verified)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    v_role,
    v_campus,
    COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    email_verified = EXCLUDED.email_verified,
    role = CASE WHEN EXCLUDED.role = 'admin' THEN 'admin' ELSE public.profiles.role END,
    campus = COALESCE(EXCLUDED.campus, public.profiles.campus);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update trigger function sync_admin_role()
-- Ensures admin_users table is updated with the restricted campus scope
CREATE OR REPLACE FUNCTION public.sync_admin_role()
RETURNS TRIGGER AS $$
DECLARE
    v_campus VARCHAR(200);
BEGIN
  IF NEW.role = 'admin' THEN
    -- Get campus mapping
    SELECT campus INTO v_campus FROM public.campus_admins_config WHERE email = NEW.email;
    
    INSERT INTO public.admin_users (id, email, campus)
    VALUES (NEW.id, NEW.email, v_campus)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, campus = EXCLUDED.campus;
  ELSE
    DELETE FROM public.admin_users WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Force update existing profiles role and campus for these emails (in case they signed up already)
UPDATE public.profiles
SET role = 'admin',
    campus = (SELECT campus FROM public.campus_admins_config WHERE campus_admins_config.email = public.profiles.email)
WHERE email IN (SELECT email FROM public.campus_admins_config);

-- Force update for global admins
UPDATE public.profiles
SET role = 'admin',
    campus = NULL
WHERE email IN ('teach.d3v@gmail.com', 'etospusat@gmail.com');

-- 6. Reinforce Row-Level Security (RLS) on applicants
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applicants;
CREATE POLICY "Admins can view all applications"
ON public.applicants FOR SELECT
TO authenticated
USING (
    auth.uid() = id 
    OR auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE id = auth.uid() 
          AND (campus IS NULL OR UPPER(campus) = UPPER(applicants.province))
    )
);

DROP POLICY IF EXISTS "Admins can update all applications" ON public.applicants;
CREATE POLICY "Admins can update all applications"
ON public.applicants FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE id = auth.uid() 
          AND (campus IS NULL OR UPPER(campus) = UPPER(applicants.province))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE id = auth.uid() 
          AND (campus IS NULL OR UPPER(campus) = UPPER(applicants.province))
    )
);

-- 7. Reinforce RLS on achievements & organizations
DROP POLICY IF EXISTS "Admins can view all achievements" ON public.achievements;
CREATE POLICY "Admins can view all achievements"
ON public.achievements FOR SELECT
TO authenticated
USING (
    auth.uid() = applicant_id
    OR EXISTS (
        SELECT 1 FROM public.admin_users au
        JOIN public.applicants a ON a.id = achievements.applicant_id
        WHERE au.id = auth.uid() 
          AND (au.campus IS NULL OR UPPER(au.campus) = UPPER(a.province))
    )
);

DROP POLICY IF EXISTS "Admins can view all organizations" ON public.organizations;
CREATE POLICY "Admins can view all organizations"
ON public.organizations FOR SELECT
TO authenticated
USING (
    auth.uid() = applicant_id
    OR EXISTS (
        SELECT 1 FROM public.admin_users au
        JOIN public.applicants a ON a.id = organizations.applicant_id
        WHERE au.id = auth.uid() 
          AND (au.campus IS NULL OR UPPER(au.campus) = UPPER(a.province))
    )
);

-- 8. Reinforce RLS on verification_results
DROP POLICY IF EXISTS "Admins can manage verification_results" ON public.verification_results;
CREATE POLICY "Admins can manage verification_results" 
ON public.verification_results FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.admin_users au
        JOIN public.applicants a ON a.id = verification_results.applicant_id
        WHERE au.id = auth.uid()
          AND (au.campus IS NULL OR UPPER(au.campus) = UPPER(a.province))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admin_users au
        JOIN public.applicants a ON a.id = verification_results.applicant_id
        WHERE au.id = auth.uid()
          AND (au.campus IS NULL OR UPPER(au.campus) = UPPER(a.province))
    )
);

DROP POLICY IF EXISTS "Users can view own verification_results" ON public.verification_results;
CREATE POLICY "Users can view own verification_results" 
ON public.verification_results FOR SELECT 
TO authenticated 
USING (
    applicant_id = auth.uid() 
    OR EXISTS (
        SELECT 1 FROM public.admin_users au
        JOIN public.applicants a ON a.id = verification_results.applicant_id
        WHERE au.id = auth.uid()
          AND (au.campus IS NULL OR UPPER(au.campus) = UPPER(a.province))
    )
);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
