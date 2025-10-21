import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch,
  ActivityIndicator, SafeAreaView, Alert, Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '../../../constant/Colors';
import { Plus, Trash2, Check, UploadCloud, Copy, X, CheckSquare } from 'lucide-react-native';
import { supabase } from '../../../lib/Superbase';
import { useAuth } from '../../../Context/auth';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

interface AnswerOption {
  id: number;
  text: string;
  isCorrect: boolean;
}

interface QuestionState {
  id: number;
  text: string;
  points: number;
  allowMultipleAnswers: boolean;
  options: AnswerOption[];
  mediaUrl?: string | null;
}

const AssessmentCreation = () => {
  const router = useRouter();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ courseId: string; moduleId: string }>();
  const [loading, setLoading] = useState(false);
  
  const [uploadingMediaFor, setUploadingMediaFor] = useState<number | null>(null);

  const [quizTitle, setQuizTitle] = useState('Module 1 Quiz');
  const [quizDescription, setQuizDescription] = useState('');
  // NEW: State for the time limit input
  const [timeLimit, setTimeLimit] = useState(''); 
  const [totalPoints, setTotalPoints] = useState(0);

  const [questions, setQuestions] = useState<QuestionState[]>([
    {
      id: 1,
      text: '',
      points: 10,
      allowMultipleAnswers: false,
      mediaUrl: null,
      options: [
        { id: 1, text: '', isCorrect: false },
        { id: 2, text: '', isCorrect: false },
      ],
    },
  ]);

  useEffect(() => {
    const calculatedTotal = questions.reduce((sum, q) => sum + (q.points || 0), 0);
    setTotalPoints(calculatedTotal);
  }, [questions]);


  const handleMediaPick = async (questionId: number) => {
    if (!session?.user) return;
    
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.7,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;
    
    const asset = result.assets[0];
    setUploadingMediaFor(questionId);

    try {
        const fileExt = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
        const fileName = `${session.user.id}/${params.courseId}/${params.moduleId}/${Date.now()}.${fileExt}`;

        const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        const { error: uploadError } = await supabase.storage
            .from('assessment-media')
            .upload(fileName, decode(base64), { contentType: asset.mimeType });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('assessment-media').getPublicUrl(fileName);
        
        updateQuestion(questionId, 'mediaUrl', urlData.publicUrl);

    } catch (error: any) {
        Alert.alert("Upload Failed", error.message);
    } finally {
        setUploadingMediaFor(null);
    }
  };

  const handleRemoveMedia = (questionId: number) => {
    updateQuestion(questionId, 'mediaUrl', null);
  };

  const handlePublish = async () => {
    if (!session?.user || !params.courseId || !params.moduleId) {
      Alert.alert("Error", "Required information is missing. Cannot publish.");
      return;
    }
    
    // --- Validation Logic ---
    if (!quizTitle.trim()) {
        Alert.alert("Validation Failed", "Please provide a title for the quiz.");
        return;
    }
    if (questions.length === 0) {
        Alert.alert("Validation Failed", "Please add at least one question to the quiz.");
        return;
    }
    for (const q of questions) {
        if (!q.text.trim()) {
            Alert.alert("Validation Failed", "One or more questions are missing text.");
            return;
        }
        if (q.options.some(opt => !opt.text.trim())) {
             Alert.alert("Validation Failed", `Please fill in all answer options for the question: "${q.text || `Question ${questions.indexOf(q) + 1}`}"`);
            return;
        }
        if (!q.options.some(opt => opt.isCorrect)) {
            Alert.alert("Validation Failed", `Please select a correct answer for the question: "${q.text || `Question ${questions.indexOf(q) + 1}`}"`);
            return;
        }
    }

    setLoading(true);
    try {
      // NEW: Parse the time limit. If blank, it will be null.
      const timeLimitInSeconds = timeLimit.trim() ? parseInt(timeLimit.trim(), 10) : null;
      if (timeLimit.trim() && (isNaN(timeLimitInSeconds) || timeLimitInSeconds <= 0)) {
          Alert.alert("Invalid Input", "Please enter a valid positive number for the time limit per question.");
          setLoading(false);
          return;
      }

      // 1. Insert into 'assessments' table
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          course_id: params.courseId,
          module_id: params.moduleId,
          user_id: session.user.id,
          title: quizTitle,
          description: quizDescription,
          type: 'quiz',
          total_points: totalPoints,
          time_limit_seconds: timeLimitInSeconds, // NEW: Add time limit to the payload
          is_published: true,
        })
        .select()
        .single();
      
      if (assessmentError) throw assessmentError;
      const assessmentId = assessmentData.id;

      // 2. Insert each question and its options
      for (const question of questions) {
        const { data: questionData, error: questionError } = await supabase
          .from('assessment_questions')
          .insert({
            assessment_id: assessmentId,
            question_text: question.text,
            type: 'multiple_choice',
            points: question.points,
            allow_multiple_answers: question.allowMultipleAnswers,
            media_url: question.mediaUrl,
          })
          .select()
          .single();

        if (questionError) throw questionError;
        const questionId = questionData.id;

        const optionsToInsert = question.options.map(opt => ({
            question_id: questionId,
            option_text: opt.text,
            is_correct: opt.isCorrect,
        }));

        const { error: optionsError } = await supabase
            .from('question_options')
            .insert(optionsToInsert);
        
        if (optionsError) throw optionsError;
      }

      Alert.alert("Success!", "Your quiz has been published.", [
          { text: "OK", onPress: () => router.back() }
      ]);

    } catch (error: any) {
      console.error("Error publishing quiz:", error);
      Alert.alert("Publish Failed", error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: QuestionState = {
      id: Date.now(),
      text: '',
      points: 10,
      allowMultipleAnswers: false,
      mediaUrl: null,
      options: [{ id: 1, text: '', isCorrect: false }],
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const updateQuestion = (questionId: number, field: keyof QuestionState, value: any) => {
    if (field === 'points') {
      const numericValue = parseInt(value, 10);
      value = isNaN(numericValue) ? 0 : numericValue;
    }
    setQuestions(prev =>
      prev.map(q => (q.id === questionId ? { ...q, [field]: value } : q))
    );
  };
  
  const deleteQuestion = (questionId: number) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const addOption = (questionId: number) => {
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === questionId) {
          const newOption: AnswerOption = { id: Date.now(), text: '', isCorrect: false };
          return { ...q, options: [...q.options, newOption] };
        }
        return q;
      })
    );
  };

  const updateOption = (questionId: number, optionId: number, newText: string) => {
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === questionId) {
          const updatedOptions = q.options.map(opt =>
            opt.id === optionId ? { ...opt, text: newText } : opt
          );
          return { ...q, options: updatedOptions };
        }
        return q;
      })
    );
  };

  const toggleCorrectOption = (questionId: number, optionId: number) => {
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === questionId) {
          const updatedOptions = q.options.map(opt => {
            if (q.allowMultipleAnswers) {
              return opt.id === optionId ? { ...opt, isCorrect: !opt.isCorrect } : opt;
            } else {
              return { ...opt, isCorrect: opt.id === optionId };
            }
          });
          return { ...q, options: updatedOptions };
        }
        return q;
      })
    );
  };

  const deleteOption = (questionId: number, optionId: number) => {
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === questionId && q.options.length > 1) {
          return { ...q, options: q.options.filter(opt => opt.id !== optionId) };
        }
        return q;
      })
    );
  };

  const renderQuestionCard = (question: QuestionState, index: number) => (
    <View key={question.id} style={styles.card}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionNumber}>Question {index + 1}</Text>
        <View style={styles.pointsInputContainer}>
          <CheckSquare size={16} color={Colors.GRAY}/>
          <TextInput
            style={styles.pointsInput}
            value={String(question.points)}
            onChangeText={text => updateQuestion(question.id, 'points', text)}
            keyboardType="number-pad"
          />
          <Text style={styles.pointsLabel}>Points</Text>
        </View>
        <View style={styles.questionActions}>
          <TouchableOpacity><Copy size={18} color={Colors.GRAY} /></TouchableOpacity>
          <TouchableOpacity onPress={() => deleteQuestion(question.id)}><Trash2 size={18} color={Colors.ERROR} /></TouchableOpacity>
        </View>
      </View>
      <TextInput
        style={styles.questionInput}
        placeholder="Type your question here..."
        value={question.text}
        onChangeText={text => updateQuestion(question.id, 'text', text)}
        multiline
      />

      {uploadingMediaFor === question.id ? (
        <ActivityIndicator style={{ marginVertical: 20 }} color={Colors.PRIMARY}/>
      ) : question.mediaUrl ? (
        <View style={styles.mediaPreviewContainer}>
            <Image source={{ uri: question.mediaUrl }} style={styles.mediaPreview} />
            <TouchableOpacity style={styles.removeMediaButton} onPress={() => handleRemoveMedia(question.id)}>
                <X size={16} color={Colors.WHITE} />
            </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.addMediaButton} onPress={() => handleMediaPick(question.id)}>
            <UploadCloud size={16} color={Colors.GRAY} />
            <Text style={styles.addMediaText}>Add Media (Image/Video)</Text>
        </TouchableOpacity>
      )}

      <View style={styles.separator} />
      <Text style={styles.optionsHeader}>Answer Options</Text>
      {question.options.map(option => (
        <View key={option.id} style={styles.optionRow}>
          <TouchableOpacity 
            onPress={() => toggleCorrectOption(question.id, option.id)}
            style={question.allowMultipleAnswers ? (option.isCorrect ? styles.checkboxChecked : styles.checkbox) : styles.radioCircle}
          >
            {option.isCorrect && (
              question.allowMultipleAnswers 
              ? <Check size={14} color={Colors.WHITE} /> 
              : <View style={styles.radioDot} />
            )}
          </TouchableOpacity>
          <TextInput
            style={styles.optionInput}
            placeholder="Answer option..."
            value={option.text}
            onChangeText={text => updateOption(question.id, option.id, text)}
          />
          <TouchableOpacity onPress={() => deleteOption(question.id, option.id)}>
              <Trash2 size={18} color={Colors.GRAY} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addChoiceButton} onPress={() => addOption(question.id)}>
        <Text style={styles.addChoiceText}>Add Choice</Text>
      </TouchableOpacity>
      <View style={styles.separator} />
      <View style={styles.questionSettings}>
        <Text style={styles.settingLabel}>Allow multiple answers</Text>
        <Switch
          value={question.allowMultipleAnswers}
          onValueChange={value => updateQuestion(question.id, 'allowMultipleAnswers', value)}
          trackColor={{ false: '#767577', true: Colors.PRIMARY_LIGHT }}
          thumbColor={question.allowMultipleAnswers ? Colors.PRIMARY : '#f4f3f4'}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} disabled={loading}>
                <X size={24} color={Colors.BLACK} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Quiz</Text>
            <TouchableOpacity style={[styles.publishButton, loading && styles.disabledButton]} onPress={handlePublish} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color={Colors.WHITE}/> : <Text style={styles.publishButtonText}>Publish</Text>}
            </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quiz Overview</Text>
          <TextInput style={styles.titleInput} value={quizTitle} onChangeText={setQuizTitle} />
          <TextInput style={styles.descriptionInput} placeholder="Add a description..." value={quizDescription} onChangeText={setQuizDescription} multiline />
        </View>
        
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Quiz Settings</Text>
            <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Total Points</Text>
                <Text style={styles.settingValue}>{totalPoints} Points</Text>
            </View>
            {/* NEW: Time Limit Input */}
            <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Time Limit per Question (seconds)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., 30 (leave blank for none)"
                    value={timeLimit}
                    onChangeText={setTimeLimit}
                    keyboardType="number-pad"
                />
            </View>
            {/* END: Time Limit Input */}
        </View>

        {questions.map((q, index) => renderQuestionCard(q, index))}
        
        <TouchableOpacity style={styles.addQuestionButton} onPress={addQuestion}>
            <Plus size={20} color={Colors.PRIMARY}/>
            <Text style={styles.addQuestionText}>Add Question</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F4F8' },
  container: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  publishButton: { backgroundColor: Colors.PRIMARY, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  publishButtonText: { color: Colors.WHITE, fontWeight: 'bold' },
  disabledButton: { backgroundColor: Colors.GRAY },
  card: { backgroundColor: Colors.WHITE, borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  titleInput: { fontSize: 18, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingBottom: 8, marginBottom: 8 },
  descriptionInput: { fontSize: 14, minHeight: 60, textAlignVertical: 'top' },
  settingItem: { marginBottom: 12 },
  settingLabel: { color: Colors.GRAY, fontSize: 14, marginBottom: 4 },
  settingValue: { fontWeight: '500', fontSize: 15 },
  input: { // NEW: Style for the time limit input
    backgroundColor: '#F7F9FC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E8EDF2',
  },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  questionNumber: { fontSize: 15, fontWeight: '500' },
  pointsInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F9FC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E8EDF2' },
  pointsInput: { fontSize: 14, fontWeight: 'bold', minWidth: 20, textAlign: 'center', padding: 0, marginHorizontal: 4 },
  pointsLabel: { fontSize: 12, color: Colors.GRAY },
  questionActions: { flexDirection: 'row', gap: 16 },
  questionInput: { backgroundColor: '#F7F9FC', borderRadius: 8, padding: 12, minHeight: 80, textAlignVertical: 'top', fontSize: 15, borderWidth: 1, borderColor: '#E8EDF2' },
  addMediaButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#F7F9FC', borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: '#CED9E5', marginTop: 12, },
  addMediaText: { marginLeft: 8, color: Colors.GRAY, fontWeight: '500' },
  mediaPreviewContainer: { position: 'relative', marginTop: 12, alignItems: 'center' },
  mediaPreview: { width: '100%', height: 150, borderRadius: 8, backgroundColor: '#e0e0e0' },
  removeMediaButton: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4 },
  separator: { height: 1, backgroundColor: '#E8EDF2', marginVertical: 16 },
  optionsHeader: { fontSize: 14, fontWeight: '500', color: Colors.GRAY, marginBottom: 10 },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.PRIMARY, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.PRIMARY },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: Colors.PRIMARY, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  checkboxChecked: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: Colors.PRIMARY, backgroundColor: Colors.PRIMARY, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  optionInput: { flex: 1, backgroundColor: '#F7F9FC', borderRadius: 8, paddingHorizontal: 12, height: 44, fontSize: 15, borderWidth: 1, borderColor: '#E8EDF2', marginRight: 10 },
  addChoiceButton: { alignItems: 'center', justifyContent: 'center', padding: 10, backgroundColor: Colors.PRIMARY_LIGHT, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
  addChoiceText: { color: Colors.PRIMARY, fontWeight: 'bold' },
  questionSettings: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  addQuestionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, backgroundColor: Colors.WHITE, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.PRIMARY, },
  addQuestionText: { marginLeft: 8, color: Colors.PRIMARY, fontWeight: 'bold', fontSize: 16 },
});

export default AssessmentCreation;