-- Gmail OAuth connections (tokens accessed server-side only)
CREATE TABLE public.gmail_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  gmail_address TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ,
  history_id TEXT,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT NOT NULL DEFAULT 'pending',
  last_sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.gmail_connections IS 'Gmail OAuth credentials per user for read-only inbox sync';

-- Imported inbox emails (independent from Opportunities)
CREATE TABLE public.inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL,
  thread_id TEXT,
  subject TEXT,
  sender_name TEXT,
  sender_email TEXT,
  recipient TEXT,
  date_received TIMESTAMPTZ NOT NULL,
  body_plain TEXT,
  body_html TEXT,
  attachments JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inbox_user_message_unique UNIQUE (user_id, gmail_message_id)
);

COMMENT ON TABLE public.inbox IS 'Emails imported from Gmail inbox for review before AI processing';

CREATE INDEX idx_inbox_user_id ON public.inbox (user_id);
CREATE INDEX idx_inbox_date_received ON public.inbox (date_received DESC);
CREATE INDEX idx_inbox_is_read ON public.inbox (is_read);
CREATE INDEX idx_inbox_imported_at ON public.inbox (imported_at DESC);
CREATE INDEX idx_gmail_connections_user_id ON public.gmail_connections (user_id);

CREATE TRIGGER set_gmail_connections_updated_at
  BEFORE UPDATE ON public.gmail_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
