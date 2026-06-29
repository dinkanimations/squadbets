ALTER TABLE public.gmail_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox ENABLE ROW LEVEL SECURITY;

-- Users can view their own connection metadata (tokens excluded via server-only queries)
CREATE POLICY "gmail_connections_select_own"
  ON public.gmail_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "gmail_connections_delete_own"
  ON public.gmail_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Inbox: users can only access their own imported emails
CREATE POLICY "inbox_select_own"
  ON public.inbox FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "inbox_update_own"
  ON public.inbox FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Inserts handled by service role during sync (no client insert policy)
