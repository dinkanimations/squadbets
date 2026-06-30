/** SQL to paste in Supabase SQL Editor when Inbox tables are missing. */
export const INBOX_SETUP_SQL = `-- Inbox setup for Dissembargo OS (run once in Supabase SQL Editor)

DO $$ BEGIN
  CREATE TYPE public.potential_opportunity_status AS ENUM ('pending', 'accepted', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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

ALTER TABLE public.potential_opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "potential_opportunities_all_authenticated" ON public.potential_opportunities;
CREATE POLICY "potential_opportunities_all_authenticated" ON public.potential_opportunities
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TYPE public.inbox_review_status ADD VALUE IF NOT EXISTS 'ignored';

DO $$ BEGIN
  CREATE TYPE public.inbox_item_type AS ENUM ('new_opportunity', 'client_communication');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.potential_opportunities
  ADD COLUMN IF NOT EXISTS item_type public.inbox_item_type NOT NULL DEFAULT 'new_opportunity',
  ADD COLUMN IF NOT EXISTS linked_opportunity_id UUID REFERENCES public.opportunities (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_quote_id UUID REFERENCES public.quotes (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_project_id UUID REFERENCES public.projects (id) ON DELETE SET NULL;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ;
ALTER TABLE public.gmail_connections ADD COLUMN IF NOT EXISTS historical_import_page_token TEXT;

NOTIFY pgrst, 'reload schema';
`;
