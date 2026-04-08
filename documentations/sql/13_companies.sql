-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Allow insert during signup (trigger runs as SECURITY DEFINER so this is mainly for direct use)
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;
CREATE POLICY "Authenticated users can create companies" ON public.companies
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Reuse existing updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at ON public.companies;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
