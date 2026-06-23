-- Migration: Enable Row-Level Security on campus_admins_config table
-- Date: 2026-06-24

-- Enable RLS to remove the orange UNRESTRICTED badge and secure the table from public access
ALTER TABLE public.campus_admins_config ENABLE ROW LEVEL SECURITY;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
