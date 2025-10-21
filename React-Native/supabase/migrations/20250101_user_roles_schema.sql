-- Create role-based authentication system for existing profiles table
-- This migration adds role-based access control using boolean algebra for admin and teacher roles

-- Add role columns to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_teacher BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS role_level INTEGER DEFAULT 1 CHECK (role_level >= 1 AND role_level <= 10),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;

-- Add constraints for role validation
ALTER TABLE public.profiles 
ADD CONSTRAINT IF NOT EXISTS valid_role_combination CHECK (
    -- Admin can have any combination
    (is_admin = true) OR
    -- Teacher cannot be admin
    (is_teacher = true AND is_admin = false) OR
    -- Default role (neither admin nor teacher)
    (is_admin = false AND is_teacher = false)
),
ADD CONSTRAINT IF NOT EXISTS valid_role_level CHECK (
    -- Admin has highest level
    (is_admin = true AND role_level >= 8) OR
    -- Teacher has medium level
    (is_teacher = true AND role_level >= 5 AND role_level <= 7) OR
    -- Default role has lowest level
    (is_admin = false AND is_teacher = false AND role_level >= 1 AND role_level <= 4)
);

-- Create role permissions table for detailed permission management
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_name TEXT NOT NULL UNIQUE,
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default role permissions for admin and teacher
INSERT INTO public.role_permissions (role_name, permissions) VALUES
('admin', '{
    "dashboard": {"view": true, "edit": true, "delete": true},
    "courses": {"view": true, "create": true, "edit": true, "delete": true, "publish": true, "archive": true},
    "users": {"view": true, "create": true, "edit": true, "delete": true, "suspend": true},
    "analytics": {"view": true, "export": true},
    "content": {"view": true, "create": true, "edit": true, "delete": true, "approve": true},
    "payments": {"view": true, "manage": true, "refund": true},
    "reports": {"view": true, "generate": true},
    "settings": {"view": true, "edit": true},
    "jobs": {"view": true, "create": true, "edit": true, "delete": true, "manage": true, "publish": true, "archive": true},
    "job_applications": {"view": true, "create": false, "edit": true, "delete": true, "approve": true, "reject": true},
    "interviews": {"view": true, "create": true, "edit": true, "delete": true, "schedule": true, "manage": true},
    "job_analytics": {"view": true, "export": true, "generate_reports": true},
    "panel_members": {"view": true, "create": true, "edit": true, "delete": true, "manage": true},
    "webinars": {"view": true, "create": true, "edit": true, "delete": true, "manage": true},
    "workshops": {"view": true, "create": true, "edit": true, "delete": true, "manage": true},
    "knowledge_base": {"view": true, "create": true, "edit": true, "delete": true, "approve": true},
    "certificates": {"view": true, "create": true, "edit": true, "delete": true, "issue": true},
    "books": {"view": true, "create": true, "edit": true, "delete": true, "manage": true},
    "social_media": {"view": true, "create": true, "edit": true, "delete": true, "moderate": true},
    "events": {"view": true, "create": true, "edit": true, "delete": true, "manage": true}
}'),
('teacher', '{
    "dashboard": {"view": true, "edit": false, "delete": false},
    "courses": {"view": true, "create": true, "edit": true, "delete": false, "publish": true, "archive": false},
    "users": {"view": false, "create": false, "edit": false, "delete": false, "suspend": false},
    "analytics": {"view": true, "export": false},
    "content": {"view": true, "create": true, "edit": true, "delete": false, "approve": false},
    "payments": {"view": false, "manage": false, "refund": false},
    "reports": {"view": false, "generate": false},
    "settings": {"view": true, "edit": false},
    "jobs": {"view": true, "create": false, "edit": false, "delete": false, "manage": false, "publish": false, "archive": false},
    "job_applications": {"view": true, "create": true, "edit": false, "delete": false, "approve": false, "reject": false},
    "interviews": {"view": true, "create": false, "edit": false, "delete": false, "schedule": false, "manage": false},
    "job_analytics": {"view": false, "export": false, "generate_reports": false},
    "panel_members": {"view": false, "create": false, "edit": false, "delete": false, "manage": false},
    "webinars": {"view": true, "create": true, "edit": true, "delete": false, "manage": false},
    "workshops": {"view": true, "create": true, "edit": true, "delete": false, "manage": false},
    "knowledge_base": {"view": true, "create": true, "edit": true, "delete": false, "approve": false},
    "certificates": {"view": true, "create": false, "edit": false, "delete": false, "issue": false},
    "books": {"view": true, "create": false, "edit": false, "delete": false, "manage": false},
    "social_media": {"view": true, "create": true, "edit": true, "delete": false, "moderate": false},
    "events": {"view": true, "create": true, "edit": true, "delete": false, "manage": false}
}');

-- Enable Row Level Security
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for role_permissions (read-only for authenticated users)
CREATE POLICY "Authenticated users can view role permissions" ON public.role_permissions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policies for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_is_teacher ON public.profiles(is_teacher);
CREATE INDEX IF NOT EXISTS idx_profiles_role_level ON public.profiles(role_level);

-- Create function to get user role information
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS JSONB AS $$
DECLARE
    user_role JSONB;
    user_profile RECORD;
BEGIN
    -- Get user profile
    SELECT * INTO user_profile FROM public.profiles WHERE id = user_uuid;
    
    IF user_profile IS NULL THEN
        RETURN '{}'::jsonb;
    END IF;
    
    -- Build role object
    SELECT jsonb_build_object(
        'is_admin', COALESCE(user_profile.is_admin, false),
        'is_teacher', COALESCE(user_profile.is_teacher, false),
        'role_level', COALESCE(user_profile.role_level, 1),
        'is_active', COALESCE(user_profile.is_active, true),
        'is_suspended', COALESCE(user_profile.is_suspended, false),
        'permissions', CASE
            WHEN user_profile.is_admin = true THEN (SELECT permissions FROM public.role_permissions WHERE role_name = 'admin')
            WHEN user_profile.is_teacher = true THEN (SELECT permissions FROM public.role_permissions WHERE role_name = 'teacher')
            ELSE (SELECT permissions FROM public.role_permissions WHERE role_name = 'teacher')
        END
    ) INTO user_role;
    
    RETURN COALESCE(user_role, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(
    permission_path TEXT,
    user_uuid UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
    path_parts TEXT[];
    current_level JSONB;
    result BOOLEAN;
BEGIN
    -- Get user permissions
    SELECT get_user_role(user_uuid)->'permissions' INTO user_permissions;
    
    IF user_permissions IS NULL THEN
        RETURN false;
    END IF;
    
    -- Split permission path (e.g., 'jobs.create' -> ['jobs', 'create'])
    path_parts := string_to_array(permission_path, '.');
    
    -- Navigate through the permission structure
    current_level := user_permissions;
    FOR i IN 1..array_length(path_parts, 1) LOOP
        current_level := current_level->path_parts[i];
        IF current_level IS NULL THEN
            RETURN false;
        END IF;
    END LOOP;
    
    -- Check if the final value is true
    result := (current_level = 'true'::jsonb);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to migrate existing users to role system based on occupation
CREATE OR REPLACE FUNCTION public.migrate_user_to_role_system()
RETURNS void AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Update users based on their occupation
    FOR user_record IN SELECT * FROM public.profiles WHERE occupation IS NOT NULL LOOP
        -- Set default role level
        UPDATE public.profiles 
        SET role_level = 1,
            is_active = true,
            is_suspended = false
        WHERE id = user_record.id;
        
        -- Map occupation to role
        IF LOWER(user_record.occupation) LIKE '%admin%' OR LOWER(user_record.occupation) = 'admin' THEN
            UPDATE public.profiles 
            SET is_admin = true,
                is_teacher = false,
                role_level = 9
            WHERE id = user_record.id;
        ELSIF LOWER(user_record.occupation) LIKE '%teacher%' OR 
              LOWER(user_record.occupation) LIKE '%instructor%' OR 
              LOWER(user_record.occupation) = 'teacher' THEN
            UPDATE public.profiles 
            SET is_admin = false,
                is_teacher = true,
                role_level = 6
            WHERE id = user_record.id;
        ELSE
            -- Default to teacher role for other occupations
            UPDATE public.profiles 
            SET is_admin = false,
                is_teacher = true,
                role_level = 6
            WHERE id = user_record.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute migration for existing users
SELECT public.migrate_user_to_role_system(); 