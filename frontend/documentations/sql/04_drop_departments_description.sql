-- Remove the description column from departments table
ALTER TABLE public.departments DROP COLUMN IF EXISTS description;
