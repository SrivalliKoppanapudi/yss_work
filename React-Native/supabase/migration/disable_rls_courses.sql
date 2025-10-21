-- Disable Row Level Security on courses table
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on related tables
ALTER TABLE public.modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons DISABLE ROW LEVEL SECURITY;

-- Drop existing policies since RLS is disabled
DROP POLICY IF EXISTS "Users can view public courses" ON public.courses;
DROP POLICY IF EXISTS "Users can create their own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can update their own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can delete their own courses" ON public.courses; 