-- Company Intelligence: extended fields for AI research, deduplication, and profile management

ALTER TABLE public.companies
  ADD COLUMN logo_url TEXT,
  ADD COLUMN products TEXT[] DEFAULT '{}',
  ADD COLUMN services TEXT[] DEFAULT '{}',
  ADD COLUMN key_markets TEXT[] DEFAULT '{}',
  ADD COLUMN target_customers TEXT[] DEFAULT '{}',
  ADD COLUMN creative_opportunities TEXT[] DEFAULT '{}',
  ADD COLUMN suggested_services TEXT[] DEFAULT '{}',
  ADD COLUMN executive_summary TEXT,
  ADD COLUMN internal_notes TEXT,
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  ADD COLUMN is_existing_client BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN website_candidates JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN website_pending_selection BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN ai_research_cached_at TIMESTAMPTZ,
  ADD COLUMN ai_research_raw JSONB,
  ADD COLUMN normalized_name TEXT,
  ADD COLUMN website_domain TEXT,
  ADD COLUMN manual_overrides JSONB NOT NULL DEFAULT '{}'::JSONB;

COMMENT ON COLUMN public.companies.normalized_name IS 'Lowercase normalized name for deduplication';
COMMENT ON COLUMN public.companies.website_domain IS 'Extracted domain for deduplication';
COMMENT ON COLUMN public.companies.manual_overrides IS 'Fields manually edited; AI refresh skips these keys';
COMMENT ON COLUMN public.companies.ai_research_raw IS 'Cached raw AI research response';

-- Backfill normalized names for existing rows
UPDATE public.companies
SET normalized_name = lower(regexp_replace(trim(company_name), '[^a-zA-Z0-9]+', '', 'g'))
WHERE normalized_name IS NULL;

-- Backfill website domains
UPDATE public.companies
SET website_domain = lower(
  regexp_replace(
    regexp_replace(coalesce(website, ''), '^https?://(www\.)?', '', 'i'),
    '/.*$',
    ''
  )
)
WHERE website IS NOT NULL AND website != '' AND website_domain IS NULL;

-- Dedup indexes (partial unique to allow nulls)
CREATE UNIQUE INDEX companies_normalized_name_unique
  ON public.companies (normalized_name)
  WHERE normalized_name IS NOT NULL AND normalized_name != '' AND status = 'active';

CREATE UNIQUE INDEX companies_website_domain_unique
  ON public.companies (website_domain)
  WHERE website_domain IS NOT NULL AND website_domain != '' AND status = 'active';

CREATE INDEX companies_status_idx ON public.companies (status);
CREATE INDEX companies_industry_idx ON public.companies (industry);
CREATE INDEX companies_created_at_idx ON public.companies (created_at);
CREATE INDEX companies_is_existing_client_idx ON public.companies (is_existing_client);
