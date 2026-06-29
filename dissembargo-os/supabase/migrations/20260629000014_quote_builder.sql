-- Quote Builder: extended quotes with deliverables and budget sections

CREATE TYPE public.discount_type AS ENUM ('percentage', 'fixed');

-- Extend quotes table
ALTER TABLE public.quotes
  ALTER COLUMN project_id DROP NOT NULL,
  ADD COLUMN quote_number TEXT,
  ADD COLUMN company_id UUID REFERENCES public.companies (id) ON DELETE SET NULL,
  ADD COLUMN contact_id UUID REFERENCES public.contacts (id) ON DELETE SET NULL,
  ADD COLUMN opportunity_id UUID REFERENCES public.opportunities (id) ON DELETE SET NULL,
  ADD COLUMN project_title TEXT,
  ADD COLUMN client_name TEXT,
  ADD COLUMN notes TEXT,
  ADD COLUMN discount_type public.discount_type NOT NULL DEFAULT 'fixed',
  ADD COLUMN discount_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.quotes.quote_number IS 'Auto-generated unique quote reference e.g. Q-2026-0001';
COMMENT ON COLUMN public.quotes.discount_value IS 'User-entered discount (percentage or fixed amount)';
COMMENT ON COLUMN public.quotes.discount IS 'Computed discount amount in currency';

-- Quote deliverables
CREATE TABLE public.quote_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes (id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.quote_deliverables IS 'Deliverable line items on a quote';

-- Budget sections
CREATE TABLE public.quote_budget_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.quote_budget_sections IS 'Budget category sections on a quote';

-- Budget line items
CREATE TABLE public.quote_budget_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.quote_budget_sections (id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  day_rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
  num_days NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.quote_budget_line_items IS 'Individual budget rows within a section';

-- Quote number generator
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_part TEXT := to_char(NOW(), 'YYYY');
  seq_num INTEGER;
BEGIN
  SELECT COALESCE(
    MAX(
      CASE
        WHEN quote_number ~ ('^Q-' || year_part || '-[0-9]+$')
        THEN CAST(split_part(quote_number, '-', 3) AS INTEGER)
        ELSE 0
      END
    ),
    0
  ) + 1
  INTO seq_num
  FROM public.quotes;

  RETURN 'Q-' || year_part || '-' || lpad(seq_num::TEXT, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_quote_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_quote_number() TO service_role;

-- Backfill quote numbers for any existing rows
UPDATE public.quotes
SET quote_number = public.generate_quote_number()
WHERE quote_number IS NULL;

ALTER TABLE public.quotes
  ALTER COLUMN quote_number SET NOT NULL;

CREATE UNIQUE INDEX quotes_quote_number_unique ON public.quotes (quote_number);
CREATE INDEX quotes_company_id_idx ON public.quotes (company_id);
CREATE INDEX quotes_opportunity_id_idx ON public.quotes (opportunity_id);
CREATE INDEX quotes_status_idx ON public.quotes (quote_status);
CREATE INDEX quotes_is_archived_idx ON public.quotes (is_archived);
CREATE INDEX quote_deliverables_quote_id_idx ON public.quote_deliverables (quote_id);
CREATE INDEX quote_budget_sections_quote_id_idx ON public.quote_budget_sections (quote_id);
CREATE INDEX quote_budget_line_items_section_id_idx ON public.quote_budget_line_items (section_id);

-- Updated_at triggers
CREATE TRIGGER quote_deliverables_updated_at
  BEFORE UPDATE ON public.quote_deliverables
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER quote_budget_sections_updated_at
  BEFORE UPDATE ON public.quote_budget_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER quote_budget_line_items_updated_at
  BEFORE UPDATE ON public.quote_budget_line_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
