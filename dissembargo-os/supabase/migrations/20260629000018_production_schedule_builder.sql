-- Production Schedule Builder: extended schedules with version history

ALTER TABLE public.production_schedules
  ALTER COLUMN project_id DROP NOT NULL,
  ADD COLUMN company_id UUID REFERENCES public.companies (id) ON DELETE SET NULL,
  ADD COLUMN opportunity_id UUID REFERENCES public.opportunities (id) ON DELETE SET NULL,
  ADD COLUMN quote_id UUID REFERENCES public.quotes (id) ON DELETE SET NULL,
  ADD COLUMN project_title TEXT NOT NULL DEFAULT 'Untitled Production Schedule',
  ADD COLUMN start_date DATE,
  ADD COLUMN delivery_date DATE,
  ADD COLUMN review_rounds INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN deliverables TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN notes TEXT,
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'archived')),
  ADD COLUMN current_version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.production_schedules
  DROP CONSTRAINT IF EXISTS production_schedules_project_version_unique;

-- Version history snapshots
CREATE TABLE public.production_schedule_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.production_schedules (id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  schedule_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  change_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT production_schedule_versions_schedule_version_unique
    UNIQUE (schedule_id, version)
);

COMMENT ON TABLE public.production_schedule_versions IS 'Version history snapshots for production schedules';
COMMENT ON COLUMN public.production_schedules.schedule_json IS 'Current schedule data: phases and milestones';

-- Migrate existing version numbers into current_version
UPDATE public.production_schedules
SET current_version = version
WHERE current_version = 1 AND version > 1;

-- Seed version history from existing rows
INSERT INTO public.production_schedule_versions (schedule_id, version, schedule_json)
SELECT id, COALESCE(version, 1), schedule_json
FROM public.production_schedules
ON CONFLICT (schedule_id, version) DO NOTHING;

ALTER TABLE public.production_schedules DROP COLUMN IF EXISTS version;

CREATE INDEX production_schedules_company_id_idx ON public.production_schedules (company_id);
CREATE INDEX production_schedules_quote_id_idx ON public.production_schedules (quote_id);
CREATE INDEX production_schedules_opportunity_id_idx ON public.production_schedules (opportunity_id);
CREATE INDEX production_schedules_status_idx ON public.production_schedules (status);
CREATE INDEX production_schedules_delivery_date_idx ON public.production_schedules (delivery_date);
CREATE INDEX production_schedule_versions_schedule_id_idx
  ON public.production_schedule_versions (schedule_id);
