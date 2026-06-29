-- Companies
CREATE INDEX idx_companies_company_name ON public.companies (company_name);
CREATE INDEX idx_companies_created_at ON public.companies (created_at DESC);

-- Contacts
CREATE INDEX idx_contacts_company_id ON public.contacts (company_id);
CREATE INDEX idx_contacts_email ON public.contacts (email) WHERE email IS NOT NULL;

-- Opportunities
CREATE INDEX idx_opportunities_company_id ON public.opportunities (company_id);
CREATE INDEX idx_opportunities_contact_id ON public.opportunities (contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_opportunities_status ON public.opportunities (opportunity_status);
CREATE INDEX idx_opportunities_created_at ON public.opportunities (created_at DESC);
CREATE INDEX idx_opportunities_ai_confidence ON public.opportunities (ai_confidence DESC NULLS LAST);

-- Clients
CREATE INDEX idx_clients_company_id ON public.clients (company_id);
CREATE INDEX idx_clients_status ON public.clients (client_status);

-- Projects
CREATE INDEX idx_projects_client_id ON public.projects (client_id);
CREATE INDEX idx_projects_status ON public.projects (status);
CREATE INDEX idx_projects_delivery_date ON public.projects (delivery_date) WHERE delivery_date IS NOT NULL;

-- Quotes
CREATE INDEX idx_quotes_project_id ON public.quotes (project_id);
CREATE INDEX idx_quotes_status ON public.quotes (quote_status);

-- Production Schedules
CREATE INDEX idx_production_schedules_project_id ON public.production_schedules (project_id);
