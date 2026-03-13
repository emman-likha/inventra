-- Drop columns no longer needed
ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Set up Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users." ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users." ON public.profiles
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile." ON public.profiles;
CREATE POLICY "Users can insert own profile." ON public.profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
