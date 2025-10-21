import React, { ReactNode } from 'react';
import { useAuth } from '../Context/auth';
import { RoleType } from '../types/auth';

// Component that shows content only for specific roles
interface ShowForRoleProps {
  roles: RoleType[];
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForRole: React.FC<ShowForRoleProps> = ({ roles, children, fallback }) => {
  const { permissionCheck } = useAuth();

  if (!permissionCheck) {
    return fallback ? <>{fallback}</> : null;
  }

  const hasRole = roles.some(role => permissionCheck.hasRole(role));
  
  if (hasRole) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content only for admins
interface ShowForAdminProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForAdmin: React.FC<ShowForAdminProps> = ({ children, fallback }) => {
  return <ShowForRole roles={['admin']} fallback={fallback}>{children}</ShowForRole>;
};

// Component that shows content only for teachers
interface ShowForTeacherProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForTeacher: React.FC<ShowForTeacherProps> = ({ children, fallback }) => {
  return <ShowForRole roles={['teacher', 'admin']} fallback={fallback}>{children}</ShowForRole>;
};

// Component that shows content based on permissions
interface ShowForPermissionProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForPermission: React.FC<ShowForPermissionProps> = ({ permission, children, fallback }) => {
  const { permissionCheck } = useAuth();

  if (!permissionCheck) {
    return fallback ? <>{fallback}</> : null;
  }

  if (permissionCheck.hasPermission(permission)) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content based on multiple permissions (AND logic)
interface ShowForAllPermissionsProps {
  permissions: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForAllPermissions: React.FC<ShowForAllPermissionsProps> = ({ permissions, children, fallback }) => {
  const { permissionCheck } = useAuth();

  if (!permissionCheck) {
    return fallback ? <>{fallback}</> : null;
  }

  const hasAllPermissions = permissions.every(permission => permissionCheck.hasPermission(permission));
  
  if (hasAllPermissions) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content based on multiple permissions (OR logic)
interface ShowForAnyPermissionProps {
  permissions: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForAnyPermission: React.FC<ShowForAnyPermissionProps> = ({ permissions, children, fallback }) => {
  const { permissionCheck } = useAuth();

  if (!permissionCheck) {
    return fallback ? <>{fallback}</> : null;
  }

  const hasAnyPermission = permissions.some(permission => permissionCheck.hasPermission(permission));
  
  if (hasAnyPermission) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that hides content for specific roles
interface HideForRoleProps {
  roles: RoleType[];
  children: ReactNode;
  fallback?: ReactNode;
}

export const HideForRole: React.FC<HideForRoleProps> = ({ roles, children, fallback }) => {
  const { permissionCheck } = useAuth();

  if (!permissionCheck) {
    return <>{children}</>;
  }

  const hasRole = roles.some(role => permissionCheck.hasRole(role));
  
  if (!hasRole) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content based on boolean algebra expressions
interface ShowForConditionProps {
  condition: () => boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForCondition: React.FC<ShowForConditionProps> = ({ condition, children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (condition()) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for course management
interface ShowForCourseManagementProps {
  courseUserId?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForCourseManagement: React.FC<ShowForCourseManagementProps> = ({ courseUserId, children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  // Check if user can manage this specific course
  const canManage = booleanAlgebra.canPerformAction('edit', 'courses') || 
                   booleanAlgebra.canPerformAction('delete', 'courses') ||
                   booleanAlgebra.canPerformAction('publish', 'courses');

  if (canManage) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for analytics access
interface ShowForAnalyticsProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForAnalytics: React.FC<ShowForAnalyticsProps> = ({ children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (booleanAlgebra.canPerformAction('view', 'analytics')) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for user management
interface ShowForUserManagementProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForUserManagement: React.FC<ShowForUserManagementProps> = ({ children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (booleanAlgebra.canPerformAction('view', 'users') || 
      booleanAlgebra.canPerformAction('edit', 'users') ||
      booleanAlgebra.canPerformAction('delete', 'users')) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for content approval
interface ShowForContentApprovalProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForContentApproval: React.FC<ShowForContentApprovalProps> = ({ children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (booleanAlgebra.canPerformAction('approve', 'content')) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for payment management
interface ShowForPaymentManagementProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForPaymentManagement: React.FC<ShowForPaymentManagementProps> = ({ children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (booleanAlgebra.canPerformAction('manage', 'payments')) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for report generation
interface ShowForReportGenerationProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForReportGeneration: React.FC<ShowForReportGenerationProps> = ({ children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (booleanAlgebra.canPerformAction('generate', 'reports')) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for settings management
interface ShowForSettingsManagementProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForSettingsManagement: React.FC<ShowForSettingsManagementProps> = ({ children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (booleanAlgebra.canPerformAction('edit', 'settings')) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Job Portal Specific Components - Updated for specific requirements

// Component that shows content for job creation (admin only)
interface ShowForJobCreationProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForJobCreation: React.FC<ShowForJobCreationProps> = ({ children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (booleanAlgebra.canPerformAction('create', 'jobs')) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for job management (admin only)
interface ShowForJobManagementProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForJobManagement: React.FC<ShowForJobManagementProps> = ({ children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (booleanAlgebra.canPerformAction('manage', 'jobs')) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for job viewing (admin and teacher)
interface ShowForJobViewingProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForJobViewing: React.FC<ShowForJobViewingProps> = ({ children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (booleanAlgebra.canPerformAction('view', 'jobs')) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for job applications (admin and teacher)
interface ShowForJobApplicationsProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForJobApplications: React.FC<ShowForJobApplicationsProps> = ({ children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (booleanAlgebra.canPerformAction('view', 'job_applications')) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for job application creation (teacher only)
interface ShowForJobApplicationCreationProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForJobApplicationCreation: React.FC<ShowForJobApplicationCreationProps> = ({ children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (booleanAlgebra.canPerformAction('create', 'job_applications')) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for job application tracking (admin and teacher)
interface ShowForJobApplicationTrackingProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForJobApplicationTracking: React.FC<ShowForJobApplicationTrackingProps> = ({ children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (booleanAlgebra.canPerformAction('track', 'job_applications')) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for interview management (admin only)
interface ShowForInterviewManagementProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForInterviewManagement: React.FC<ShowForInterviewManagementProps> = ({ children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (booleanAlgebra.canPerformAction('manage', 'interviews')) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for job analytics (admin only)
interface ShowForJobAnalyticsProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForJobAnalytics: React.FC<ShowForJobAnalyticsProps> = ({ children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (booleanAlgebra.canPerformAction('view', 'job_analytics')) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for panel members management (admin only)
interface ShowForPanelMembersManagementProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForPanelMembersManagement: React.FC<ShowForPanelMembersManagementProps> = ({ children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (booleanAlgebra.canPerformAction('manage', 'panel_members')) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Hook for role-based conditional rendering
export const useRoleBasedUI = () => {
  const { permissionCheck, booleanAlgebra } = useAuth();

  return {
    // Role checks
    isAdmin: () => permissionCheck?.isAdmin() || false,
    isTeacher: () => permissionCheck?.isTeacher() || false,
    
    // Permission checks
    hasPermission: (permission: string) => permissionCheck?.hasPermission(permission) || false,
    hasAnyPermission: (permissions: string[]) => permissions.some(p => permissionCheck?.hasPermission(p) || false),
    hasAllPermissions: (permissions: string[]) => permissions.every(p => permissionCheck?.hasPermission(p) || false),
    
    // Boolean algebra operations
    booleanAlgebra,
    
    // Complex checks
    canAccessAdminPanel: () => booleanAlgebra?.canAccessFeature('admin_panel', 'admin') || false,
    canAccessTeacherPanel: () => booleanAlgebra?.canAccessFeature('teacher_panel', 'teacher') || false,
    canManageCourse: (courseUserId?: string) => booleanAlgebra?.canPerformAction('manage', 'courses') || false,
    canViewAnalytics: () => booleanAlgebra?.canPerformAction('view', 'analytics') || false,
    canManageUsers: () => booleanAlgebra?.canPerformAction('manage', 'users') || false,
    canApproveContent: () => booleanAlgebra?.canPerformAction('approve', 'content') || false,
    
    // Job portal checks - Updated for specific requirements
    canCreateJobs: () => permissionCheck?.canCreateJobs() || false,
    canManageJobs: () => permissionCheck?.canManageJobs() || false,
    canViewJobs: () => permissionCheck?.canViewJobs() || false,
    canViewJobApplications: () => permissionCheck?.canViewJobApplications() || false,
    canCreateJobApplications: () => permissionCheck?.canCreateJobApplications() || false,
    canTrackJobApplications: () => permissionCheck?.canTrackJobApplications() || false,
    canManageJobApplications: () => permissionCheck?.canManageJobApplications() || false,
    canScheduleInterviews: () => permissionCheck?.canScheduleInterviews() || false,
    canViewJobAnalytics: () => permissionCheck?.canViewJobAnalytics() || false,
    canManagePanelMembers: () => permissionCheck?.canManagePanelMembers() || false,
  };
}; 

// Component that shows content for course creation (admin only)
interface ShowForCourseCreationProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForCourseCreation: React.FC<ShowForCourseCreationProps> = ({ children, fallback }) => {
  const { permissionCheck } = useAuth();

  if (!permissionCheck) {
    return fallback ? <>{fallback}</> : null;
  }

  if (permissionCheck.canCreateCourses()) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for workshop creation (admin only)
interface ShowForWorkshopCreationProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForWorkshopCreation: React.FC<ShowForWorkshopCreationProps> = ({ children, fallback }) => {
  const { permissionCheck } = useAuth();

  if (!permissionCheck) {
    return fallback ? <>{fallback}</> : null;
  }

  if (permissionCheck.canCreateWorkshops()) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for webinar creation (admin only)
interface ShowForWebinarCreationProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForWebinarCreation: React.FC<ShowForWebinarCreationProps> = ({ children, fallback }) => {
  const { permissionCheck } = useAuth();

  if (!permissionCheck) {
    return fallback ? <>{fallback}</> : null;
  }

  if (permissionCheck.canCreateWebinars()) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for knowledge base creation (admin only)
interface ShowForKnowledgeBaseCreationProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForKnowledgeBaseCreation: React.FC<ShowForKnowledgeBaseCreationProps> = ({ children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (booleanAlgebra.canPerformAction('create', 'knowledge_base')) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for social media creation (admin only)
interface ShowForSocialMediaCreationProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForSocialMediaCreation: React.FC<ShowForSocialMediaCreationProps> = ({ children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (booleanAlgebra.canPerformAction('create', 'social_media')) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for event creation (admin only)
interface ShowForEventCreationProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForEventCreation: React.FC<ShowForEventCreationProps> = ({ children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (booleanAlgebra.canPerformAction('create', 'events')) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for book creation (admin only)
interface ShowForBookCreationProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForBookCreation: React.FC<ShowForBookCreationProps> = ({ children, fallback }) => {
  const { permissionCheck } = useAuth();

  if (!permissionCheck) {
    return fallback ? <>{fallback}</> : null;
  }

  if (permissionCheck.canManageBooks()) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for book management (admin only)
interface ShowForBookManagementProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForBookManagement: React.FC<ShowForBookManagementProps> = ({ children, fallback }) => {
  const { permissionCheck } = useAuth();

  if (!permissionCheck) {
    return fallback ? <>{fallback}</> : null;
  }

  if (permissionCheck.canManageBooks()) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

// Component that shows content for certificate creation (admin only)
interface ShowForCertificateCreationProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ShowForCertificateCreation: React.FC<ShowForCertificateCreationProps> = ({ children, fallback }) => {
  const { booleanAlgebra } = useAuth();

  if (!booleanAlgebra) {
    return fallback ? <>{fallback}</> : null;
  }

  if (booleanAlgebra.canPerformAction('create', 'certificates')) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}; 