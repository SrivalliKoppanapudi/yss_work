import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    Platform,
    Linking,
    Dimensions,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import Colors from '../../../constant/Colors';
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, GraduationCap, Calendar, Clock, Video, Users, CheckCircle, XCircle, User, Edit2, Trash2, Linkedin } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { JobService } from '../../../lib/jobService';
import { InterviewPanelistV2 } from '../../../types/jobs';
import { Picker } from '@react-native-picker/picker';

interface ApplicationDetails {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    experience: string;
    education: {
        degree: string;
        institution: string;
        graduation_year: string;
    }[];
    skills: string[];
    resume_url?: string;
    cover_letter?: string;
    status: string;
    created_at: string;
    job: {
        job_name: string;
        company_name: string;
        preferred_location: string;
    };
    interview_schedule?: {
        id?: string;
        interview_date: string;
        interview_time: string;
        interview_type: 'online' | 'offline';
        location?: string;
        meeting_link?: string;
        additional_notes?: string;
        status: 'scheduled' | 'completed' | 'cancelled';
        round?: string;
        duration?: number;
    };
}

interface InterviewSchedule {
    interview_date: string;
    interview_time: string;
    interview_type: 'online' | 'offline';
    location?: string;
    meeting_link?: string;
    additional_notes?: string;
}

export default function ApplicationDetails() {
    const router = useRouter();
    const { applicationId } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [application, setApplication] = useState<ApplicationDetails | null>(null);
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [interviewSchedule, setInterviewSchedule] = useState<InterviewSchedule>({
        interview_date: new Date().toISOString().split('T')[0],
        interview_time: '10:00',
        interview_type: 'online',
        location: '',
        meeting_link: '',
        additional_notes: '',
    });
    const [round, setRound] = useState('');
    const [duration, setDuration] = useState('');
    const [panelists, setPanelists] = useState<InterviewPanelistV2[]>([]);
    const [panelistDraft, setPanelistDraft] = useState<Partial<InterviewPanelistV2>>({ name: '' });
    const [editingPanelistId, setEditingPanelistId] = useState<string | null>(null);
    const [panelLoading, setPanelLoading] = useState(false);
    const [showPanelistModal, setShowPanelistModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [panelistError, setPanelistError] = useState<string | null>(null);

    // New state for modal panelists
    const [modalPanelists, setModalPanelists] = useState<{ id: string; name: string; availability?: string }[]>([]);
    const [allPanelMembers, setAllPanelMembers] = useState<{ id: string; name: string; availability?: string }[]>([]);
    const [selectedPanelMemberId, setSelectedPanelMemberId] = useState<string>('');

    useEffect(() => {
        fetchApplicationDetails();
    }, [applicationId]);

    useEffect(() => {
        if (application?.interview_schedule?.id) {
            setPanelLoading(true);
            JobService.getPanelistsV2(application.interview_schedule.id)
                .then(setPanelists)
                .finally(() => setPanelLoading(false));
        } else {
            setPanelists([]);
        }
    }, [application?.interview_schedule?.id]);

    useEffect(() => {
        // Fetch all available panel members for dropdown
        const fetchPanelMembers = async () => {
            const { data, error } = await supabase
                .from('interview_panelists')
                .select('id, name, availability');
            if (!error && data) setAllPanelMembers(data);
        };
        fetchPanelMembers();
    }, []);

    const fetchApplicationDetails = async () => {
        try {
            // First fetch the application details
            const { data: applicationData, error: applicationError } = await supabase
                .from('job_applications')
                .select(`
                    *,
                    job:jobs(job_name, company_name, preferred_location)
                `)
                .eq('id', applicationId)
                .single();

            if (applicationError) throw applicationError;

            // Then fetch the interview schedule if it exists
            const { data: interviewData, error: interviewError } = await supabase
                .from('interview_schedules')
                .select('*')
                .eq('application_id', applicationId)
                .single();

            if (interviewError && interviewError.code !== 'PGRST116') {
                // PGRST116 is "not found" error, which is expected if no interview is scheduled
                console.log('Interview schedule error:', interviewError);
            }

            // Combine the data
            const combinedData = {
                ...applicationData,
                interview_schedule: interviewData || null
            };

            setApplication(combinedData as ApplicationDetails);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            const { error } = await supabase
                .from('job_applications')
                .update({ status: newStatus })
                .eq('id', applicationId);

            if (error) throw error;

            // Update local state
            if (application) {
                setApplication({ ...application, status: newStatus });
            }

            Alert.alert('Success', `Application status updated to ${newStatus}`);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleScheduleInterview = async () => {
        try {
            const scheduleData = {
                application_id: applicationId,
                interview_date: interviewSchedule.interview_date,
                interview_time: interviewSchedule.interview_time,
                interview_type: interviewSchedule.interview_type,
                location: interviewSchedule.interview_type === 'offline' ? interviewSchedule.location : null,
                meeting_link: interviewSchedule.interview_type === 'online' ? interviewSchedule.meeting_link : null,
                additional_notes: interviewSchedule.additional_notes,
                status: 'scheduled',
                round,
                duration: duration ? parseInt(duration) : null,
            };
            let operation, interviewId;
            if (application?.interview_schedule?.id) {
                operation = supabase
                    .from('interview_schedules')
                    .update(scheduleData)
                    .eq('id', application.interview_schedule.id)
                    .select();
            } else {
                operation = supabase
                    .from('interview_schedules')
                    .insert([scheduleData])
                    .select();
            }
            const { data: scheduleDataResult, error: scheduleError } = await operation;
            if (scheduleError) {
                Alert.alert('Error', scheduleError.message);
                console.log('Schedule error:', scheduleError.message);
                return;
            }
            interviewId = application?.interview_schedule?.id || scheduleDataResult?.[0]?.id;
            // Save panelists from modalPanelists to backend for this interview
            if (interviewId && modalPanelists.length > 0) {
                for (const p of modalPanelists) {
                    try {
                        await JobService.updatePanelistV2(p.id, {
                            interview_id: interviewId,
                            availability: 'Unavailable',
                        });
                    } catch (e) {
                        Alert.alert('Panelist assign error', e.message);
                        console.log('Panelist assign error:', e.message);
                    }
                }
            }
            await supabase
                .from('job_applications')
                .update({ status: 'Interviewing' })
                .eq('id', applicationId);
            await fetchApplicationDetails();
            setShowInterviewModal(false);
            setModalPanelists([]);
            Alert.alert('Success', 'Interview scheduled successfully', [
                { text: 'OK', onPress: () => { if (router.canGoBack()) router.back(); } }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message);
            console.log('Schedule error:', error.message);
        }
    };

    const handleDownloadResume = async () => {
        if (!application?.resume_url) return;
        
        try {
            const { data, error } = await supabase
                .storage
                .from('resumes')
                .download(application.resume_url);

            if (error) throw error;

            Alert.alert('Success', 'Resume downloaded successfully');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleAddPanelist = async () => {
        if (!panelistDraft.name) return Alert.alert('Panelist name is required');
        setPanelLoading(true);
        try {
            if (application?.interview_schedule?.id) {
                const newPanelist = await JobService.addPanelistV2(application.interview_schedule.id, panelistDraft as any);
                setPanelists([...panelists, newPanelist]);
                setPanelistDraft({ name: '' });
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setPanelLoading(false);
        }
    };

    const handleEditPanelist = (panelist: InterviewPanelistV2) => {
        setPanelistDraft(panelist);
        setEditingPanelistId(panelist.id!);
    };

    const handleSavePanelist = async () => {
        if (!panelistDraft.name) {
            setPanelistError('Panelist name is required');
            return;
        }
        setPanelLoading(true);
        setPanelistError(null);
        try {
            if (isEditMode && editingPanelistId) {
                const updated = await JobService.updatePanelistV2(editingPanelistId, panelistDraft as any);
                setPanelists(panelists.map(p => p.id === editingPanelistId ? updated : p));
                setPanelistDraft({ name: '' });
                setEditingPanelistId(null);
            } else if (application?.interview_schedule?.id) {
                const newPanelist = await JobService.addPanelistV2(application.interview_schedule.id, panelistDraft as any);
                setPanelists([...panelists, newPanelist]);
                setPanelistDraft({ name: '' });
            }
            setShowPanelistModal(false);
        } catch (e: any) {
            setPanelistError(e.message);
            Alert.alert('Error', e.message);
        } finally {
            setPanelLoading(false);
        }
    };

    const handleDeletePanelist = async (panelistId: string) => {
        setPanelLoading(true);
        try {
            await JobService.deletePanelistV2(panelistId);
            setPanelists(panelists.filter(p => p.id !== panelistId));
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setPanelLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
            </View>
        );
    }

    if (!application) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Application not found</Text>
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Applied':
                return '#2196f3';
            case 'Interviewing':
                return '#ff9800';
            case 'Hired':
                return '#4caf50';
            case 'Rejected':
                return '#f44336';
            default:
                return Colors.GRAY;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Application Details</Text>
            </View>

            <ScrollView style={styles.content}>
                {/* Job Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{application.job.job_name}</Text>
                    <Text style={styles.companyName}>{application.job.company_name}</Text>
                    <View style={styles.locationContainer}>
                        <MapPin size={16} color={Colors.GRAY} />
                        <Text style={styles.locationText}>{application.job.preferred_location}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) }]}>
                        <Text style={styles.statusText}>{application.status}</Text>
                    </View>

                    {/* Status Management Buttons */}
                    <View style={styles.actionButtonsContainer}>
                        {application.status !== 'Hired' && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#4caf50' }]}
                                onPress={() => handleStatusChange('Hired')}
                            >
                                <CheckCircle size={20} color="#fff" />
                                <Text style={styles.actionButtonText}>Accept</Text>
                            </TouchableOpacity>
                        )}
                        
                        {application.status !== 'Rejected' && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#f44336' }]}
                                onPress={() => handleStatusChange('Rejected')}
                            >
                                <XCircle size={20} color="#fff" />
                                <Text style={styles.actionButtonText}>Reject</Text>
                            </TouchableOpacity>
                        )}
                        
                        {application.status !== 'Interviewing' && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#ff9800' }]}
                                onPress={() => setShowInterviewModal(true)}
                            >
                                <Calendar size={20} color="#fff" />
                                <Text style={styles.actionButtonText}>Schedule Interview</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Applicant Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <Text style={styles.applicantName}>
                        {application.first_name} {application.last_name}
                    </Text>
                    
                    <View style={styles.infoRow}>
                        <Mail size={16} color={Colors.GRAY} />
                        <Text style={styles.infoText}>{application.email}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <Phone size={16} color={Colors.GRAY} />
                        <Text style={styles.infoText}>{application.phone}</Text>
                    </View>
                </View>

                {/* Experience */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Experience</Text>
                    <View style={styles.infoRow}>
                        <Briefcase size={16} color={Colors.GRAY} />
                        <Text style={styles.infoText}>{application.experience}</Text>
                    </View>
                </View>

                {/* Education */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Education</Text>
                    {Array.isArray(application.education) && application.education.map((edu, index) => (
                        <View key={index} style={styles.educationItem}>
                            <View style={styles.infoRow}>
                                <GraduationCap size={16} color={Colors.GRAY} />
                                <Text style={styles.degreeText}>{edu.degree}</Text>
                            </View>
                            <Text style={styles.institutionText}>{edu.institution}</Text>
                            <Text style={styles.yearText}>{edu.graduation_year}</Text>
                        </View>
                    ))}
                </View>

                {/* Skills */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Skills</Text>
                    <View style={styles.skillsContainer}>
                        {Array.isArray(application.skills) && application.skills.map((skill, index) => (
                            <View key={index} style={styles.skillBadge}>
                                <Text style={styles.skillText}>{skill}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Interview Schedule */}
                {application.interview_schedule ? (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Interview Details</Text>
                            <TouchableOpacity 
                                style={styles.editButton}
                                onPress={() => {
                                    // Pre-fill the form with existing data
                                    setInterviewSchedule({
                                        interview_date: application.interview_schedule.interview_date,
                                        interview_time: application.interview_schedule.interview_time,
                                        interview_type: application.interview_schedule.interview_type,
                                        location: application.interview_schedule.location || '',
                                        meeting_link: application.interview_schedule.meeting_link || '',
                                        additional_notes: application.interview_schedule.additional_notes || '',
                                    });
                                    setShowInterviewModal(true);
                                }}
                            >
                                <Text style={styles.editButtonText}>Edit</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.interviewCard}>
                            <View style={styles.interviewStatusBadge}>
                                <Text style={styles.interviewStatusText}>
                                    {application.interview_schedule.status.charAt(0).toUpperCase() + 
                                     application.interview_schedule.status.slice(1)}
                                </Text>
                            </View>
                            
                            <View style={styles.infoRow}>
                                <Calendar size={16} color={Colors.GRAY} />
                                <Text style={styles.infoText}>
                                    {new Date(application.interview_schedule.interview_date).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Clock size={16} color={Colors.GRAY} />
                                <Text style={styles.infoText}>
                                    {application.interview_schedule.interview_time}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                {application.interview_schedule.interview_type === 'online' ? (
                                    <>
                                        <Video size={16} color={Colors.GRAY} />
                                        <Text style={styles.infoText}>Online Interview</Text>
                                    </>
                                ) : (
                                    <>
                                        <Users size={16} color={Colors.GRAY} />
                                        <Text style={styles.infoText}>In-person Interview</Text>
                                    </>
                                )}
                            </View>
                            {application.interview_schedule.location && (
                                <View style={styles.infoRow}>
                                    <MapPin size={16} color={Colors.GRAY} />
                                    <Text style={styles.infoText}>
                                        {application.interview_schedule.location}
                                    </Text>
                                </View>
                            )}
                            {application.interview_schedule.meeting_link && (
                                <TouchableOpacity 
                                    style={styles.meetingLinkButton}
                                    onPress={() => {
                                        if (application.interview_schedule.meeting_link) {
                                            Linking.openURL(application.interview_schedule.meeting_link);
                                        }
                                    }}
                                >
                                    <Text style={styles.meetingLinkText}>
                                        Join Meeting
                                    </Text>
                                </TouchableOpacity>
                            )}
                            {/* Show all details */}
                            {application.interview_schedule.round && (
                                <View style={styles.infoRow}><Text style={styles.infoText}>Round: {application.interview_schedule.round}</Text></View>
                            )}
                            {application.interview_schedule.duration && (
                                <View style={styles.infoRow}><Text style={styles.infoText}>Duration: {application.interview_schedule.duration} min</Text></View>
                            )}
                            {application.interview_schedule.meeting_link && (
                                <View style={styles.infoRow}><Text style={styles.infoText}>Meeting Link: {application.interview_schedule.meeting_link}</Text></View>
                            )}
                            {application.interview_schedule.location && (
                                <View style={styles.infoRow}><Text style={styles.infoText}>Venue: {application.interview_schedule.location}</Text></View>
                            )}
                            {panelists.length > 0 && (
                                <View style={[styles.infoRow, { flexDirection: 'column', alignItems: 'flex-start', marginTop: 8 }]}> 
                                    <Text style={[styles.infoText, { fontWeight: 'bold', marginBottom: 4 }]}>Panel Information:</Text>
                                    {panelists.map(panelist => (
                                        <View key={panelist.id} style={{ backgroundColor: '#f3f4f6', borderRadius: 8, padding: 8, marginBottom: 4, width: '100%' }}>
                                            {panelist.photo_url ? (
                                                <Image source={{ uri: panelist.photo_url }} style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: '#e0e0e0' }} />
                                            ) : (
                                                <View style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Text style={{ color: Colors.GRAY, fontSize: 18 }}>{panelist.name?.[0] || '?'}</Text>
                                                </View>
                                            )}
                                            <View style={{ flex: 1 }}>
                                                <TouchableOpacity onPress={() => { setPanelistDraft(panelist); setIsEditMode(true); setShowPanelistModal(true); }}>
                                                    <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 2, color: Colors.PRIMARY, textDecorationLine: 'underline' }}>{panelist.name}</Text>
                                                </TouchableOpacity>
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
                            )}
                        </View>
                    </View>
                ) : (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Interview Details</Text>
                        <View style={styles.noInterviewCard}>
                            <Text style={styles.noInterviewText}>No interview scheduled yet</Text>
                            <TouchableOpacity 
                                style={styles.scheduleInterviewButton}
                                onPress={() => setShowInterviewModal(true)}
                            >
                                <Text style={styles.scheduleInterviewButtonText}>Schedule Interview</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Documents */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Documents</Text>
                    {application.resume_url && (
                        <TouchableOpacity 
                            style={styles.documentButton}
                            onPress={handleDownloadResume}
                        >
                            <Text style={styles.documentButtonText}>Download Resume</Text>
                        </TouchableOpacity>
                    )}
                    {application.cover_letter && (
                        <View style={styles.coverLetterContainer}>
                            <Text style={styles.coverLetterTitle}>Cover Letter</Text>
                            <Text style={styles.coverLetterText}>{application.cover_letter}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Interview Scheduling Modal */}
            <Modal
                visible={showInterviewModal}
                animationType="slide"
                transparent={true}
            >
                <View style={[styles.modalContainer, { justifyContent: 'center', alignItems: 'center' }]}> 
                    <View style={[styles.modalContent, { maxHeight: Dimensions.get('window').height * 0.8, width: '90%', borderRadius: 16, backgroundColor: Colors.WHITE, padding: 20 }]}> 
                        <ScrollView 
                            contentContainerStyle={{ paddingBottom: 24 }} 
                            keyboardShouldPersistTaps="handled" 
                            keyboardDismissMode="on-drag"
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={styles.modalTitle}>Schedule Interview</Text>

                            {/* Round */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Round</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={round}
                                    onChangeText={setRound}
                                    placeholder="e.g. Technical Round 1"
                                />
                            </View>

                            {/* Duration */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Duration (minutes)</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={duration}
                                    onChangeText={setDuration}
                                    placeholder="e.g. 60"
                                    keyboardType="numeric"
                                />
                            </View>

                            {/* Interview Type */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Interview Type</Text>
                                <View style={styles.radioGroup}>
                                    <TouchableOpacity
                                        style={[
                                            styles.radioButton,
                                            interviewSchedule.interview_type === 'online' && styles.radioButtonSelected
                                        ]}
                                        onPress={() => setInterviewSchedule({
                                            ...interviewSchedule,
                                            interview_type: 'online',
                                            location: ''
                                        })}
                                    >
                                        <Text style={[
                                            styles.radioButtonText,
                                            interviewSchedule.interview_type === 'online' && styles.radioButtonTextSelected
                                        ]}>Online</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.radioButton,
                                            interviewSchedule.interview_type === 'offline' && styles.radioButtonSelected
                                        ]}
                                        onPress={() => setInterviewSchedule({
                                            ...interviewSchedule,
                                            interview_type: 'offline',
                                            meeting_link: ''
                                        })}
                                    >
                                        <Text style={[
                                            styles.radioButtonText,
                                            interviewSchedule.interview_type === 'offline' && styles.radioButtonTextSelected
                                        ]}>In-person</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Date Picker */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Interview Date</Text>
                                <TouchableOpacity
                                    style={styles.datePickerButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={styles.datePickerText}>
                                        {new Date(interviewSchedule.interview_date).toLocaleDateString()}
                                    </Text>
                                    <Calendar size={20} color={Colors.GRAY} />
                                </TouchableOpacity>
                            </View>

                            {/* Time Picker */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Interview Time</Text>
                                <TouchableOpacity
                                    style={styles.datePickerButton}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Text style={styles.datePickerText}>
                                        {interviewSchedule.interview_time}
                                    </Text>
                                    <Clock size={20} color={Colors.GRAY} />
                                </TouchableOpacity>
                            </View>

                            {/* Location or Meeting Link */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    {interviewSchedule.interview_type === 'online' ? 'Meeting Link' : 'Location'}
                                </Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={interviewSchedule.interview_type === 'online' ? 
                                        interviewSchedule.meeting_link : interviewSchedule.location}
                                    onChangeText={(text) => setInterviewSchedule({
                                        ...interviewSchedule,
                                        [interviewSchedule.interview_type === 'online' ? 'meeting_link' : 'location']: text
                                    })}
                                    placeholder={interviewSchedule.interview_type === 'online' ? 
                                        'Enter meeting link' : 'Enter interview location'}
                                />
                            </View>

                            {/* Additional Notes */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Additional Notes</Text>
                                <TextInput
                                    style={[styles.textInput, styles.textArea]}
                                    value={interviewSchedule.additional_notes}
                                    onChangeText={(text) => setInterviewSchedule({
                                        ...interviewSchedule,
                                        additional_notes: text
                                    })}
                                    placeholder="Enter any additional notes"
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>

                            {/* Select Panel Members */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Select Panel Members</Text>
                                <View style={{ backgroundColor: '#f8f9fa', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 8 }}>
                                    {allPanelMembers.length === 0 ? (
                                        <Text style={{ color: Colors.GRAY, padding: 12 }}>No panel members available</Text>
                                    ) : (
                                        allPanelMembers.map((member) => {
                                            const isUnavailable = member.availability === 'Unavailable';
                                            const isSelected = modalPanelists.some((p) => p.id === member.id);
                                            return (
                                                <TouchableOpacity
                                                    key={member.id}
                                                    style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee', opacity: isUnavailable ? 0.5 : 1 }}
                                                    onPress={isUnavailable ? undefined : () => {
                                                        if (isSelected) {
                                                            setModalPanelists(modalPanelists.filter((p) => p.id !== member.id));
                                                        } else {
                                                            setModalPanelists([...modalPanelists, member]);
                                                        }
                                                    }}
                                                    disabled={isUnavailable}
                                                >
                                                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: Colors.PRIMARY, marginRight: 10, backgroundColor: isSelected ? Colors.PRIMARY : '#fff', justifyContent: 'center', alignItems: 'center' }}>
                                                        {isSelected && !isUnavailable && <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>}
                                                    </View>
                                                    <Text style={{ color: Colors.BLACK }}>{member.name} {member.availability ? `(${member.availability})` : ''}</Text>
                                                    {isUnavailable && <Text style={{ color: Colors.ERROR, marginLeft: 8, fontSize: 12 }}>(Unavailable)</Text>}
                                                </TouchableOpacity>
                                            );
                                        })
                                    )}
                                </View>
                            </View>

                            {/* Modal Actions */}
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setShowInterviewModal(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.scheduleButton]}
                                    onPress={handleScheduleInterview}
                                >
                                    <Text style={styles.scheduleButtonText}>Schedule</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Date Picker Modal */}
            {showDatePicker && (
                <DateTimePicker
                    value={new Date(interviewSchedule.interview_date)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                            setInterviewSchedule({
                                ...interviewSchedule,
                                interview_date: selectedDate.toISOString().split('T')[0]
                            });
                        }
                    }}
                    minimumDate={new Date()}
                />
            )}

            {/* Time Picker Modal */}
            {showTimePicker && (
                <DateTimePicker
                    value={new Date(`2000-01-01T${interviewSchedule.interview_time}`)}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowTimePicker(false);
                        if (selectedDate) {
                            setInterviewSchedule({
                                ...interviewSchedule,
                                interview_time: selectedDate.toTimeString().split(' ')[0].slice(0, 5)
                            });
                        }
                    }}
                />
            )}

            {/* Panelist Add/Edit Modal */}
            <Modal
                visible={showPanelistModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowPanelistModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: Colors.WHITE, borderRadius: 16, padding: 24, width: 340, maxWidth: '95%' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.PRIMARY, marginBottom: 16 }}>{isEditMode ? 'Edit Panelist' : 'Add Panelist'}</Text>
                        <ScrollView contentContainerStyle={{ gap: 12 }}>
                            <TextInput style={styles.textInput} value={panelistDraft.name || ''} onChangeText={name => setPanelistDraft({ ...panelistDraft, name })} placeholder="Name*" />
                            <TextInput style={styles.textInput} value={panelistDraft.email || ''} onChangeText={email => setPanelistDraft({ ...panelistDraft, email })} placeholder="Email" />
                            <TextInput style={styles.textInput} value={panelistDraft.role || ''} onChangeText={role => setPanelistDraft({ ...panelistDraft, role })} placeholder="Role" />
                            <TextInput style={styles.textInput} value={panelistDraft.organization || ''} onChangeText={organization => setPanelistDraft({ ...panelistDraft, organization })} placeholder="Organization" />
                            <TextInput style={styles.textInput} value={panelistDraft.phone || ''} onChangeText={phone => setPanelistDraft({ ...panelistDraft, phone })} placeholder="Phone" />
                            <TextInput style={styles.textInput} value={panelistDraft.photo_url || ''} onChangeText={photo_url => setPanelistDraft({ ...panelistDraft, photo_url })} placeholder="Photo URL" />
                            <View style={{ backgroundColor: '#f8f9fa', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 4 }}>
                                <Picker
                                    selectedValue={panelistDraft.availability || 'Available'}
                                    onValueChange={availability => setPanelistDraft({ ...panelistDraft, availability })}
                                    style={{ height: 44 }}
                                >
                                    <Picker.Item label="Available" value="Available" />
                                    <Picker.Item label="Unavailable" value="Unavailable" />
                                </Picker>
                            </View>
                            <TextInput style={styles.textInput} value={panelistDraft.linkedin_url || ''} onChangeText={linkedin_url => setPanelistDraft({ ...panelistDraft, linkedin_url })} placeholder="LinkedIn URL" />
                            <TextInput style={styles.textInput} value={panelistDraft.notes || ''} onChangeText={notes => setPanelistDraft({ ...panelistDraft, notes })} placeholder="Notes" multiline />
                        </ScrollView>
                        {panelistError && <Text style={{ color: Colors.ERROR, marginTop: 8 }}>{panelistError}</Text>}
                        <TouchableOpacity
                            onPress={handleSavePanelist}
                            style={{ backgroundColor: Colors.PRIMARY, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10, marginTop: 16 }}
                        >
                            <Text style={{ color: Colors.WHITE, fontWeight: 'bold', fontSize: 16 }}>{isEditMode ? 'Save' : 'Add'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowPanelistModal(false)} style={{ marginTop: 12 }}>
                            <Text style={{ color: Colors.GRAY, fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: Colors.GRAY,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.BLACK,
    },
    content: {
        flex: 1,
    },
    section: {
        backgroundColor: Colors.WHITE,
        padding: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.BLACK,
        marginBottom: 12,
    },
    companyName: {
        fontSize: 16,
        color: Colors.GRAY,
        marginBottom: 8,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationText: {
        marginLeft: 8,
        color: Colors.GRAY,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: Colors.WHITE,
        fontSize: 12,
        fontWeight: '500',
    },
    applicantName: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.BLACK,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        marginLeft: 8,
        fontSize: 16,
        color: Colors.BLACK,
    },
    educationItem: {
        marginBottom: 16,
    },
    degreeText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '500',
        color: Colors.BLACK,
    },
    institutionText: {
        marginLeft: 24,
        fontSize: 14,
        color: Colors.GRAY,
    },
    yearText: {
        marginLeft: 24,
        fontSize: 14,
        color: Colors.GRAY,
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillBadge: {
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    skillText: {
        color: Colors.PRIMARY,
        fontSize: 14,
    },
    interviewCard: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
    },
    meetingLinkButton: {
        backgroundColor: Colors.PRIMARY,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    meetingLinkText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: '500',
    },
    documentButton: {
        backgroundColor: Colors.PRIMARY,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    documentButtonText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: '500',
    },
    coverLetterContainer: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
    },
    coverLetterTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.BLACK,
        marginBottom: 8,
    },
    coverLetterText: {
        fontSize: 14,
        color: Colors.BLACK,
        lineHeight: 20,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 16,
        paddingHorizontal: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    actionButtonText: {
        color: Colors.WHITE,
        fontSize: 14,
        fontWeight: '500',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    modalContent: {
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 16,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.BLACK,
        marginBottom: 16,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.BLACK,
        marginBottom: 8,
    },
    radioGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    radioButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
    },
    radioButtonSelected: {
        backgroundColor: Colors.PRIMARY,
    },
    radioButtonText: {
        color: Colors.PRIMARY,
        fontSize: 14,
        fontWeight: '500',
    },
    radioButtonTextSelected: {
        color: Colors.WHITE,
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
    },
    datePickerText: {
        fontSize: 14,
        color: Colors.BLACK,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: Colors.BLACK,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 16,
    },
    modalButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
    },
    cancelButtonText: {
        color: Colors.BLACK,
        fontSize: 14,
        fontWeight: '500',
    },
    scheduleButton: {
        backgroundColor: Colors.PRIMARY,
    },
    scheduleButtonText: {
        color: Colors.WHITE,
        fontSize: 14,
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    editButton: {
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    editButtonText: {
        color: Colors.WHITE,
        fontSize: 12,
        fontWeight: '500',
    },
    interviewStatusBadge: {
        backgroundColor: '#e8f5e8',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    interviewStatusText: {
        color: '#2e7d32',
        fontSize: 12,
        fontWeight: '500',
    },
    notesContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    notesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.BLACK,
        marginBottom: 4,
    },
    notesText: {
        fontSize: 14,
        color: Colors.BLACK,
        lineHeight: 20,
    },
    noInterviewCard: {
        backgroundColor: '#f8f9fa',
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    noInterviewText: {
        fontSize: 16,
        color: Colors.GRAY,
        marginBottom: 16,
    },
    scheduleInterviewButton: {
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    scheduleInterviewButtonText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: '500',
    },
});