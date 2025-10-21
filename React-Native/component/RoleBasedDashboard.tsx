import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../Context/auth';
import { 
  ShowForAdmin, 
  ShowForTeacher, 
  ShowForPermission,
  ShowForAnalytics,
  ShowForUserManagement,
  ShowForContentApproval,
  ShowForPaymentManagement,
  ShowForReportGeneration,
  ShowForSettingsManagement,
  ShowForJobCreation,
  ShowForJobManagement,
  ShowForJobApplications,
  ShowForJobApplicationCreation,
  ShowForInterviewManagement,
  ShowForJobAnalytics,
  ShowForPanelMembersManagement,
  useRoleBasedUI
} from './RoleBasedUI';

const RoleBasedDashboard: React.FC = () => {
  const { userProfile, userRole, permissionCheck } = useAuth();
  const { isAdmin, isTeacher, hasPermission } = useRoleBasedUI();

  if (!userProfile || !userRole) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading user profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* User Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Information</Text>
        <Text style={styles.userInfo}>Name: {userProfile.name}</Text>
        <Text style={styles.userInfo}>Occupation: {userProfile.occupation}</Text>
        <Text style={styles.userInfo}>Role Level: {userRole.role_level}</Text>
        <Text style={styles.userInfo}>Status: {userProfile.is_active ? 'Active' : 'Inactive'}</Text>
      </View>

      {/* Role-based Navigation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Features</Text>
        
        {/* Admin Features */}
        <ShowForAdmin>
          <View style={styles.featureSection}>
            <Text style={styles.roleTitle}>🔧 Admin Features</Text>
            
            <ShowForPermission permission="dashboard.view">
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>📊 System Dashboard</Text>
              </TouchableOpacity>
            </ShowForPermission>

            <ShowForUserManagement>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>👥 User Management</Text>
              </TouchableOpacity>
            </ShowForUserManagement>

            <ShowForAnalytics>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>📈 Analytics & Reports</Text>
              </TouchableOpacity>
            </ShowForAnalytics>

            <ShowForPaymentManagement>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>💰 Payment Management</Text>
              </TouchableOpacity>
            </ShowForPaymentManagement>

            <ShowForReportGeneration>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>📋 Generate Reports</Text>
              </TouchableOpacity>
            </ShowForReportGeneration>

            <ShowForSettingsManagement>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>⚙️ System Settings</Text>
              </TouchableOpacity>
            </ShowForSettingsManagement>

            {/* Job Portal - Admin Only */}
            <ShowForJobCreation>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>💼 Create Jobs</Text>
              </TouchableOpacity>
            </ShowForJobCreation>

            <ShowForJobManagement>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>🔧 Manage Jobs</Text>
              </TouchableOpacity>
            </ShowForJobManagement>

            <ShowForPanelMembersManagement>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>👥 Manage Panel Members</Text>
              </TouchableOpacity>
            </ShowForPanelMembersManagement>

            <ShowForInterviewManagement>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>📅 Manage Interviews</Text>
              </TouchableOpacity>
            </ShowForInterviewManagement>

            <ShowForJobAnalytics>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>📊 Job Analytics</Text>
              </TouchableOpacity>
            </ShowForJobAnalytics>
          </View>
        </ShowForAdmin>

        {/* Teacher Features */}
        <ShowForTeacher>
          <View style={styles.featureSection}>
            <Text style={styles.roleTitle}>📚 Teacher Features</Text>
            
            <ShowForPermission permission="courses.create">
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>➕ Create Course</Text>
              </TouchableOpacity>
            </ShowForPermission>

            <ShowForPermission permission="courses.edit">
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>✏️ Edit Courses</Text>
              </TouchableOpacity>
            </ShowForPermission>

            <ShowForPermission permission="courses.publish">
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>📤 Publish Course</Text>
              </TouchableOpacity>
            </ShowForPermission>

            <ShowForAnalytics>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>📊 Course Analytics</Text>
              </TouchableOpacity>
            </ShowForAnalytics>

            <ShowForContentApproval>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>✅ Approve Content</Text>
              </TouchableOpacity>
            </ShowForContentApproval>

            {/* Job Portal - Teacher Access */}
            <ShowForJobApplications>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>📋 View Job Applications</Text>
              </TouchableOpacity>
            </ShowForJobApplications>

            <ShowForJobApplicationCreation>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>📝 Apply for Jobs</Text>
              </TouchableOpacity>
            </ShowForJobApplicationCreation>

            <ShowForPermission permission="interviews.view">
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>📅 Track Interviews</Text>
              </TouchableOpacity>
            </ShowForPermission>

            <ShowForPermission permission="webinars.create">
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>🎥 Create Webinars</Text>
              </TouchableOpacity>
            </ShowForPermission>

            <ShowForPermission permission="workshops.create">
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>🛠️ Create Workshops</Text>
              </TouchableOpacity>
            </ShowForPermission>

            <ShowForPermission permission="knowledge_base.create">
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>📚 Create Knowledge Base</Text>
              </TouchableOpacity>
            </ShowForPermission>

            <ShowForPermission permission="social_media.create">
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>📱 Social Media Posts</Text>
              </TouchableOpacity>
            </ShowForPermission>

            <ShowForPermission permission="events.create">
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureText}>🎉 Create Events</Text>
              </TouchableOpacity>
            </ShowForPermission>
          </View>
        </ShowForTeacher>
      </View>

      {/* Permission Testing Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permission Testing</Text>
        
        <View style={styles.permissionGrid}>
          <View style={styles.permissionItem}>
            <Text style={styles.permissionLabel}>Can Create Courses:</Text>
            <Text style={[styles.permissionValue, { color: hasPermission('courses.create') ? 'green' : 'red' }]}>
              {hasPermission('courses.create') ? '✅ Yes' : '❌ No'}
            </Text>
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permissionLabel}>Can Edit Courses:</Text>
            <Text style={[styles.permissionValue, { color: hasPermission('courses.edit') ? 'green' : 'red' }]}>
              {hasPermission('courses.edit') ? '✅ Yes' : '❌ No'}
            </Text>
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permissionLabel}>Can Delete Courses:</Text>
            <Text style={[styles.permissionValue, { color: hasPermission('courses.delete') ? 'green' : 'red' }]}>
              {hasPermission('courses.delete') ? '✅ Yes' : '❌ No'}
            </Text>
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permissionLabel}>Can View Analytics:</Text>
            <Text style={[styles.permissionValue, { color: hasPermission('analytics.view') ? 'green' : 'red' }]}>
              {hasPermission('analytics.view') ? '✅ Yes' : '❌ No'}
            </Text>
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permissionLabel}>Can Manage Users:</Text>
            <Text style={[styles.permissionValue, { color: hasPermission('users.manage') ? 'green' : 'red' }]}>
              {hasPermission('users.manage') ? '✅ Yes' : '❌ No'}
            </Text>
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permissionLabel}>Can Approve Content:</Text>
            <Text style={[styles.permissionValue, { color: hasPermission('content.approve') ? 'green' : 'red' }]}>
              {hasPermission('content.approve') ? '✅ Yes' : '❌ No'}
            </Text>
          </View>

          {/* Job Portal Permissions */}
          <View style={styles.permissionItem}>
            <Text style={styles.permissionLabel}>Can Create Jobs:</Text>
            <Text style={[styles.permissionValue, { color: hasPermission('jobs.create') ? 'green' : 'red' }]}>
              {hasPermission('jobs.create') ? '✅ Yes' : '❌ No'}
            </Text>
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permissionLabel}>Can Manage Jobs:</Text>
            <Text style={[styles.permissionValue, { color: hasPermission('jobs.manage') ? 'green' : 'red' }]}>
              {hasPermission('jobs.manage') ? '✅ Yes' : '❌ No'}
            </Text>
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permissionLabel}>Can View Job Applications:</Text>
            <Text style={[styles.permissionValue, { color: hasPermission('job_applications.view') ? 'green' : 'red' }]}>
              {hasPermission('job_applications.view') ? '✅ Yes' : '❌ No'}
            </Text>
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permissionLabel}>Can Apply for Jobs:</Text>
            <Text style={[styles.permissionValue, { color: hasPermission('job_applications.create') ? 'green' : 'red' }]}>
              {hasPermission('job_applications.create') ? '✅ Yes' : '❌ No'}
            </Text>
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permissionLabel}>Can Manage Interviews:</Text>
            <Text style={[styles.permissionValue, { color: hasPermission('interviews.manage') ? 'green' : 'red' }]}>
              {hasPermission('interviews.manage') ? '✅ Yes' : '❌ No'}
            </Text>
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permissionLabel}>Can View Job Analytics:</Text>
            <Text style={[styles.permissionValue, { color: hasPermission('job_analytics.view') ? 'green' : 'red' }]}>
              {hasPermission('job_analytics.view') ? '✅ Yes' : '❌ No'}
            </Text>
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permissionLabel}>Can Manage Panel Members:</Text>
            <Text style={[styles.permissionValue, { color: hasPermission('panel_members.manage') ? 'green' : 'red' }]}>
              {hasPermission('panel_members.manage') ? '✅ Yes' : '❌ No'}
            </Text>
          </View>
        </View>
      </View>

      {/* Role Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Role Information</Text>
        
        <View style={styles.roleInfo}>
          <Text style={styles.roleInfoText}>
            <Text style={styles.bold}>Admin:</Text> {isAdmin() ? '✅ Yes' : '❌ No'}
          </Text>
          <Text style={styles.roleInfoText}>
            <Text style={styles.bold}>Teacher:</Text> {isTeacher() ? '✅ Yes' : '❌ No'}
          </Text>
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
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
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
  userInfo: {
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
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  featureText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
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
  roleInfo: {
    gap: 8,
  },
  roleInfoText: {
    fontSize: 16,
    color: '#555',
  },
  bold: {
    fontWeight: 'bold',
  },
});

export default RoleBasedDashboard; 