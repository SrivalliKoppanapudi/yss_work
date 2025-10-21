import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import Colors from '../../../constant/Colors';
import { ArrowLeft, CheckCircle, Award, Clock } from 'lucide-react-native';

const QuizHistory = () => {
    const router = useRouter();
    const { studentId, courseId } = useLocalSearchParams<{ studentId: string, courseId: string }>();

    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<any>(null);
    const [assessments, setAssessments] = useState<any[]>([]);

    const fetchScores = useCallback(async () => {
        if (!studentId || !courseId) {
            Alert.alert("Error", "Student or Course ID is missing.");
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            // Fetch student's name
            const { data: studentData, error: studentError } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', studentId)
                .single();
            if (studentError) throw studentError;
            setStudent(studentData);

            // Fetch all assessments for the course
            const { data: assessmentsData, error: assessmentsError } = await supabase
                .from('assessments')
                .select('id, title, total_points')
                .eq('course_id', courseId);
            if (assessmentsError) throw assessmentsError;

            if (!assessmentsData || assessmentsData.length === 0) {
                setAssessments([]);
                setLoading(false);
                return;
            }

            const assessmentIds = assessmentsData.map(a => a.id);

            // Fetch all submissions for this student and these assessments
            const { data: submissionsData, error: submissionsError } = await supabase
                .from('assessment_submissions')
                .select('*')
                .eq('user_id', studentId)
                .in('assessment_id', assessmentIds)
                .order('submitted_at', { ascending: false });
            
            if (submissionsError) throw submissionsError;

            // Group submissions by assessment
            const assessmentsWithSubmissions = assessmentsData.map(assessment => {
                const submissions = (submissionsData || []).filter(sub => sub.assessment_id === assessment.id);
                return {
                    ...assessment,
                    submissions: submissions,
                };
            });

            setAssessments(assessmentsWithSubmissions);

        } catch (error: any) {
            Alert.alert("Error", "Could not load quiz scores.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [studentId, courseId]);

    useEffect(() => {
        fetchScores();
    }, [fetchScores]);

    if (loading) {
        return <ActivityIndicator style={styles.centered} size="large" color={Colors.PRIMARY} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.BLACK} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{student?.name}'s Scores</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {assessments.length === 0 ? (
                    <Text style={styles.emptyText}>No quizzes found in this course.</Text>
                ) : (
                    assessments.map(assessment => (
                        <View key={assessment.id} style={styles.assessmentCard}>
                            <Text style={styles.assessmentTitle}>{assessment.title}</Text>
                            {assessment.submissions.length > 0 ? (
                                assessment.submissions.map((sub: any, index: number) => (
                                    <View key={sub.id} style={styles.submissionRow}>
                                        <View style={styles.attemptInfo}>
                                            <Award size={16} color={Colors.PRIMARY} />
                                            <Text style={styles.attemptText}>Attempt #{assessment.submissions.length - index}</Text>
                                        </View>
                                        <View style={styles.scoreInfo}>
                                            <Text style={styles.scoreText}>{sub.score}/{sub.total_points}</Text>
                                            <Text style={styles.dateText}>
                                                {new Date(sub.submitted_at).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.noSubmissionText}>No submissions yet for this quiz.</Text>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: { padding: 4, marginRight: 12 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '600' },
    scrollContent: { padding: 16 },
    assessmentCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    assessmentTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 8,
    },
    submissionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    attemptInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    attemptText: {
        marginLeft: 8,
        fontSize: 15,
        color: Colors.GRAY,
    },
    scoreInfo: {
        alignItems: 'flex-end',
    },
    scoreText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 12,
        color: Colors.GRAY,
        marginTop: 2,
    },
    noSubmissionText: {
        textAlign: 'center',
        color: Colors.GRAY,
        fontStyle: 'italic',
        padding: 10,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
        color: Colors.GRAY,
    },
});

export default QuizHistory;