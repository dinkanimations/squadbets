-- RLS for quote builder tables

ALTER TABLE public.quote_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_budget_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_budget_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quote_deliverables_all_authenticated"
  ON public.quote_deliverables FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "quote_budget_sections_all_authenticated"
  ON public.quote_budget_sections FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "quote_budget_line_items_all_authenticated"
  ON public.quote_budget_line_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
