-- Drop old inventories table if it exists (redesigned from container to stock-type)
DROP TABLE IF EXISTS public.inventories CASCADE;

-- Remove inventory_id from assets (assets and inventory are separate concepts)
ALTER TABLE public.assets DROP COLUMN IF EXISTS inventory_id;

-- Inventories table — stock-type / consumable items
CREATE TABLE IF NOT EXISTS public.inventories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  cost_per_unit NUMERIC(12, 2),
  location TEXT,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by creator
CREATE INDEX IF NOT EXISTS idx_inventories_created_by
  ON public.inventories USING btree (created_by);

-- Enable RLS
ALTER TABLE public.inventories ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all inventory items
DROP POLICY IF EXISTS "Inventories are viewable by authenticated users." ON public.inventories;
CREATE POLICY "Inventories are viewable by authenticated users." ON public.inventories
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- Authenticated users can create inventory items
DROP POLICY IF EXISTS "Authenticated users can insert inventories." ON public.inventories;
CREATE POLICY "Authenticated users can insert inventories." ON public.inventories
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Authenticated users can update inventory items
DROP POLICY IF EXISTS "Authenticated users can update inventories." ON public.inventories;
CREATE POLICY "Authenticated users can update inventories." ON public.inventories
  FOR UPDATE USING ((select auth.uid()) IS NOT NULL);

-- Authenticated users can delete inventory items
DROP POLICY IF EXISTS "Authenticated users can delete inventories." ON public.inventories;
CREATE POLICY "Authenticated users can delete inventories." ON public.inventories
  FOR DELETE USING ((select auth.uid()) IS NOT NULL);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.inventories;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.inventories
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
