-- Projects module: extended schema, deliverables, notes, files

CREATE TYPE public.project_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Migrate project_status to new workflow values
ALTER TABLE public.projects ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.projects ALTER COLUMN status TYPE TEXT USING status::TEXT;

UPDATE public.projects SET status = CASE status
  WHEN 'draft' THEN 'planning'
  WHEN 'active' THEN 'in_progress'
  WHEN 'on_hold' THEN 'waiting_for_client'
  WHEN 'in_review' THEN 'review'
  WHEN 'completed' THEN 'complete'
  WHEN 'cancelled' THEN 'archived'
  ELSE 'planning'
END;

DROP TYPE public.project_status;

CREATE TYPE public.project_status AS ENUM (
  'planning',
  'in_progress',
  'waiting_for_client',
  'rendering',
  'review',
  'complete',
  'archived'
);

ALTER TABLE public.projects
  ALTER COLUMN status TYPE public.project_status
  USING status::public.project_status;

ALTER TABLE public.projects
  ALTER COLUMN status SET DEFAULT 'planning';

-- Extend projects with workspace fields and direct links
ALTER TABLE public.projects
  ADD COLUMN company_id UUID REFERENCES public.companies (id) ON DELETE SET NULL,
  ADD COLUMN contact_id UUID REFERENCES public.contacts (id) ON DELETE SET NULL,
  ADD COLUMN opportunity_id UUID REFERENCES public.opportunities (id) ON DELETE SET NULL,
  ADD COLUMN quote_id UUID REFERENCES public.quotes (id) ON DELETE SET NULL,
  ADD COLUMN producer TEXT,
  ADD COLUMN team_members TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN priority public.project_priority NOT NULL DEFAULT 'medium',
  ADD COLUMN budget NUMERIC(12, 2),
  ADD COLUMN notes TEXT,
  ADD COLUMN progress INTEGER NOT NULL DEFAULT 0
    CHECK (progress >= 0 AND progress <= 100);

-- Backfill company_id from clients
UPDATE public.projects p
SET company_id = c.company_id
FROM public.clients c
WHERE p.client_id = c.id
  AND p.company_id IS NULL;

CREATE INDEX projects_company_id_idx ON public.projects (company_id);
CREATE INDEX projects_status_idx ON public.projects (status);
CREATE INDEX projects_delivery_date_idx ON public.projects (delivery_date)
  WHERE delivery_date IS NOT NULL;
CREATE INDEX projects_quote_id_idx ON public.projects (quote_id);

-- Project deliverables
CREATE TABLE public.project_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX project_deliverables_project_id_idx
  ON public.project_deliverables (project_id);

-- Project notes (internal, chronological)
CREATE TABLE public.project_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX project_notes_project_id_idx ON public.project_notes (project_id);

-- Project files (stored in project-assets bucket)
CREATE TABLE public.project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX project_files_project_id_idx ON public.project_files (project_id);

-- Updated-at triggers
CREATE TRIGGER project_deliverables_updated_at
  BEFORE UPDATE ON public.project_deliverables
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER project_notes_updated_at
  BEFORE UPDATE ON public.project_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.project_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_deliverables_all_authenticated"
  ON public.project_deliverables FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "project_notes_all_authenticated"
  ON public.project_notes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "project_files_all_authenticated"
  ON public.project_files FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.project_deliverables IS 'Trackable deliverables per project';
COMMENT ON TABLE public.project_notes IS 'Internal chronological notes per project';
COMMENT ON TABLE public.project_files IS 'Files uploaded to project-assets storage';
