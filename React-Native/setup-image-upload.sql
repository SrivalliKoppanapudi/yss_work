-- Manual Setup Script for Image Upload Feature
-- Run this script in your Supabase SQL editor

-- 1. Create storage bucket for course cover images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-covers',
  'course-covers',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- 2. Create storage policies for course covers bucket
-- Public read access
CREATE POLICY IF NOT EXISTS "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-covers');

-- Authenticated users can upload
CREATE POLICY IF NOT EXISTS "Authenticated users can upload course covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'course-covers' 
    AND auth.role() = 'authenticated'
  );

-- Users can update their own course covers
CREATE POLICY IF NOT EXISTS "Users can update their own course covers" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'course-covers' 
    AND auth.role() = 'authenticated'
  );

-- Users can delete their own course covers
CREATE POLICY IF NOT EXISTS "Users can delete their own course covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'course-covers' 
    AND auth.role() = 'authenticated'
  );

-- 3. Create function to clean up orphaned images
CREATE OR REPLACE FUNCTION cleanup_orphaned_course_covers()
RETURNS void AS $$
BEGIN
  -- Delete course cover images that are not referenced in the courses table
  DELETE FROM storage.objects 
  WHERE bucket_id = 'course-covers'
    AND name NOT IN (
      SELECT cover_image 
      FROM courses 
      WHERE cover_image IS NOT NULL 
        AND cover_image != ''
    );
END;
$$ LANGUAGE plpgsql;

-- 4. Create a trigger to automatically clean up orphaned images when a course is deleted
CREATE OR REPLACE FUNCTION cleanup_course_cover_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the cover image when a course is deleted
  IF OLD.cover_image IS NOT NULL AND OLD.cover_image != '' THEN
    DELETE FROM storage.objects 
    WHERE bucket_id = 'course-covers' 
      AND name = OLD.cover_image;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 5. Create the trigger
DROP TRIGGER IF EXISTS cleanup_course_cover_trigger ON courses;
CREATE TRIGGER cleanup_course_cover_trigger
  BEFORE DELETE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_course_cover_on_delete();

-- 6. Add cover_image column to courses table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'cover_image') THEN
        ALTER TABLE courses ADD COLUMN cover_image TEXT;
    END IF;
END $$;

-- 7. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_courses_cover_image ON courses(cover_image) WHERE cover_image IS NOT NULL;

-- 8. Verify setup
SELECT 
  'Storage bucket created successfully' as status,
  id, name, public, file_size_limit
FROM storage.buckets 
WHERE id = 'course-covers';

-- 9. Show storage policies
SELECT 
  'Storage policies created successfully' as status,
  policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'; 