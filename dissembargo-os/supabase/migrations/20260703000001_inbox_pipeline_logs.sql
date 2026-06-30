-- Pipeline event log for Gmail → AI → CRM tracing
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

CREATE POLICY "Users can read own pipeline logs"
  ON public.inbox_pipeline_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage pipeline logs"
  ON public.inbox_pipeline_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);
