import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
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
import Colors from '../../constant/Colors';

const RoleTestScreen: React.FC = () => {
  const { userProfile, userRole, session } = useAuth();
  const roleChecker = useRoleChecker();

  const testRoleFunction = () => {
    if (!roleChecker) {
      Alert.alert('Error', 'Role checker not available');
      return;
    }

    const summary = roleChecker.getPermissionSummary();
    Alert.alert(
      'Role Test Results',
      `Admin: ${summary.isAdmin}\nTeacher: ${summary.isTeacher}\nCan Create Jobs: ${summary.canCreateJobs}\nCan View Jobs: ${summary.canViewJobs}\nCan Apply to Jobs: ${summary.canCreateJobApplications}\nCan Track Applications: ${summary.canTrackJobApplications}`
    );
  };

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to test roles</Text>
      </View>
    );
  }

  if (!userProfile || !userRole) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading user profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Job Portal Role-Based Authentication Test</Text>
        <Text style={styles.subtitle}>Testing specific job portal permissions</Text>
      </View>

      {/* User Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 User Information</Text>
        <Text style={styles.infoText}>Name: {userProfile.name}</Text>
        <Text style={styles.infoText}>Occupation: {userProfile.occupation}</Text>
        <Text style={styles.infoText}>Role Level: {userRole.role_level}</Text>
        <Text style={styles.infoText}>Admin: {userRole.is_admin ? '✅ Yes' : '❌ No'}</Text>
        <Text style={styles.infoText}>Teacher: {userRole.is_teacher ? '✅ Yes' : '❌ No'}</Text>
      </View>

      {/* Job Portal Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💼 Job Portal Features</Text>
        
        {/* Admin Job Portal Features */}
        <ShowForAdmin>
          <View style={styles.featureSection}>
            <Text style={styles.roleTitle}>👑 Admin Job Portal Features</Text>
            
            <ShowForJobCreation>
              <TouchableOpacity style={styles.featureButton} onPress={() => Alert.alert('Admin', 'Create Jobs feature')}>
                <Text style={styles.featureText}>💼 Create Jobs</Text>
              </TouchableOpacity>
            </ShowForJobCreation>

            <ShowForJobManagement>
              <TouchableOpacity style={styles.featureButton} onPress={() => Alert.alert('Admin', 'Manage Jobs feature')}>
                <Text style={styles.featureText}>🔧 Manage Jobs</Text>
              </TouchableOpacity>
            </ShowForJobManagement>

            <ShowForPanelMembersManagement>
              <TouchableOpacity style={styles.featureButton} onPress={() => Alert.alert('Admin', 'Manage Panel Members feature')}>
                <Text style={styles.featureText}>👥 Manage Panel Members</Text>
              </TouchableOpacity>
            </ShowForPanelMembersManagement>

            <ShowForInterviewManagement>
              <TouchableOpacity style={styles.featureButton} onPress={() => Alert.alert('Admin', 'Manage Interviews feature')}>
                <Text style={styles.featureText}>📅 Manage Interviews</Text>
              </TouchableOpacity>
            </ShowForInterviewManagement>

            <ShowForJobAnalytics>
              <TouchableOpacity style={styles.featureButton} onPress={() => Alert.alert('Admin', 'Job Analytics feature')}>
                <Text style={styles.featureText}>📊 Job Analytics</Text>
              </TouchableOpacity>
            </ShowForJobAnalytics>

            <ShowForJobApplications>
              <TouchableOpacity style={styles.featureButton} onPress={() => Alert.alert('Admin', 'View Job Applications feature')}>
                <Text style={styles.featureText}>📋 View All Job Applications</Text>
              </TouchableOpacity>
            </ShowForJobApplications>
          </View>
        </ShowForAdmin>

        {/* Teacher Job Portal Features */}
        <ShowForTeacher>
          <View style={styles.featureSection}>
            <Text style={styles.roleTitle}>📚 Teacher Job Portal Features</Text>
            
            <ShowForJobViewing>
              <TouchableOpacity style={styles.featureButton} onPress={() => Alert.alert('Teacher', 'View Available Jobs feature')}>
                <Text style={styles.featureText}>👀 View Available Jobs</Text>
              </TouchableOpacity>
            </ShowForJobViewing>

            <ShowForJobApplicationCreation>
              <TouchableOpacity style={styles.featureButton} onPress={() => Alert.alert('Teacher', 'Apply for Jobs feature')}>
                <Text style={styles.featureText}>📝 Apply for Jobs</Text>
              </TouchableOpacity>
            </ShowForJobApplicationCreation>

            <ShowForJobApplicationTracking>
              <TouchableOpacity style={styles.featureButton} onPress={() => Alert.alert('Teacher', 'Track My Applications feature')}>
                <Text style={styles.featureText}>📊 Track My Applications</Text>
              </TouchableOpacity>
            </ShowForJobApplicationTracking>

            <ShowForJobApplications>
              <TouchableOpacity style={styles.featureButton} onPress={() => Alert.alert('Teacher', 'View Job Applications feature')}>
                <Text style={styles.featureText}>📋 View Job Applications</Text>
              </TouchableOpacity>
            </ShowForJobApplications>
          </View>
        </ShowForTeacher>
      </View>

      {/* Permission Testing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧪 Job Portal Permission Testing</Text>
        
        <TouchableOpacity style={styles.testButton} onPress={testRoleFunction}>
          <Text style={styles.testButtonText}>Test Job Portal Permissions</Text>
        </TouchableOpacity>

        {roleChecker && (
          <View style={styles.permissionGrid}>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionLabel}>Can Create Jobs:</Text>
              <Text style={[styles.permissionValue, { color: roleChecker.canCreateJobs() ? 'green' : 'red' }]}>
                {roleChecker.canCreateJobs() ? '✅ Yes' : '❌ No'}
              </Text>
            </View>

            <View style={styles.permissionItem}>
              <Text style={styles.permissionLabel}>Can Manage Jobs:</Text>
              <Text style={[styles.permissionValue, { color: roleChecker.canManageJobs() ? 'green' : 'red' }]}>
                {roleChecker.canManageJobs() ? '✅ Yes' : '❌ No'}
              </Text>
            </View>

            <View style={styles.permissionItem}>
              <Text style={styles.permissionLabel}>Can View Jobs:</Text>
              <Text style={[styles.permissionValue, { color: roleChecker.canViewJobs() ? 'green' : 'red' }]}>
                {roleChecker.canViewJobs() ? '✅ Yes' : '❌ No'}
              </Text>
            </View>

            <View style={styles.permissionItem}>
              <Text style={styles.permissionLabel}>Can Apply for Jobs:</Text>
              <Text style={[styles.permissionValue, { color: roleChecker.canCreateJobApplications() ? 'green' : 'red' }]}>
                {roleChecker.canCreateJobApplications() ? '✅ Yes' : '❌ No'}
              </Text>
            </View>

            <View style={styles.permissionItem}>
              <Text style={styles.permissionLabel}>Can Track Applications:</Text>
              <Text style={[styles.permissionValue, { color: roleChecker.canTrackJobApplications() ? 'green' : 'red' }]}>
                {roleChecker.canTrackJobApplications() ? '✅ Yes' : '❌ No'}
              </Text>
            </View>

            <View style={styles.permissionItem}>
              <Text style={styles.permissionLabel}>Can Manage Panel Members:</Text>
              <Text style={[styles.permissionValue, { color: roleChecker.canManagePanelMembers() ? 'green' : 'red' }]}>
                {roleChecker.canManagePanelMembers() ? '✅ Yes' : '❌ No'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Boolean Algebra Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔢 Job Portal Boolean Algebra Examples</Text>
        
        <Text style={styles.exampleText}>
          <Text style={styles.bold}>Admin Job Creation:</Text> Admin AND Can Create Jobs = {roleChecker?.AND(roleChecker.isAdmin(), roleChecker.canCreateJobs()) ? 'True' : 'False'}
        </Text>
        
        <Text style={styles.exampleText}>
          <Text style={styles.bold}>Teacher Job Viewing:</Text> Teacher AND Can View Jobs = {roleChecker?.AND(roleChecker.isTeacher(), roleChecker.canViewJobs()) ? 'True' : 'False'}
        </Text>
        
        <Text style={styles.exampleText}>
          <Text style={styles.bold}>Job Application Tracking:</Text> Admin OR (Teacher AND Can Track Applications) = {roleChecker?.OR(roleChecker.isAdmin(), roleChecker.AND(roleChecker.isTeacher(), roleChecker.canTrackJobApplications())) ? 'True' : 'False'}
        </Text>
        
        <Text style={styles.exampleText}>
          <Text style={styles.bold}>Panel Management:</Text> Admin AND Can Manage Panel Members = {roleChecker?.AND(roleChecker.isAdmin(), roleChecker.canManagePanelMembers()) ? 'True' : 'False'}
        </Text>
      </View>

      {/* Access Control Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 Job Portal Access Control Summary</Text>
        
        <View style={styles.accessControl}>
          <Text style={styles.accessTitle}>👑 Admin Access:</Text>
          <Text style={styles.accessText}>• Create and manage jobs</Text>
          <Text style={styles.accessText}>• Manage panel members</Text>
          <Text style={styles.accessText}>• View all job applications</Text>
          <Text style={styles.accessText}>• Manage interviews</Text>
          <Text style={styles.accessText}>• View job analytics</Text>
          <Text style={styles.accessText}>• Approve/reject applications</Text>
        </View>

        <View style={styles.accessControl}>
          <Text style={styles.accessTitle}>📚 Teacher Access:</Text>
          <Text style={styles.accessText}>• View available jobs</Text>
          <Text style={styles.accessText}>• Apply for jobs</Text>
          <Text style={styles.accessText}>• Track own applications</Text>
          <Text style={styles.accessText}>• View job applications</Text>
          <Text style={styles.accessText}>• Cannot create jobs</Text>
          <Text style={styles.accessText}>• Cannot manage panel members</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  featureSection: {
    marginBottom: 20,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  featureButton: {
    backgroundColor: Colors.PRIMARY,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  featureText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  testButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  testButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  permissionGrid: {
    gap: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  permissionLabel: {
    fontSize: 16,
    color: '#555',
    flex: 1,
  },
  permissionValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  exampleText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  bold: {
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#FF3B30',
  },
  accessControl: {
    marginBottom: 16,
  },
  accessTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  accessText: {
    fontSize: 16,
    marginBottom: 4,
    color: '#555',
    marginLeft: 8,
  },
});

export default RoleTestScreen; 