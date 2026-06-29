ALTER TABLE public.ai_classification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_classification_logs_select_own"
  ON public.ai_classification_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Inserts handled server-side via service role during processing
