-- AI email classification categories
CREATE TYPE public.ai_email_category AS ENUM (
  'new_business_opportunity',
  'existing_client',
  'supplier',
  'invoice',
  'marketing',
  'recruitment',
  'spam',
  'other'
);

CREATE TYPE public.inbox_review_status AS ENUM (
  'pending_review',
  'approved',
  'rejected',
  'auto_created'
);

CREATE TYPE public.ai_processing_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

-- Extend inbox with AI qualification fields
ALTER TABLE public.inbox
  ADD COLUMN ai_category public.ai_email_category,
  ADD COLUMN ai_confidence NUMERIC(5, 2) CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
  ADD COLUMN ai_summary TEXT,
  ADD COLUMN ai_reasoning TEXT,
  ADD COLUMN ai_signature TEXT,
  ADD COLUMN ai_processed_at TIMESTAMPTZ,
  ADD COLUMN ai_processing_status public.ai_processing_status NOT NULL DEFAULT 'pending',
  ADD COLUMN ai_processing_error TEXT,
  ADD COLUMN review_status public.inbox_review_status,
  ADD COLUMN opportunity_id UUID REFERENCES public.opportunities (id) ON DELETE SET NULL,
  ADD COLUMN detected_company_name TEXT,
  ADD COLUMN detected_website TEXT;

-- Link opportunities back to source inbox email
ALTER TABLE public.opportunities
  ADD COLUMN inbox_id UUID REFERENCES public.inbox (id) ON DELETE SET NULL;

CREATE INDEX idx_inbox_ai_processing_status ON public.inbox (ai_processing_status);
CREATE INDEX idx_inbox_review_status ON public.inbox (review_status);
CREATE INDEX idx_inbox_opportunity_id ON public.inbox (opportunity_id);
CREATE INDEX idx_opportunities_inbox_id ON public.opportunities (inbox_id);

-- AI classification audit log
CREATE TABLE public.ai_classification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_id UUID NOT NULL REFERENCES public.inbox (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  ai_category public.ai_email_category,
  ai_confidence NUMERIC(5, 2),
  ai_summary TEXT,
  ai_reasoning TEXT,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  raw_response JSONB,
  action_taken TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_classification_logs_inbox_id ON public.ai_classification_logs (inbox_id);
CREATE INDEX idx_ai_classification_logs_user_id ON public.ai_classification_logs (user_id);
CREATE INDEX idx_ai_classification_logs_created_at ON public.ai_classification_logs (created_at DESC);

COMMENT ON TABLE public.ai_classification_logs IS 'Audit log of all AI email classification decisions';
