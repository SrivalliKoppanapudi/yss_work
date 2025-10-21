-- Create comprehensive courses schema
-- This includes courses, modules, lessons, and related tables

-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    university TEXT,
    specialization TEXT,
    tags TEXT[] DEFAULT '{}',
    price DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(5,2) DEFAULT 0,
    final_price DECIMAL(10,2) DEFAULT 0,
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'invitation')),
    is_paid BOOLEAN DEFAULT false,
    currency TEXT DEFAULT 'USD',
    subscription_type TEXT DEFAULT 'one-time' CHECK (subscription_type IN ('one-time', 'monthly', 'yearly')),
    subscription_price DECIMAL(10,2) DEFAULT 0,
    scheduled_release BOOLEAN DEFAULT false,
    release_date TIMESTAMP WITH TIME ZONE,
    access_restrictions TEXT DEFAULT 'all' CHECK (access_restrictions IN ('all', 'specific-roles', 'specific-users')),
    allowed_roles TEXT[] DEFAULT '{}',
    allowed_users UUID[] DEFAULT '{}',
    notify_on_enrollment BOOLEAN DEFAULT true,
    notify_on_completion BOOLEAN DEFAULT true,
    notify_on_assessment_submission BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false,
    enrollment_count INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    duration TEXT,
    instructor TEXT,
    institution TEXT,
    prerequisites TEXT,
    objectives TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create modules table
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    duration_hours TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'video', 'pdf', 'quiz', 'forum', 'key_elements_article')),
    duration INTEGER DEFAULT 0,
    order_index INTEGER NOT NULL,
    discussion_enabled BOOLEAN DEFAULT false,
    key_elements_content JSONB,
    summary_checklist JSONB,
    reflective_prompt TEXT,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Users can view public courses" ON public.courses
    FOR SELECT USING (visibility = 'public' OR user_id = auth.uid());

CREATE POLICY "Users can create their own courses" ON public.courses
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own courses" ON public.courses
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own courses" ON public.courses
    FOR DELETE USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_courses_user_id ON public.courses(user_id);
CREATE INDEX idx_modules_course_id ON public.modules(course_id);
CREATE INDEX idx_lessons_module_id ON public.lessons(module_id);
