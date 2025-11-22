-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Create profiles table for additional user info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create resources table
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- video, image, pdf
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create resource_views table for analytics
CREATE TABLE public.resource_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_views ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User roles RLS policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Categories RLS policies
CREATE POLICY "Everyone can view categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers and admins can manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'teacher') OR 
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'teacher') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Resources RLS policies
CREATE POLICY "Everyone can view resources"
  ON public.resources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can create resources"
  ON public.resources FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'teacher') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Teachers can update own resources"
  ON public.resources FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = uploaded_by OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Teachers can delete own resources"
  ON public.resources FOR DELETE
  TO authenticated
  USING (
    auth.uid() = uploaded_by OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Resource views RLS policies
CREATE POLICY "Users can create own views"
  ON public.resource_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers and admins can view analytics"
  ON public.resource_views FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'teacher') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default categories
INSERT INTO public.categories (name, description) VALUES
  ('Mathematics', 'Mathematical concepts and problem solving'),
  ('Science', 'Scientific concepts and experiments'),
  ('Literature', 'Books, poems, and literary works'),
  ('History', 'Historical events and analysis'),
  ('Technology', 'Computer science and technology topics'),
  ('Arts', 'Visual arts, music, and creative works');

-- Create storage bucket for learning resources
INSERT INTO storage.buckets (id, name, public)
VALUES ('learning-resources', 'learning-resources', true);

-- Storage policies for learning resources
CREATE POLICY "Anyone can view learning resources"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'learning-resources');

CREATE POLICY "Teachers can upload learning resources"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'learning-resources' AND
    (
      public.has_role(auth.uid(), 'teacher') OR 
      public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Teachers can update own resources"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'learning-resources');

CREATE POLICY "Teachers can delete own resources"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'learning-resources');