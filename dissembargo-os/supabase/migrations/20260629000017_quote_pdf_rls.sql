-- RLS for quote PDF versions

ALTER TABLE public.quote_pdf_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quote_pdf_versions_all_authenticated"
  ON public.quote_pdf_versions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
