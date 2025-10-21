import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../Context/auth';
import { useRoleChecker } from '../utils/roleChecker';
import { 
  ShowForAdmin, 
  ShowForTeacher, 
  ShowForPermission,
  ShowForCourseCreation,
  ShowForWorkshopCreation,
  ShowForWebinarCreation,
  ShowForKnowledgeBaseCreation,
  ShowForSocialMediaCreation,
  ShowForEventCreation,
  ShowForBookCreation,
  ShowForCertificateCreation
} from './RoleBasedUI';
import Colors from '../constant/Colors';

export default function RoleTestScreen() {
  const { userProfile, userRole, permissionCheck, booleanAlgebra } = useAuth();
  const roleChecker = useRoleChecker();

  // Debug logging
  useEffect(() => {
    console.log('RoleTestScreen Debug Info:');
    console.log('userProfile:', userProfile);
    console.log('userRole:', userRole);
    console.log('permissionCheck:', permissionCheck);
    console.log('booleanAlgebra:', booleanAlgebra);
    
    if (permissionCheck) {
      console.log('Permission Check Results:');
      console.log('canCreateWebinars:', permissionCheck.canCreateWebinars());
      console.log('canCreateWorkshops:', permissionCheck.canCreateWorkshops());
      console.log('canCreateCourses:', permissionCheck.canCreateCourses());
    }
  }, [userProfile, userRole, permissionCheck, booleanAlgebra]);

  if (!roleChecker) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading role information...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔐 Role-Based Access Control Test</Text>
      
      {/* User Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 User Information</Text>
        <Text style={styles.infoText}>Name: {userProfile?.name || 'N/A'}</Text>
        <Text style={styles.infoText}>Occupation: {userProfile?.occupation || 'N/A'}</Text>
        <Text style={styles.infoText}>Role Level: {userRole?.role_level || 'N/A'}</Text>
        <Text style={styles.infoText}>Is Admin: {userRole?.is_admin ? '✅ Yes' : '❌ No'}</Text>
        <Text style={styles.infoText}>Is Teacher: {userRole?.is_teacher ? '✅ Yes' : '❌ No'}</Text>
        <Text style={styles.infoText}>Active: {userRole?.is_active ? '✅ Yes' : '❌ No'}</Text>
        <Text style={styles.infoText}>Suspended: {userRole?.is_suspended ? '❌ Yes' : '✅ No'}</Text>
      </View>

      {/* Role-Based UI Components */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎭 Role-Based UI Components</Text>
        
        <ShowForAdmin>
          <View style={styles.permissionItem}>
            <Text style={styles.permissionText}>✅ Admin Content - You can see this because you're an admin</Text>
          </View>
        </ShowForAdmin>

        <ShowForTeacher>
          <View style={styles.permissionItem}>
            <Text style={styles.permissionText}>✅ Teacher Content - You can see this because you're a teacher</Text>
          </View>
        </ShowForTeacher>

        <ShowForCourseCreation>
          <View style={styles.permissionItem}>
            <Text style={styles.permissionText}>✅ Course Creation - You can create courses</Text>
          </View>
        </ShowForCourseCreation>

        <ShowForWorkshopCreation>
          <View style={styles.permissionItem}>
            <Text style={styles.permissionText}>✅ Workshop Creation - You can create workshops</Text>
          </View>
        </ShowForWorkshopCreation>

        <ShowForWebinarCreation>
          <View style={styles.permissionItem}>
            <Text style={styles.permissionText}>✅ Webinar Creation - You can create webinars</Text>
          </View>
        </ShowForWebinarCreation>

        <ShowForKnowledgeBaseCreation>
          <View style={styles.permissionItem}>
            <Text style={styles.permissionText}>✅ Knowledge Base Creation - You can create knowledge base content</Text>
          </View>
        </ShowForKnowledgeBaseCreation>

        <ShowForSocialMediaCreation>
          <View style={styles.permissionItem}>
            <Text style={styles.permissionText}>✅ Social Media Creation - You can create social media posts</Text>
          </View>
        </ShowForSocialMediaCreation>

        <ShowForEventCreation>
          <View style={styles.permissionItem}>
            <Text style={styles.permissionText}>✅ Event Creation - You can create events</Text>
          </View>
        </ShowForEventCreation>

        <ShowForBookCreation>
          <View style={styles.permissionItem}>
            <Text style={styles.permissionText}>✅ Book Creation - You can create books</Text>
          </View>
        </ShowForBookCreation>

        <ShowForCertificateCreation>
          <View style={styles.permissionItem}>
            <Text style={styles.permissionText}>✅ Certificate Creation - You can create certificates</Text>
          </View>
        </ShowForCertificateCreation>
      </View>

      {/* Permission Testing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔍 Permission Testing</Text>
        
        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            Can Create Courses: {roleChecker.canCreateCourses() ? '✅ Yes' : '❌ No'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            Can Create Workshops: {roleChecker.canCreateWorkshops() ? '✅ Yes' : '❌ No'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            Can Create Webinars: {roleChecker.canCreateWebinars() ? '✅ Yes' : '❌ No'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            Can Create Knowledge Base: {roleChecker.canCreateKnowledgeBase() ? '✅ Yes' : '❌ No'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            Can Create Social Media Posts: {roleChecker.canCreateSocialMediaPosts() ? '✅ Yes' : '❌ No'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            Can Create Events: {roleChecker.canCreateEvents() ? '✅ Yes' : '❌ No'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            Can Create Books: {roleChecker.canCreateBooks() ? '✅ Yes' : '❌ No'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            Can Create Certificates: {roleChecker.canCreateCertificates() ? '✅ Yes' : '❌ No'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            Can View Courses: {roleChecker.canViewCourses() ? '✅ Yes' : '❌ No'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            Can View Workshops: {roleChecker.canViewWorkshops() ? '✅ Yes' : '❌ No'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            Can View Webinars: {roleChecker.canViewWebinars() ? '✅ Yes' : '❌ No'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            Can View Knowledge Base: {roleChecker.canViewKnowledgeBase() ? '✅ Yes' : '❌ No'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            Can View Social Media: {roleChecker.canViewSocialMedia() ? '✅ Yes' : '❌ No'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            Can View Events: {roleChecker.canViewEvents() ? '✅ Yes' : '❌ No'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            Can View Books: {roleChecker.canViewBooks() ? '✅ Yes' : '❌ No'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            Can View Certificates: {roleChecker.canViewCertificates() ? '✅ Yes' : '❌ No'}
          </Text>
        </View>
      </View>

      {/* Boolean Algebra Testing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧮 Boolean Algebra Testing</Text>
        
        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            AND(true, true): {roleChecker.AND(true, true) ? '✅ True' : '❌ False'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            OR(true, false): {roleChecker.OR(true, false) ? '✅ True' : '❌ False'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            NOT(false): {roleChecker.NOT(false) ? '✅ True' : '❌ False'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionText}>
            Can Access Admin Panel: {roleChecker.canAccessAdminPanel() ? '✅ Yes' : '❌ No'}
          </Text>
        </View>
      </View>

      {/* Navigation Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧭 Available Navigation Items</Text>
        <Text style={styles.infoText}>
          {roleChecker.getAvailableNavigationItems().join(', ')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: Colors.BLACK,
    marginBottom: 5,
  },
  permissionItem: {
    padding: 10,
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: Colors.BLACK,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.GRAY,
    textAlign: 'center',
    marginTop: 50,
  },
}); 