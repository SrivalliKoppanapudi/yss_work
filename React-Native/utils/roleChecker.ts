// Role checking utility for admin and teacher roles using boolean algebra
import { useAuth } from '../Context/auth';
import { RoleType } from '../types/auth';

export class RoleChecker {
  private userProfile: any;
  private userRole: any;
  private permissionCheck: any;
  private booleanAlgebra: any;

  constructor(userProfile: any, userRole: any, permissionCheck: any, booleanAlgebra: any) {
    this.userProfile = userProfile;
    this.userRole = userRole;
    this.permissionCheck = permissionCheck;
    this.booleanAlgebra = booleanAlgebra;
  }

  // Basic role checks
  isAdmin(): boolean {
    return this.userRole?.is_admin === true;
  }

  isTeacher(): boolean {
    return this.userRole?.is_teacher === true;
  }

  hasRole(role: RoleType): boolean {
    return this.permissionCheck?.hasRole(role) || false;
  }

  // Boolean algebra operations
  AND(a: boolean, b: boolean): boolean {
    return a && b;
  }

  OR(a: boolean, b: boolean): boolean {
    return a || b;
  }

  NOT(a: boolean): boolean {
    return !a;
  }

  // Complex role-based access control
  canAccessFeature(feature: string, requiredRole?: RoleType, requiredPermissions?: string[]): boolean {
    let canAccess = true;

    // Check role requirement
    if (requiredRole) {
      canAccess = this.AND(canAccess, this.hasHigherRole(requiredRole));
    }

    // Check permission requirements
    if (requiredPermissions && requiredPermissions.length > 0) {
      canAccess = this.AND(canAccess, this.hasAllPermissions(requiredPermissions));
    }

    return canAccess;
  }

  hasHigherRole(minRole: RoleType): boolean {
    if (!this.userRole) return false;
    const roleLevels = { teacher: 5, admin: 8 };
    return this.userRole.role_level >= roleLevels[minRole];
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  hasPermission(permission: string): boolean {
    return this.permissionCheck?.hasPermission(permission) || false;
  }

  // Admin-specific access checks
  canAccessAdminPanel(): boolean {
    return this.AND(this.isAdmin(), this.isUserActive());
  }

  canManageSystem(): boolean {
    return this.AND(this.isAdmin(), this.isUserActive());
  }

  canManageUsers(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('users.manage'));
  }

  canViewSystemAnalytics(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('analytics.view'));
  }

  canManagePayments(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('payments.manage'));
  }

  canGenerateReports(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('reports.generate'));
  }

  canManageSettings(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('settings.edit'));
  }

  // Job portal access checks - Updated for specific requirements
  canCreateJobs(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('jobs.create'));
  }

  canManageJobs(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('jobs.manage'));
  }

  canDeleteJobs(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('jobs.delete'));
  }

  canPublishJobs(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('jobs.publish'));
  }

  canArchiveJobs(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('jobs.archive'));
  }

  // Teachers can view jobs but cannot create/manage them
  canViewJobs(): boolean {
    return this.OR(
      this.isAdmin(),
      this.AND(this.isTeacher(), this.hasPermission('jobs.view'))
    );
  }

  // Job applications - Teachers can view and create, admins can manage
  canViewJobApplications(): boolean {
    return this.OR(
      this.isAdmin(),
      this.AND(this.isTeacher(), this.hasPermission('job_applications.view'))
    );
  }

  canCreateJobApplications(): boolean {
    return this.AND(this.isTeacher(), this.hasPermission('job_applications.create'));
  }

  canTrackJobApplications(): boolean {
    return this.OR(
      this.isAdmin(),
      this.AND(this.isTeacher(), this.hasPermission('job_applications.track'))
    );
  }

  canManageJobApplications(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('job_applications.manage'));
  }

  canApproveJobApplications(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('job_applications.approve'));
  }

  canRejectJobApplications(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('job_applications.reject'));
  }

  // Interview management - Admin only
  canScheduleInterviews(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('interviews.schedule'));
  }

  canManageInterviews(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('interviews.manage'));
  }

  // Job analytics - Admin only
  canViewJobAnalytics(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('job_analytics.view'));
  }

  canExportJobData(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('job_analytics.export'));
  }

  canGenerateJobReports(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('job_analytics.generate_reports'));
  }

  // Panel members management - Admin only
  canManagePanelMembers(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('panel_members.manage'));
  }

  canCreatePanelMembers(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('panel_members.create'));
  }

  canEditPanelMembers(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('panel_members.edit'));
  }

  canDeletePanelMembers(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('panel_members.delete'));
  }

  // Teacher-specific access checks
  canAccessTeacherPanel(): boolean {
    return this.OR(
      this.isAdmin(),
      this.AND(this.isTeacher(), this.isUserActive())
    );
  }

  canCreateCourses(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('courses.create'));
  }

  canEditCourses(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('courses.edit'));
  }

  canPublishCourses(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('courses.publish'));
  }

  canViewCourseAnalytics(): boolean {
    return this.OR(
      this.isAdmin(),
      this.AND(this.isTeacher(), this.hasPermission('analytics.view'))
    );
  }

  canApproveContent(): boolean {
    return this.OR(
      this.isAdmin(),
      this.AND(this.isTeacher(), this.hasPermission('content.approve'))
    );
  }

  // Content creation permissions - Admin only
  canCreateWebinars(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('webinars.create'));
  }

  canCreateWorkshops(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('workshops.create'));
  }

  canCreateKnowledgeBase(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('knowledge_base.create'));
  }

  canCreateSocialMediaPosts(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('social_media.create'));
  }

  canCreateEvents(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('events.create'));
  }

  // Content viewing permissions - Admin and Teacher
  canViewCourses(): boolean {
    return this.OR(
      this.isAdmin(),
      this.AND(this.isTeacher(), this.hasPermission('courses.view'))
    );
  }

  canViewWorkshops(): boolean {
    return this.OR(
      this.isAdmin(),
      this.AND(this.isTeacher(), this.hasPermission('workshops.view'))
    );
  }

  canViewWebinars(): boolean {
    return this.OR(
      this.isAdmin(),
      this.AND(this.isTeacher(), this.hasPermission('webinars.view'))
    );
  }

  canViewKnowledgeBase(): boolean {
    return this.OR(
      this.isAdmin(),
      this.AND(this.isTeacher(), this.hasPermission('knowledge_base.view'))
    );
  }

  canViewSocialMedia(): boolean {
    return this.OR(
      this.isAdmin(),
      this.AND(this.isTeacher(), this.hasPermission('social_media.view'))
    );
  }

  canViewEvents(): boolean {
    return this.OR(
      this.isAdmin(),
      this.AND(this.isTeacher(), this.hasPermission('events.view'))
    );
  }

  canViewBooks(): boolean {
    return this.OR(
      this.isAdmin(),
      this.AND(this.isTeacher(), this.hasPermission('books.view'))
    );
  }

  canViewCertificates(): boolean {
    return this.OR(
      this.isAdmin(),
      this.AND(this.isTeacher(), this.hasPermission('certificates.view'))
    );
  }

  canCreateBooks(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('books.create'));
  }

  canCreateCertificates(): boolean {
    return this.AND(this.isAdmin(), this.hasPermission('certificates.create'));
  }

  // Course management with ownership checks
  canManageCourse(courseUserId?: string): boolean {
    return this.OR(
      this.isAdmin(),
      this.AND(
        this.isTeacher(),
        this.OR(
          !courseUserId, // If no course user ID, allow if teacher
          courseUserId === this.userProfile?.id // Or if course belongs to teacher
        )
      )
    );
  }

  canEditCourse(courseUserId?: string): boolean {
    return this.AND(
      this.canManageCourse(courseUserId),
      this.hasPermission('courses.edit')
    );
  }

  canDeleteCourse(courseUserId?: string): boolean {
    return this.AND(
      this.canManageCourse(courseUserId),
      this.hasPermission('courses.delete')
    );
  }

  canPublishCourse(courseUserId?: string): boolean {
    return this.AND(
      this.canManageCourse(courseUserId),
      this.hasPermission('courses.publish')
    );
  }

  // Utility checks
  isUserActive(): boolean {
    return this.userProfile?.is_active === true && this.userProfile?.is_suspended === false;
  }

  isUserVerified(): boolean {
    return this.userProfile?.isVerified === true;
  }

  // Navigation helpers
  getAvailableNavigationItems(): string[] {
    const items: string[] = [];

    if (this.isAdmin()) {
      items.push(
        'dashboard', 'courses', 'users', 'analytics', 'content', 
        'payments', 'reports', 'settings', 'jobs', 'job_applications', 
        'interviews', 'job_analytics', 'panel_members', 'webinars', 
        'workshops', 'knowledge_base', 'certificates', 'books', 
        'social_media', 'events'
      );
    } else if (this.isTeacher()) {
      items.push(
        'dashboard', 'courses', 'analytics', 'content', 'jobs', 
        'job_applications', 'webinars', 'workshops', 'knowledge_base', 
        'social_media', 'events'
      );
    }

    return items;
  }

  // Feature access checks
  canAccessFeatureByName(feature: string): boolean {
    const featureAccessMap: Record<string, () => boolean> = {
      'admin-panel': () => this.canAccessAdminPanel(),
      'teacher-panel': () => this.canAccessTeacherPanel(),
      'user-management': () => this.canManageUsers(),
      'system-analytics': () => this.canViewSystemAnalytics(),
      'payment-management': () => this.canManagePayments(),
      'report-generation': () => this.canGenerateReports(),
      'system-settings': () => this.canManageSettings(),
      'job-creation': () => this.canCreateJobs(),
      'job-management': () => this.canManageJobs(),
      'job-viewing': () => this.canViewJobs(),
      'job-applications': () => this.canViewJobApplications(),
      'job-application-creation': () => this.canCreateJobApplications(),
      'job-application-tracking': () => this.canTrackJobApplications(),
      'interview-management': () => this.canManageInterviews(),
      'job-analytics': () => this.canViewJobAnalytics(),
      'panel-management': () => this.canManagePanelMembers(),
      'course-creation': () => this.canCreateCourses(),
      'course-editing': () => this.canEditCourses(),
      'course-publishing': () => this.canPublishCourses(),
      'content-approval': () => this.canApproveContent(),
      'webinar-creation': () => this.canCreateWebinars(),
      'workshop-creation': () => this.canCreateWorkshops(),
      'knowledge-base-creation': () => this.canCreateKnowledgeBase(),
      'social-media-creation': () => this.canCreateSocialMediaPosts(),
      'event-creation': () => this.canCreateEvents(),
    };

    return featureAccessMap[feature]?.() || false;
  }

  // Permission summary
  getPermissionSummary(): Record<string, boolean> {
    return {
      // Role checks
      isAdmin: this.isAdmin(),
      isTeacher: this.isTeacher(),
      isActive: this.isUserActive(),
      isVerified: this.isUserVerified(),

      // Admin permissions
      canAccessAdminPanel: this.canAccessAdminPanel(),
      canManageUsers: this.canManageUsers(),
      canViewSystemAnalytics: this.canViewSystemAnalytics(),
      canManagePayments: this.canManagePayments(),
      canGenerateReports: this.canGenerateReports(),
      canManageSettings: this.canManageSettings(),

      // Job portal permissions - Updated for specific requirements
      canCreateJobs: this.canCreateJobs(),
      canManageJobs: this.canManageJobs(),
      canDeleteJobs: this.canDeleteJobs(),
      canPublishJobs: this.canPublishJobs(),
      canArchiveJobs: this.canArchiveJobs(),
      canViewJobs: this.canViewJobs(),
      canViewJobApplications: this.canViewJobApplications(),
      canCreateJobApplications: this.canCreateJobApplications(),
      canTrackJobApplications: this.canTrackJobApplications(),
      canManageJobApplications: this.canManageJobApplications(),
      canApproveJobApplications: this.canApproveJobApplications(),
      canRejectJobApplications: this.canRejectJobApplications(),
      canScheduleInterviews: this.canScheduleInterviews(),
      canManageInterviews: this.canManageInterviews(),
      canViewJobAnalytics: this.canViewJobAnalytics(),
      canExportJobData: this.canExportJobData(),
      canGenerateJobReports: this.canGenerateJobReports(),
      canManagePanelMembers: this.canManagePanelMembers(),
      canCreatePanelMembers: this.canCreatePanelMembers(),
      canEditPanelMembers: this.canEditPanelMembers(),
      canDeletePanelMembers: this.canDeletePanelMembers(),

      // Teacher permissions
      canAccessTeacherPanel: this.canAccessTeacherPanel(),
      canCreateCourses: this.canCreateCourses(),
      canEditCourses: this.canEditCourses(),
      canPublishCourses: this.canPublishCourses(),
      canViewCourseAnalytics: this.canViewCourseAnalytics(),
      canApproveContent: this.canApproveContent(),

      // Content creation permissions
      canCreateWebinars: this.canCreateWebinars(),
      canCreateWorkshops: this.canCreateWorkshops(),
      canCreateKnowledgeBase: this.canCreateKnowledgeBase(),
      canCreateSocialMediaPosts: this.canCreateSocialMediaPosts(),
      canCreateEvents: this.canCreateEvents(),
    };
  }
}

// Hook to use role checker
export const useRoleChecker = () => {
  const { userProfile, userRole, permissionCheck, booleanAlgebra } = useAuth();
  
  // Add error handling for when auth data is not ready
  if (!userProfile || !userRole) {
    console.log('useRoleChecker: Auth data not ready yet');
    return null;
  }
  
  try {
    return new RoleChecker(userProfile, userRole, permissionCheck, booleanAlgebra);
  } catch (error) {
    console.error('useRoleChecker: Error creating RoleChecker:', error);
    return null;
  }
}; 