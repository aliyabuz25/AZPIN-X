-- BU SKRİPTİ SUPABASE SQL EDITOR-DA İŞLƏDİN
-- Bu skript "Database error saving new user" xətasını həll edəcək.
-- Xətanın səbəbi: Server tərəfində işləyən (və xətalı olan) Trigger funksiyasıdır.
-- Həlli: Biz xətalı triggeri silirik və profil yaradılmasını (onsuz da kodda var) client-tərəfə buraxırıq.

-- 1. Mövcud xətalı triggeri silin
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Profiles cədvəlinin düzgün olduğundan əmin olun
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Təhlükəsizlik qaydalarını (RLS) yeniləyin
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING ( true );

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = user_id );
