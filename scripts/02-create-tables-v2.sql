-- Create database schema for Question Diversification System
-- This script creates all necessary tables with proper relationships and security

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create question_packages table
CREATE TABLE IF NOT EXISTS public.question_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID REFERENCES public.question_packages(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'essay', 'true_false', 'fill_blank')),
  options JSONB, -- For multiple choice options
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create diversified_questions table
CREATE TABLE IF NOT EXISTS public.diversified_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  diversified_text TEXT NOT NULL,
  diversification_strategy TEXT NOT NULL CHECK (diversification_strategy IN ('context_change', 'difficulty_variation', 'format_change', 'language_style')),
  options JSONB, -- For multiple choice options
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diversified_questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for question_packages table
CREATE POLICY "Users can view own packages" ON public.question_packages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own packages" ON public.question_packages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own packages" ON public.question_packages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own packages" ON public.question_packages
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for questions table
CREATE POLICY "Users can view questions in own packages" ON public.questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.question_packages 
      WHERE id = questions.package_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create questions in own packages" ON public.questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.question_packages 
      WHERE id = questions.package_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions in own packages" ON public.questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.question_packages 
      WHERE id = questions.package_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions in own packages" ON public.questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.question_packages 
      WHERE id = questions.package_id AND user_id = auth.uid()
    )
  );

-- Create RLS policies for diversified_questions table
CREATE POLICY "Users can view diversified questions from own questions" ON public.diversified_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.question_packages p ON q.package_id = p.id
      WHERE q.id = diversified_questions.original_question_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create diversified questions from own questions" ON public.diversified_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.question_packages p ON q.package_id = p.id
      WHERE q.id = diversified_questions.original_question_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete diversified questions from own questions" ON public.diversified_questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.question_packages p ON q.package_id = p.id
      WHERE q.id = diversified_questions.original_question_id AND p.user_id = auth.uid()
    )
  );

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_packages_user_id ON public.question_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_package_id ON public.questions(package_id);
CREATE INDEX IF NOT EXISTS idx_diversified_questions_original_id ON public.diversified_questions(original_question_id);
