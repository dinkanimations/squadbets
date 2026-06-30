-- Update opportunity_status enum to match product requirements
ALTER TABLE public.opportunities
  ALTER COLUMN opportunity_status DROP DEFAULT;

CREATE TYPE public.opportunity_status_new AS ENUM (
  'new',
  'contacted',
  'quote_requested',
  'quote_sent',
  'won',
  'lost',
  'archived'
);

ALTER TABLE public.opportunities
  ALTER COLUMN opportunity_status TYPE public.opportunity_status_new
  USING (
    CASE opportunity_status::text
      WHEN 'reviewing' THEN 'new'::public.opportunity_status_new
      WHEN 'qualified' THEN 'new'::public.opportunity_status_new
      WHEN 'contacted' THEN 'contacted'::public.opportunity_status_new
      WHEN 'proposal_sent' THEN 'quote_sent'::public.opportunity_status_new
      WHEN 'new' THEN 'new'::public.opportunity_status_new
      WHEN 'won' THEN 'won'::public.opportunity_status_new
      WHEN 'lost' THEN 'lost'::public.opportunity_status_new
      WHEN 'archived' THEN 'archived'::public.opportunity_status_new
      ELSE 'new'::public.opportunity_status_new
    END
  );

DROP TYPE public.opportunity_status;

ALTER TYPE public.opportunity_status_new RENAME TO opportunity_status;

ALTER TABLE public.opportunities
  ALTER COLUMN opportunity_status SET DEFAULT 'new';
