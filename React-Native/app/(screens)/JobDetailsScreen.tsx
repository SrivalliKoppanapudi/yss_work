import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Share,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/Superbase';
import { Job, JobApplication, InterviewPanelist } from '../../types/jobs';
import Colors from '../../constant/Colors';
import { useAuth } from '../../Context/auth';
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  CheckCircle,
  Clock,
  DollarSign,
  Info,
  Layers,
  Mail,
  MapPin,
  Phone,
  Share2,
  Bookmark as BookmarkIcon,
  Users,
  Building,
  X,
  UserCheck,
  Award,
  UserX,
  FileText,
  XCircle,
  ChevronRight,
} from 'lucide-react-native';
import JobApplicationModal from '../../component/jobs/applicationForm/JobApplicationModal';
import { JobService } from '../../lib/jobService';

  const statusTimeline = [
    { status: 'Applied', icon: <FileText size={20} color={Colors.WHITE} />, text: 'Application Sent' },
    { status: 'Viewed', icon: <UserCheck size={20} color={Colors.WHITE} />, text: 'Application Viewed' },
    { status: 'Shortlisted', icon: <CheckCircle size={20} color={Colors.WHITE} />, text: 'Shortlisted' },
    { status: 'Interviewing', icon: <Briefcase size={20} color={Colors.WHITE} />, text: 'Interviewing' },
    { status: 'Offered', icon: <Award size={20} color={Colors.WHITE} />, text: 'Offer Extended' },
    { status: 'Hired', icon: <Award size={20} color={Colors.SUCCESS} />, text: 'Hired!' }
  ];
  const terminalStatuses = ['Rejected', 'Withdrawn'];

// --- ApplicationStatusModal Component ---
const ApplicationStatusModal: React.FC<{
  isVisible: boolean;
  onClose: () => void;
  application: JobApplication;
}> = ({ isVisible, onClose, application }) => {
  const router = useRouter();
  const [panelists, setPanelists] = useState<InterviewPanelist[]>([]);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewError, setInterviewError] = useState<string | null>(null);

  const currentStatusIndex = statusTimeline.findIndex(s => s.status === application.status);

  useEffect(() => {
    if (application?.id && application.status === 'Interviewing') {
      setInterviewLoading(true);
      setInterviewError(null);
      JobService.getInterviewScheduleWithPanelByApplicationId(application.id)
        .then(schedule => setPanelists(schedule?.panelists || []))
        .catch(e => setInterviewError(e.message))
        .finally(() => setInterviewLoading(false));
    } else {
      setPanelists([]);
    }
  }, [application?.id, application?.status]);

  const handleViewInterviewDetails = () => {
    onClose(); 
    router.push({ pathname: '/(screens)/InterviewDetailsScreen', params: { applicationId: application.id } });
  };

  const renderTimelineNode = (item: typeof statusTimeline[0], index: number) => {
    const isCompleted = index < currentStatusIndex;
    const isActive = index === currentStatusIndex;
    const isLast = index === statusTimeline.length - 1;

    let nodeColor = '#d1d5db';
    if (isCompleted) nodeColor = Colors.SUCCESS;
    if (isActive) nodeColor = Colors.PRIMARY;

    return (
      <View key={item.status} style={styles.timelineNode}>
        <View style={styles.iconContainer}>
          <View style={[styles.timelineIcon, { backgroundColor: nodeColor }]}>
            {item.icon}
          </View>
          {!isLast && <View style={[styles.timelineConnector, { backgroundColor: isCompleted ? Colors.SUCCESS : '#e5e7eb' }]} />}
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.statusText, isActive && { fontWeight: 'bold' }]}>{item.text}</Text>
          {item.status === 'Interviewing' && isActive && (
            <>
            <TouchableOpacity style={styles.interviewButton} onPress={handleViewInterviewDetails}>
              <Text style={styles.interviewButtonText}>View Interview Details</Text>
              <ChevronRight size={16} color={Colors.PRIMARY} />
            </TouchableOpacity>
              {interviewLoading && <Text style={styles.infoText}>Loading panel info...</Text>}
              {interviewError && <Text style={styles.infoText}>{interviewError}</Text>}
              {panelists.length > 0 ? (
                <View style={{ width: '100%', marginTop: 8 }}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Panel Information:</Text>
                  {panelists.map(panelist => (
                    <View key={panelist.id} style={{ backgroundColor: '#f3f4f6', borderRadius: 8, padding: 8, marginBottom: 4, width: '100%' }}>
                      <Text style={{ fontWeight: 'bold' }}>{panelist.name}</Text>
                      {panelist.role && <Text style={{ color: Colors.GRAY }}>Role: {panelist.role}</Text>}
                      {panelist.organization && <Text style={{ color: Colors.GRAY }}>Org: {panelist.organization}</Text>}
                      {panelist.email && <Text style={{ color: Colors.GRAY }}>Email: {panelist.email}</Text>}
                      {panelist.phone && <Text style={{ color: Colors.GRAY }}>Phone: {panelist.phone}</Text>}
                      {panelist.notes && <Text style={{ color: Colors.GRAY }}>Notes: {panelist.notes}</Text>}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.infoText}>No panelists added</Text>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  const renderTerminalStatus = (status: 'Rejected' | 'Withdrawn') => {
    const isRejected = status === 'Rejected';
    return (
      <View style={styles.terminalStatusContainer}>
        {isRejected ? <XCircle size={48} color={Colors.ERROR} /> : <UserX size={48} color={Colors.GRAY} />}
        <Text style={[styles.terminalStatusText, { color: isRejected ? Colors.ERROR : Colors.GRAY }]}>
          {isRejected ? 'Application Rejected' : 'Application Withdrawn'}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'formSheet' : undefined}
    >
      <View style={styles.safeArea}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Application Status</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <X size={24} color={Colors.GRAY} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContentContainer}>
          <View style={styles.timelineContainer}>
            {terminalStatuses.includes(application.status || '') ?
              renderTerminalStatus(application.status as 'Rejected' | 'Withdrawn') :
              statusTimeline.map((item, index) => renderTimelineNode(item, index))
            }
          </View>
          {application.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>Recruiter's Notes</Text>
              <Text style={styles.notesText}>{application.notes}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};
// --- END OF MODAL COMPONENT ---

// Helper functions and main component remain the same as the last step
const timeSince = (dateString: string | Date | undefined): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const secondsPast = (now.getTime() - date.getTime()) / 1000;
  if (secondsPast < 60) return `${Math.round(secondsPast)}s ago`;
  if (secondsPast < 3600) return `${Math.round(secondsPast / 60)}m ago`;
  if (secondsPast <= 86400) return `${Math.round(secondsPast / 3600)}h ago`;
  const days = Math.round(secondsPast / 86400);
  if (days <= 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months <= 12) return `${months}mo ago`;
  const years = Math.round(days / 365);
  return `${years}y ago`;
};
const formatBulletPoints = (text: string | null | undefined): string[] => {
  if (!text) return [];
  return text.split(/\n(?=\s*[-•*❖–—]\s*)|(?<=\S)\s*[-•*❖–—]\s*/).map(s => s.trim()).filter(s => s.length > 0);
};
const DetailItem: React.FC<{icon: React.ReactNode, label: string, value: string | number | null | undefined, isLink?: string}> = ({icon, label, value, isLink}) => {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    return (
        <View style={styles.detailRow}>
            {icon}
            <Text style={styles.detailLabel}>{label}: </Text>
            {isLink ? (
                <TouchableOpacity onPress={() => Linking.openURL(isLink)}>
                    <Text style={[styles.detailValue, styles.linkValue]}>{String(value)}</Text>
                </TouchableOpacity>
            ) : (
                <Text style={styles.detailValue}>{String(value)}</Text>
            )}
        </View>
    );
};

export default function JobDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId: string }>();
  const { session: authSession, isLoading: authIsLoading } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkProcessing, setBookmarkProcessing] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationDetails, setApplicationDetails] = useState<JobApplication | null>(null);
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);

  const currentUserId = authSession?.user?.id;

  useEffect(() => {
    const fetchJobData = async () => {
      if (!params.jobId) {
        setError('Job ID not provided.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setHasApplied(false);
      setApplicationDetails(null);
      setIsBookmarked(false);

      try {
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', params.jobId)
          .single();

        if (jobError) throw jobError;
        if (!jobData) throw new Error('Job not found.');
        setJob(jobData as Job);

        if (currentUserId) {
          const { data: applicationData, error: applicationError } = await supabase
            .from('job_applications')
            .select('*')
            .eq('job_id', params.jobId)
            .eq('user_id', currentUserId)
            .maybeSingle();
            
          if (applicationError) console.error("Error checking application status:", applicationError.message);

          if (applicationData) {
            setHasApplied(true);
            setApplicationDetails(applicationData as JobApplication);
          }

          const { data: bookmarkData, error: bookmarkError } = await supabase
            .from('bookmarked_jobs')
            .select('id')
            .eq('user_id', currentUserId)
            .eq('job_id', params.jobId)
            .maybeSingle();
          if (bookmarkError) console.error("Error checking bookmark status:", bookmarkError.message);
          setIsBookmarked(!!bookmarkData);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load job data.');
      } finally {
        setLoading(false);
      }
    };

    if (!authIsLoading) {
      fetchJobData();
    }
  }, [params.jobId, currentUserId, authIsLoading]);
  
  const handleApply = async () => {
    if (!job) return;
    if (authIsLoading) {
        Alert.alert("Please wait", "Checking session...");
        return;
    }
    if (!currentUserId) {
      Alert.alert("Login Required", "Please sign in to apply for jobs.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push('/auth/SignIn') }
      ]);
      return;
    }

    if (hasApplied) {
        setIsStatusModalVisible(true);
        return;
    }
    
    setShowApplicationModal(true);
  };

  const handleApplicationSubmitSuccess = (applicationId: string) => {
    setHasApplied(true); 
    setShowApplicationModal(false);
    
    const refetchApplication = async () => {
        if (!currentUserId || !params.jobId) return;
        const { data } = await supabase.from('job_applications').select('*').eq('id', applicationId).single();
        if(data) setApplicationDetails(data as JobApplication);
    };
    refetchApplication();
    Alert.alert("Application Status", "Your application has been submitted!");
  };

  const handleToggleBookmark = async () => {
    if (authIsLoading || bookmarkProcessing) return;
    if (!currentUserId || !job) {
      Alert.alert("Login Required", "Please sign in to bookmark jobs.", [
         { text: "Cancel", style: "cancel" },
         { text: "Sign In", onPress: () => router.push('/auth/SignIn') }
      ]);
      return;
    }

    setBookmarkProcessing(true);
    const currentlyBookmarked = isBookmarked;

    try {
      if (currentlyBookmarked) {
        const { error: deleteError } = await supabase
          .from('bookmarked_jobs')
          .delete()
          .match({ user_id: currentUserId, job_id: job.id });
        if (deleteError) throw deleteError;
        setIsBookmarked(false);
      } else {
        const { error: insertError } = await supabase
          .from('bookmarked_jobs')
          .insert({ user_id: currentUserId, job_id: job.id });
        if (insertError) throw insertError;
        setIsBookmarked(true);
      }
    } catch (err: any) {
      console.error("Error toggling bookmark:", err);
      Alert.alert("Error", `Could not ${currentlyBookmarked ? 'remove' : 'add'} bookmark. Please try again.`);
    } finally {
      setBookmarkProcessing(false);
    }
  };

  const handleShare = async () => {
    if (!job) return;
    try {
      const jobUrl = `yourappscheme://job/${job.id}`;
      await Share.share({
        message: `Check out this job: ${job.job_name} at ${job.company_name}\n${jobUrl}`,
        title: `Job Opening: ${job.job_name}`,
      });
    } catch (error: any) {
      Alert.alert("Share Error", error.message);
    }
  };
  
  if (loading || (authIsLoading && !job)) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.PRIMARY} /></View>;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeAreaCentered}>
        <View style={styles.headerBarAbsolute}>
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(screens)/Jobs')} style={styles.backButton}>
                <ArrowLeft size={24} color={Colors.PRIMARY} />
            </TouchableOpacity>
        </View>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.safeAreaCentered}>
         <View style={styles.headerBarAbsolute}>
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(screens)/Jobs')} style={styles.backButton}>
                <ArrowLeft size={24} color={Colors.PRIMARY} />
            </TouchableOpacity>
        </View>
        <Text>Job details not found.</Text>
      </SafeAreaView>
    );
  }

  const jobHighlightsArray = formatBulletPoints(job.job_highlights);
  const keyResponsibilitiesArray = formatBulletPoints(job.details);

  return (
    <View style={styles.safeArea}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(screens)/Jobs')} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">{job.job_name}</Text>
        <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleToggleBookmark} style={styles.headerIconButton} disabled={bookmarkProcessing || authIsLoading}>
                <BookmarkIcon size={22} color={isBookmarked ? Colors.PRIMARY : Colors.GRAY} fill={isBookmarked ? Colors.PRIMARY : 'none'}/>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.headerIconButton}>
                <Share2 size={22} color={Colors.GRAY} />
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.jobHeaderSection}>
          <Image
            source={job.organization_logo ? { uri: job.organization_logo } : require('../../assets/images/organization_default_logo.jpg')}
            style={styles.companyLogo}
          />
          <View style={styles.jobHeaderTexts}>
            <Text style={styles.jobNameText}>{job.job_name}</Text>
            {job.job_title && <Text style={styles.jobSubtitleText}>{job.job_title}</Text>}
            <Text style={styles.companyNameText}>{job.company_name || 'Confidential'}</Text>
          </View>
        </View>

        <View style={styles.metaInfoBar}>
            <Text style={styles.postedDateText}>Posted {timeSince(job.created_at)}</Text>
            {job.application_deadline && <Text style={styles.deadlineText}>Apply by: {new Date(job.application_deadline).toLocaleDateString()}</Text>}
        </View>

        <View style={styles.actionButtonContainer}>
          {hasApplied ? (
            <TouchableOpacity
              style={[styles.applyPrimaryButton, styles.trackButton]}
              onPress={handleApply}
            >
              <Text style={[styles.applyPrimaryButtonText, styles.trackButtonText]}>Track Application</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.applyPrimaryButton}
              onPress={handleApply}
            >
              <Text style={styles.applyPrimaryButtonText}>Apply Now</Text>
            </TouchableOpacity>
          )}
        </View>

        {jobHighlightsArray.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Highlights</Text>
            {jobHighlightsArray.map((highlight, index) => (
              <View key={`highlight-${index}`} style={styles.listItem}>
                  <CheckCircle size={16} color={Colors.SUCCESS} style={styles.listItemIcon}/>
                  <Text style={styles.listItemText}>{highlight}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Overview</Text>
            <DetailItem icon={<MapPin size={18} color={Colors.GRAY}/>} label="Location" value={job.preferred_location} />
            <DetailItem icon={<Briefcase size={18} color={Colors.GRAY}/>} label="Job Type" value={`${job.job_type || ''}${job.employment_type ? ` (${job.employment_type})` : ''}`} />
            <DetailItem icon={<Layers size={18} color={Colors.GRAY}/>} label="Work Mode" value={job.work_mode} />
            <DetailItem icon={<DollarSign size={18} color={Colors.GRAY}/>} label="Salary" value={job.salary_range} />
            <DetailItem icon={<Users size={18} color={Colors.GRAY}/>} label="Experience" value={(job.experience !== null && job.experience !== undefined) ? `${job.experience} ${job.experience === 1 ? 'year' : 'years'}` : undefined} />
            <DetailItem icon={<CheckCircle size={18} color={Colors.GRAY}/>} label="Qualification" value={job.qualification} />
            <DetailItem icon={<Layers size={18} color={Colors.GRAY}/>} label="Education Level" value={job.education_level} />
            <DetailItem icon={<Building size={18} color={Colors.GRAY}/>} label="Industry" value={job.industry} />
            <DetailItem icon={<Info size={18} color={Colors.GRAY}/>} label="Department" value={job.department} />
        </View>

        {job.about && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About the Company</Text>
            <Text style={styles.sectionParagraph}>{job.about}</Text>
          </View>
        )}

        {keyResponsibilitiesArray.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Responsibilities</Text>
             {keyResponsibilitiesArray.map((detail, index) => (
              <View key={`detail-${index}`} style={styles.listItem}>
                  <CheckCircle size={16} color={Colors.PRIMARY} style={styles.listItemIcon}/>
                  <Text style={styles.listItemText}>{detail}</Text>
              </View>
            ))}
          </View>
        )}

        {job.required_skills && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required Skills</Text>
            <Text style={styles.sectionParagraph}>{job.required_skills}</Text>
          </View>
        )}

        {job.benefits && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Benefits</Text>
            <Text style={styles.sectionParagraph}>{job.benefits}</Text>
          </View>
        )}

        {job.additional_info && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            <Text style={styles.sectionParagraph}>{job.additional_info}</Text>
          </View>
        )}

        {(job.contact_email || job.phone) && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                {job.contact_email && <DetailItem icon={<Mail size={18} color={Colors.GRAY}/>} label="Email" value={job.contact_email} isLink={`mailto:${job.contact_email}`} />}
                {job.phone && <DetailItem icon={<Phone size={18} color={Colors.GRAY}/>} label="Phone" value={job.phone} isLink={`tel:${job.phone}`} />}
            </View>
        )}
        <View style={{height: 30}} />
      </ScrollView>

      {job && (
        <JobApplicationModal
          isVisible={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          job={job}
          onApplicationSubmitSuccess={handleApplicationSubmitSuccess}
        />
      )}

      {applicationDetails && (
        <ApplicationStatusModal
          isVisible={isStatusModalVisible}
          onClose={() => setIsStatusModalVisible(false)}
          application={applicationDetails}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors.WHITE,
    },
    safeAreaCentered: {
      flex: 1,
      backgroundColor: Colors.WHITE,
      justifyContent: 'center',
      alignItems: 'center',
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerBarAbsolute: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 40 : 10,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      zIndex: 10,
    },
    errorText: {
      color: Colors.ERROR,
      fontSize: 16,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eef0f2',
      backgroundColor: Colors.WHITE,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
      color: Colors.BLACK,
      marginHorizontal: 8,
    },
    headerActions: {
      flexDirection: 'row',
    },
    headerIconButton: {
      padding: 8,
      marginLeft: 8,
    },
    container: {
      flex: 1,
      backgroundColor: '#f8f9fa',
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 40,
    },
    jobHeaderSection: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
      backgroundColor: Colors.WHITE,
      padding: 16,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    companyLogo: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 16,
      backgroundColor: '#eef0f2',
      borderWidth: 1,
      borderColor: '#dde2e7',
    },
    jobHeaderTexts: {
      flex: 1,
    },
    jobNameText: {
      fontSize: 22,
      fontWeight: 'bold',
      color: Colors.BLACK,
      marginBottom: 4,
    },
    jobSubtitleText: {
      fontSize: 15,
      color: Colors.GRAY,
      marginBottom: 4,
    },
    companyNameText: {
      fontSize: 16,
      color: Colors.PRIMARY,
      fontWeight: '500',
    },
    metaInfoBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingVertical: 10,
      backgroundColor: '#f0f5ff',
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    postedDateText: {
      fontSize: 13,
      color: Colors.GRAY,
      fontWeight: '500',
    },
    deadlineText: {
      fontSize: 13,
      color: Colors.ERROR,
      fontWeight: '500',
    },
    actionButtonContainer: {
      marginBottom: 24,
    },
    applyPrimaryButton: {
      backgroundColor: Colors.PRIMARY,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      shadowColor: Colors.PRIMARY,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    applyPrimaryButtonText: {
      color: Colors.WHITE,
      fontSize: 17,
      fontWeight: 'bold',
    },
    trackButton: {
      backgroundColor: Colors.WHITE,
      borderWidth: 1.5,
      borderColor: Colors.PRIMARY,
    },
    trackButtonText: {
      color: Colors.PRIMARY,
    },
    section: {
      marginBottom: 24,
      backgroundColor: Colors.WHITE,
      padding: 16,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors.BLACK,
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#eef0f2',
    },
    sectionParagraph: {
      fontSize: 15,
      lineHeight: 24,
      color: '#4A4A4A',
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    listItemIcon: {
      marginRight: 10,
      marginTop: Platform.OS === 'ios' ? 3 : 5,
    },
    listItemText: {
      fontSize: 15,
      color: '#4A4A4A',
      lineHeight: 23,
      flex: 1,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      paddingVertical: 6,
    },
    detailIcon: {
      marginRight: 12,
    },
    detailLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: Colors.BLACK,
      marginRight: 6,
    },
    detailValue: {
      fontSize: 15,
      color: Colors.GRAY,
      flexShrink: 1,
    },
    linkValue: {
      color: Colors.PRIMARY,
      textDecorationLine: 'underline',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors.BLACK,
    },
    modalCloseButton: {
      padding: 4,
    },
    modalContentContainer: {
      padding: 20,
    },
    timelineContainer: {
      marginBottom: 20,
      paddingLeft: 10,
    },
    timelineNode: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      minHeight: 60,
    },
    iconContainer: {
      alignItems: 'center',
      marginRight: 16,
    },
    timelineIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    timelineConnector: {
      width: 2,
      flex: 1,
      backgroundColor: '#e5e7eb',
      marginTop: -2,
      marginBottom: -2,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
      minHeight: 40,
      paddingBottom: 4,
    },
    statusText: {
      fontSize: 16,
      fontWeight: '500',
      color: Colors.BLACK,
    },
    interviewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      backgroundColor: Colors.PRIMARY_LIGHT,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    interviewButtonText: {
      color: Colors.PRIMARY,
      fontSize: 14,
      fontWeight: '600',
      marginRight: 4,
    },
    terminalStatusContainer: {
      alignItems: 'center',
      paddingVertical: 30,
      backgroundColor: '#f9fafb',
      borderRadius: 8,
    },
    terminalStatusText: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 12,
    },
    notesSection: {
      marginTop: 20,
      padding: 15,
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    notesTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: Colors.PRIMARY,
      marginBottom: 8,
    },
    notesText: {
      fontSize: 14,
      color: '#374151',
      lineHeight: 20,
    },
    infoText: {
      color: Colors.GRAY,
      fontSize: 14,
      textAlign: 'center',
    },
  });