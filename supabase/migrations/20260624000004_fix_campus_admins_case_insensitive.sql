-- Migration: Fix campus admins case insensitive lookup and update existing profiles
-- Date: 2026-06-24

-- 1. Update trigger function handle_new_user() to look up email case-insensitively
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role TEXT := 'user';
    v_campus VARCHAR(200) := NULL;
BEGIN
  -- Fetch campus if pre-authorized (case-insensitive)
  SELECT campus INTO v_campus FROM public.campus_admins_config WHERE LOWER(email) = LOWER(NEW.email);
  
  -- Check if they are a campus admin OR global admin (case-insensitive)
  IF v_campus IS NOT NULL OR LOWER(NEW.email) = 'teach.d3v@gmail.com' OR LOWER(NEW.email) = 'etospusat@gmail.com' THEN
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

-- 2. Update trigger function sync_admin_role() to look up email case-insensitively
CREATE OR REPLACE FUNCTION public.sync_admin_role()
RETURNS TRIGGER AS $$
DECLARE
    v_campus VARCHAR(200);
BEGIN
  IF NEW.role = 'admin' THEN
    -- Get campus mapping (case-insensitive)
    SELECT campus INTO v_campus FROM public.campus_admins_config WHERE LOWER(email) = LOWER(NEW.email);
    
    INSERT INTO public.admin_users (id, email, campus)
    VALUES (NEW.id, NEW.email, v_campus)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, campus = EXCLUDED.campus;
  ELSE
    DELETE FROM public.admin_users WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Force update existing profiles role and campus for these emails case-insensitively
UPDATE public.profiles
SET role = 'admin',
    campus = (SELECT campus FROM public.campus_admins_config WHERE LOWER(campus_admins_config.email) = LOWER(public.profiles.email))
WHERE LOWER(email) IN (SELECT LOWER(email) FROM public.campus_admins_config);

-- Force update for global admins case-insensitively
UPDATE public.profiles
SET role = 'admin',
    campus = NULL
WHERE LOWER(email) IN ('teach.d3v@gmail.com', 'etospusat@gmail.com');

-- 4. Sync admin_users table for all existing admins
INSERT INTO public.admin_users (id, email, campus)
SELECT id, email, campus FROM public.profiles WHERE role = 'admin'
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, campus = EXCLUDED.campus;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
