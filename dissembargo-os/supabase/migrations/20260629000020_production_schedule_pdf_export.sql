-- Production schedule PDF export: versioned PDF storage

ALTER TABLE public.production_schedules
  ADD COLUMN current_pdf_version_id UUID;

CREATE TABLE public.production_schedule_pdf_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.production_schedules (id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT production_schedule_pdf_versions_schedule_version_unique
    UNIQUE (schedule_id, version)
);

ALTER TABLE public.production_schedules
  ADD CONSTRAINT production_schedules_current_pdf_version_id_fkey
  FOREIGN KEY (current_pdf_version_id)
  REFERENCES public.production_schedule_pdf_versions (id)
  ON DELETE SET NULL;

COMMENT ON TABLE public.production_schedule_pdf_versions IS
  'Versioned production schedule PDF exports stored in Supabase Storage';

CREATE INDEX production_schedule_pdf_versions_schedule_id_idx
  ON public.production_schedule_pdf_versions (schedule_id);

CREATE INDEX production_schedules_current_pdf_version_id_idx
  ON public.production_schedules (current_pdf_version_id);

ALTER TABLE public.production_schedule_pdf_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "production_schedule_pdf_versions_all_authenticated"
  ON public.production_schedule_pdf_versions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
