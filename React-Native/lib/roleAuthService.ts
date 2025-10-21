import { supabase } from './Superbase';
import { UserProfile, UserRole, RoleType, PermissionCheck, RoleBooleanAlgebra } from '../types/auth';

export class RoleAuthService {
  private userProfile: UserProfile | null = null;
  private userRole: UserRole | null = null;

  // Boolean algebra implementation
  private booleanAlgebra: RoleBooleanAlgebra = {
    // Basic boolean operations
    AND: (a: boolean, b: boolean) => a && b,
    OR: (a: boolean, b: boolean) => a || b,
    NOT: (a: boolean) => !a,
    XOR: (a: boolean, b: boolean) => (a || b) && !(a && b),

    // Role-specific boolean operations
    hasAnyRole: (roles: RoleType[]) => {
      if (!this.userRole) return false;
      return roles.some(role => this.userRole![role as keyof UserRole] as boolean);
    },

    hasAllRoles: (roles: RoleType[]) => {
      if (!this.userRole) return false;
      return roles.every(role => this.userRole![role as keyof UserRole] as boolean);
    },

    hasExactRole: (role: RoleType) => {
      if (!this.userRole) return false;
      return this.userRole[role as keyof UserRole] as boolean;
    },

    hasHigherRole: (minRole: RoleType) => {
      if (!this.userRole) return false;
      const roleLevels = { teacher: 5, admin: 8 };
      return this.userRole.role_level >= roleLevels[minRole];
    },

    hasLowerRole: (maxRole: RoleType) => {
      if (!this.userRole) return false;
      const roleLevels = { teacher: 7, admin: 10 };
      return this.userRole.role_level <= roleLevels[maxRole];
    },

    // Permission-specific boolean operations
    hasAnyPermission: (permissions: string[]) => {
      if (!this.userRole) return false;
      return permissions.some(permission => this.hasPermission(permission));
    },

    hasAllPermissions: (permissions: string[]) => {
      if (!this.userRole) return false;
      return permissions.every(permission => this.hasPermission(permission));
    },

    hasExactPermission: (permission: string) => {
      return this.hasPermission(permission);
    },

    // Complex boolean expressions
    canAccessFeature: (feature: string, requiredRole?: RoleType, requiredPermissions?: string[]) => {
      let canAccess = true;

      // Check role requirement
      if (requiredRole) {
        canAccess = this.booleanAlgebra.AND(canAccess, this.booleanAlgebra.hasHigherRole(requiredRole));
      }

      // Check permission requirements
      if (requiredPermissions && requiredPermissions.length > 0) {
        canAccess = this.booleanAlgebra.AND(canAccess, this.booleanAlgebra.hasAllPermissions(requiredPermissions));
      }

      return canAccess;
    },

    canPerformAction: (action: string, resource: string) => {
      const permissionPath = `${resource}.${action}`;
      return this.hasPermission(permissionPath);
    }
  };

  // Load user profile and role information
  async loadUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log('roleAuthService.loadUserProfile: Loading profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return null;
      }

      console.log('roleAuthService.loadUserProfile: Profile data loaded:', data);
      this.userProfile = data;
      
      // Load user role
      await this.loadUserRole(userId);
      return data;
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      return null;
    }
  }

  // Load user role information from database
  async loadUserRole(userId: string): Promise<UserRole | null> {
    try {
      console.log('roleAuthService.loadUserRole: Loading role for user:', userId);
      
      // First try to get role from the profiles table directly
      // Try to select all columns, but handle missing ones gracefully
      let profileData;
      let profileError;
      
      try {
        // Try with all columns first
        const result = await supabase
          .from('profiles')
          .select('is_admin, is_teacher, role_level, is_active, is_suspended')
          .eq('id', userId)
          .single();
        profileData = result.data;
        profileError = result.error;
      } catch (error) {
        // If that fails, try without the new columns
        console.log('Trying without is_active and is_suspended columns...');
        const result = await supabase
          .from('profiles')
          .select('is_admin, is_teacher, role_level')
          .eq('id', userId)
          .single();
        profileData = result.data;
        profileError = result.error;
      }

      if (profileError) {
        console.error('Error loading user role from profiles:', profileError);
        return null;
      }

      console.log('roleAuthService.loadUserRole: Profile role data:', profileData);

      // Create a basic role object from the profile data
      const role: UserRole = {
        is_admin: profileData.is_admin || false,
        is_teacher: profileData.is_teacher || false,
        role_level: profileData.role_level || 1,
        is_active: profileData.is_active !== false, // Default to true if column doesn't exist
        is_suspended: profileData.is_suspended || false, // Default to false if column doesn't exist
        permissions: {} as any // We'll load permissions separately
      };

      // Try to load permissions from role_permissions table
      try {
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('role_permissions')
          .select('role_name, permissions')
          .or(`role_name.eq.admin,role_name.eq.teacher`)
          .limit(2);

        if (!permissionsError && permissionsData && permissionsData.length > 0) {
          // Use admin permissions if user is admin, otherwise use teacher permissions
          const userPermissions = role.is_admin ? 
            permissionsData.find((p: any) => p.role_name === 'admin')?.permissions :
            permissionsData.find((p: any) => p.role_name === 'teacher')?.permissions;
          
          if (userPermissions) {
            role.permissions = userPermissions;
          }
        }
      } catch (permissionsError) {
        console.log('Could not load permissions, using default:', permissionsError);
      }

      console.log('roleAuthService.loadUserRole: Final role object:', role);
      this.userRole = role;
      return role;
    } catch (error) {
      console.error('Error in loadUserRole:', error);
      return null;
    }
  }

  // Check if user has specific permission
  hasPermission(permissionPath: string): boolean {
    if (!this.userRole) return false;

    try {
      const pathParts = permissionPath.split('.');
      let currentLevel: any = this.userRole.permissions;

      for (const part of pathParts) {
        if (currentLevel && typeof currentLevel === 'object' && part in currentLevel) {
          currentLevel = currentLevel[part];
        } else {
          return false;
        }
      }

      return currentLevel === true;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Get permission checker object
  getPermissionChecker(): PermissionCheck {
    return {
      hasPermission: (permissionPath: string) => this.hasPermission(permissionPath),
      hasRole: (role: RoleType) => this.booleanAlgebra.hasExactRole(role),
      isAdmin: () => this.booleanAlgebra.hasExactRole('admin'),
      isTeacher: () => this.booleanAlgebra.hasExactRole('teacher'),
      
      // Course permissions
      canCreateCourses: () => this.hasPermission('courses.create'),
      canEditCourses: () => this.hasPermission('courses.edit'),
      canDeleteCourses: () => this.hasPermission('courses.delete'),
      canManageUsers: () => this.hasPermission('users.manage'),
      canViewAnalytics: () => this.hasPermission('analytics.view'),
      canManageContent: () => this.hasPermission('content.manage'),
      canApproveContent: () => this.hasPermission('content.approve'),
      canManagePayments: () => this.hasPermission('payments.manage'),
      canViewReports: () => this.hasPermission('reports.view'),
      
      // Job portal permissions
      canCreateJobs: () => this.hasPermission('jobs.create'),
      canEditJobs: () => this.hasPermission('jobs.edit'),
      canDeleteJobs: () => this.hasPermission('jobs.delete'),
      canManageJobs: () => this.hasPermission('jobs.manage'),
      canViewJobApplications: () => this.hasPermission('job_applications.view'),
      canCreateJobApplications: () => this.hasPermission('job_applications.create'),
      canManageJobApplications: () => this.hasPermission('job_applications.manage'),
      canApproveJobApplications: () => this.hasPermission('job_applications.approve'),
      canScheduleInterviews: () => this.hasPermission('interviews.schedule'),
      canManageInterviews: () => this.hasPermission('interviews.manage'),
      canViewJobAnalytics: () => this.hasPermission('job_analytics.view'),
      
      // Panel members permissions
      canManagePanelMembers: () => this.hasPermission('panel_members.manage'),
      
      // Other portal permissions
      canCreateCourses: () => this.hasPermission('courses.create'),
      canCreateWebinars: () => this.hasPermission('webinars.create'),
      canCreateWorkshops: () => this.hasPermission('workshops.create'),
      canCreateKnowledgeBase: () => this.hasPermission('knowledge_base.create'),
      canIssueCertificates: () => this.hasPermission('certificates.issue'),
      canManageBooks: () => this.hasPermission('books.manage'),
      canModerateSocialMedia: () => this.hasPermission('social_media.moderate'),
      canManageEvents: () => this.hasPermission('events.manage'),
    };
  }

  // Get boolean algebra object
  getBooleanAlgebra(): RoleBooleanAlgebra {
    return this.booleanAlgebra;
  }

  // Update user role (admin only)
  async updateUserRole(userId: string, roleUpdates: Partial<UserProfile>): Promise<boolean> {
    try {
      // Check if current user is admin
      if (!this.booleanAlgebra.hasExactRole('admin')) {
        console.error('Only admins can update user roles');
        return false;
      }

      const { error } = await supabase
        .from('profiles')
        .update(roleUpdates)
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      return false;
    }
  }

  // Check and migrate user from old system
  async checkAndMigrateUser(userId: string): Promise<boolean> {
    try {
      // Check if user needs migration
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin, is_teacher, role_level')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking user migration status:', error);
        return false;
      }

      // If user doesn't have role information, migrate them
      if (!profile.is_admin && !profile.is_teacher && !profile.role_level) {
        const { error: migrationError } = await supabase
          .rpc('migrate_user_to_role_system');

        if (migrationError) {
          console.error('Error migrating user:', migrationError);
          return false;
        }

        console.log('User migrated successfully');
        return true;
      }

      return true;
    } catch (error) {
      console.error('Error in checkAndMigrateUser:', error);
      return false;
    }
  }

  // Migrate user role based on occupation
  async migrateUserRole(userId: string, occupation?: string): Promise<boolean> {
    try {
      let roleUpdates: Partial<UserProfile> = {
        role_level: 1,
        is_active: true,
        is_suspended: false
      };

      if (occupation) {
        const lowerOccupation = occupation.toLowerCase();
        if (lowerOccupation.includes('admin') || lowerOccupation === 'admin') {
          roleUpdates = {
            ...roleUpdates,
            is_admin: true,
            is_teacher: false,
            role_level: 9
          };
        } else if (lowerOccupation.includes('teacher') || 
                   lowerOccupation.includes('instructor') || 
                   lowerOccupation === 'teacher') {
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
      }

      const success = await this.updateUserRole(userId, roleUpdates);
      return success;
    } catch (error) {
      console.error('Error in migrateUserRole:', error);
      return false;
    }
  }

  // Get current user profile
  getCurrentUserProfile(): UserProfile | null {
    return this.userProfile;
  }

  // Get current user role
  getCurrentUserRole(): UserRole | null {
    return this.userRole;
  }

  // Check if user is active and not suspended
  isUserActive(): boolean {
    return this.userProfile?.is_active === true && this.userProfile?.is_suspended === false;
  }

  // Complex permission checks using boolean algebra
  canAccessAdminPanel(): boolean {
    return this.booleanAlgebra.AND(
      this.booleanAlgebra.hasExactRole('admin'),
      this.isUserActive()
    );
  }

  canAccessTeacherPanel(): boolean {
    return this.booleanAlgebra.OR(
      this.booleanAlgebra.hasExactRole('admin'),
      this.booleanAlgebra.AND(
        this.booleanAlgebra.hasExactRole('teacher'),
        this.isUserActive()
      )
    );
  }

  canManageCourse(courseUserId?: string): boolean {
    return this.booleanAlgebra.OR(
      this.booleanAlgebra.hasExactRole('admin'),
      this.booleanAlgebra.AND(
        this.booleanAlgebra.hasExactRole('teacher'),
        this.booleanAlgebra.AND(
          this.isUserActive(),
          this.booleanAlgebra.OR(
            !courseUserId, // If no course user ID, allow if teacher
            courseUserId === this.userProfile?.id // Or if course belongs to teacher
          )
        )
      )
    );
  }

  canViewAnalytics(): boolean {
    return this.booleanAlgebra.OR(
      this.booleanAlgebra.hasExactRole('admin'),
      this.booleanAlgebra.AND(
        this.booleanAlgebra.hasExactRole('teacher'),
        this.booleanAlgebra.AND(
          this.isUserActive(),
          this.hasPermission('analytics.view')
        )
      )
    );
  }

  canManageUsers(): boolean {
    return this.booleanAlgebra.AND(
      this.booleanAlgebra.hasExactRole('admin'),
      this.booleanAlgebra.AND(
        this.isUserActive(),
        this.hasPermission('users.manage')
      )
    );
  }

  canApproveContent(): boolean {
    return this.booleanAlgebra.OR(
      this.booleanAlgebra.hasExactRole('admin'),
      this.booleanAlgebra.AND(
        this.booleanAlgebra.hasExactRole('teacher'),
        this.booleanAlgebra.AND(
          this.isUserActive(),
          this.hasPermission('content.approve')
        )
      )
    );
  }

  // Job portal specific permission checks
  canCreateJobs(): boolean {
    return this.booleanAlgebra.AND(
      this.booleanAlgebra.hasExactRole('admin'),
      this.booleanAlgebra.AND(
        this.isUserActive(),
        this.hasPermission('jobs.create')
      )
    );
  }

  canManageJobs(): boolean {
    return this.booleanAlgebra.AND(
      this.booleanAlgebra.hasExactRole('admin'),
      this.booleanAlgebra.AND(
        this.isUserActive(),
        this.hasPermission('jobs.manage')
      )
    );
  }

  canViewJobApplications(): boolean {
    return this.booleanAlgebra.OR(
      this.booleanAlgebra.hasExactRole('admin'),
      this.booleanAlgebra.AND(
        this.booleanAlgebra.hasExactRole('teacher'),
        this.booleanAlgebra.AND(
          this.isUserActive(),
          this.hasPermission('job_applications.view')
        )
      )
    );
  }

  canCreateJobApplications(): boolean {
    return this.booleanAlgebra.AND(
      this.booleanAlgebra.hasExactRole('teacher'),
      this.booleanAlgebra.AND(
        this.isUserActive(),
        this.hasPermission('job_applications.create')
      )
    );
  }

  canManageJobApplications(): boolean {
    return this.booleanAlgebra.AND(
      this.booleanAlgebra.hasExactRole('admin'),
      this.booleanAlgebra.AND(
        this.isUserActive(),
        this.hasPermission('job_applications.manage')
      )
    );
  }

  canScheduleInterviews(): boolean {
    return this.booleanAlgebra.AND(
      this.booleanAlgebra.hasExactRole('admin'),
      this.booleanAlgebra.AND(
        this.isUserActive(),
        this.hasPermission('interviews.schedule')
      )
    );
  }

  canViewJobAnalytics(): boolean {
    return this.booleanAlgebra.AND(
      this.booleanAlgebra.hasExactRole('admin'),
      this.booleanAlgebra.AND(
        this.isUserActive(),
        this.hasPermission('job_analytics.view')
      )
    );
  }

  canManagePanelMembers(): boolean {
    return this.booleanAlgebra.AND(
      this.booleanAlgebra.hasExactRole('admin'),
      this.booleanAlgebra.AND(
        this.isUserActive(),
        this.hasPermission('panel_members.manage')
      )
    );
  }

  // Role-based navigation helpers
  getAvailableNavigationItems(): string[] {
    const items: string[] = [];

    if (this.booleanAlgebra.hasExactRole('admin')) {
      items.push('dashboard', 'courses', 'users', 'analytics', 'content', 'payments', 'reports', 'settings', 'jobs', 'job_applications', 'interviews', 'job_analytics', 'panel_members', 'webinars', 'workshops', 'knowledge_base', 'certificates', 'books', 'social_media', 'events');
    } else if (this.booleanAlgebra.hasExactRole('teacher')) {
      items.push('dashboard', 'courses', 'analytics', 'content', 'jobs', 'job_applications', 'interviews', 'webinars', 'workshops', 'knowledge_base', 'social_media', 'events');
    }

    return items;
  }

  // Clear user data (for logout)
  clearUserData(): void {
    this.userProfile = null;
    this.userRole = null;
  }
}

// Create singleton instance
export const roleAuthService = new RoleAuthService(); 