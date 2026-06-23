-- Migration: Remove old/redundant verification checklist item
-- Date: 2026-06-24

-- Delete the redundant verification checklist item "Konsistensi Daya Listrik & Status Rumah"
-- Also check using ILIKE to capture variations in capitalization or spacing
DELETE FROM public.verification_items 
WHERE label = 'Konsistensi Daya Listrik & Status Rumah'
   OR label ILIKE '%Konsistensi Daya Listrik%';

-- Reload PostgREST schema cache to apply changes immediately
NOTIFY pgrst, 'reload schema';
