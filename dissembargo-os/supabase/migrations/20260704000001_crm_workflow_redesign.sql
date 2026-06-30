-- CRM workflow redesign: freelancers module + simplified potential opportunity status

CREATE TABLE IF NOT EXISTS public.freelancers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  inbox_id UUID UNIQUE REFERENCES public.inbox (id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  skills TEXT,
  software TEXT,
  portfolio_url TEXT,
  website TEXT,
  linkedin_url TEXT,
  day_rate NUMERIC(12, 2),
  availability TEXT,
  notes TEXT,
  ai_summary TEXT,
  ai_confidence NUMERIC(5, 2),
  ai_reasoning TEXT,
  extraction_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_freelancers_user_id ON public.freelancers (user_id);
CREATE INDEX IF NOT EXISTS idx_freelancers_status ON public.freelancers (status);

ALTER TABLE public.freelancers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own freelancers"
  ON public.freelancers
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow converted status on potential opportunities (company created from enquiry)
ALTER TABLE public.potential_opportunities
  DROP CONSTRAINT IF EXISTS potential_opportunities_status_check;

ALTER TABLE public.potential_opportunities
  ADD CONSTRAINT potential_opportunities_status_check
  CHECK (status IN ('pending', 'accepted', 'dismissed', 'converted'));

NOTIFY pgrst, 'reload schema';
