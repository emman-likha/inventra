-- Create the members table (replaces the TEXT[] members column on departments)
CREATE TABLE IF NOT EXISTS public.members (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  employee_id   TEXT UNIQUE,
  position      TEXT,
  email         TEXT,
  site_location TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Index for fast department lookups
CREATE INDEX IF NOT EXISTS idx_members_department_id ON public.members(department_id);

-- Enable RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read members
CREATE POLICY "Allow authenticated read members"
  ON public.members FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert members
CREATE POLICY "Allow authenticated insert members"
  ON public.members FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update members
CREATE POLICY "Allow authenticated update members"
  ON public.members FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete members
CREATE POLICY "Allow authenticated delete members"
  ON public.members FOR DELETE
  TO authenticated
  USING (true);

-- Remove the old TEXT[] members column from departments
ALTER TABLE public.departments DROP COLUMN IF EXISTS members;
