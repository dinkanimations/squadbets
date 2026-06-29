-- Quote PDF export: expiry date and versioned PDF storage

ALTER TABLE public.quotes
  ADD COLUMN expiry_date DATE,
  ADD COLUMN current_pdf_version_id UUID;

CREATE TABLE public.quote_pdf_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes (id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT quote_pdf_versions_quote_version_unique UNIQUE (quote_id, version)
);

ALTER TABLE public.quotes
  ADD CONSTRAINT quotes_current_pdf_version_id_fkey
  FOREIGN KEY (current_pdf_version_id)
  REFERENCES public.quote_pdf_versions (id)
  ON DELETE SET NULL;

COMMENT ON TABLE public.quote_pdf_versions IS 'Versioned PDF exports stored in Supabase Storage';
COMMENT ON COLUMN public.quotes.expiry_date IS 'Quote validity expiry date shown on PDF';

CREATE INDEX quote_pdf_versions_quote_id_idx ON public.quote_pdf_versions (quote_id);
CREATE INDEX quotes_current_pdf_version_id_idx ON public.quotes (current_pdf_version_id);

-- Default expiry: 30 days from creation for existing quotes
UPDATE public.quotes
SET expiry_date = (created_at::DATE + INTERVAL '30 days')
WHERE expiry_date IS NULL;
