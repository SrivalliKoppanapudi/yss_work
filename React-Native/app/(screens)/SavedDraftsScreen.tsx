import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constant/Colors';
import { supabase } from '../../lib/Superbase';
import { Job } from '../../types/jobs';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../Context/auth';
import DraftJobCard from '../../component/jobs/DraftJobCard'; // We will create this next
import { ScrollView } from 'react-native-gesture-handler';

export default function SavedDraftsScreen() {
  const router = useRouter();
  const { session, isLoading: authIsLoading } = useAuth();
  const currentUserId = session?.user?.id;

  const [draftJobs, setDraftJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDraftJobs = useCallback(async () => {
    if (authIsLoading || !currentUserId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('status', 'Draft')
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;

      setDraftJobs((data as Job[]) || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch your saved drafts.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUserId, authIsLoading]);

  // useFocusEffect will refetch data every time the screen is viewed
  useFocusEffect(
    useCallback(() => {
      fetchDraftJobs();
    }, [fetchDraftJobs])
  );
  
  const handleDeleteJob = async (jobId: number) => {
      Alert.alert(
          "Confirm Deletion",
          "Are you sure you want to delete this draft? This action cannot be undone.",
          [
              { text: "Cancel", style: "cancel" },
              {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                      try {
                          const { error } = await supabase.from('jobs').delete().eq('id', jobId);
                          if (error) throw error;
                          Alert.alert("Success", "Draft has been deleted.");
                          fetchDraftJobs(); // Refresh the list
                      } catch (err: any) {
                          Alert.alert("Error", `Failed to delete draft: ${err.message}`);
                      }
                  },
              },
          ]
      );
  };

  if (authIsLoading) {
      return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.PRIMARY} /></View>;
  }

  if (!currentUserId) {
    return (
        <SafeAreaView style={styles.centered}>
            <Text style={styles.infoText}>Please log in to see your drafts.</Text>
            <TouchableOpacity style={styles.authButton} onPress={() => router.push('/auth/SignIn')}>
                <Text style={styles.authButtonText}>Sign In</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {isLoading && draftJobs.length === 0 ? (
        <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.activityIndicator} />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDraftJobs}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : draftJobs.length === 0 ? (
         <ScrollView 
            contentContainerStyle={styles.centered}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={fetchDraftJobs} colors={[Colors.PRIMARY]} />}
          >
          <Text style={styles.infoText}>You have no saved drafts.</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={draftJobs}
          renderItem={({ item }) => (
            <DraftJobCard
              job={item}
              onDelete={() => handleDeleteJob(item.id)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={fetchDraftJobs}
              colors={[Colors.PRIMARY]}
              tintColor={Colors.PRIMARY}
            />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f4f6f8' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    infoText: { fontSize: 16, color: Colors.GRAY, textAlign: 'center', marginBottom: 20 },
    authButton: { backgroundColor: Colors.PRIMARY, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8 },
    authButtonText: { color: Colors.WHITE, fontWeight: 'bold', fontSize: 16 },
    createButton: { backgroundColor: Colors.SUCCESS, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8 },
    createButtonText: { color: Colors.WHITE, fontWeight: 'bold', fontSize: 16 },
    listContainer: { paddingBottom: 20, paddingTop: 8 },
    activityIndicator: { marginTop: 50 },
    errorText: { fontSize: 16, color: Colors.ERROR, textAlign: 'center', marginBottom: 15 },
    retryButton: { backgroundColor: Colors.PRIMARY, paddingVertical: 10, paddingHorizontal: 25, borderRadius: 5 },
    retryButtonText: { color: Colors.WHITE, fontSize: 16 },
});