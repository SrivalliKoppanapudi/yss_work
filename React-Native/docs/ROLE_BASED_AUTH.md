# Role-Based Authentication System

This document explains the role-based authentication system implemented using boolean algebra for admin and teacher roles.

## Overview

The role-based authentication system uses boolean algebra (true/false logic) to control access to different features and content based on user roles. The system supports three main roles:

- **Admin**: Full system access with all permissions
- **Teacher**: Course creation and management capabilities
- **Student**: Basic access to view and enroll in courses

## Database Schema

### User Profiles Table

The system uses a `user_profiles` table with boolean flags for role-based access control:

```sql
CREATE TABLE user_profiles (
    -- Basic user info
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    
    -- Role-based access control using boolean algebra
    is_admin BOOLEAN DEFAULT false,
    is_teacher BOOLEAN DEFAULT false,
    is_student BOOLEAN DEFAULT true,
    is_moderator BOOLEAN DEFAULT false,
    
    -- Additional role flags for granular control
    can_create_courses BOOLEAN DEFAULT false,
    can_edit_courses BOOLEAN DEFAULT false,
    can_delete_courses BOOLEAN DEFAULT false,
    can_manage_users BOOLEAN DEFAULT false,
    can_view_analytics BOOLEAN DEFAULT false,
    can_manage_content BOOLEAN DEFAULT false,
    can_approve_content BOOLEAN DEFAULT false,
    can_manage_payments BOOLEAN DEFAULT false,
    can_view_reports BOOLEAN DEFAULT false,
    
    -- Role hierarchy (higher number = more permissions)
    role_level INTEGER DEFAULT 1,
    
    -- Status flags
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    is_suspended BOOLEAN DEFAULT false
);
```

### Role Permissions Table

Detailed permissions are stored in a `role_permissions` table:

```sql
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY,
    role_name TEXT UNIQUE,
    permissions JSONB
);
```

## Boolean Algebra Implementation

The system uses boolean algebra operations for permission checking:

### Basic Operations

```typescript
// AND operation
AND(a: boolean, b: boolean): boolean
// OR operation  
OR(a: boolean, b: boolean): boolean
// NOT operation
NOT(a: boolean): boolean
// XOR operation
XOR(a: boolean, b: boolean): boolean
```

### Role-Based Operations

```typescript
// Check if user has any of the required roles
hasAnyRole(roles: RoleType[]): boolean

// Check if user has all required roles
hasAllRoles(roles: RoleType[]): boolean

// Check if user has exact role
hasExactRole(role: RoleType): boolean

// Check if user has higher role level
hasHigherRole(minRole: RoleType): boolean
```

### Permission-Based Operations

```typescript
// Check if user has specific permission
hasPermission(permissionPath: string): boolean

// Check if user has any of the required permissions
hasAnyPermission(permissions: string[]): boolean

// Check if user has all required permissions
hasAllPermissions(permissions: string[]): boolean
```

## Usage Examples

### 1. Basic Role Checking

```typescript
import { useAuth } from '../Context/auth';

const MyComponent = () => {
  const { permissionCheck } = useAuth();

  if (permissionCheck?.isAdmin()) {
    return <AdminPanel />;
  }

  if (permissionCheck?.isTeacher()) {
    return <TeacherPanel />;
  }

  return <StudentPanel />;
};
```

### 2. Permission-Based UI Components

```typescript
import { ShowForAdmin, ShowForTeacher, ShowForPermission } from '../component/RoleBasedUI';

const Dashboard = () => {
  return (
    <div>
      {/* Only admins can see this */}
      <ShowForAdmin>
        <AdminDashboard />
      </ShowForAdmin>

      {/* Teachers and admins can see this */}
      <ShowForTeacher>
        <TeacherDashboard />
      </ShowForTeacher>

      {/* Anyone with course creation permission */}
      <ShowForPermission permission="courses.create">
        <CreateCourseButton />
      </ShowForPermission>
    </div>
  );
};
```

### 3. Complex Boolean Expressions

```typescript
import { useRoleBasedUI } from '../component/RoleBasedUI';

const CourseManagement = () => {
  const { booleanAlgebra } = useRoleBasedUI();

  // Check if user can manage this specific course
  const canManage = booleanAlgebra?.canManageCourse(courseUserId, currentUserId);

  // Check if user can view analytics
  const canViewAnalytics = booleanAlgebra?.canViewAnalytics();

  return (
    <div>
      {canManage && <EditCourseButton />}
      {canViewAnalytics && <AnalyticsButton />}
    </div>
  );
};
```

### 4. Role-Based Navigation

```typescript
import { useRoleBasedUI } from '../component/RoleBasedUI';

const Navigation = () => {
  const { isAdmin, isTeacher, hasPermission } = useRoleBasedUI();

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', show: true },
    { path: '/courses', label: 'Courses', show: true },
    { path: '/users', label: 'Users', show: isAdmin() },
    { path: '/analytics', label: 'Analytics', show: hasPermission('analytics.view') },
    { path: '/settings', label: 'Settings', show: isAdmin() || isTeacher() },
  ];

  return (
    <nav>
      {navigationItems
        .filter(item => item.show)
        .map(item => (
          <Link key={item.path} to={item.path}>
            {item.label}
          </Link>
        ))}
    </nav>
  );
};
```

## Permission Structure

The system uses a hierarchical permission structure:

```
dashboard
├── view: true/false
├── edit: true/false
└── delete: true/false

courses
├── view: true/false
├── create: true/false
├── edit: true/false
├── delete: true/false
├── publish: true/false
└── archive: true/false

users
├── view: true/false
├── create: true/false
├── edit: true/false
├── delete: true/false
└── suspend: true/false

analytics
├── view: true/false
└── export: true/false

content
├── view: true/false
├── create: true/false
├── edit: true/false
├── delete: true/false
└── approve: true/false

payments
├── view: true/false
├── manage: true/false
└── refund: true/false

reports
├── view: true/false
└── generate: true/false

settings
├── view: true/false
└── edit: true/false
```

## Default Role Permissions

### Admin Role
- All permissions set to `true`
- Role level: 8-10
- Can access all features and manage all users

### Teacher Role
- Course management permissions: `true`
- Analytics view: `true`
- User management: `false`
- Role level: 5-7
- Can create, edit, and publish courses

### Student Role
- Course view: `true`
- All other permissions: `false`
- Role level: 1-4
- Can only view and enroll in courses

## Boolean Algebra Patterns

### 1. Role Hierarchy Pattern
```typescript
// Admin can do everything
if (isAdmin) return true;

// Teacher can do teacher things
if (isTeacher && hasPermission) return true;

// Student has limited access
if (isStudent && basicPermission) return true;

return false;
```

### 2. Permission Combination Pattern
```typescript
// User needs both role AND permission
const canAccess = AND(hasRole('teacher'), hasPermission('courses.create'));
```

### 3. Complex Access Control Pattern
```typescript
// Admin can manage all courses, teacher can manage their own
const canManageCourse = OR(
  isAdmin,
  AND(isTeacher, OR(!courseOwner, courseOwner === currentUser))
);
```

## Security Considerations

1. **Server-Side Validation**: Always validate permissions on the server side
2. **Row Level Security**: Use database policies to enforce access control
3. **Token-Based**: Use JWT tokens with role information
4. **Audit Logging**: Log all permission checks and access attempts
5. **Rate Limiting**: Implement rate limiting for sensitive operations

## Testing

### Unit Tests for Boolean Algebra

```typescript
import { BooleanAlgebra } from '../utils/booleanAlgebra';

describe('Boolean Algebra', () => {
  test('AND operation', () => {
    expect(BooleanAlgebra.AND(true, true)).toBe(true);
    expect(BooleanAlgebra.AND(true, false)).toBe(false);
    expect(BooleanAlgebra.AND(false, false)).toBe(false);
  });

  test('Role checking', () => {
    const userRoles = { admin: true, teacher: false, student: false };
    expect(BooleanAlgebra.hasExactRole(userRoles, 'admin')).toBe(true);
    expect(BooleanAlgebra.hasExactRole(userRoles, 'teacher')).toBe(false);
  });
});
```

### Integration Tests

```typescript
import { roleAuthService } from '../lib/roleAuthService';

describe('Role Auth Service', () => {
  test('Admin can access all features', async () => {
    const adminProfile = await roleAuthService.loadUserProfile(adminUserId);
    expect(adminProfile.is_admin).toBe(true);
    expect(roleAuthService.hasPermission('users.manage')).toBe(true);
  });
});
```

## Migration Guide

To implement this system in an existing application:

1. **Run the migration**: Execute the SQL migration to create the user_profiles table
2. **Update auth context**: Replace existing auth context with the new role-based one
3. **Add UI components**: Import and use the role-based UI components
4. **Update existing components**: Wrap existing components with role-based conditionals
5. **Test thoroughly**: Ensure all role-based access controls work correctly

## Troubleshooting

### Common Issues

1. **Permission not working**: Check if the permission path is correct (e.g., 'courses.create')
2. **Role not recognized**: Ensure the user profile has the correct boolean flags set
3. **UI not updating**: Make sure the auth context is properly updated when roles change
4. **Database errors**: Verify that the migration has been run successfully

### Debug Tools

```typescript
// Debug user permissions
const { userProfile, userRole, permissionCheck } = useAuth();
console.log('User Profile:', userProfile);
console.log('User Role:', userRole);
console.log('Has Permission:', permissionCheck?.hasPermission('courses.create'));
```

This role-based authentication system provides a robust, scalable solution for controlling access to different features based on user roles using boolean algebra principles. 