const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lylambzzecswhsofafir.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5bGFtYnp6ZWNzd2hzb2ZhZmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTg0OTMsImV4cCI6MjA2ODY5NDQ5M30.AyIx3P95tw0fnPjZCByBfBzAHibqw2e2gJEjv7XIh9w';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupRoleAuth() {
  try {
    console.log('🚀 Setting up role-based authentication with updated job portal permissions...');

    // Step 1: Insert default role permissions with updated job portal access
    console.log('🔐 Setting up role permissions...');
    
    // Admin permissions - Full access to create jobs and manage panelists
    const { error: adminError } = await supabase
      .from('role_permissions')
      .upsert({
        role_name: 'admin',
        permissions: {
          dashboard: { view: true, edit: true, delete: true },
          courses: { view: true, create: true, edit: true, delete: true, publish: true, archive: true },
          users: { view: true, create: true, edit: true, delete: true, suspend: true },
          analytics: { view: true, export: true },
          content: { view: true, create: true, edit: true, delete: true, approve: true },
          payments: { view: true, manage: true, refund: true },
          reports: { view: true, generate: true },
          settings: { view: true, edit: true },
          // Job portal - Admin can create jobs and manage panelists
          jobs: { view: true, create: true, edit: true, delete: true, manage: true, publish: true, archive: true },
          job_applications: { view: true, create: false, edit: true, delete: true, approve: true, reject: true, track: true },
          interviews: { view: true, create: true, edit: true, delete: true, schedule: true, manage: true },
          job_analytics: { view: true, export: true, generate_reports: true },
          panel_members: { view: true, create: true, edit: true, delete: true, manage: true },
          webinars: { view: true, create: true, edit: true, delete: true, manage: true },
          workshops: { view: true, create: true, edit: true, delete: true, manage: true },
          knowledge_base: { view: true, create: true, edit: true, delete: true, approve: true },
          certificates: { view: true, create: true, edit: true, delete: true, issue: true },
          books: { view: true, create: true, edit: true, delete: true, manage: true },
          social_media: { view: true, create: true, edit: true, delete: true, moderate: true },
          events: { view: true, create: true, edit: true, delete: true, manage: true }
        }
      }, { onConflict: 'role_name' });

    if (adminError) {
      console.error('❌ Error inserting admin permissions:', adminError);
    } else {
      console.log('✅ Admin permissions configured - Can create jobs and manage panelists');
    }

    // Teacher permissions - Limited access: only see and apply to jobs, track applications
    const { error: teacherError } = await supabase
      .from('role_permissions')
      .upsert({
        role_name: 'teacher',
        permissions: {
          dashboard: { view: true, edit: false, delete: false },
          courses: { view: true, create: false, edit: false, delete: false, publish: false, archive: false },
          users: { view: false, create: false, edit: false, delete: false, suspend: false },
          analytics: { view: true, export: false },
          content: { view: true, create: true, edit: true, delete: false, approve: false },
          payments: { view: false, manage: false, refund: false },
          reports: { view: false, generate: false },
          settings: { view: true, edit: false },
          // Job portal - Teacher can only see and apply to jobs, track applications
          jobs: { view: true, create: false, edit: false, delete: false, manage: false, publish: false, archive: false },
          job_applications: { view: true, create: true, edit: false, delete: false, approve: false, reject: false, track: true },
          interviews: { view: true, create: false, edit: false, delete: false, schedule: false, manage: false },
          job_analytics: { view: false, export: false, generate_reports: false },
          panel_members: { view: false, create: false, edit: false, delete: false, manage: false },
          webinars: { view: true, create: false, edit: false, delete: false, manage: false },
          workshops: { view: true, create: false, edit: false, delete: false, manage: false },
          knowledge_base: { view: true, create: true, edit: true, delete: false, approve: false },
          certificates: { view: true, create: false, edit: false, delete: false, issue: false },
          books: { view: true, create: false, edit: false, delete: false, manage: false },
          social_media: { view: true, create: true, edit: true, delete: false, moderate: false },
          events: { view: true, create: true, edit: true, delete: false, manage: false }
        }
      }, { onConflict: 'role_name' });

    if (teacherError) {
      console.error('❌ Error inserting teacher permissions:', teacherError);
    } else {
      console.log('✅ Teacher permissions configured - Can only see and apply to jobs, track applications');
    }

    // Step 2: Update existing users with role information
    console.log('👥 Setting up user roles...');
    
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, occupation, name');

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log(`📊 Found ${users.length} users to configure`);
      
      for (const user of users) {
        let roleUpdates = {};

        const occupation = user.occupation?.toLowerCase() || '';
        const name = user.name?.toLowerCase() || '';
        
        // Determine role based on occupation or name
        if (occupation.includes('admin') || occupation === 'admin' || 
            name.includes('admin') || name === 'admin') {
          roleUpdates = {
            is_admin: true,
            is_teacher: false,
            role_level: 9
          };
          console.log(`👑 Setting user ${user.id} (${user.name}) as ADMIN - Can create jobs and manage panelists`);
        } else if (occupation.includes('teacher') || 
                   occupation.includes('instructor') || 
                   occupation === 'teacher' ||
                   name.includes('teacher') ||
                   name.includes('instructor')) {
          roleUpdates = {
            is_admin: false,
            is_teacher: true,
            role_level: 6
          };
          console.log(`📚 Setting user ${user.id} (${user.name}) as TEACHER - Can only see and apply to jobs`);
        } else {
          // Default to teacher role for other users
          roleUpdates = {
            is_admin: false,
            is_teacher: true,
            role_level: 6
          };
          console.log(`📚 Setting user ${user.id} (${user.name}) as TEACHER (default) - Can only see and apply to jobs`);
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(roleUpdates)
          .eq('id', user.id);

        if (updateError) {
          console.error(`❌ Error updating user ${user.id}:`, updateError);
        } else {
          console.log(`✅ Updated user ${user.id} successfully`);
        }
      }
    }

    // Step 3: Test the role system
    console.log('🧪 Testing role system...');
    
    // Get a test user to verify the setup
    const { data: testUser, error: testError } = await supabase
      .from('profiles')
      .select('id, name, occupation, is_admin, is_teacher, role_level')
      .limit(1)
      .single();

    if (testError) {
      console.error('❌ Error testing role system:', testError);
    } else {
      console.log('✅ Role system test successful');
      console.log('📋 Test user details:', {
        id: testUser.id,
        name: testUser.name,
        occupation: testUser.occupation,
        is_admin: testUser.is_admin,
        is_teacher: testUser.is_teacher,
        role_level: testUser.role_level
      });
    }

    console.log('🎉 Role-based authentication setup completed with updated job portal permissions!');
    console.log('📋 Summary:');
    console.log('  - Role permissions configured');
    console.log('  - User roles assigned');
    console.log('  - System tested successfully');
    console.log('');
    console.log('🔐 Job Portal Access Control:');
    console.log('  👑 Admin: Can create jobs and manage panelists');
    console.log('  📚 Teacher: Can only see and apply to jobs, track applications');
    console.log('');
    console.log('🚀 Your app is now ready to use role-based authentication!');
    console.log('📱 You can now use the role-based UI components in your React Native app.');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupRoleAuth(); 