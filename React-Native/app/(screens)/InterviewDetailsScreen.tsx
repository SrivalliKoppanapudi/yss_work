// app/(screens)/InterviewDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
  Share,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '../../constant/Colors';
import { supabase } from '../../lib/Superbase';
import { InterviewDetails, InterviewPanelistV2 } from '../../types/jobs';
import {
  ArrowLeft,
  Video,
  MapPin,
  CalendarDays,
  Clock,
  Users,
  Info,
  Link as LinkIcon,
  Share2,
  AlertCircle,
} from 'lucide-react-native';
import { JobService } from '../../lib/jobService';

// --- Helper Components ---
const DetailRow = ({ icon, label, children }: { icon: React.ReactNode, label: string, children: React.ReactNode }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>{icon}</View>
    <View style={styles.detailTextContainer}>
      <Text style={styles.detailLabel}>{label}</Text>
      {children}
    </View>
  </View>
);

const InterviewDetailsScreen = () => {
  const router = useRouter();
  const { applicationId } = useLocalSearchParams();
  
  const [interview, setInterview] = useState<InterviewDetails | null>(null);
  const [panelists, setPanelists] = useState<InterviewPanelistV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 

  useEffect(() => {
    if (applicationId) {
      fetchInterviewDetails();
    }
  }, [applicationId]);

  const fetchInterviewDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch application with job and interview details
      const { data: applicationData, error: applicationError } = await supabase
        .from('job_applications')
        .select(`
          *,
          job:jobs(job_name, company_name, preferred_location),
          interview_schedule:interview_schedules(*)
        `)
        .eq('id', applicationId)
        .single();

      if (applicationError) throw applicationError;

      if (!applicationData.interview_schedule) {
        setError('No interview scheduled for this application');
        setLoading(false);
        return;
      }

      // Fetch panelists
      let panel: InterviewPanelistV2[] = [];
      if (applicationData.interview_schedule.id) {
        panel = await JobService.getPanelistsV2(applicationData.interview_schedule.id);
      }

      // Transform the data to match InterviewDetails interface
      const interviewDetails: InterviewDetails = {
        jobTitle: applicationData.job?.job_name || 'Unknown Job',
        companyName: applicationData.job?.company_name || 'Unknown Company',
        round: applicationData.interview_schedule.round || '',
        interviewType: applicationData.interview_schedule.interview_type,
        date: applicationData.interview_schedule.interview_date || '',
        time: applicationData.interview_schedule.interview_time || '',
        duration: applicationData.interview_schedule.duration || 60,
        panel: panel.map(p => p.name),
        notes: applicationData.interview_schedule.additional_notes,
        meetingLink: applicationData.interview_schedule.meeting_link || undefined,
        address: applicationData.interview_schedule.location || undefined,
        instructions: applicationData.interview_schedule.additional_notes,
      };

      setInterview(interviewDetails);
      setPanelists(panel);
    } catch (error: any) {
      console.error('Error fetching interview details:', error);
      setError(error.message || 'Failed to load interview details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(`Don't know how to open this URL: ${url}`);
    }
  };
  
  const handleShare = async () => {
    if (!interview) return;
    
    let message = `Interview Reminder:\n\nJob: ${interview.jobTitle}\nCompany: ${interview.companyName}\nDate: ${new Date(interview.date).toLocaleString()}\n`;
    if (interview.interviewType === 'online' && interview.meetingLink) {
        message += `Meeting Link: ${interview.meetingLink}`;
    } else if (interview.interviewType === 'offline' && interview.address) {
        message += `Location: ${interview.address}`;
    }
    try {
        await Share.share({ message });
    } catch (error: any) {
        Alert.alert('Share Error', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ArrowLeft size={24} color={Colors.PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Interview Schedule</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
          <Text style={styles.loadingText}>Loading interview details...</Text>
        </View>
      </View>
    );
  }

  if (error || !interview) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ArrowLeft size={24} color={Colors.PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Interview Schedule</Text>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.GRAY} />
          <Text style={styles.errorText}>{error || 'Interview not found'}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchInterviewDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Interview Schedule</Text>
         <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
          <Share2 size={22} color={Colors.PRIMARY} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.titleSection}>
          <Text style={styles.jobTitle}>{interview.jobTitle}</Text>
          <Text style={styles.companyName}>{interview.companyName}</Text>
          <Text style={styles.roundName}>{interview.round}</Text>
        </View>

        {/* --- Online Interview Details --- */}
        {interview.interviewType === 'online' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Video size={22} color={Colors.PRIMARY} />
                <Text style={styles.sectionTitle}>Online Interview Details</Text>
            </View>
            <DetailRow icon={<LinkIcon size={20} color={Colors.GRAY} />} label="Meeting Link">
                <TouchableOpacity onPress={() => handleOpenLink(interview.meetingLink!)}>
                    <Text style={styles.linkText}>{interview.meetingLink}</Text>
                </TouchableOpacity>
            </DetailRow>
          </View>
        )}

        {/* --- Offline Interview Details --- */}
        {interview.interviewType === 'offline' && (
           <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <MapPin size={22} color={Colors.PRIMARY} />
                <Text style={styles.sectionTitle}>In-Person Interview Details</Text>
            </View>
            <DetailRow icon={<MapPin size={20} color={Colors.GRAY} />} label="Location">
                <Text style={styles.detailValue}>{interview.address}</Text>
            </DetailRow>
            {interview.instructions && (
                <DetailRow icon={<Info size={20} color={Colors.GRAY} />} label="On-site Instructions">
                    <Text style={styles.detailValue}>{interview.instructions}</Text>
                </DetailRow>
            )}
          </View>
        )}

        {/* --- Common Details --- */}
        <View style={styles.section}>
           <View style={styles.sectionHeader}>
                <CalendarDays size={22} color={Colors.PRIMARY} />
                <Text style={styles.sectionTitle}>Schedule & Panel</Text>
            </View>
            <DetailRow icon={<CalendarDays size={20} color={Colors.GRAY} />} label="Date">
              <Text style={styles.detailValue}>
                {interview.date
                  ? new Date(interview.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                  : <Text style={{ color: Colors.ERROR }}>No date set</Text>}
              </Text>
            </DetailRow>
            <DetailRow icon={<Clock size={20} color={Colors.GRAY} />} label="Time">
              <Text style={styles.detailValue}>
                {interview.time
                  ? interview.time
                  : <Text style={{ color: Colors.ERROR }}>No time set</Text>}
              </Text>
            </DetailRow>
            {interview.round && (
                <DetailRow icon={<Info size={20} color={Colors.GRAY} />} label="Round">
                    <Text style={styles.detailValue}>{interview.round}</Text>
                </DetailRow>
            )}
             <DetailRow icon={<Clock size={20} color={Colors.GRAY} />} label="Duration">
              <Text style={styles.detailValue}>{interview.duration} minutes</Text>
            </DetailRow>
            {/* Interview Panel Box */}
             <DetailRow icon={<Users size={20} color={Colors.GRAY} />} label="Interview Panel">
              {panelists.length > 0 ? (
                <View style={{ width: '100%' }}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Panel Information:</Text>
                  {panelists.map(panelist => (
                    <View key={panelist.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, padding: 8, marginBottom: 4, width: '100%' }}>
                      {panelist.photo_url ? (
                        <Image source={{ uri: panelist.photo_url }} style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: '#e0e0e0' }} />
                      ) : (
                        <View style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: Colors.GRAY, fontSize: 18 }}>{panelist.name?.[0] || '?'}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold' }}>{panelist.name}</Text>
                        {panelist.role && <Text style={{ color: Colors.GRAY }}>Role: {panelist.role}</Text>}
                        {panelist.organization && <Text style={{ color: Colors.GRAY }}>Org: {panelist.organization}</Text>}
                        {panelist.email && <Text style={{ color: Colors.GRAY }}>Email: {panelist.email}</Text>}
                        {panelist.phone && <Text style={{ color: Colors.GRAY }}>Phone: {panelist.phone}</Text>}
                        {panelist.linkedin_url && <Text style={{ color: Colors.PRIMARY, textDecorationLine: 'underline' }} onPress={() => Linking.openURL(panelist.linkedin_url!)}>LinkedIn</Text>}
                        {panelist.notes && <Text style={{ color: Colors.GRAY }}>Notes: {panelist.notes}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.detailValue}>No panelists added</Text>
              )}
            </DetailRow>
        </View>

        {/* --- Notes Section --- */}
        {interview.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Info size={22} color={Colors.PRIMARY} />
                <Text style={styles.sectionTitle}>Important Notes</Text>
            </View>
            <Text style={styles.notesText}>{interview.notes}</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.GRAY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.GRAY,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.BLACK,
    textAlign: 'center',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.BLACK,
  },
  companyName: {
    fontSize: 16,
    color: Colors.GRAY,
    marginTop: 4,
  },
  roundName: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors.PRIMARY,
      marginTop: 8,
      backgroundColor: Colors.PRIMARY_LIGHT,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      alignSelf: 'flex-start'
  },
  section: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.PRIMARY,
    marginLeft: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.GRAY,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.BLACK,
    lineHeight: 22,
  },
  linkText: {
    fontSize: 16,
    color: Colors.PRIMARY,
    textDecorationLine: 'underline',
  },
  notesText: {
      fontSize: 15,
      color: '#4A4A4A',
      lineHeight: 22,
      fontStyle: 'italic',
      backgroundColor: '#f8f9fa',
      padding: 12,
      borderRadius: 8,
  }
});

export default InterviewDetailsScreen;