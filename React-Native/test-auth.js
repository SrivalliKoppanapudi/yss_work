const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lylambzzecswhsofafir.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5bGFtYnp6ZWNzd2hzb2ZhZmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTg0OTMsImV4cCI6MjA2ODY5NDQ5M30.AyIx3P95tw0fnPjZCByBfBzAHibqw2e2gJEjv7XIh9w';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuthentication() {
  try {
    console.log('Testing authentication...');
    
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
    } else {
      console.log('Current session:', session);
      if (session) {
        console.log('User ID:', session.user.id);
        console.log('User email:', session.user.email);
      } else {
        console.log('No active session');
      }
    }

    // Test sign in (you'll need to provide real credentials)
    console.log('\nTesting sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com', // Replace with a real email
      password: 'password123'     // Replace with a real password
    });

    if (signInError) {
      console.error('Sign in error:', signInError);
    } else {
      console.log('Sign in successful:', signInData);
      
      // Now test course creation with authenticated user
      if (signInData.user) {
        console.log('\nTesting course creation with authenticated user...');
        const testCourseData = {
          title: 'Test Course with Auth',
          description: 'This is a test course with authenticated user',
          status: 'draft',
          level: 'beginner',
          price: 0,
          discount: 0,
          final_price: 0,
          is_paid: false,
          currency: 'USD',
          tags: ['test'],
          instructor: signInData.user.email || signInData.user.id,
          user_id: signInData.user.id
        };

        const { data: course, error: courseError } = await supabase
          .from('courses')
          .insert([testCourseData])
          .select()
          .single();

        if (courseError) {
          console.error('Error creating course with auth:', courseError);
        } else {
          console.log('Course created successfully with auth:', course);
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testAuthentication(); 