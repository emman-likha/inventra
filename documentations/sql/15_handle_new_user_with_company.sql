-- Updated signup trigger: creates company + profile with company_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
  user_role public.user_role;
BEGIN
  -- Check if user was invited to an existing company (company_id in metadata)
  IF new.raw_user_meta_data->>'company_id' IS NOT NULL THEN
    -- Invited user: join existing company as regular user
    new_company_id := (new.raw_user_meta_data->>'company_id')::UUID;
    user_role := 'user';
  ELSE
    -- New signup: create a new company
    INSERT INTO public.companies (name)
    VALUES (COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'company_name'), ''), 'My Company'))
    RETURNING id INTO new_company_id;
    user_role := 'admin';
  END IF;

  -- Create profile linked to the company
  INSERT INTO public.profiles (id, first_name, last_name, role, company_id)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    user_role,
    new_company_id
  );

  -- Create company-scoped folder in documents bucket
  INSERT INTO storage.objects (bucket_id, name, owner)
  VALUES ('documents', new_company_id || '/.keep', new.id);

  -- Create company-scoped folder in images bucket
  INSERT INTO storage.objects (bucket_id, name, owner)
  VALUES ('images', new_company_id || '/.keep', new.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
