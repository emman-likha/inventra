-- Asset actions / movement history table
-- Tracks all asset lifecycle events: check out, check in, move, maintenance, dispose, reserve

CREATE TABLE IF NOT EXISTS public.asset_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('check_out', 'check_in', 'move', 'maintenance', 'dispose', 'reserve')),
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  from_location TEXT,
  to_location TEXT,
  work_setup TEXT CHECK (work_setup IN ('on_site', 'remote', 'hybrid')),
  action_date TIMESTAMPTZ,
  notes TEXT,
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.asset_actions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all actions
DROP POLICY IF EXISTS "Asset actions are viewable by authenticated users." ON public.asset_actions;
CREATE POLICY "Asset actions are viewable by authenticated users." ON public.asset_actions
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- Authenticated users can insert actions
DROP POLICY IF EXISTS "Authenticated users can insert asset actions." ON public.asset_actions;
CREATE POLICY "Authenticated users can insert asset actions." ON public.asset_actions
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Index for fast lookups by asset
CREATE INDEX IF NOT EXISTS idx_asset_actions_asset_id ON public.asset_actions(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_actions_created_at ON public.asset_actions(created_at DESC);
