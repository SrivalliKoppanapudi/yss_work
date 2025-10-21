import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/Superbase';
import { Platform } from 'react-native';
import { roleAuthService } from '../lib/roleAuthService';
import { UserProfile, UserRole, PermissionCheck, RoleBooleanAlgebra } from '../types/auth';
import { useRouter } from 'expo-router';

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  userProfile: UserProfile | null;
  userRole: UserRole | null;
  permissionCheck: PermissionCheck | null;
  booleanAlgebra: RoleBooleanAlgebra | null;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loadUserProfile: () => Promise<void>;
  updateUserRole: (userId: string, roleUpdates: Partial<UserProfile>) => Promise<boolean>;
  migrateUserRole: (userId: string, occupation?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [permissionCheck, setPermissionCheck] = useState<PermissionCheck | null>(null);
  const [booleanAlgebra, setBooleanAlgebra] = useState<RoleBooleanAlgebra | null>(null);
  const router=useRouter()

  useEffect(() => {
    // Initialize session
    const initializeSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        // Do not block UI on profile loading; load it asynchronously
        if (session?.user) {
          (async () => {
            try {
              await loadUserProfile(session);
            } catch (e) {
              console.error('Error loading user profile (non-blocking):', e);
            }
          })();
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        // Ensure the app does not get stuck on a loading screen
        setIsLoading(false);
      }
    };

    initializeSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[AuthContext] onAuthStateChange:', { event: _event, hasUser: !!session?.user });
      setSession(session);
      
      if (session?.user) {
        // Load profile asynchronously without blocking
        (async () => {
          try {
            await loadUserProfile(session);
          } catch (e) {
            console.error('[AuthContext] Profile loading failed in auth state change:', e);
          }
        })();
      } else {
        // Clear user data on logout
        setUserProfile(null);
        setUserRole(null);
        setPermissionCheck(null);
        setBooleanAlgebra(null);
        roleAuthService.clearUserData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
 

  const loadUserProfile = async (currentSession?: Session | null) => {
    const sessionToUse = currentSession || session;
    console.log('loadUserProfile: Session object:', sessionToUse);
    console.log('loadUserProfile: Session user:', sessionToUse?.user);
    
    if (!sessionToUse?.user) {
      console.log('loadUserProfile: No session user available');
      return;
    }

    console.log('loadUserProfile: Starting to load profile for user:', sessionToUse.user.id);

    try {
      // Add timeout to prevent hanging on migration check
      const migrationPromise = roleAuthService.checkAndMigrateUser(sessionToUse.user.id);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Migration check timeout')), 5000)
      );
      
      console.log('Checking if user needs migration...');
      try {
        const migrationSuccess = await Promise.race([migrationPromise, timeoutPromise]);
        console.log('User migration completed or not needed:', migrationSuccess);
      } catch (migrationError) {
        console.warn('Migration check failed or timed out, continuing...', migrationError);
      }

      // Now load the user profile and role with timeout
      console.log('Loading user profile...');
      const profilePromise = roleAuthService.loadUserProfile(sessionToUse.user.id);
      const profileTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile load timeout')), 5000)
      );
      
      try {
        const profile = await Promise.race([profilePromise, profileTimeoutPromise]) as UserProfile | null;
        console.log('Profile loaded:', profile ? 'success' : 'failed');
        
        console.log('Loading user role...');
        const role = await roleAuthService.loadUserRole(sessionToUse.user.id);
        console.log('Role loaded:', role ? 'success' : 'failed');
        
        if (profile) {
          setUserProfile(profile);
          setUserRole(role);
          setPermissionCheck(roleAuthService.getPermissionChecker());
          setBooleanAlgebra(roleAuthService.getBooleanAlgebra());
          
          console.log('User profile loaded successfully:', {
            userId: profile.id,
            name: profile.name,
            occupation: profile.occupation,
            isAdmin: profile.is_admin,
            isTeacher: profile.is_teacher,
            roleLevel: profile.role_level,
          });
        } else {
          console.log('Failed to load user profile - profile is null');
        }
      } catch (profileError) {
        console.error('Profile loading failed or timed out:', profileError);
        // Continue without profile data to avoid blocking the app
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const getRedirectURL = () => {
    if (Platform.OS === 'web') {
      return `${window.location.origin}/auth/callback`;
    }
    return 'your-app-scheme://auth/callback';
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getRedirectURL(),
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectURL(),
    });
    if (error) throw error;
  };

  const updateUserRole = async (userId: string, roleUpdates: Partial<UserProfile>): Promise<boolean> => {
    const success = await roleAuthService.updateUserRole(userId, roleUpdates);
    if (success) {
      // Reload user profile to get updated data
      await loadUserProfile(session);
    }
    return success;
  };

  const migrateUserRole = async (userId: string, occupation?: string): Promise<boolean> => {
    const success = await roleAuthService.migrateUserRole(userId, occupation);
    if (success) {
      // Reload user profile to get updated data
      await loadUserProfile();
    }
    return success;
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      isLoading, 
      userProfile,
      userRole,
      permissionCheck,
      booleanAlgebra,
      signUp, 
      signIn, 
      signOut,
      resetPassword,
      loadUserProfile,
      updateUserRole,
      migrateUserRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};