-- Settings & Team Management

CREATE TYPE public.user_role AS ENUM (
  'administrator',
  'producer',
  'creative_director',
  'designer',
  'freelancer',
  'viewer'
);

CREATE TYPE public.team_member_status AS ENUM (
  'active',
  'inactive'
);

CREATE TABLE public.app_settings (
  id TEXT PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  company_name TEXT NOT NULL DEFAULT 'Dissembargo',
  company_logo_url TEXT,
  company_address TEXT DEFAULT 'London, United Kingdom',
  company_email TEXT DEFAULT 'hello@dissembargo.com',
  company_phone TEXT,
  website TEXT DEFAULT 'www.dissembargo.com',
  default_currency TEXT NOT NULL DEFAULT 'GBP',
  timezone TEXT NOT NULL DEFAULT 'Europe/London',
  default_language TEXT NOT NULL DEFAULT 'en-GB',
  quote_validity_days INTEGER NOT NULL DEFAULT 30,
  default_budget_sections JSONB NOT NULL DEFAULT '["Studio Leads","Design","Modelling","Animation","Lighting","Rendering","Editing","Music","Miscellaneous"]'::JSONB,
  default_day_rates JSONB NOT NULL DEFAULT '{}'::JSONB,
  default_discount_type public.discount_type NOT NULL DEFAULT 'fixed',
  default_discount_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  default_terms JSONB NOT NULL DEFAULT '[]'::JSONB,
  default_phases JSONB NOT NULL DEFAULT '["Scoping","Research","Look Development","Design","Modelling","Animation","Lighting","Rendering","Compositing","Client Review","Final Delivery"]'::JSONB,
  phase_weights JSONB NOT NULL DEFAULT '{}'::JSONB,
  default_milestones JSONB NOT NULL DEFAULT '["kick_off","wip_review","client_feedback","client_approval","final_delivery"]'::JSONB,
  default_review_rounds INTEGER NOT NULL DEFAULT 2,
  default_schedule_duration_days INTEGER NOT NULL DEFAULT 42,
  working_days JSONB NOT NULL DEFAULT '[1,2,3,4,5]'::JSONB,
  company_holidays JSONB NOT NULL DEFAULT '[]'::JSONB,
  email_signature TEXT,
  pdf_header_logo_url TEXT,
  pdf_footer_text TEXT,
  pdf_tagline TEXT DEFAULT 'Creative Production Studio',
  pdf_colors JSONB NOT NULL DEFAULT '{"primary":"#18181b","accent":"#6366f1","accentLight":"#eef2ff","muted":"#71717a","border":"#e4e4e7","background":"#ffffff","surface":"#fafafa"}'::JSONB,
  notify_email BOOLEAN NOT NULL DEFAULT TRUE,
  notify_deadlines BOOLEAN NOT NULL DEFAULT TRUE,
  notify_quote_approval BOOLEAN NOT NULL DEFAULT TRUE,
  notify_client_feedback BOOLEAN NOT NULL DEFAULT TRUE,
  notify_ai_processing BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  job_title TEXT,
  day_rate NUMERIC(10, 2),
  department TEXT,
  avatar_url TEXT,
  status public.team_member_status NOT NULL DEFAULT 'active',
  role public.user_role NOT NULL DEFAULT 'viewer',
  profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT team_members_email_unique UNIQUE (email)
);

CREATE INDEX team_members_status_idx ON public.team_members (status);
CREATE INDEX team_members_role_idx ON public.team_members (role);

CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings_all_authenticated"
  ON public.app_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "team_members_all_authenticated"
  ON public.team_members FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed default settings row
INSERT INTO public.app_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- Seed default terms from existing PDF defaults
UPDATE public.app_settings
SET default_terms = '[
  "This quotation is valid until the expiry date stated above. Prices are quoted in GBP and exclude VAT unless otherwise stated.",
  "A 50% deposit is required to commence work. The remaining balance is due upon delivery of final assets, unless alternative payment terms are agreed in writing.",
  "Scope is limited to the deliverables listed in this document. Additional revisions, assets, or services outside the agreed scope will be quoted separately.",
  "Client-supplied materials must be cleared for use. Dissembargo is not liable for delays caused by incomplete briefs, feedback, or third-party dependencies.",
  "Final project files will be released upon receipt of full payment. Usage rights are granted as specified in the project agreement.",
  "Cancellation after project commencement may incur fees for work completed to date. Deposits are non-refundable once production has begun.",
  "Dissembargo retains the right to showcase completed work in its portfolio unless a confidentiality agreement is in place."
]'::JSONB,
phase_weights = '{
  "Scoping": 1,
  "Research": 1,
  "Look Development": 2,
  "Design": 2,
  "Modelling": 3,
  "Animation": 4,
  "Lighting": 2,
  "Rendering": 2,
  "Compositing": 2,
  "Client Review": 1,
  "Final Delivery": 1
}'::JSONB
WHERE id = 'default';
