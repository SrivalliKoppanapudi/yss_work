import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../Context/auth';
import { JobService } from '../../lib/jobService';
import { InterviewSchedule, InterviewPanelist } from '../../types/jobs';
import Colors from '../../constant/Colors';
import { Calendar, Clock, Users, Video, MapPin, ArrowRight } from 'lucide-react-native';

export default function MyInterviewsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await JobService.getUpcomingInterviews(userId);
      console.log('Fetched interviews:', data?.length, 'interviews');
      setInterviews(data);
      setLastUpdated(new Date());
    } catch (e: any) {
      console.error('Error fetching interviews:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await JobService.getUpcomingInterviews(userId);
      setInterviews(data);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchInterviews();
    }
  }, [userId, fetchInterviews]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchInterviews();
      }
    }, [userId, fetchInterviews])
  );

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color={Colors.PRIMARY} /><Text style={styles.loadingText}>Loading your interviews...</Text></View>
    );
  }
  if (error) {
    return (
      <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>
    );
  }
  if (!interviews.length) {
    return (
      <View style={styles.centered}><Text style={styles.emptyText}>No upcoming interviews scheduled.</Text></View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.PRIMARY]}
          tintColor={Colors.PRIMARY}
        />
      }
    >
      <Text style={styles.title}>My Upcoming Interviews</Text>
      {lastUpdated && (
        <Text style={styles.lastUpdated}>
          Last updated: {lastUpdated.toLocaleDateString()} at {lastUpdated.toLocaleTimeString()}
        </Text>
      )}
      {interviews.map((item, idx) => {
        const interview: InterviewSchedule = item;
        const application = item.job_applications;
        const job = application?.jobs;
        // Use the new panelists data structure, fallback to old structure for compatibility
        const panelists: InterviewPanelist[] = item.interview_panelists || item.interview_panel || [];
        return (
          <TouchableOpacity
            key={interview.id}
            style={styles.card}
            onPress={() => router.push({ pathname: '/(screens)/InterviewDetailsScreen', params: { applicationId: application.id } })}
          >
            <Text style={styles.jobTitle}>{job?.job_name || 'Job'}</Text>
            <Text style={styles.companyName}>{job?.company_name || ''}</Text>
            <View style={styles.row}><Calendar size={16} color={Colors.GRAY} /><Text style={styles.infoText}>Date: {interview.interview_date}</Text></View>
            <View style={styles.row}><Clock size={16} color={Colors.GRAY} /><Text style={styles.infoText}>Time: {interview.interview_time}</Text></View>
            {interview.round && <View style={styles.row}><Text style={styles.infoText}>Round: {interview.round}</Text></View>}
            {interview.duration && <View style={styles.row}><Text style={styles.infoText}>Duration: {interview.duration} min</Text></View>}
            {interview.meeting_link && <View style={styles.row}><Text style={styles.infoText}>Meeting Link: {interview.meeting_link}</Text></View>}
            {interview.location && <View style={styles.row}><Text style={styles.infoText}>Venue: {interview.location}</Text></View>}
            {/* Panel Information Box */}
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
            {interview.interview_type === 'online' && interview.meeting_link && (
              <TouchableOpacity style={styles.joinButton} onPress={() => {
                if (interview.meeting_link) {
                  Linking.openURL(interview.meeting_link);
                }
              }}>
                <Video size={16} color={Colors.WHITE} />
                <Text style={styles.joinButtonText}>Join Meeting</Text>
                <ArrowRight size={16} color={Colors.WHITE} />
              </TouchableOpacity>
            )}
            {interview.interview_type === 'offline' && interview.location && (
              <View style={styles.row}><MapPin size={16} color={Colors.GRAY} /><Text style={styles.infoText}>{interview.location}</Text></View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 16, color: Colors.GRAY, fontSize: 16 },
  errorText: { color: 'red', fontSize: 16 },
  emptyText: { color: Colors.GRAY, fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: Colors.PRIMARY },
  card: { backgroundColor: Colors.WHITE, borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  jobTitle: { fontSize: 16, fontWeight: '600', color: Colors.PRIMARY },
  companyName: { fontSize: 14, color: Colors.GRAY, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  infoText: { fontSize: 14, color: Colors.BLACK, marginLeft: 6 },
  joinButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.PRIMARY, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, marginTop: 10, gap: 8, alignSelf: 'flex-start' },
  joinButtonText: { color: Colors.WHITE, fontWeight: '600', fontSize: 14, marginLeft: 6 },
  lastUpdated: { fontSize: 12, color: Colors.GRAY, marginBottom: 16, textAlign: 'center' },
}); 