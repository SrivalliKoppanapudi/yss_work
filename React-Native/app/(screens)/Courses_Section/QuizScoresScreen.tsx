import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import { useAuth } from '../../../Context/auth';
import Colors from '../../../constant/Colors';
import { ArrowLeft } from 'lucide-react-native';

const QuizScoresScreen = () => {
  const router = useRouter();
  const { session } = useAuth();
  const { assessmentId, moduleId } = useLocalSearchParams<{ assessmentId: string, moduleId: string }>();

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [assessment, setAssessment] = useState<any>(null);
  const [module, setModule] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchScores = async () => {
        if (!assessmentId || !session?.user?.id) {
            Alert.alert("Error", "Could not load quiz scores. Missing required information.");
            setLoading(false);
            if (router.canGoBack()) router.back();
            return;
        }

        try {
            setLoading(true);

            // Fetch submissions for the current user and assessment
            const { data: submissionsData, error: submissionsError } = await supabase
                .from('assessment_submissions')
                .select('*')
                .eq('assessment_id', assessmentId)
                .eq('user_id', session.user.id)
                .order('submitted_at', { ascending: true });
            
            if (submissionsError) throw submissionsError;

            // If no submissions exist, redirect to take the quiz for the first time
            if (submissionsData.length === 0) {
                router.replace({ 
                    pathname: '/(screens)/Courses_Section/TakeAssessmentScreen', 
                    params: { assessmentId } 
                });
                return;
            }

            setSubmissions(submissionsData);
            
            // Fetch assessment and module details for display
            const { data: assessmentData, error: assessmentError } = await supabase
                .from('assessments')
                .select('title, module_id')
                .eq('id', assessmentId)
                .single();
            if (assessmentError) throw assessmentError;
            setAssessment(assessmentData);

            const modId = moduleId || assessmentData?.module_id;
            if (modId) {
                const { data: moduleData, error: moduleError } = await supabase
                    .from('modules')
                    .select('title')
                    .eq('id', modId)
                    .single();
                if (moduleError) throw moduleError;
                setModule(moduleData);
            }

        } catch (err: any) {
            console.error("Error fetching quiz scores:", err);
            Alert.alert("Error", "Could not load quiz scores.");
        } finally {
            setLoading(false);
        }
      };
      
      fetchScores();
    }, [assessmentId, moduleId, session?.user?.id])
  );

  const handleQuizAgain = () => {
    router.push({ 
        pathname: '/(screens)/Courses_Section/TakeAssessmentScreen', 
        params: { assessmentId } 
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      </SafeAreaView>
    );
  }

  const getAttemptLabel = (index: number) => {
      const suffixes = ['st', 'nd', 'rd', 'th'];
      const i = index + 1;
      if (i % 100 >= 11 && i % 100 <= 13) return `${i}th Attempt`;
      switch (i % 10) {
          case 1: return `${i}st Attempt`;
          case 2: return `${i}nd Attempt`;
          case 3: return `${i}rd Attempt`;
          default: return `${i}th Attempt`;
      }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color={Colors.BLACK} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz Scores</Text>
        <View style={{width: 24}}/>
      </View>

      <View style={styles.content}>
        <Text style={styles.moduleTitle}>
          {module?.title || 'Module'}
        </Text>
        <Text style={styles.quizTitle}>
          {assessment?.title || 'Quiz'}
        </Text>

        <View style={styles.scoresContainer}>
          {submissions.map((submission, index) => (
            <View 
              key={submission.id} 
              style={[
                styles.attemptRow, 
                // Highlight the latest attempt like in your screenshot
                index === submissions.length - 1 && styles.latestAttemptRow 
              ]}
            >
              <Text style={styles.attemptLabel}>{getAttemptLabel(index)}</Text>
              <Text style={styles.scoreText}>{submission.score}/{submission.total_points}</Text>
            </View>
          ))}
        </View>
        
        <TouchableOpacity style={styles.quizAgainButton} onPress={handleQuizAgain}>
            <Text style={styles.quizAgainButtonText}>Quiz Again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: Colors.WHITE },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#0075ff' },
    content: { padding: 24, flex: 1 },
    moduleTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.BLACK, textAlign: 'center', marginBottom: 4 },
    quizTitle: { fontSize: 16, color: Colors.GRAY, textAlign: 'center', marginBottom: 32 },
    scoresContainer: {
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    attemptRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    latestAttemptRow: {
        backgroundColor: '#d1fae5', // Light green
        borderBottomWidth: 0,
    },
    attemptLabel: {
        fontSize: 16,
        color: Colors.BLACK,
    },
    scoreText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.BLACK,
    },
    quizAgainButton: {
        marginTop: 40,
        backgroundColor: '#2563eb',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    quizAgainButtonText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default QuizScoresScreen;