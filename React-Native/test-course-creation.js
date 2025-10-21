const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lylambzzecswhsofafir.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5bGFtYnp6ZWNzd2hzb2ZhZmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTg0OTMsImV4cCI6MjA2ODY5NDQ5M30.AyIx3P95tw0fnPjZCByBfBzAHibqw2e2gJEjv7XIh9w';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCourseCreation() {
  try {
    console.log('Testing course creation...');
    
    // First, let's check if we can read from the courses table
    console.log('Testing read access to courses table...');
    const { data: existingCourses, error: readError } = await supabase
      .from('courses')
      .select('*')
      .limit(5);

    if (readError) {
      console.error('Error reading courses:', readError);
    } else {
      console.log('Successfully read courses:', existingCourses?.length || 0, 'courses found');
    }

    // Test the table structure
    console.log('Testing table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('courses')
      .select('*')
      .limit(0);

    if (tableError) {
      console.error('Error checking table structure:', tableError);
    } else {
      console.log('Table structure is accessible');
    }

    // Test with a valid UUID format (but fake user)
    const testCourseData = {
      title: 'Test Course',
      description: 'This is a test course',
      status: 'draft',
      level: 'beginner',
      price: 0,
      discount: 0,
      final_price: 0,
      is_paid: false,
      currency: 'USD',
      tags: ['test'],
      instructor: 'test@example.com',
      user_id: '00000000-0000-0000-0000-000000000000' // Valid UUID format
    };

    console.log('Attempting to create course with valid UUID format...');
    
    const { data: course, error } = await supabase
      .from('courses')
      .insert([testCourseData])
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      console.log('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('Course created successfully:', course);
    }

    // Test without user_id (should work since it has default auth.uid())
    console.log('\nTesting course creation without user_id...');
    const testCourseDataNoUser = {
      title: 'Test Course No User',
      description: 'This is a test course without user_id',
      status: 'draft',
      level: 'beginner',
      price: 0,
      discount: 0,
      final_price: 0,
      is_paid: false,
      currency: 'USD',
      tags: ['test'],
      instructor: 'test@example.com'
    };

    const { data: courseNoUser, error: errorNoUser } = await supabase
      .from('courses')
      .insert([testCourseDataNoUser])
      .select()
      .single();

    if (errorNoUser) {
      console.error('Error creating course without user_id:', errorNoUser);
      console.log('Error details:', {
        message: errorNoUser.message,
        details: errorNoUser.details,
        hint: errorNoUser.hint,
        code: errorNoUser.code
      });
    } else {
      console.log('Course created successfully without user_id:', courseNoUser);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testCourseCreation(); 