import React, { useRef, useEffect, useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import JobListingScreen from "./JobListingsScreen";
import CreateJobScreen from './CreateJobScreen';
import SavedDraftsScreen from './SavedDraftsScreen'; // Import the new screen
import Colors from "../../constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from '../../Context/auth';
import { useRoleChecker } from '../../utils/roleChecker';
import { 
  ShowForAdmin, 
  ShowForTeacher, 
  ShowForJobCreation,
  ShowForJobManagement,
  ShowForJobViewing,
  ShowForJobApplications,
  ShowForJobApplicationCreation,
  ShowForJobApplicationTracking,
  ShowForInterviewManagement,
  ShowForJobAnalytics,
  ShowForPanelMembersManagement
} from '../../component/RoleBasedUI';

const Tab = createMaterialTopTabNavigator();

function JobTabs() {
  const { userProfile, userRole } = useAuth();
  const roleChecker = useRoleChecker();

  // Determine which tabs to show based on user role
  const isAdmin = roleChecker?.isAdmin() || false;
  const isTeacher = roleChecker?.isTeacher() || false;
  const canCreateJobs = roleChecker?.canCreateJobs() || false;

  // Debug logging
  console.log('JobTabs Debug:', {
    roleChecker: !!roleChecker,
    isAdmin,
    isTeacher,
    canCreateJobs
  });

  return (
    <Tab.Navigator
     id={undefined}
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#ffffff',
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: 'bold',
          textTransform: 'capitalize',
        },
        tabBarIndicatorStyle: {
          backgroundColor: Colors.PRIMARY,
          height: 3,
        },
        tabBarActiveTintColor: Colors.PRIMARY,
        tabBarInactiveTintColor: Colors.GRAY,
      }}
    >
      {/* Always show "All Jobs" tab */}
      <Tab.Screen name="All Jobs" component={JobListingScreen} />
      
      {/* Show "Create Job" tab for admins or if role checking fails */}
      {(canCreateJobs || !roleChecker) && (
        <Tab.Screen name="Create Job" component={CreateJobScreen} />
      )}
      
      {/* Show "Saved Drafts" tab for admins only */}
      {isAdmin && (
        <Tab.Screen name="Saved Drafts" component={SavedDraftsScreen} />
      )}
    </Tab.Navigator>
  );
}

export default function JobsScreen() { 
  const router = useRouter();
  const { session, isLoading: authIsLoading, userProfile, userRole } = useAuth();
  const roleChecker = useRoleChecker();
  
  // Debug logging
  console.log('JobsScreen Debug:', {
    session: !!session,
    sessionUser: !!session?.user,
    sessionUserId: session?.user?.id,
    authIsLoading,
    userProfile: !!userProfile,
    userRole: !!userRole,
    roleChecker: !!roleChecker,
    isAdmin: roleChecker?.isAdmin(),
    isTeacher: roleChecker?.isTeacher()
  });
  
  // --- Fallback for stuck authIsLoading ---
  const [showAuthTimeout, setShowAuthTimeout] = useState(false);
  const authTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (authIsLoading) {
      authTimeoutRef.current = setTimeout(() => setShowAuthTimeout(true), 10000);
    } else {
      setShowAuthTimeout(false);
      if (authTimeoutRef.current) clearTimeout(authTimeoutRef.current);
    }
    return () => {
      if (authTimeoutRef.current) clearTimeout(authTimeoutRef.current);
    };
  }, [authIsLoading]);

  // Show loading state while authentication is being determined
  if (authIsLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.WHITE }}>
        <Text style={{ color: Colors.PRIMARY, fontSize: 16 }}>Loading authentication...</Text>
      </View>
    );
  }

  if (showAuthTimeout) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.WHITE }}>
        <Text style={{ color: Colors.ERROR, fontSize: 16, marginBottom: 16 }}>Network/authentication is taking too long.</Text>
        <TouchableOpacity onPress={() => router.replace('/(screens)/Jobs')} style={{ backgroundColor: Colors.PRIMARY, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}>
          <Text style={{ color: Colors.WHITE, fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const navigateToAdmin = () => {
    router.push('/(screens)/Jobs(selection)/AdminDashboard');
  };

  const navigateToInterviewDetails = () => {
    // This could be used for a general interview overview
    router.push('/(screens)/InterviewDetailsScreen');
  };

  const navigateToMyInterviews = () => {
    router.push('/(screens)/MyInterviewsScreen');
  };

  const navigateToPanelMembers = () => {
    router.push('/(screens)/PanelMembersScreen');
  };

  const navigateToJobAnalytics = () => {
    router.push('/(screens)/DashBoard');
  };

  // Safe role checking with fallbacks
  const isAdmin = roleChecker?.isAdmin() || false;
  const isTeacher = roleChecker?.isTeacher() || false;

  // If role checker is not available, show a basic interface
  if (!roleChecker) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
        <View style={styles.headerRow}>
          <View style={styles.headerSide}>
            <TouchableOpacity
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(screens)/Home')}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Job Portal</Text> 
          </View>
          <View style={styles.headerSide}>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={navigateToMyInterviews}
                style={styles.actionButton}
              >
                <Ionicons name="videocam" size={20} color={Colors.PRIMARY} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            👋 Welcome to the Job Portal! Loading user permissions...
          </Text>
        </View>
        
        {/* Show basic tabs when role checker is not available */}
        <Tab.Navigator
          id={undefined}
          screenOptions={{
            tabBarStyle: {
              backgroundColor: '#ffffff',
            },
            tabBarLabelStyle: {
              fontSize: 14,
              fontWeight: 'bold',
              textTransform: 'capitalize',
            },
            tabBarIndicatorStyle: {
              backgroundColor: Colors.PRIMARY,
              height: 3,
            },
            tabBarActiveTintColor: Colors.PRIMARY,
            tabBarInactiveTintColor: Colors.GRAY,
          }}
        >
          <Tab.Screen name="All Jobs" component={JobListingScreen} />
          <Tab.Screen name="Create Job" component={CreateJobScreen} />
        </Tab.Navigator>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <View style={styles.headerRow}>
        {/* Left: Back Button */}
        <View style={styles.headerSide}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(screens)/Home')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
        </View>
        {/* Center: Title only (remove Interview button) */}
        <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Job Portal</Text> 
        </View>
        {/* Right: Actions - Role-based */}
        <View style={styles.headerSide}>
          <View style={styles.headerActions}>
            {/* Show interview button for all users */}
            <TouchableOpacity
              onPress={navigateToMyInterviews}
              style={styles.actionButton}
            >
              <Ionicons name="videocam" size={20} color={Colors.PRIMARY} />
            </TouchableOpacity>
            
            {/* Admin-only actions */}
            {isAdmin && (
              <>
                <TouchableOpacity
                  onPress={navigateToAdmin}
                  style={styles.actionButton}
                >
                  <Ionicons name="people" size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={navigateToPanelMembers}
                  style={styles.actionButton}
                >
                  <Ionicons name="person-add" size={20} color={Colors.PRIMARY} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={navigateToJobAnalytics}
                  style={styles.actionButton}
                >
                  <Ionicons name="analytics" size={20} color={Colors.PRIMARY} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
      
      {/* Role-based welcome message */}
      <View style={styles.welcomeSection}>
        {isAdmin ? (
          <Text style={styles.welcomeText}>
            👑 Welcome, {userProfile?.name || 'Admin'}! You have full access to create jobs and manage panel members.
          </Text>
        ) : isTeacher ? (
          <Text style={styles.welcomeText}>
            📚 Welcome, {userProfile?.name || 'Teacher'}! You can view jobs, apply for positions, and track your applications.
          </Text>
        ) : (
          <Text style={styles.welcomeText}>
            👋 Welcome to the Job Portal! Browse available positions and apply for jobs.
          </Text>
        )}
      </View>
      
      <JobTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerSide: {
    flex: 1,
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  welcomeSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});