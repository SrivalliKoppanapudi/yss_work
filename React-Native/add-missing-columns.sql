-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;

-- Update existing users to have default values
UPDATE public.profiles 
SET is_active = true, is_suspended = false 
WHERE is_active IS NULL OR is_suspended IS NULL;

-- Verify the changes
SELECT id, name, occupation, is_admin, is_teacher, role_level, is_active, is_suspended 
FROM public.profiles 
LIMIT 5; 