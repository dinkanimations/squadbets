-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types
CREATE TYPE public.opportunity_status AS ENUM (
  'new',
  'reviewing',
  'qualified',
  'contacted',
  'proposal_sent',
  'won',
  'lost',
  'archived'
);

CREATE TYPE public.client_status AS ENUM (
  'prospect',
  'onboarding',
  'active',
  'inactive',
  'churned'
);

CREATE TYPE public.project_status AS ENUM (
  'draft',
  'active',
  'on_hold',
  'in_review',
  'completed',
  'cancelled'
);

CREATE TYPE public.quote_status AS ENUM (
  'draft',
  'sent',
  'approved',
  'rejected',
  'expired'
);
