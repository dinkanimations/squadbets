-- Potential Opportunities: AI-staged business development leads from Gmail

CREATE TYPE public.potential_opportunity_status AS ENUM (
  'pending',
  'accepted',
  'dismissed'
);

CREATE TABLE public.potential_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  inbox_id UUID NOT NULL UNIQUE REFERENCES public.inbox (id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies (id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts (id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.opportunities (id) ON DELETE SET NULL,
  status public.potential_opportunity_status NOT NULL DEFAULT 'pending',
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  company_website TEXT,
  project_name TEXT,
  project_description TEXT,
  deliverables TEXT,
  estimated_budget NUMERIC(12, 2),
  deadline TEXT,
  location TEXT,
  ai_summary TEXT NOT NULL,
  ai_confidence NUMERIC(5, 2) NOT NULL CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
  ai_reasoning TEXT,
  extraction_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.potential_opportunities IS
  'AI-identified job enquiries surfaced in the Inbox business development assistant';

CREATE INDEX potential_opportunities_user_status_idx
  ON public.potential_opportunities (user_id, status);

CREATE INDEX potential_opportunities_company_id_idx
  ON public.potential_opportunities (company_id);

CREATE INDEX potential_opportunities_created_at_idx
  ON public.potential_opportunities (created_at DESC);

CREATE TRIGGER potential_opportunities_updated_at
  BEFORE UPDATE ON public.potential_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.potential_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "potential_opportunities_all_authenticated"
  ON public.potential_opportunities FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Extend inbox review_status for ignored non-job mail
ALTER TYPE public.inbox_review_status ADD VALUE IF NOT EXISTS 'ignored';
