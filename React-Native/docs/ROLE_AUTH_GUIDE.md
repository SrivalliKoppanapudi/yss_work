# Role-Based Authentication System Guide

## 🎯 Overview

This guide explains how to use the role-based authentication system implemented with boolean algebra for admin and teacher roles in your React Native application.

## 📋 System Features

### ✅ What's Implemented

1. **Two-Role System**: Admin and Teacher roles
2. **Boolean Algebra**: True/false logic for all permission checks
3. **Job Portal Integration**: Role-specific job management features
4. **Database Integration**: Works with your existing profiles table
5. **React Components**: Declarative UI components for role-based rendering
6. **Utility Functions**: Comprehensive role checking utilities

### 🔐 Role Hierarchy

- **Admin** (Level 8-10): Full system access
  - Can create and manage jobs
  - Can manage all users
  - Can view all analytics
  - Can manage panel members
  - Can schedule interviews

- **Teacher** (Level 5-7): Limited access
  - Can view job applications
  - Can apply for jobs
  - Can create courses, webinars, workshops
  - Cannot create jobs or manage system

## 🚀 Quick Start

### 1. Import Components

```typescript
import { 
  ShowForAdmin, 
  ShowForTeacher, 
  ShowForPermission,
  ShowForJobCreation,
  ShowForJobManagement,
  ShowForJobApplications,
  useRoleChecker 
} from '../component/RoleBasedUI';
```

### 2. Use Role-Based Components

```typescript
// Show content only for admins
<ShowForAdmin>
  <JobCreationPanel />
</ShowForAdmin>

// Show content for teachers (and admins)
<ShowForTeacher>
  <JobApplicationForm />
</ShowForTeacher>

// Show content based on specific permission
<ShowForPermission permission="jobs.create">
  <CreateJobButton />
</ShowForPermission>

// Job portal specific components
<ShowForJobCreation>
  <CreateJobForm />
</ShowForJobCreation>

<ShowForJobApplications>
  <JobApplicationsList />
</ShowForJobApplications>
```

### 3. Use Role Checker Hook

```typescript
import { useRoleChecker } from '../utils/roleChecker';

const MyComponent = () => {
  const roleChecker = useRoleChecker();

  if (roleChecker.isAdmin()) {
    // Show admin features
  }

  if (roleChecker.canCreateJobs()) {
    // Show job creation button
  }

  if (roleChecker.canViewJobApplications()) {
    // Show job applications list
  }
};
```

## 🔧 Boolean Algebra Operations

### Basic Operations

```typescript
const roleChecker = useRoleChecker();

// AND operation
const canManageJobs = roleChecker.AND(
  roleChecker.isAdmin(), 
  roleChecker.hasPermission('jobs.manage')
);

// OR operation
const canViewAnalytics = roleChecker.OR(
  roleChecker.isAdmin(),
  roleChecker.AND(roleChecker.isTeacher(), roleChecker.hasPermission('analytics.view'))
);

// NOT operation
const isNotAdmin = roleChecker.NOT(roleChecker.isAdmin());
```

### Complex Checks

```typescript
// Check if user can access admin panel
const canAccessAdmin = roleChecker.canAccessAdminPanel();

// Check if user can manage specific course
const canManageCourse = roleChecker.canManageCourse(courseUserId);

// Check if user can view job analytics
const canViewJobAnalytics = roleChecker.canViewJobAnalytics();
```

## 💼 Job Portal Features

### Admin Job Permissions

```typescript
// Admin can do everything
roleChecker.canCreateJobs()        // ✅ True
roleChecker.canManageJobs()        // ✅ True
roleChecker.canDeleteJobs()        // ✅ True
roleChecker.canPublishJobs()       // ✅ True
roleChecker.canArchiveJobs()       // ✅ True
roleChecker.canViewJobAnalytics()  // ✅ True
roleChecker.canManagePanelMembers() // ✅ True
roleChecker.canScheduleInterviews() // ✅ True
```

### Teacher Job Permissions

```typescript
// Teachers have limited access
roleChecker.canCreateJobs()        // ❌ False
roleChecker.canManageJobs()        // ❌ False
roleChecker.canViewJobApplications() // ✅ True
roleChecker.canCreateJobApplications() // ✅ True
roleChecker.canViewJobAnalytics()  // ❌ False
```

## 🎨 UI Components Reference

### Basic Role Components

```typescript
// Show for specific roles
<ShowForRole roles={['admin']}>
  <AdminOnlyContent />
</ShowForRole>

<ShowForRole roles={['teacher', 'admin']}>
  <TeacherAndAdminContent />
</ShowForRole>

// Hide for specific roles
<HideForRole roles={['teacher']}>
  <NonTeacherContent />
</HideForRole>
```

### Permission-Based Components

```typescript
// Single permission
<ShowForPermission permission="jobs.create">
  <CreateJobButton />
</ShowForPermission>

// Multiple permissions (AND logic)
<ShowForAllPermissions permissions={['jobs.create', 'jobs.manage']}>
  <FullJobManagement />
</ShowForAllPermissions>

// Multiple permissions (OR logic)
<ShowForAnyPermission permissions={['jobs.view', 'jobs.create']}>
  <JobRelatedContent />
</ShowForAnyPermission>
```

### Job Portal Components

```typescript
// Job creation (admin only)
<ShowForJobCreation>
  <CreateJobForm />
</ShowForJobCreation>

// Job management (admin only)
<ShowForJobManagement>
  <JobManagementPanel />
</ShowForJobManagement>

// Job applications (admin and teacher)
<ShowForJobApplications>
  <JobApplicationsList />
</ShowForJobApplications>

// Job application creation (teacher only)
<ShowForJobApplicationCreation>
  <ApplyForJobForm />
</ShowForJobApplicationCreation>

// Interview management (admin only)
<ShowForInterviewManagement>
  <InterviewScheduler />
</ShowForInterviewManagement>

// Job analytics (admin only)
<ShowForJobAnalytics>
  <JobAnalyticsDashboard />
</ShowForJobAnalytics>

// Panel members management (admin only)
<ShowForPanelMembersManagement>
  <PanelMembersManager />
</ShowForPanelMembersManagement>
```

## 🔍 Permission Testing

### Test Screen

Use the `RoleTestScreen` component to test all role-based features:

```typescript
import RoleTestScreen from '../component/RoleTestScreen';

// In your navigation
<Stack.Screen name="RoleTest" component={RoleTestScreen} />
```

### Manual Testing

```typescript
const roleChecker = useRoleChecker();

// Get complete permission summary
const summary = roleChecker.getPermissionSummary();
console.log('Permission Summary:', summary);

// Test specific features
console.log('Can Create Jobs:', roleChecker.canCreateJobs());
console.log('Can Manage Jobs:', roleChecker.canManageJobs());
console.log('Can View Job Applications:', roleChecker.canViewJobApplications());
```

## 📊 Available Permissions

### Admin Permissions

```typescript
// System management
canAccessAdminPanel()      // Access admin panel
canManageSystem()          // Manage system settings
canManageUsers()           // Manage all users
canViewSystemAnalytics()   // View system analytics
canManagePayments()        // Manage payments
canGenerateReports()       // Generate reports
canManageSettings()        // Manage system settings

// Job portal
canCreateJobs()            // Create new jobs
canManageJobs()            // Manage all jobs
canDeleteJobs()            // Delete jobs
canPublishJobs()           // Publish jobs
canArchiveJobs()           // Archive jobs
canViewJobAnalytics()      // View job analytics
canExportJobData()         // Export job data
canGenerateJobReports()    // Generate job reports
canManagePanelMembers()    // Manage panel members
canScheduleInterviews()    // Schedule interviews
canManageInterviews()      // Manage interviews
canApproveJobApplications() // Approve job applications
canRejectJobApplications() // Reject job applications
canManageJobApplications() // Manage job applications

// Content management
canApproveContent()        // Approve content
canManageContent()         // Manage all content
```

### Teacher Permissions

```typescript
// Course management
canCreateCourses()         // Create courses
canEditCourses()           // Edit courses
canPublishCourses()        // Publish courses
canViewCourseAnalytics()   // View course analytics

// Job portal
canViewJobApplications()   // View job applications
canCreateJobApplications() // Apply for jobs

// Content creation
canCreateWebinars()        // Create webinars
canCreateWorkshops()       // Create workshops
canCreateKnowledgeBase()   // Create knowledge base
canCreateSocialMediaPosts() // Create social media posts
canCreateEvents()          // Create events

// Content approval
canApproveContent()        // Approve content (limited)
```

## 🧪 Testing Examples

### Test Role Functions

```typescript
const testRoleSystem = () => {
  const roleChecker = useRoleChecker();
  
  // Test basic role checks
  console.log('Is Admin:', roleChecker.isAdmin());
  console.log('Is Teacher:', roleChecker.isTeacher());
  
  // Test boolean algebra
  console.log('AND Test:', roleChecker.AND(true, true)); // true
  console.log('OR Test:', roleChecker.OR(true, false));  // true
  console.log('NOT Test:', roleChecker.NOT(true));       // false
  
  // Test complex permissions
  console.log('Can Access Admin Panel:', roleChecker.canAccessAdminPanel());
  console.log('Can Create Jobs:', roleChecker.canCreateJobs());
  console.log('Can View Job Applications:', roleChecker.canViewJobApplications());
  
  // Get permission summary
  const summary = roleChecker.getPermissionSummary();
  console.log('Permission Summary:', summary);
};
```

### Test UI Components

```typescript
const TestComponent = () => {
  return (
    <View>
      {/* This will only show for admins */}
      <ShowForAdmin>
        <Text>Admin Only Content</Text>
      </ShowForAdmin>
      
      {/* This will show for teachers and admins */}
      <ShowForTeacher>
        <Text>Teacher Content</Text>
      </ShowForTeacher>
      
      {/* This will show if user has specific permission */}
      <ShowForPermission permission="jobs.create">
        <Text>Job Creation Content</Text>
      </ShowForPermission>
      
      {/* This will show for job creation (admin only) */}
      <ShowForJobCreation>
        <Text>Create Jobs Content</Text>
      </ShowForJobCreation>
    </View>
  );
};
```

## 🔧 Customization

### Add New Permissions

1. Update the database permissions in `role_permissions` table
2. Add new methods to `RoleChecker` class
3. Create new UI components if needed

### Add New Roles

1. Add role columns to profiles table
2. Update role permissions
3. Add role-specific components
4. Update role checker logic

## 🚨 Troubleshooting

### Common Issues

1. **User profile not loading**: Check if user is signed in
2. **Permissions not working**: Verify role assignment in database
3. **Components not showing**: Check role and permission logic
4. **Boolean algebra errors**: Verify input types are boolean

### Debug Tips

```typescript
// Enable debug logging
const roleChecker = useRoleChecker();
console.log('User Profile:', roleChecker.getCurrentUserProfile());
console.log('User Role:', roleChecker.getCurrentUserRole());
console.log('Permission Summary:', roleChecker.getPermissionSummary());
```

## 📚 Additional Resources

- **Database Schema**: Check `supabase/migrations/20250101_user_roles_schema.sql`
- **Type Definitions**: See `types/auth.ts`
- **Service Layer**: Review `lib/roleAuthService.ts`
- **UI Components**: Explore `component/RoleBasedUI.tsx`
- **Utility Functions**: Check `utils/roleChecker.ts`

## 🎉 Success!

Your role-based authentication system is now fully implemented and ready to use! The system provides:

- ✅ Two-role system (Admin/Teacher)
- ✅ Boolean algebra implementation
- ✅ Job portal integration
- ✅ Declarative UI components
- ✅ Comprehensive testing tools
- ✅ Database integration
- ✅ Type safety

You can now build role-aware features throughout your React Native application! 🚀 