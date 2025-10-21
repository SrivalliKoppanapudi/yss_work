-- Update role permissions to make content creation admin-only
-- This script updates the role_permissions table to ensure only admins can create content

-- First, let's check current permissions
SELECT role_name, permissions FROM role_permissions;

-- Update admin permissions to include all creation capabilities
UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{courses,create}',
  'true'
)
WHERE role_name = 'admin';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{workshops,create}',
  'true'
)
WHERE role_name = 'admin';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{webinars,create}',
  'true'
)
WHERE role_name = 'admin';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{knowledge_base,create}',
  'true'
)
WHERE role_name = 'admin';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{social_media,create}',
  'true'
)
WHERE role_name = 'admin';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{events,create}',
  'true'
)
WHERE role_name = 'admin';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{books,create}',
  'true'
)
WHERE role_name = 'admin';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{certificates,create}',
  'true'
)
WHERE role_name = 'admin';

-- Update teacher permissions to REMOVE creation capabilities (make them false)
UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{courses,create}',
  'false'
)
WHERE role_name = 'teacher';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{workshops,create}',
  'false'
)
WHERE role_name = 'teacher';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{webinars,create}',
  'false'
)
WHERE role_name = 'teacher';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{knowledge_base,create}',
  'false'
)
WHERE role_name = 'teacher';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{social_media,create}',
  'false'
)
WHERE role_name = 'teacher';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{events,create}',
  'false'
)
WHERE role_name = 'teacher';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{books,create}',
  'false'
)
WHERE role_name = 'teacher';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{certificates,create}',
  'false'
)
WHERE role_name = 'teacher';

-- Ensure teachers can still VIEW content
UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{courses,view}',
  'true'
)
WHERE role_name = 'teacher';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{workshops,view}',
  'true'
)
WHERE role_name = 'teacher';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{webinars,view}',
  'true'
)
WHERE role_name = 'teacher';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{knowledge_base,view}',
  'true'
)
WHERE role_name = 'teacher';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{social_media,view}',
  'true'
)
WHERE role_name = 'teacher';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{events,view}',
  'true'
)
WHERE role_name = 'teacher';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{books,view}',
  'true'
)
WHERE role_name = 'teacher';

UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions,
  '{certificates,view}',
  'true'
)
WHERE role_name = 'teacher';

-- Verify the changes
SELECT 
  role_name,
  permissions->'courses'->>'create' as can_create_courses,
  permissions->'workshops'->>'create' as can_create_workshops,
  permissions->'webinars'->>'create' as can_create_webinars,
  permissions->'knowledge_base'->>'create' as can_create_knowledge_base,
  permissions->'social_media'->>'create' as can_create_social_media,
  permissions->'events'->>'create' as can_create_events,
  permissions->'books'->>'create' as can_create_books,
  permissions->'certificates'->>'create' as can_create_certificates
FROM role_permissions
ORDER BY role_name;

-- Show complete permission structure for verification
SELECT role_name, permissions FROM role_permissions ORDER BY role_name; 