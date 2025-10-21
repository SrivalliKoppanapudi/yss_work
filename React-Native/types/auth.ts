// Role-based authentication types for existing profiles table
export interface UserProfile {
  id: string;
  name?: string;
  address?: string;
  phoneNumber?: string;
  occupation?: string;
  education?: string;
  workExperience?: string;
  goals?: string;
  objectives?: string;
  profilePicture?: string;
  isVerified?: boolean;
  privacyLevel?: string;
  muted_accounts?: string[];
  banner_image_url?: string;
  experience_json?: any;
  education_json?: any;
  specialties?: string[];
  recent_activities?: any;
  bio?: string;
  resume_url?: string;
  gamified_completed?: boolean;
  teaching_role?: string;
  super_skills?: string[];
  learning_styles?: string[];
  platform_goals?: string[];
  experience_level?: string;
  gender?: string;
  subjects_interest?: string[];
  
  // Role-based access control using boolean algebra
  is_admin: boolean;
  is_teacher: boolean;
  role_level: number;
  is_active: boolean;
  is_suspended: boolean;
}

export interface RolePermissions {
  dashboard: {
    view: boolean;
    edit: boolean;
    delete: boolean;
  };
  courses: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    publish: boolean;
    archive: boolean;
  };
  users: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    suspend: boolean;
  };
  analytics: {
    view: boolean;
    export: boolean;
  };
  content: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
  };
  payments: {
    view: boolean;
    manage: boolean;
    refund: boolean;
  };
  reports: {
    view: boolean;
    generate: boolean;
  };
  settings: {
    view: boolean;
    edit: boolean;
  };
  jobs: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    manage: boolean;
    publish: boolean;
    archive: boolean;
  };
  job_applications: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
    reject: boolean;
  };
  interviews: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    schedule: boolean;
    manage: boolean;
  };
  job_analytics: {
    view: boolean;
    export: boolean;
    generate_reports: boolean;
  };
  panel_members: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    manage: boolean;
  };
  webinars: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    manage: boolean;
  };
  workshops: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    manage: boolean;
  };
  knowledge_base: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
  };
  certificates: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    issue: boolean;
  };
  books: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    manage: boolean;
  };
  social_media: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    moderate: boolean;
  };
  events: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    manage: boolean;
  };
}

export interface UserRole {
  is_admin: boolean;
  is_teacher: boolean;
  role_level: number;
  is_active: boolean;
  is_suspended: boolean;
  permissions: RolePermissions;
}

export type RoleType = 'admin' | 'teacher';

export interface PermissionCheck {
  hasPermission: (permissionPath: string) => boolean;
  hasRole: (role: RoleType) => boolean;
  isAdmin: () => boolean;
  isTeacher: () => boolean;
  canCreateCourses: () => boolean;
  canEditCourses: () => boolean;
  canDeleteCourses: () => boolean;
  canManageUsers: () => boolean;
  canViewAnalytics: () => boolean;
  canManageContent: () => boolean;
  canApproveContent: () => boolean;
  canManagePayments: () => boolean;
  canViewReports: () => boolean;
  // Job portal permissions
  canCreateJobs: () => boolean;
  canEditJobs: () => boolean;
  canDeleteJobs: () => boolean;
  canManageJobs: () => boolean;
  canViewJobApplications: () => boolean;
  canCreateJobApplications: () => boolean;
  canManageJobApplications: () => boolean;
  canApproveJobApplications: () => boolean;
  canScheduleInterviews: () => boolean;
  canManageInterviews: () => boolean;
  canViewJobAnalytics: () => boolean;
  // Panel members permissions
  canManagePanelMembers: () => boolean;
  // Other portal permissions
  canCreateWebinars: () => boolean;
  canCreateWorkshops: () => boolean;
  canCreateKnowledgeBase: () => boolean;
  canIssueCertificates: () => boolean;
  canManageBooks: () => boolean;
  canModerateSocialMedia: () => boolean;
  canManageEvents: () => boolean;
}

// Boolean algebra operators for role-based access control
export interface RoleBooleanAlgebra {
  // Basic boolean operations
  AND: (a: boolean, b: boolean) => boolean;
  OR: (a: boolean, b: boolean) => boolean;
  NOT: (a: boolean) => boolean;
  XOR: (a: boolean, b: boolean) => boolean;
  
  // Role-specific boolean operations
  hasAnyRole: (roles: RoleType[]) => boolean;
  hasAllRoles: (roles: RoleType[]) => boolean;
  hasExactRole: (role: RoleType) => boolean;
  hasHigherRole: (minRole: RoleType) => boolean;
  hasLowerRole: (maxRole: RoleType) => boolean;
  
  // Permission-specific boolean operations
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasExactPermission: (permission: string) => boolean;
  
  // Complex boolean expressions
  canAccessFeature: (feature: string, requiredRole?: RoleType, requiredPermissions?: string[]) => boolean;
  canPerformAction: (action: string, resource: string) => boolean;
}

// Role-based navigation and UI control
export interface RoleBasedUI {
  showForRole: (role: RoleType) => boolean;
  showForRoles: (roles: RoleType[]) => boolean;
  showForPermission: (permission: string) => boolean;
  showForPermissions: (permissions: string[]) => boolean;
  hideForRole: (role: RoleType) => boolean;
  hideForRoles: (roles: RoleType[]) => boolean;
}

// Role-based routing
export interface RoleBasedRoute {
  path: string;
  component: React.ComponentType;
  allowedRoles: RoleType[];
  requiredPermissions?: string[];
  fallbackComponent?: React.ComponentType;
}

// Role-based menu items
export interface RoleBasedMenuItem {
  id: string;
  title: string;
  icon: string;
  path: string;
  allowedRoles: RoleType[];
  requiredPermissions?: string[];
  children?: RoleBasedMenuItem[];
}

// Role-based content filtering
export interface RoleBasedContent {
  isVisible: (userRole: UserRole) => boolean;
  isEditable: (userRole: UserRole) => boolean;
  isDeletable: (userRole: UserRole) => boolean;
  isPublishable: (userRole: UserRole) => boolean;
}

// Role-based analytics and reporting
export interface RoleBasedAnalytics {
  canViewAnalytics: (userRole: UserRole) => boolean;
  canExportData: (userRole: UserRole) => boolean;
  canViewReports: (userRole: UserRole) => boolean;
  canGenerateReports: (userRole: UserRole) => boolean;
}

// Role-based user management
export interface RoleBasedUserManagement {
  canViewUsers: (userRole: UserRole) => boolean;
  canCreateUsers: (userRole: UserRole) => boolean;
  canEditUsers: (userRole: UserRole) => boolean;
  canDeleteUsers: (userRole: UserRole) => boolean;
  canSuspendUsers: (userRole: UserRole) => boolean;
  canAssignRoles: (userRole: UserRole) => boolean;
}

// Role-based course management
export interface RoleBasedCourseManagement {
  canViewCourses: (userRole: UserRole) => boolean;
  canCreateCourses: (userRole: UserRole) => boolean;
  canEditCourses: (userRole: UserRole) => boolean;
  canDeleteCourses: (userRole: UserRole) => boolean;
  canPublishCourses: (userRole: UserRole) => boolean;
  canArchiveCourses: (userRole: UserRole) => boolean;
  canApproveCourses: (userRole: UserRole) => boolean;
}

// Role-based job management
export interface RoleBasedJobManagement {
  canViewJobs: (userRole: UserRole) => boolean;
  canCreateJobs: (userRole: UserRole) => boolean;
  canEditJobs: (userRole: UserRole) => boolean;
  canDeleteJobs: (userRole: UserRole) => boolean;
  canManageJobs: (userRole: UserRole) => boolean;
  canPublishJobs: (userRole: UserRole) => boolean;
  canArchiveJobs: (userRole: UserRole) => boolean;
  canViewJobApplications: (userRole: UserRole) => boolean;
  canCreateJobApplications: (userRole: UserRole) => boolean;
  canManageJobApplications: (userRole: UserRole) => boolean;
  canApproveJobApplications: (userRole: UserRole) => boolean;
  canScheduleInterviews: (userRole: UserRole) => boolean;
  canManageInterviews: (userRole: UserRole) => boolean;
  canViewJobAnalytics: (userRole: UserRole) => boolean;
  canManagePanelMembers: (userRole: UserRole) => boolean;
}

// Role-based payment management
export interface RoleBasedPaymentManagement {
  canViewPayments: (userRole: UserRole) => boolean;
  canManagePayments: (userRole: UserRole) => boolean;
  canProcessRefunds: (userRole: UserRole) => boolean;
  canViewFinancialReports: (userRole: UserRole) => boolean;
}

// Role-based content management
export interface RoleBasedContentManagement {
  canViewContent: (userRole: UserRole) => boolean;
  canCreateContent: (userRole: UserRole) => boolean;
  canEditContent: (userRole: UserRole) => boolean;
  canDeleteContent: (userRole: UserRole) => boolean;
  canApproveContent: (userRole: UserRole) => boolean;
  canPublishContent: (userRole: UserRole) => boolean;
}

// Role-based settings management
export interface RoleBasedSettingsManagement {
  canViewSettings: (userRole: UserRole) => boolean;
  canEditSettings: (userRole: UserRole) => boolean;
  canManageSystemSettings: (userRole: UserRole) => boolean;
  canManageSecuritySettings: (userRole: UserRole) => boolean;
} 