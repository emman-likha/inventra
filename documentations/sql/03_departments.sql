-- Departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add department_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view departments
DROP POLICY IF EXISTS "Departments are viewable by authenticated users." ON public.departments;
CREATE POLICY "Departments are viewable by authenticated users." ON public.departments
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- Authenticated users can insert departments
DROP POLICY IF EXISTS "Authenticated users can insert departments." ON public.departments;
CREATE POLICY "Authenticated users can insert departments." ON public.departments
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Authenticated users can update departments
DROP POLICY IF EXISTS "Authenticated users can update departments." ON public.departments;
CREATE POLICY "Authenticated users can update departments." ON public.departments
  FOR UPDATE USING ((select auth.uid()) IS NOT NULL);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.departments;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
