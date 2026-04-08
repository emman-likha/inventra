-- Add company_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);

-- Add company_id to assets
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_assets_company_id ON public.assets(company_id);

-- Add company_id to departments
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_departments_company_id ON public.departments(company_id);

-- Change departments name unique constraint to composite (name, company_id)
ALTER TABLE public.departments DROP CONSTRAINT IF EXISTS departments_name_key;
ALTER TABLE public.departments ADD CONSTRAINT departments_name_company_unique UNIQUE (name, company_id);

-- Add company_id to members
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_members_company_id ON public.members(company_id);

-- Add company_id to inventories
ALTER TABLE public.inventories ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_inventories_company_id ON public.inventories(company_id);

-- Add company_id to asset_actions
ALTER TABLE public.asset_actions ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_asset_actions_company_id ON public.asset_actions(company_id);

-- Helper function: get current user's company_id (used in RLS policies)
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = (select auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Now that company_id exists on profiles, add company-scoped RLS to companies table
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
CREATE POLICY "Users can view own company" ON public.companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM public.profiles WHERE id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update own company" ON public.companies;
CREATE POLICY "Users can update own company" ON public.companies
  FOR UPDATE USING (
    id IN (SELECT company_id FROM public.profiles WHERE id = (select auth.uid()))
  );
