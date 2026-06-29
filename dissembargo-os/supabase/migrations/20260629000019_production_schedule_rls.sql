-- RLS for production schedule versions

ALTER TABLE public.production_schedule_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "production_schedule_versions_all_authenticated"
  ON public.production_schedule_versions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
