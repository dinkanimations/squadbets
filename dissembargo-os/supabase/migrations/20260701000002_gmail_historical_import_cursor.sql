-- Track Gmail inbox pagination for importing older messages on each sync
ALTER TABLE public.gmail_connections
  ADD COLUMN IF NOT EXISTS historical_import_page_token TEXT;

COMMENT ON COLUMN public.gmail_connections.historical_import_page_token IS
  'Gmail messages.list page token — resumes historical inbox import on the next sync';
