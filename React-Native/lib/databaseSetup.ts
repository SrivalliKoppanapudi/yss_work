import { supabase } from './Superbase';

export const setupDatabase = async () => {
  try {
    console.log('Setting up database tables...');

    // Create courses table
    const { error: coursesError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (coursesError) {
      console.log('Courses table might already exist:', coursesError.message);
    }

    // Create modules table
    const { error: modulesError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (modulesError) {
      console.log('Modules table might already exist:', modulesError.message);
    }

    // Create lessons table
    const { error: lessonsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (lessonsError) {
      console.log('Lessons table might already exist:', lessonsError.message);
    }

    // Create course_enrollments table
    const { error: enrollmentsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.course_enrollments (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          completion_date TIMESTAMP WITH TIME ZONE,
          progress DECIMAL(5,2) DEFAULT 0,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
          UNIQUE(course_id, user_id)
        );
      `
    });

    if (enrollmentsError) {
      console.log('Course enrollments table might already exist:', enrollmentsError.message);
    }

    // Create lesson_progress table
    const { error: progressError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.lesson_progress (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          completed BOOLEAN DEFAULT false,
          completed_at TIMESTAMP WITH TIME ZONE,
          time_spent INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(lesson_id, user_id)
        );
      `
    });

    if (progressError) {
      console.log('Lesson progress table might already exist:', progressError.message);
    }

    // Enable RLS on all tables
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
      `
    });

    // Create basic policies
    await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Users can view public courses" ON public.courses;
        CREATE POLICY "Users can view public courses" ON public.courses
          FOR SELECT USING (visibility = 'public' OR user_id = auth.uid());

        DROP POLICY IF EXISTS "Users can create their own courses" ON public.courses;
        CREATE POLICY "Users can create their own courses" ON public.courses
          FOR INSERT WITH CHECK (user_id = auth.uid());

        DROP POLICY IF EXISTS "Users can update their own courses" ON public.courses;
        CREATE POLICY "Users can update their own courses" ON public.courses
          FOR UPDATE USING (user_id = auth.uid());

        DROP POLICY IF EXISTS "Users can delete their own courses" ON public.courses;
        CREATE POLICY "Users can delete their own courses" ON public.courses
          FOR DELETE USING (user_id = auth.uid());
      `
    });

    console.log('Database setup completed successfully!');
    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    return false;
  }
};

// Function to check if tables exist
export const checkTablesExist = async () => {
  try {
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id')
      .limit(1);

    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id')
      .limit(1);

    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id')
      .limit(1);

    return {
      courses: !coursesError,
      modules: !modulesError,
      lessons: !lessonsError
    };
  } catch (error) {
    console.error('Error checking tables:', error);
    return {
      courses: false,
      modules: false,
      lessons: false
    };
  }
}; 