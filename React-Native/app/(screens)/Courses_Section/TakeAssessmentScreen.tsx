import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert, Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import { useAuth } from '../../../Context/auth';
import Colors from '../../../constant/Colors';
import { X, ArrowLeft, ArrowRight, CheckCircle, Award, Check, Eye, Clock } from 'lucide-react-native';

interface Option { id: string; option_text: string; is_correct: boolean; }
interface QuestionWithOptions { 
    id: string; 
    question_text: string; 
    points: number; 
    allow_multiple_answers: boolean; 
    media_url?: string | null;
    options: Option[]; 
}
type UserAnswers = Record<string, string[]>;

const TakeAssessmentScreen = () => {
  const router = useRouter();
  const { session } = useAuth();
  const { assessmentId } = useLocalSearchParams<{ assessmentId: string }>();

  const [quizState, setQuizState] = useState<'loading' | 'in_progress' | 'submitted' | 'error'>('loading');
  const [assessmentDetails, setAssessmentDetails] = useState<any>(null);
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // NEW: State for the timer
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // NEW: Timer logic
  useEffect(() => {
    // Only run the timer if the quiz is in progress and has a time limit
    if (quizState !== 'in_progress' || !assessmentDetails?.time_limit_seconds) {
      return;
    }

    // If the timer hits zero, move to the next question or submit
    if (timeLeft === 0) {
      handleNext();
      return;
    }

    // Decrement the timer every second
    const timerId = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : 0));
    }, 1000);

    // Clean up the interval on component unmount or when dependencies change
    return () => clearInterval(timerId);
  }, [quizState, timeLeft, assessmentDetails]);


  useEffect(() => {
    const loadQuiz = async () => {
      if (!assessmentId) {
        setQuizState('error');
        return;
      }
      try {
        // MODIFIED: Fetch time_limit_seconds
        const { data: assessment, error: assessmentError } = await supabase
          .from('assessments').select('*, time_limit_seconds').eq('id', assessmentId).single();
        if (assessmentError) throw assessmentError;
        setAssessmentDetails(assessment);
        setTotalPoints(assessment.total_points || 0);

        // NEW: Set the initial time for the first question
        if (assessment.time_limit_seconds) {
          setTimeLeft(assessment.time_limit_seconds);
        }

        const { data: questionsData, error: questionsError } = await supabase
          .from('assessment_questions').select('*, media_url').eq('assessment_id', assessmentId).order('order_index');
        if (questionsError) throw questionsError;

        const questionIds = questionsData.map(q => q.id);
        const { data: optionsData, error: optionsError } = await supabase
          .from('question_options').select('*').in('question_id', questionIds);
        if (optionsError) throw optionsError;

        const questionsWithOptions = questionsData.map(q => ({
          ...q,
          options: optionsData.filter(opt => opt.question_id === q.id).sort((a, b) => a.order_index - b.order_index)
        }));

        setQuestions(questionsWithOptions);
        setQuizState('in_progress');
      } catch (err) {
        console.error("Failed to load quiz:", err);
        setQuizState('error');
      }
    };
    loadQuiz();
  }, [assessmentId]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    const currentAnswers = userAnswers[questionId] || [];
    if (question.allow_multiple_answers) {
      const newAnswers = currentAnswers.includes(optionId)
        ? currentAnswers.filter(id => id !== optionId)
        : [...currentAnswers, optionId];
      setUserAnswers(prev => ({ ...prev, [questionId]: newAnswers }));
    } else {
      setUserAnswers(prev => ({ ...prev, [questionId]: [optionId] }));
    }
  };

  const handleSubmitQuiz = async () => {
    let finalScore = 0;
    const submissionAnswers = [];
    if (!session?.user) {
      Alert.alert("Error", "You must be signed in to submit.");
      return;
    }

    questions.forEach(q => {
      const correctOptions = q.options.filter(opt => opt.is_correct).map(opt => opt.id);
      const userSelectedOptions = userAnswers[q.id] || [];
      const isCorrect = correctOptions.length === userSelectedOptions.length && correctOptions.every(id => userSelectedOptions.includes(id));
      if (isCorrect) finalScore += q.points;
      submissionAnswers.push({
        question_id: q.id,
        selected_option_ids: userSelectedOptions,
        is_correct: isCorrect,
        points_awarded: isCorrect ? q.points : 0,
      });
    });

    setScore(finalScore);
    
    try {
      setQuizState('loading');
      const { data: submissionData, error: submissionError } = await supabase
        .from('assessment_submissions')
        .insert([{
          assessment_id: assessmentId,
          user_id: session.user.id,
          score: finalScore,
          total_points: totalPoints,
        }])
        .select()
        .single();
      
      if (submissionError) throw submissionError;
      
      setSubmissionId(submissionData.id);

      const answersToInsert = submissionAnswers.map(ans => ({
        ...ans,
        submission_id: submissionData.id,
      }));
      const { error: answersError } = await supabase
        .from('submission_answers')
        .insert(answersToInsert);
      if (answersError) throw answersError;
      
      setQuizState('submitted');

    } catch (err: any) {
      Alert.alert("Submission Failed", "There was an error saving your results.");
      setQuizState('in_progress');
    }
  };

  // NEW: Function to reset the timer for the next question
  const resetTimer = () => {
      if (assessmentDetails?.time_limit_seconds) {
          setTimeLeft(assessmentDetails.time_limit_seconds);
      }
  };

  // NEW: Combined logic for moving to the next question
  const handleNext = () => {
      if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(p => p + 1);
          resetTimer();
      } else {
          handleSubmitQuiz();
      }
  };

  const handlePrevious = () => {
      setCurrentQuestionIndex(p => Math.max(0, p - 1));
      resetTimer();
  };

  const renderQuestion = () => {
    const question = questions[currentQuestionIndex];
    if (!question) return null;
    const selectedOptions = userAnswers[question.id] || [];

    return (
      <View>
        {question.media_url && (
            <Image
                source={{ uri: question.media_url }}
                style={styles.questionImage}
                resizeMode="contain"
            />
        )}

        <Text style={styles.questionText}>{question.question_text}</Text>
        
        {question.options.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.optionButton, selectedOptions.includes(opt.id) && styles.optionButtonSelected]}
            onPress={() => handleSelectOption(question.id, opt.id)}
          >
            <View style={question.allow_multiple_answers ? styles.checkbox : styles.radioCircle}>
              {selectedOptions.includes(opt.id) && (
                question.allow_multiple_answers 
                ? <Check size={16} color={Colors.WHITE} /> 
                : <View style={styles.radioDot} />
              )}
            </View>
            <Text style={[styles.optionText, selectedOptions.includes(opt.id) && styles.optionTextSelected]}>
              {opt.option_text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  const renderResults = () => (
    <View style={styles.resultsContainer}>
        <Award size={64} color={Colors.PRIMARY} />
        <Text style={styles.resultsTitle}>Quiz Completed!</Text>
        <Text style={styles.scoreText}>Your Score</Text>
        <Text style={styles.scoreValue}>{score} / {totalPoints}</Text>
        
        <View style={styles.resultsActions}>
            <TouchableOpacity 
                style={[styles.resultsButton, styles.reviewButton]} 
                onPress={() => router.push({ pathname: '/(screens)/Courses_Section/QuizReviewScreen', params: { submissionId } })}
                disabled={!submissionId}
            >
                <Eye size={18} color={Colors.PRIMARY}/>
                <Text style={styles.reviewButtonText}>Review Answers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.resultsButton, styles.finishButton]} onPress={() => router.back()}>
                <Text style={styles.finishButtonText}>Back to Course</Text>
            </TouchableOpacity>
        </View>
    </View>
  );

  const renderContent = () => {
    switch(quizState) {
      case 'loading': return <ActivityIndicator size="large" color={Colors.PRIMARY} />;
      case 'error': return <Text style={styles.errorText}>Failed to load the quiz. Please try again.</Text>;
      case 'submitted': return renderResults();
      case 'in_progress':
        const isTimerWarning = timeLeft !== null && timeLeft <= 10;
        return (
          <>
            <View style={styles.progressHeader}>
                <Text style={styles.progressText}>Question {currentQuestionIndex + 1} of {questions.length}</Text>
                {/* NEW: Timer Display */}
                {timeLeft !== null && (
                    <View style={styles.timerContainer}>
                        <Clock size={16} color={isTimerWarning ? Colors.ERROR : Colors.GRAY} />
                        <Text style={[styles.timerText, isTimerWarning && styles.timerTextWarning]}>
                            {`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}
                        </Text>
                    </View>
                )}
                <Text style={styles.pointsText}>{questions[currentQuestionIndex]?.points} Points</Text>
            </View>
            {questions.length > 0 && renderQuestion()}
          </>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><X size={24} color={Colors.BLACK} /></TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{assessmentDetails?.title}</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderContent()}
      </ScrollView>

      {quizState === 'in_progress' && (
        <View style={styles.navigation}>
          <TouchableOpacity 
            style={[styles.navButton, styles.prevButton, currentQuestionIndex === 0 && styles.disabledNavButton]} 
            onPress={handlePrevious} // MODIFIED
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft size={18} color={currentQuestionIndex === 0 ? Colors.GRAY : Colors.PRIMARY}/>
            <Text style={[styles.prevButtonText, currentQuestionIndex === 0 && { color: Colors.GRAY }]}>Previous</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Submit Quiz'}
            </Text>
            {currentQuestionIndex < questions.length - 1 
                ? <ArrowRight size={18} color={Colors.WHITE}/>
                : <CheckCircle size={18} color={Colors.WHITE}/>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: Colors.WHITE, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center', marginHorizontal: 8 },
    scrollContent: { padding: 16, flexGrow: 1 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    progressText: { color: Colors.GRAY, fontWeight: '500' },
    pointsText: { color: Colors.PRIMARY, fontWeight: 'bold' },
    timerContainer: { // NEW
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    timerText: { // NEW
        marginLeft: 4,
        fontWeight: 'bold',
        color: Colors.GRAY
    },
    timerTextWarning: { // NEW
        color: Colors.ERROR
    },
    questionImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 16,
    },
    questionText: { fontSize: 20, fontWeight: '600', marginBottom: 24, lineHeight: 28 },
    optionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.WHITE, padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#E8EDF2', marginBottom: 12 },
    optionButtonSelected: { borderColor: Colors.PRIMARY, backgroundColor: Colors.PRIMARY_LIGHT },
    radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CED9E5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.PRIMARY },
    checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: Colors.PRIMARY, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    optionText: { flex: 1, fontSize: 16 },
    optionTextSelected: { fontWeight: 'bold' },
    navigation: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderTopColor: '#E0E0E0', backgroundColor: Colors.WHITE },
    navButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
    disabledNavButton: { backgroundColor: '#f0f0f0' },
    prevButton: { backgroundColor: Colors.WHITE, borderWidth: 1, borderColor: '#CED9E5' },
    nextButton: { backgroundColor: Colors.PRIMARY },
    prevButtonText: { color: Colors.PRIMARY, fontWeight: 'bold', marginLeft: 8 },
    nextButtonText: { color: Colors.WHITE, fontWeight: 'bold', marginRight: 8 },
    resultsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    resultsTitle: { fontSize: 28, fontWeight: 'bold', marginTop: 16 },
    scoreText: { fontSize: 18, color: Colors.GRAY, marginTop: 24 },
    scoreValue: { fontSize: 48, fontWeight: 'bold', color: Colors.PRIMARY, marginVertical: 8 },
    resultsActions: { flexDirection: 'row', marginTop: 32, gap: 12 },
    resultsButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, gap: 8 },
    reviewButton: { backgroundColor: Colors.WHITE, borderWidth: 1.5, borderColor: Colors.PRIMARY },
    reviewButtonText: { color: Colors.PRIMARY, fontSize: 16, fontWeight: 'bold' },
    finishButton: { backgroundColor: Colors.PRIMARY },
    finishButtonText: { color: Colors.WHITE, fontSize: 16, fontWeight: 'bold' },
    errorText: { textAlign: 'center', fontSize: 16, color: Colors.ERROR },
});

export default TakeAssessmentScreen;