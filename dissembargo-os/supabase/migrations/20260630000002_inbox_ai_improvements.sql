-- Extend AI email categories
ALTER TYPE public.ai_email_category ADD VALUE IF NOT EXISTS 'newsletter';
ALTER TYPE public.ai_email_category ADD VALUE IF NOT EXISTS 'internal';

-- Opportunity fields for AI-extracted enquiry details
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS requested_deliverables TEXT;

COMMENT ON COLUMN public.opportunities.requested_deliverables IS
  'Creative deliverables requested in the source email, extracted by AI';

-- Human feedback on AI classification decisions (for future model improvement)
CREATE TABLE IF NOT EXISTS public.ai_classification_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_id UUID NOT NULL REFERENCES public.inbox (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  original_category public.ai_email_category,
  corrected_category public.ai_email_category,
  original_confidence NUMERIC(5, 2),
  feedback_action TEXT NOT NULL CHECK (
    feedback_action IN ('approved', 'rejected', 'reclassified', 'manual_created')
  ),
  company_name_override TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_classification_feedback_inbox_id
  ON public.ai_classification_feedback (inbox_id);

CREATE INDEX IF NOT EXISTS idx_ai_classification_feedback_user_id
  ON public.ai_classification_feedback (user_id);

CREATE INDEX IF NOT EXISTS idx_ai_classification_feedback_created_at
  ON public.ai_classification_feedback (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inbox_ai_category
  ON public.inbox (ai_category);

COMMENT ON TABLE public.ai_classification_feedback IS
  'Human corrections to AI email classifications for future model training';
