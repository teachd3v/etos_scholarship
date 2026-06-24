-- Migration: Fix applicants status check constraint to support waiting list status
-- Date: 2026-06-24

-- Drop the old constraint that rejects 'waiting' status
ALTER TABLE public.applicants DROP CONSTRAINT IF EXISTS applicants_status_check;

-- Recreate the check constraint to allow 'waiting', 'pending', and other standard states
ALTER TABLE public.applicants ADD CONSTRAINT applicants_status_check CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'waiting', 'pending'));

-- Reload PostgREST schema cache to apply changes immediately
NOTIFY pgrst, 'reload schema';
