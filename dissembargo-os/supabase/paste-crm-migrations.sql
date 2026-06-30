-- CRM workflow migrations for Dissembargo OS
-- Run once in Supabase Dashboard → SQL Editor

-- Pipeline event log (Gmail → AI → CRM tracing)
CREATE TABLE IF NOT EXISTS public.inbox_pipeline_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  inbox_id UUID REFERENCES public.inbox (id) ON DELETE CASCADE,
  gmail_message_id TEXT,
  stage TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'skipped')),
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inbox_pipeline_logs_user_id
  ON public.inbox_pipeline_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inbox_pipeline_logs_inbox_id
  ON public.inbox_pipeline_logs (inbox_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inbox_pipeline_logs_stage
  ON public.inbox_pipeline_logs (stage);

ALTER TABLE public.inbox_pipeline_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own pipeline logs" ON public.inbox_pipeline_logs;
CREATE POLICY "Users can read own pipeline logs"
  ON public.inbox_pipeline_logs
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage pipeline logs" ON public.inbox_pipeline_logs;
CREATE POLICY "Service role can manage pipeline logs"
  ON public.inbox_pipeline_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Freelancers module
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

DROP POLICY IF EXISTS "Users can manage own freelancers" ON public.freelancers;
CREATE POLICY "Users can manage own freelancers"
  ON public.freelancers
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow converted status on potential opportunities
ALTER TABLE public.potential_opportunities
  DROP CONSTRAINT IF EXISTS potential_opportunities_status_check;

ALTER TABLE public.potential_opportunities
  ADD CONSTRAINT potential_opportunities_status_check
  CHECK (status IN ('pending', 'accepted', 'dismissed', 'converted'));

NOTIFY pgrst, 'reload schema';
