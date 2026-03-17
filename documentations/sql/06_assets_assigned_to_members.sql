-- Migration: Change assigned_to FK from profiles to members
-- Assets should be assigned to members (employees), not user accounts

-- Drop the old FK constraint on assigned_to (referencing profiles)
ALTER TABLE public.assets
  DROP CONSTRAINT IF EXISTS assets_assigned_to_fkey;

-- Add new FK constraint referencing members
ALTER TABLE public.assets
  ADD CONSTRAINT assets_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES public.members(id) ON DELETE SET NULL;

-- Update the RLS update policy (remove assigned_to from auth check since it's now a member, not a user)
DROP POLICY IF EXISTS "Users can update relevant assets." ON public.assets;
CREATE POLICY "Users can update relevant assets." ON public.assets
  FOR UPDATE USING ((select auth.uid()) IS NOT NULL);

-- Add a delete policy for authenticated users
DROP POLICY IF EXISTS "Authenticated users can delete assets." ON public.assets;
CREATE POLICY "Authenticated users can delete assets." ON public.assets
  FOR DELETE USING ((select auth.uid()) IS NOT NULL);
