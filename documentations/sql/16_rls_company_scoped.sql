-- ============================================================
-- Replace all RLS policies with company-scoped versions
-- ============================================================

-- ---- PROFILES ----
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users." ON public.profiles;
CREATE POLICY "Profiles are viewable by company members" ON public.profiles
  FOR SELECT USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile." ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- ---- ASSETS ----
DROP POLICY IF EXISTS "Assets are viewable by authenticated users." ON public.assets;
CREATE POLICY "Assets are viewable by company members" ON public.assets
  FOR SELECT USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "Authenticated users can insert assets." ON public.assets;
CREATE POLICY "Company members can insert assets" ON public.assets
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "Users can update relevant assets." ON public.assets;
CREATE POLICY "Company members can update assets" ON public.assets
  FOR UPDATE USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "Authenticated users can delete assets." ON public.assets;
CREATE POLICY "Company members can delete assets" ON public.assets
  FOR DELETE USING (company_id = public.get_my_company_id());

-- ---- DEPARTMENTS ----
DROP POLICY IF EXISTS "Departments are viewable by authenticated users." ON public.departments;
CREATE POLICY "Departments are viewable by company members" ON public.departments
  FOR SELECT USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "Authenticated users can insert departments." ON public.departments;
CREATE POLICY "Company members can insert departments" ON public.departments
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "Authenticated users can update departments." ON public.departments;
CREATE POLICY "Company members can update departments" ON public.departments
  FOR UPDATE USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "Authenticated users can delete departments." ON public.departments;
CREATE POLICY "Company members can delete departments" ON public.departments
  FOR DELETE USING (company_id = public.get_my_company_id());

-- ---- MEMBERS ----
DROP POLICY IF EXISTS "Authenticated users can view members" ON public.members;
DROP POLICY IF EXISTS "Members are viewable by authenticated users." ON public.members;
CREATE POLICY "Members are viewable by company members" ON public.members
  FOR SELECT USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "Authenticated users can insert members" ON public.members;
DROP POLICY IF EXISTS "Authenticated users can insert members." ON public.members;
CREATE POLICY "Company members can insert members" ON public.members
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "Authenticated users can update members" ON public.members;
DROP POLICY IF EXISTS "Authenticated users can update members." ON public.members;
CREATE POLICY "Company members can update members" ON public.members
  FOR UPDATE USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "Authenticated users can delete members" ON public.members;
DROP POLICY IF EXISTS "Authenticated users can delete members." ON public.members;
CREATE POLICY "Company members can delete members" ON public.members
  FOR DELETE USING (company_id = public.get_my_company_id());

-- ---- INVENTORIES ----
DROP POLICY IF EXISTS "Inventories are viewable by authenticated users." ON public.inventories;
CREATE POLICY "Inventories are viewable by company members" ON public.inventories
  FOR SELECT USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "Authenticated users can insert inventories." ON public.inventories;
CREATE POLICY "Company members can insert inventories" ON public.inventories
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "Authenticated users can update inventories." ON public.inventories;
CREATE POLICY "Company members can update inventories" ON public.inventories
  FOR UPDATE USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "Authenticated users can delete inventories." ON public.inventories;
CREATE POLICY "Company members can delete inventories" ON public.inventories
  FOR DELETE USING (company_id = public.get_my_company_id());

-- ---- ASSET ACTIONS ----
DROP POLICY IF EXISTS "Asset actions are viewable by authenticated users." ON public.asset_actions;
CREATE POLICY "Asset actions are viewable by company members" ON public.asset_actions
  FOR SELECT USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "Authenticated users can insert asset actions." ON public.asset_actions;
CREATE POLICY "Company members can insert asset actions" ON public.asset_actions
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());

-- ---- STORAGE: DOCUMENTS ----
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Company members can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents'
    AND (select auth.uid()) IS NOT NULL
    AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
CREATE POLICY "Company members can view documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents'
    AND (select auth.uid()) IS NOT NULL
    AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
CREATE POLICY "Company members can delete documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents'
    AND (select auth.uid()) IS NOT NULL
    AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
CREATE POLICY "Company members can update documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents'
    AND (select auth.uid()) IS NOT NULL
    AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

-- ---- STORAGE: IMAGES ----
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Company members can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images'
    AND (select auth.uid()) IS NOT NULL
    AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

DROP POLICY IF EXISTS "Authenticated users can view images" ON storage.objects;
CREATE POLICY "Company members can view images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'images'
    AND (select auth.uid()) IS NOT NULL
    AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

-- Remove the overly permissive public read policy on images
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
CREATE POLICY "Company members can delete images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images'
    AND (select auth.uid()) IS NOT NULL
    AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
CREATE POLICY "Company members can update images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'images'
    AND (select auth.uid()) IS NOT NULL
    AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  );
