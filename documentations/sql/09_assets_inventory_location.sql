-- Add inventory_location column to assets
-- Stores the asset's home/storage location (where it lives when not checked out)
-- Separate from location which tracks current whereabouts (e.g. member's site)

ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS inventory_location TEXT;

-- Backfill: set inventory_location to current location for existing assets that are not checked out
UPDATE public.assets
SET inventory_location = location
WHERE inventory_location IS NULL AND location IS NOT NULL;
