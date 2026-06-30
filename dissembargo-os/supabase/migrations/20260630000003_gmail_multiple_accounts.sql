-- Support multiple Gmail accounts per user
ALTER TABLE public.gmail_connections
  DROP CONSTRAINT IF EXISTS gmail_connections_user_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS gmail_connections_user_address_unique
  ON public.gmail_connections (user_id, gmail_address);

-- Track which Gmail account imported each email
ALTER TABLE public.inbox
  ADD COLUMN IF NOT EXISTS gmail_connection_id UUID
  REFERENCES public.gmail_connections (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inbox_gmail_connection_id
  ON public.inbox (gmail_connection_id);

COMMENT ON INDEX public.gmail_connections_user_address_unique IS
  'Each user can connect multiple Gmail accounts, but not the same address twice';
