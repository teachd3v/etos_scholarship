-- Add verification_start to the timeline config
UPDATE public.form_config
SET value = jsonb_set(
  COALESCE(value, '{}'::jsonb),
  '{verification_start}',
  '"2026-05-24T00:00:00"'::jsonb
)
WHERE key = 'timeline';
