-- Assets table
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'checked_out', 'maintenance', 'retired')),
  value NUMERIC(12, 2),
  assigned_to UUID REFERENCES public.members(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all assets
DROP POLICY IF EXISTS "Assets are viewable by authenticated users." ON public.assets;
CREATE POLICY "Assets are viewable by authenticated users." ON public.assets
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- Users can insert assets
DROP POLICY IF EXISTS "Authenticated users can insert assets." ON public.assets;
CREATE POLICY "Authenticated users can insert assets." ON public.assets
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Users can update assets they created or are assigned to
DROP POLICY IF EXISTS "Users can update relevant assets." ON public.assets;
CREATE POLICY "Users can update relevant assets." ON public.assets
  FOR UPDATE USING (
    (select auth.uid()) = created_by
    OR (select auth.uid()) = assigned_to
  );

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.assets;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
