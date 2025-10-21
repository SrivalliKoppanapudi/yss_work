const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lylambzzecswhsofafir.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5bGFtYnp6ZWNzd2hzb2ZhZmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTg0OTMsImV4cCI6MjA2ODY5NDQ5M30.AyIx3P95tw0fnPjZCByBfBzAHibqw2e2gJEjv7XIh9w';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyMigration() {
  try {
    console.log('🚀 Starting role-based authentication migration...');

    // Step 1: Add role columns to profiles table
    console.log('📝 Adding role columns to profiles table...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.profiles 
        ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS is_teacher BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS role_level INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
      `
    });

    if (alterError) {
      console.log('⚠️  Role columns might already exist, continuing...');
    } else {
      console.log('✅ Role columns added successfully');
    }

    // Step 2: Create role_permissions table
    console.log('📋 Creating role_permissions table...');
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.role_permissions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          role_name TEXT NOT NULL UNIQUE,
          permissions JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createTableError) {
      console.log('⚠️  Role permissions table might already exist, continuing...');
    } else {
      console.log('✅ Role permissions table created successfully');
    }

    // Step 3: Insert default role permissions
    console.log('🔐 Inserting default role permissions...');
    
    // Admin permissions
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
          jobs: { view: true, create: true, edit: true, delete: true, manage: true, publish: true, archive: true },
          job_applications: { view: true, create: false, edit: true, delete: true, approve: true, reject: true },
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
      console.log('✅ Admin permissions inserted successfully');
    }

    // Teacher permissions
    const { error: teacherError } = await supabase
      .from('role_permissions')
      .upsert({
        role_name: 'teacher',
        permissions: {
          dashboard: { view: true, edit: false, delete: false },
          courses: { view: true, create: true, edit: true, delete: false, publish: true, archive: false },
          users: { view: false, create: false, edit: false, delete: false, suspend: false },
          analytics: { view: true, export: false },
          content: { view: true, create: true, edit: true, delete: false, approve: false },
          payments: { view: false, manage: false, refund: false },
          reports: { view: false, generate: false },
          settings: { view: true, edit: false },
          jobs: { view: true, create: false, edit: false, delete: false, manage: false, publish: false, archive: false },
          job_applications: { view: true, create: true, edit: false, delete: false, approve: false, reject: false },
          interviews: { view: true, create: false, edit: false, delete: false, schedule: false, manage: false },
          job_analytics: { view: false, export: false, generate_reports: false },
          panel_members: { view: false, create: false, edit: false, delete: false, manage: false },
          webinars: { view: true, create: true, edit: true, delete: false, manage: false },
          workshops: { view: true, create: true, edit: true, delete: false, manage: false },
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
      console.log('✅ Teacher permissions inserted successfully');
    }

    // Step 4: Create database functions
    console.log('🔧 Creating database functions...');
    
    // Function to get user role
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (functionError) {
      console.error('❌ Error creating get_user_role function:', functionError);
    } else {
      console.log('✅ get_user_role function created successfully');
    }

    // Function to check permissions
    const { error: permissionFunctionError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (permissionFunctionError) {
      console.error('❌ Error creating has_permission function:', permissionFunctionError);
    } else {
      console.log('✅ has_permission function created successfully');
    }

    // Step 5: Migrate existing users
    console.log('👥 Migrating existing users...');
    
    // Get all users with occupation
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, occupation')
      .not('occupation', 'is', null);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log(`📊 Found ${users.length} users to migrate`);
      
      for (const user of users) {
        let roleUpdates = {
          role_level: 1,
          is_active: true,
          is_suspended: false
        };

        const occupation = user.occupation?.toLowerCase() || '';
        
        if (occupation.includes('admin') || occupation === 'admin') {
          roleUpdates = {
            ...roleUpdates,
            is_admin: true,
            is_teacher: false,
            role_level: 9
          };
        } else if (occupation.includes('teacher') || 
                   occupation.includes('instructor') || 
                   occupation === 'teacher') {
          roleUpdates = {
            ...roleUpdates,
            is_admin: false,
            is_teacher: true,
            role_level: 6
          };
        } else {
          // Default to teacher role for other occupations
          roleUpdates = {
            ...roleUpdates,
            is_admin: false,
            is_teacher: true,
            role_level: 6
          };
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(roleUpdates)
          .eq('id', user.id);

        if (updateError) {
          console.error(`❌ Error updating user ${user.id}:`, updateError);
        } else {
          console.log(`✅ Migrated user ${user.id} (${user.occupation}) to role level ${roleUpdates.role_level}`);
        }
      }
    }

    console.log('🎉 Role-based authentication migration completed successfully!');
    console.log('📋 Summary:');
    console.log('  - Role columns added to profiles table');
    console.log('  - Role permissions table created');
    console.log('  - Default permissions configured');
    console.log('  - Database functions created');
    console.log('  - Existing users migrated');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
applyMigration(); 