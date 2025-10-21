// Boolean algebra utilities for role-based authentication

export class BooleanAlgebra {
  // Basic boolean operations
  static AND(a: boolean, b: boolean): boolean {
    return a && b;
  }

  static OR(a: boolean, b: boolean): boolean {
    return a || b;
  }

  static NOT(a: boolean): boolean {
    return !a;
  }

  static XOR(a: boolean, b: boolean): boolean {
    return (a || b) && !(a && b);
  }

  static NAND(a: boolean, b: boolean): boolean {
    return !(a && b);
  }

  static NOR(a: boolean, b: boolean): boolean {
    return !(a || b);
  }

  static XNOR(a: boolean, b: boolean): boolean {
    return (a && b) || (!a && !b);
  }

  // Multiple boolean operations
  static AND_ALL(...values: boolean[]): boolean {
    return values.every(value => value);
  }

  static OR_ALL(...values: boolean[]): boolean {
    return values.some(value => value);
  }

  // Role-based boolean operations
  static hasAnyRole(userRoles: Record<string, boolean>, requiredRoles: string[]): boolean {
    return requiredRoles.some(role => userRoles[role] === true);
  }

  static hasAllRoles(userRoles: Record<string, boolean>, requiredRoles: string[]): boolean {
    return requiredRoles.every(role => userRoles[role] === true);
  }

  static hasExactRole(userRoles: Record<string, boolean>, role: string): boolean {
    return userRoles[role] === true;
  }

  static hasHigherRole(userRoleLevel: number, minRoleLevel: number): boolean {
    return userRoleLevel >= minRoleLevel;
  }

  static hasLowerRole(userRoleLevel: number, maxRoleLevel: number): boolean {
    return userRoleLevel <= maxRoleLevel;
  }

  // Permission-based boolean operations
  static hasAnyPermission(userPermissions: Record<string, any>, requiredPermissions: string[]): boolean {
    return requiredPermissions.some(permission => {
      const value = this.getNestedValue(userPermissions, permission);
      return value === true;
    });
  }

  static hasAllPermissions(userPermissions: Record<string, any>, requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission => {
      const value = this.getNestedValue(userPermissions, permission);
      return value === true;
    });
  }

  static hasExactPermission(userPermissions: Record<string, any>, permission: string): boolean {
    const value = this.getNestedValue(userPermissions, permission);
    return value === true;
  }

  // Complex boolean expressions for role-based access control
  static canAccessFeature(
    userRoles: Record<string, boolean>,
    userRoleLevel: number,
    userPermissions: Record<string, any>,
    feature: string,
    requiredRole?: string,
    requiredRoleLevel?: number,
    requiredPermissions?: string[]
  ): boolean {
    let canAccess = true;

    // Check role requirement
    if (requiredRole) {
      canAccess = this.AND(canAccess, this.hasExactRole(userRoles, requiredRole));
    }

    // Check role level requirement
    if (requiredRoleLevel !== undefined) {
      canAccess = this.AND(canAccess, this.hasHigherRole(userRoleLevel, requiredRoleLevel));
    }

    // Check permission requirements
    if (requiredPermissions && requiredPermissions.length > 0) {
      canAccess = this.AND(canAccess, this.hasAllPermissions(userPermissions, requiredPermissions));
    }

    return canAccess;
  }

  static canPerformAction(
    userPermissions: Record<string, any>,
    action: string,
    resource: string
  ): boolean {
    const permissionPath = `${resource}.${action}`;
    return this.hasExactPermission(userPermissions, permissionPath);
  }

  // Complex role-based access control patterns
  static canManageCourse(
    userRoles: Record<string, boolean>,
    userRoleLevel: number,
    courseUserId?: string,
    currentUserId?: string
  ): boolean {
    // Admin can manage all courses
    if (this.hasExactRole(userRoles, 'admin')) {
      return true;
    }

    // Teacher can manage their own courses or if no course owner specified
    if (this.hasExactRole(userRoles, 'teacher')) {
      return !courseUserId || courseUserId === currentUserId;
    }

    return false;
  }

  static canViewAnalytics(
    userRoles: Record<string, boolean>,
    userPermissions: Record<string, any>
  ): boolean {
    return this.OR(
      this.hasExactRole(userRoles, 'admin'),
      this.AND(
        this.hasExactRole(userRoles, 'teacher'),
        this.hasExactPermission(userPermissions, 'analytics.view')
      )
    );
  }

  static canManageUsers(
    userRoles: Record<string, boolean>,
    userPermissions: Record<string, any>
  ): boolean {
    return this.AND(
      this.hasExactRole(userRoles, 'admin'),
      this.hasExactPermission(userPermissions, 'users.manage')
    );
  }

  static canApproveContent(
    userRoles: Record<string, boolean>,
    userPermissions: Record<string, any>
  ): boolean {
    return this.OR(
      this.hasExactRole(userRoles, 'admin'),
      this.AND(
        this.hasExactRole(userRoles, 'moderator'),
        this.hasExactPermission(userPermissions, 'content.approve')
      )
    );
  }

  // Boolean algebra for navigation and UI control
  static shouldShowNavigationItem(
    userRoles: Record<string, boolean>,
    userPermissions: Record<string, any>,
    allowedRoles: string[],
    requiredPermissions?: string[]
  ): boolean {
    let shouldShow = this.hasAnyRole(userRoles, allowedRoles);

    if (requiredPermissions && requiredPermissions.length > 0) {
      shouldShow = this.AND(shouldShow, this.hasAllPermissions(userPermissions, requiredPermissions));
    }

    return shouldShow;
  }

  static shouldHideNavigationItem(
    userRoles: Record<string, boolean>,
    hiddenRoles: string[]
  ): boolean {
    return this.hasAnyRole(userRoles, hiddenRoles);
  }

  // Boolean algebra for content filtering
  static isContentVisible(
    userRoles: Record<string, boolean>,
    userRoleLevel: number,
    contentVisibility: string,
    contentAllowedRoles?: string[]
  ): boolean {
    switch (contentVisibility) {
      case 'public':
        return true;
      case 'role-based':
        return contentAllowedRoles ? this.hasAnyRole(userRoles, contentAllowedRoles) : true;
      case 'level-based':
        return userRoleLevel >= 5; // Minimum level for restricted content
      default:
        return true;
    }
  }

  static isContentEditable(
    userRoles: Record<string, boolean>,
    contentOwnerId?: string,
    currentUserId?: string
  ): boolean {
    return this.OR(
      this.hasExactRole(userRoles, 'admin'),
      this.AND(
        this.hasExactRole(userRoles, 'teacher'),
        this.OR(
          !contentOwnerId,
          contentOwnerId === currentUserId
        )
      )
    );
  }

  static isContentDeletable(
    userRoles: Record<string, boolean>,
    userPermissions: Record<string, any>,
    contentOwnerId?: string,
    currentUserId?: string
  ): boolean {
    return this.AND(
      this.hasExactPermission(userPermissions, 'content.delete'),
      this.isContentEditable(userRoles, contentOwnerId, currentUserId)
    );
  }

  // Utility function to get nested object value
  private static getNestedValue(obj: Record<string, any>, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  // Boolean algebra for conditional rendering
  static createCondition(
    userRoles: Record<string, boolean>,
    userRoleLevel: number,
    userPermissions: Record<string, any>
  ) {
    return {
      // Role-based conditions
      isAdmin: () => this.hasExactRole(userRoles, 'admin'),
      isTeacher: () => this.hasExactRole(userRoles, 'teacher'),
      isStudent: () => this.hasExactRole(userRoles, 'student'),
      isModerator: () => this.hasExactRole(userRoles, 'moderator'),
      
      // Level-based conditions
      hasMinimumLevel: (level: number) => this.hasHigherRole(userRoleLevel, level),
      hasMaximumLevel: (level: number) => this.hasLowerRole(userRoleLevel, level),
      
      // Permission-based conditions
      hasPermission: (permission: string) => this.hasExactPermission(userPermissions, permission),
      hasAnyPermission: (permissions: string[]) => this.hasAnyPermission(userPermissions, permissions),
      hasAllPermissions: (permissions: string[]) => this.hasAllPermissions(userPermissions, permissions),
      
      // Complex conditions
      canAccessAdminPanel: () => this.AND(
        this.hasExactRole(userRoles, 'admin'),
        this.hasExactPermission(userPermissions, 'dashboard.view')
      ),
      
      canAccessTeacherPanel: () => this.OR(
        this.hasExactRole(userRoles, 'admin'),
        this.AND(
          this.hasExactRole(userRoles, 'teacher'),
          this.hasExactPermission(userPermissions, 'dashboard.view')
        )
      ),
      
      canManageCourse: (courseUserId?: string, currentUserId?: string) => 
        this.canManageCourse(userRoles, userRoleLevel, courseUserId, currentUserId),
      
      canViewAnalytics: () => this.canViewAnalytics(userRoles, userPermissions),
      canManageUsers: () => this.canManageUsers(userRoles, userPermissions),
      canApproveContent: () => this.canApproveContent(userRoles, userPermissions),
    };
  }
}

// Export commonly used boolean algebra operations
export const {
  AND,
  OR,
  NOT,
  XOR,
  NAND,
  NOR,
  XNOR,
  AND_ALL,
  OR_ALL,
  hasAnyRole,
  hasAllRoles,
  hasExactRole,
  hasHigherRole,
  hasLowerRole,
  hasAnyPermission,
  hasAllPermissions,
  hasExactPermission,
  canAccessFeature,
  canPerformAction,
  canManageCourse,
  canViewAnalytics,
  canManageUsers,
  canApproveContent,
  shouldShowNavigationItem,
  shouldHideNavigationItem,
  isContentVisible,
  isContentEditable,
  isContentDeletable,
  createCondition
} = BooleanAlgebra; 