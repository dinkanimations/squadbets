-- User-editable quote version label (e.g. V1, Draft, Final)

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS version TEXT;

COMMENT ON COLUMN public.quotes.version IS
  'User-facing quote version label e.g. V1, Draft, Final, Rev A';

UPDATE public.app_settings
SET default_budget_sections =
  '["Creative Direction","Design","Modelling","Animation","Lighting","Rendering","Editing","Music","Miscellaneous"]'::jsonb
WHERE id = 'default'
  AND default_budget_sections::text LIKE '%Studio Leads%';
