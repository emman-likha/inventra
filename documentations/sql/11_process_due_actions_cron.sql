-- Enable pg_cron extension (must be done by superuser / via Supabase dashboard)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to process scheduled actions that are now due
CREATE OR REPLACE FUNCTION process_due_actions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  member_location TEXT;
  asset_inv_location TEXT;
BEGIN
  FOR rec IN
    SELECT aa.*, a.inventory_location, a.location AS current_location
    FROM public.asset_actions aa
    JOIN public.assets a ON a.id = aa.asset_id
    WHERE aa.applied = false
      AND aa.action_date <= now()
    ORDER BY aa.action_date ASC
    FOR UPDATE OF aa SKIP LOCKED
  LOOP
    CASE rec.action
      WHEN 'check_out' THEN
        -- Get member site_location for check_out
        SELECT site_location INTO member_location
        FROM public.members
        WHERE id = rec.member_id;

        UPDATE public.assets SET
          status = 'checked_out',
          assigned_to = rec.member_id,
          location = COALESCE(rec.to_location, member_location, location)
        WHERE id = rec.asset_id;

      WHEN 'check_in' THEN
        UPDATE public.assets SET
          status = 'available',
          assigned_to = NULL,
          location = COALESCE(rec.to_location, rec.inventory_location, location)
        WHERE id = rec.asset_id;

      WHEN 'move' THEN
        UPDATE public.assets SET
          location = COALESCE(rec.to_location, location)
        WHERE id = rec.asset_id;

      WHEN 'maintenance' THEN
        UPDATE public.assets SET
          status = 'maintenance'
        WHERE id = rec.asset_id;

      WHEN 'dispose' THEN
        UPDATE public.assets SET
          status = 'retired',
          assigned_to = NULL
        WHERE id = rec.asset_id;

      WHEN 'reserve' THEN
        UPDATE public.assets SET
          assigned_to = rec.member_id
        WHERE id = rec.asset_id;

      ELSE
        -- Unknown action type, skip
        NULL;
    END CASE;

    -- Mark as applied
    UPDATE public.asset_actions SET applied = true WHERE id = rec.id;
  END LOOP;
END;
$$;

-- Schedule the function to run every minute
-- Run this in the Supabase SQL editor after enabling pg_cron:
SELECT cron.schedule(
  'process-due-asset-actions',
  '* * * * *',
  $$SELECT process_due_actions()$$
);
