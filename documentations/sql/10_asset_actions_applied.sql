-- Add applied flag to asset_actions
-- true = asset has been updated, false = scheduled for future (waiting for cron)

ALTER TABLE public.asset_actions
  ADD COLUMN IF NOT EXISTS applied BOOLEAN DEFAULT true;

-- All existing records are already applied
UPDATE public.asset_actions SET applied = true WHERE applied IS NULL;

-- Make it NOT NULL going forward
ALTER TABLE public.asset_actions
  ALTER COLUMN applied SET NOT NULL;

-- Index for the cron job to quickly find pending actions
CREATE INDEX IF NOT EXISTS idx_asset_actions_pending
  ON public.asset_actions(action_date)
  WHERE applied = false;
