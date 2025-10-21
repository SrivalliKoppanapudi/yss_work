import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView, Alert, ViewStyle } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import Colors from '../../../constant/Colors';
import { X, Check, Award } from 'lucide-react-native';

const QuizReviewScreen = () => {
  const router = useRouter();
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<any>(null);

  const fetchReviewData = useCallback(async () => {
    if (!submissionId) {
      setError("Submission ID not found.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('assessment_submissions')
        .select(`
          score,
          total_points,
          assessment:assessments (
            title,
            questions:assessment_questions (
              *,
              options:question_options (*)
            )
          ),
          answers:submission_answers (*)
        `)
        .eq('id', submissionId)
        .single();
      
      if (fetchError) throw fetchError;
      setReviewData(data);

    } catch (err: any) {
      setError("Failed to load quiz review data.");
      console.error("Error fetching review data:", err);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchReviewData();
  }, [fetchReviewData]);

  const renderOption = (question: any, option: any) => {
    const userAnswersForQuestion = reviewData.answers.find((a: any) => a.question_id === question.id)?.selected_option_ids || [];
    const isSelected = userAnswersForQuestion.includes(option.id);
    const isCorrect = option.is_correct;

    // --- THIS IS THE FIX ---
    // Initialize `style` as an array of styles from the beginning.
    const style: (ViewStyle | false)[] = [styles.optionButton];
    let icon = null;

    if (isSelected && isCorrect) {
      style.push(styles.correctSelectedOption);
      icon = <Check size={16} color={Colors.WHITE} />;
    } else if (isSelected && !isCorrect) {
      style.push(styles.incorrectSelectedOption);
      icon = <X size={16} color={Colors.WHITE} />;
    } else if (!isSelected && isCorrect) {
      style.push(styles.correctUnselectedOption);
    }
    // --- END OF FIX ---

    return (
      <View key={option.id} style={style}>
        <View style={styles.optionIconContainer}>
          {icon}
        </View>
        <Text style={[styles.optionText, (isSelected && isCorrect) || (isSelected && !isCorrect) ? { color: Colors.WHITE } : {}]}>
          {option.option_text}
        </Text>
      </View>
    );
  };
  
  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.PRIMARY} />;
  }
  
  if (error || !reviewData) {
    return <View style={styles.container}><Text style={styles.errorText}>{error || "Could not load data."}</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>{reviewData.assessment.title}</Text>
        <TouchableOpacity onPress={() => router.back()}><X size={24} color={Colors.BLACK} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.scoreSummary}>
            <Award size={48} color={Colors.PRIMARY} />
            <Text style={styles.scoreTitle}>Your Final Score</Text>
            <Text style={styles.scoreValue}>{reviewData.score} / {reviewData.total_points}</Text>
        </View>

        {reviewData.assessment.questions.sort((a: any, b: any) => a.order_index - b.order_index).map((question: any, index: number) => (
          <View key={question.id} style={styles.questionContainer}>
            <Text style={styles.questionText}>{index + 1}. {question.question_text}</Text>
            {question.options.sort((a: any, b: any) => a.order_index - b.order_index).map((option: any) => renderOption(question, option))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: Colors.WHITE, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center', marginHorizontal: 8 },
    scrollContent: { padding: 16 },
    scoreSummary: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        marginBottom: 24,
    },
    scoreTitle: {
        fontSize: 18,
        color: Colors.GRAY,
        marginTop: 8,
    },
    scoreValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        marginVertical: 4,
    },
    questionContainer: {
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    questionText: { fontSize: 18, fontWeight: '600', marginBottom: 16, lineHeight: 26 },
    optionButton: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#E8EDF2', marginBottom: 12 },
    correctSelectedOption: { backgroundColor: Colors.SUCCESS, borderColor: Colors.SUCCESS },
    incorrectSelectedOption: { backgroundColor: Colors.ERROR, borderColor: Colors.ERROR },
    correctUnselectedOption: { borderColor: Colors.SUCCESS, borderWidth: 2 },
    optionIconContainer: {
        width: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionText: { flex: 1, fontSize: 16 },
    errorText: { textAlign: 'center', fontSize: 16, color: Colors.ERROR, marginTop: 40 },
});

export default QuizReviewScreen;