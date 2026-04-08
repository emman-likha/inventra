-- Backfill existing data: create a default company for existing records
DO $$
DECLARE
  default_company UUID;
BEGIN
  -- Only run if there are profiles without company_id
  IF EXISTS (SELECT 1 FROM public.profiles WHERE company_id IS NULL) THEN
    INSERT INTO public.companies (name) VALUES ('Default Company')
    RETURNING id INTO default_company;

    UPDATE public.profiles SET company_id = default_company WHERE company_id IS NULL;
    UPDATE public.assets SET company_id = default_company WHERE company_id IS NULL;
    UPDATE public.departments SET company_id = default_company WHERE company_id IS NULL;
    UPDATE public.members SET company_id = default_company WHERE company_id IS NULL;
    UPDATE public.inventories SET company_id = default_company WHERE company_id IS NULL;
    UPDATE public.asset_actions SET company_id = default_company WHERE company_id IS NULL;
  END IF;
END $$;

-- After backfill, enforce NOT NULL
ALTER TABLE public.profiles ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.assets ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.departments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.members ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.inventories ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.asset_actions ALTER COLUMN company_id SET NOT NULL;
