import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Dimensions,
    useWindowDimensions,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import Colors from '../../../constant/Colors';
import { ArrowLeft, ChevronDown, Search, Briefcase, Users, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react-native';
import { Job, JobApplication, InterviewPanelist } from '../../../types/jobs';
import { JobService } from '../../../lib/jobService';

interface GroupedApplication extends JobApplication {
    job: Job;
}

interface GroupedApplications {
    [jobId: string]: {
        job: Job;
        applications: GroupedApplication[];
    };
}

export default function AdminDashboard() {
    const router = useRouter();
    const { width: screenWidth } = useWindowDimensions();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [totalJobs, setTotalJobs] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [groupedApplications, setGroupedApplications] = useState<GroupedApplications>({});
    const [expandedJobs, setExpandedJobs] = useState<{ [key: string]: boolean }>({});
    const [filterStatus, setFilterStatus] = useState<'all' | 'accepted' | 'rejected' | 'pending' | 'interviewing'>('all');
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        interviewing: 0,
        accepted: 0,
        rejected: 0
    });
    const [interviewInfo, setInterviewInfo] = useState<{ [applicationId: string]: { round?: string; duration?: number; panelists?: InterviewPanelist[]; loading: boolean; error?: string } }>({});

    const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

    const fetchApplications = async () => {
        try {
            // First, fetch all jobs
            const { data: jobsData, error: jobsError } = await supabase
                .from('jobs')
                .select('*')
                .order('created_at', { ascending: false });

            if (jobsError) throw jobsError;

            // Build the base query
            let query = supabase
                .from('job_applications')
                .select(`
                    *,
                    jobs (
                        id,
                        job_name,
                        job_type,
                        created_at
                    )
                `);

            // Apply status filter
            if (filterStatus !== 'all') {
                const statusMap = {
                    'accepted': 'Hired',
                    'rejected': 'Rejected',
                    'pending': 'Applied',
                    'interviewing': 'Interviewing'
                };
                query = query.eq('status', statusMap[filterStatus]);
            }

            // Apply search filters
            if (searchQuery.trim()) {
                const searchTerm = `%${searchQuery.trim()}%`;
                // First get matching job IDs
                const { data: jobMatches, error: jobSearchError } = await supabase
                    .from('jobs')
                    .select('id')
                    .ilike('job_name', searchTerm);

                if (jobSearchError) throw jobSearchError;

                // Then build the search condition
                query = query.or(
                    `first_name.ilike.${searchTerm},` +
                    `last_name.ilike.${searchTerm}` +
                    (jobMatches && jobMatches.length > 0 
                        ? `,job_id.in.(${jobMatches.map(j => j.id).join(',')})` 
                        : '')
                );
            }

            const { data: applicationsData, error: applicationsError } = await query
                .order('created_at', { ascending: false });

            if (applicationsError) {
                console.error('Applications fetch error:', applicationsError);
                throw applicationsError;
            }

            // Group applications by job
            const grouped: GroupedApplications = {};
            applicationsData?.forEach((application: any) => {
                if (!application.jobs) return; // Skip if no job data
                
                const jobId = application.job_id.toString();
                if (!grouped[jobId]) {
                    grouped[jobId] = {
                        job: application.jobs,
                        applications: [],
                    };
                }
                grouped[jobId].applications.push({
                    ...application,
                    job: application.jobs,
                });
            });

            // Calculate stats
            const newStats = {
                total: applicationsData?.length || 0,
                pending: applicationsData?.filter(app => app.status === 'Applied').length || 0,
                interviewing: applicationsData?.filter(app => app.status === 'Interviewing').length || 0,
                accepted: applicationsData?.filter(app => app.status === 'Hired').length || 0,
                rejected: applicationsData?.filter(app => app.status === 'Rejected').length || 0
            };

            setGroupedApplications(grouped);
            setTotalJobs(jobsData?.length || 0);
            setStats(newStats);
            
            // Initialize expanded state for each job
            const initialExpandedState = Object.keys(grouped).reduce((acc, jobId) => {
                acc[jobId] = false;
                return acc;
            }, {} as { [key: string]: boolean });
            setExpandedJobs(initialExpandedState);

        } catch (error: any) {
            console.error('Error fetching data:', error.message);
            // Reset data to empty state on error
            setGroupedApplications({});
            setStats({
                total: 0,
                pending: 0,
                interviewing: 0,
                accepted: 0,
                rejected: 0
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchInterviewInfo = async (applicationId: string) => {
        setInterviewInfo(prev => ({ ...prev, [applicationId]: { ...(prev[applicationId] || {}), loading: true, error: undefined } }));
        try {
            const schedule = await JobService.getInterviewScheduleWithPanelByApplicationId(applicationId);
            setInterviewInfo(prev => ({
                ...prev,
                [applicationId]: {
                    round: schedule?.round,
                    duration: schedule?.duration,
                    panelists: schedule?.panelists || [],
                    loading: false,
                },
            }));
        } catch (e: any) {
            setInterviewInfo(prev => ({ ...prev, [applicationId]: { ...(prev[applicationId] || {}), loading: false, error: e.message } }));
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    useEffect(() => {
        Object.values(groupedApplications).forEach(({ applications }) => {
            applications.forEach(app => {
                if (app.id) fetchInterviewInfo(app.id);
            });
        });
    }, [groupedApplications]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchApplications();
    };

    const toggleJobExpansion = (jobId: string) => {
        setExpandedJobs(prev => ({
            ...prev,
            [jobId]: !prev[jobId]
        }));
    };

    const renderStatusIndicator = (status?: string) => {
        const color = status === 'Hired' ? '#4CAF50' : 
                     status === 'Rejected' ? '#F44336' : 
                     '#2196F3';
        return (
            <View style={[styles.statusIndicator, { backgroundColor: color }]} />
        );
    };

    const getStatCardWidth = () => {
        return screenWidth < 350 ? screenWidth * 0.4 : screenWidth * 0.35;
    };

    const navigateToApplicationDetails = (applicationId: string) => {
        router.push({
            pathname: '/(screens)/Jobs(selection)/ApplicationDetails',
            params: { applicationId }
        });
    };

    const navigateToInterviewDetails = (applicationId: string) => {
        router.push({
            pathname: '/(screens)/InterviewDetailsScreen',
            params: { applicationId }
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <ArrowLeft size={20} color={Colors.BLACK} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Job Management</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.PRIMARY, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, marginLeft: 12 }}
                        onPress={() => router.push('/(screens)/PanelMembersScreen')}
                    >
                        <Users size={18} color={Colors.WHITE} />
                        <Text style={{ color: Colors.WHITE, fontWeight: 'bold', marginLeft: 6 }}>Panel Members</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[Colors.PRIMARY]}
                        tintColor={Colors.PRIMARY}
                    />
                }
            >
                <View style={styles.statsWrapper}>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        style={styles.statsContainer}
                        contentContainerStyle={styles.statsContentContainer}
                    >
                        <View style={[styles.statCard, { backgroundColor: '#F0F7FF', width: getStatCardWidth() }]}>
                            <View style={[styles.iconContainer, { backgroundColor: '#E1EFFE' }]}>
                                <Briefcase size={18} color="#2563EB" />
                            </View>
                            <Text style={[styles.statNumber, { color: '#2563EB' }]}>{stats.total}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#F0FDF4', width: getStatCardWidth() }]}>
                            <View style={[styles.iconContainer, { backgroundColor: '#DCFCE7' }]}>
                                <Users size={18} color="#16A34A" />
                            </View>
                            <Text style={[styles.statNumber, { color: '#16A34A' }]}>{stats.pending}</Text>
                            <Text style={styles.statLabel}>Pending</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#FFF7ED', width: getStatCardWidth() }]}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FFEDD5' }]}>
                                <Clock size={18} color="#EA580C" />
                            </View>
                            <Text style={[styles.statNumber, { color: '#EA580C' }]}>{stats.interviewing}</Text>
                            <Text style={styles.statLabel}>Interview</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#ECFDF5', width: getStatCardWidth() }]}>
                            <View style={[styles.iconContainer, { backgroundColor: '#D1FAE5' }]}>
                                <CheckCircle size={18} color="#059669" />
                            </View>
                            <Text style={[styles.statNumber, { color: '#059669' }]}>{stats.accepted}</Text>
                            <Text style={styles.statLabel}>Hired</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#FEF2F2', width: getStatCardWidth() }]}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                                <XCircle size={18} color="#DC2626" />
                            </View>
                            <Text style={[styles.statNumber, { color: '#DC2626' }]}>{stats.rejected}</Text>
                            <Text style={styles.statLabel}>Rejected</Text>
                        </View>
                    </ScrollView>
                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Search size={16} color={Colors.GRAY} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name or position..."
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={(text) => {
                                setSearchQuery(text);
                                if (searchTimeout.current) {
                                    clearTimeout(searchTimeout.current);
                                }
                                // Only trigger search if there's text or if clearing previous search
                                if (text.trim() || searchQuery) {
                                    searchTimeout.current = setTimeout(() => {
                                        fetchApplications();
                                    }, 500);
                                }
                            }}
                            returnKeyType="search"
                            onSubmitEditing={() => {
                                if (searchTimeout.current) {
                                    clearTimeout(searchTimeout.current);
                                }
                                fetchApplications();
                            }}
                        />
                        {searchQuery ? (
                            <TouchableOpacity
                                onPress={() => {
                                    setSearchQuery('');
                                    fetchApplications();
                                }}
                                style={styles.clearButton}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Text style={styles.clearButtonText}>✕</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                    {searchQuery.trim() && Object.keys(groupedApplications).length === 0 && (
                        <Text style={styles.noResultsText}>No results found</Text>
                    )}
                </View>

                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.filterContainer}
                    contentContainerStyle={styles.filterContentContainer}
                >
                    {['all', 'pending', 'interviewing', 'accepted', 'rejected'].map((status) => (
                        <TouchableOpacity 
                            key={status}
                            style={[
                                styles.filterButton, 
                                filterStatus === status && styles.filterButtonActive,
                                { minWidth: screenWidth * 0.22 }
                            ]}
                            onPress={() => {
                                setFilterStatus(status as any);
                                fetchApplications();
                            }}
                        >
                            <Text style={[
                                styles.filterText, 
                                filterStatus === status && styles.filterTextActive
                            ]}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.contentContainer}>
                    <Text style={styles.sectionTitle}>Applications</Text>
                    <View style={styles.jobList}>
                        {Object.entries(groupedApplications).map(([jobId, { job, applications }]) => (
                            <View key={jobId} style={styles.jobSection}>
                                <TouchableOpacity 
                                    style={styles.jobHeader}
                                    onPress={() => toggleJobExpansion(jobId)}
                                >
                                    <View style={styles.jobTitleContainer}>
                                        <Text style={styles.jobTitle} numberOfLines={1} ellipsizeMode="tail">
                                            {job.job_name}
                                        </Text>
                                        <View style={styles.jobMetaContainer}>
                                            <Text style={styles.jobType} numberOfLines={1}>
                                                {job.job_type}
                                            </Text>
                                            <View style={styles.applicantCount}>
                                                <Users size={12} color={Colors.GRAY} />
                                                <Text style={styles.applicantCountText}>
                                                    {applications.length}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    <ChevronDown 
                                        size={20} 
                                        color={Colors.BLACK}
                                        style={[
                                            styles.chevron,
                                            expandedJobs[jobId] && styles.chevronExpanded
                                        ]}
                                    />
                                </TouchableOpacity>

                                {expandedJobs[jobId] && applications.map((application) => (
                                    <View key={application.id} style={styles.applicantCardContainer}>
                                        <TouchableOpacity
                                            style={styles.applicantCard}
                                            onPress={() => navigateToApplicationDetails(application.id!)}
                                        >
                                            <Image
                                                source={require('../../../assets/images/default.png')}
                                                style={styles.applicantImage}
                                            />
                                            <View style={styles.applicantInfo}>
                                                <Text style={styles.applicantName} numberOfLines={1}>
                                                    {application.first_name} {application.last_name}
                                                </Text>
                                                <Text style={styles.applicantDetails} numberOfLines={1}>
                                                    {application.experience}
                                                </Text>
                                                <Text style={styles.applicantEducation} numberOfLines={1}>
                                                    {application.education?.[0]?.degree}
                                                </Text>
                                                {/* Interview Info */}
                                                {interviewInfo[application.id]?.loading && <Text style={styles.infoText}>Loading interview...</Text>}
                                                {interviewInfo[application.id]?.error && <Text style={styles.infoText}>{interviewInfo[application.id]?.error}</Text>}
                                                {interviewInfo[application.id]?.round && (
                                                    <Text style={styles.infoText}>Round: {interviewInfo[application.id]?.round}</Text>
                                                )}
                                                {interviewInfo[application.id]?.duration && (
                                                    <Text style={styles.infoText}>Duration: {interviewInfo[application.id]?.duration} min</Text>
                                                )}
                                                {interviewInfo[application.id]?.panelists && interviewInfo[application.id]?.panelists.length > 0 && (
                                                    <Text style={styles.infoText}>Panel: {interviewInfo[application.id]?.panelists.map(p => p.name).join(', ')}</Text>
                                                )}
                                            </View>
                                            <View style={styles.statusContainer}>
                                                {renderStatusIndicator(application.status)}
                                                <Text style={[
                                                    styles.statusText,
                                                    { color: application.status === 'Hired' ? '#4CAF50' : 
                                                             application.status === 'Rejected' ? '#F44336' : 
                                                             '#2196F3' }
                                                ]}>
                                                    {application.status}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                        
                                        {/* Interview Details Button */}
                                        {application.status === 'Interviewing' && (
                                            <TouchableOpacity
                                                style={styles.interviewButton}
                                                onPress={() => navigateToInterviewDetails(application.id!)}
                                            >
                                                <Calendar size={16} color={Colors.WHITE} />
                                                <Text style={styles.interviewButtonText}>Interview</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 8,
        fontSize: 14,
        color: Colors.GRAY,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: Colors.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 4,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.BLACK,
        flex: 1,
    },
    statsWrapper: {
        backgroundColor: Colors.WHITE,
        paddingVertical: 8,
    },
    statsContainer: {
        maxHeight: 120,
    },
    statsContentContainer: {
        paddingHorizontal: 8,
        gap: 8,
    },
    statCard: {
        borderRadius: 12,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        justifyContent: 'center',
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    statNumber: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    searchContainer: {
        padding: 8,
        backgroundColor: Colors.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 36,
    },
    searchInput: {
        flex: 1,
        marginLeft: 6,
        fontSize: 14,
        color: Colors.BLACK,
        paddingVertical: 6,
        paddingRight: 24, // Space for clear button
    },
    clearButton: {
        padding: 4,
        marginLeft: 4,
    },
    clearButtonText: {
        color: Colors.GRAY,
        fontSize: 14,
        fontWeight: '500',
    },
    filterContainer: {
        backgroundColor: Colors.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    filterContentContainer: {
        padding: 8,
        gap: 6,
    },
    filterButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        marginRight: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterButtonActive: {
        backgroundColor: Colors.PRIMARY,
    },
    filterText: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: '500',
    },
    filterTextActive: {
        color: Colors.WHITE,
    },
    contentContainer: {
        flex: 1,
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.BLACK,
        padding: 8,
    },
    jobList: {
        paddingHorizontal: 8,
    },
    jobSection: {
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        marginBottom: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    jobHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    jobTitleContainer: {
        flex: 1,
        marginRight: 8,
    },
    jobTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.BLACK,
        marginBottom: 2,
    },
    jobMetaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    jobType: {
        fontSize: 12,
        color: '#6B7280',
        marginRight: 8,
        flex: 1,
    },
    applicantCount: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    applicantCountText: {
        marginLeft: 4,
        fontSize: 12,
        color: Colors.GRAY,
    },
    chevron: {
        transform: [{ rotate: '0deg' }],
    },
    chevronExpanded: {
        transform: [{ rotate: '180deg' }],
    },
    applicantCardContainer: {
        marginBottom: 8,
    },
    applicantCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    interviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginTop: 4,
        gap: 4,
    },
    interviewButtonText: {
        color: Colors.WHITE,
        fontSize: 12,
        fontWeight: '500',
    },
    applicantImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    applicantInfo: {
        flex: 1,
        marginRight: 8,
    },
    applicantName: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.BLACK,
        marginBottom: 2,
    },
    applicantDetails: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 1,
    },
    applicantEducation: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    statusContainer: {
        alignItems: 'center',
        minWidth: 50,
    },
    statusIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginBottom: 3,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '500',
    },
    noResultsText: {
        textAlign: 'center',
        color: Colors.GRAY,
        fontSize: 14,
        marginTop: 8,
    },
    infoText: {
        fontSize: 12,
        color: Colors.GRAY,
        marginTop: 4,
    },
}); 