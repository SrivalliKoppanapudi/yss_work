-- Create storage bucket for course cover images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-covers',
  'course-covers',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for course covers bucket
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-covers');

CREATE POLICY "Authenticated users can upload course covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'course-covers' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own course covers" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'course-covers' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own course covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'course-covers' 
    AND auth.role() = 'authenticated'
  );

-- Create function to clean up orphaned images
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

-- Create a trigger to automatically clean up orphaned images when a course is deleted
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

CREATE TRIGGER cleanup_course_cover_trigger
  BEFORE DELETE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_course_cover_on_delete(); 