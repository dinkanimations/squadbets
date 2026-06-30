-- Inbox intelligent assistant: entity linking, item types, company last contact

CREATE TYPE public.inbox_item_type AS ENUM (
  'new_opportunity',
  'client_communication'
);

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

COMMENT ON COLUMN public.potential_opportunities.item_type IS
  'new_opportunity = potential new business; client_communication = reply from existing client';
