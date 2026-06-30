-- =============================================================================
-- INBOX MIGRATIONS — paste this entire file into Supabase SQL Editor and Run
-- Project: https://supabase.com/dashboard → SQL Editor → New query
-- Safe to run once. If a step already exists, you may see harmless errors — continue.
-- =============================================================================

-- 1) Potential opportunities table
DO $$ BEGIN
  CREATE TYPE public.potential_opportunity_status AS ENUM (
    'pending',
    'accepted',
    'dismissed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.potential_opportunities (
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

CREATE INDEX IF NOT EXISTS potential_opportunities_user_status_idx
  ON public.potential_opportunities (user_id, status);

CREATE INDEX IF NOT EXISTS potential_opportunities_company_id_idx
  ON public.potential_opportunities (company_id);

CREATE INDEX IF NOT EXISTS potential_opportunities_created_at_idx
  ON public.potential_opportunities (created_at DESC);

DROP TRIGGER IF EXISTS potential_opportunities_updated_at ON public.potential_opportunities;
CREATE TRIGGER potential_opportunities_updated_at
  BEFORE UPDATE ON public.potential_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.potential_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "potential_opportunities_all_authenticated" ON public.potential_opportunities;
CREATE POLICY "potential_opportunities_all_authenticated"
  ON public.potential_opportunities FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TYPE public.inbox_review_status ADD VALUE IF NOT EXISTS 'ignored';

-- 2) Gmail historical import cursor
ALTER TABLE public.gmail_connections
  ADD COLUMN IF NOT EXISTS historical_import_page_token TEXT;

-- 3) Inbox intelligent assistant columns
DO $$ BEGIN
  CREATE TYPE public.inbox_item_type AS ENUM (
    'new_opportunity',
    'client_communication'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE public.ai_email_category ADD VALUE IF NOT EXISTS 'receipt';
ALTER TYPE public.ai_email_category ADD VALUE IF NOT EXISTS 'password_reset';
ALTER TYPE public.ai_email_category ADD VALUE IF NOT EXISTS 'calendar';
ALTER TYPE public.ai_email_category ADD VALUE IF NOT EXISTS 'social_notification';

ALTER TABLE public.inbox
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_quote_id UUID REFERENCES public.quotes (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_project_id UUID REFERENCES public.projects (id) ON DELETE SET NULL;

ALTER TABLE public.potential_opportunities
  ADD COLUMN IF NOT EXISTS item_type public.inbox_item_type NOT NULL DEFAULT 'new_opportunity',
  ADD COLUMN IF NOT EXISTS linked_opportunity_id UUID REFERENCES public.opportunities (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_quote_id UUID REFERENCES public.quotes (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_project_id UUID REFERENCES public.projects (id) ON DELETE SET NULL;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_inbox_company_id ON public.inbox (company_id);
CREATE INDEX IF NOT EXISTS idx_inbox_linked_quote_id ON public.inbox (linked_quote_id);
CREATE INDEX IF NOT EXISTS idx_inbox_linked_project_id ON public.inbox (linked_project_id);
CREATE INDEX IF NOT EXISTS idx_potential_opportunities_item_type
  ON public.potential_opportunities (item_type, status);
CREATE INDEX IF NOT EXISTS idx_companies_last_contact_at
  ON public.companies (last_contact_at DESC NULLS LAST);
