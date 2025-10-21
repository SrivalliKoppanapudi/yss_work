import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator, Switch 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Course, Module, Lesson, Assessment } from '../../types/courses';
import { supabase } from '../../lib/Superbase';
import Colors from '../../constant/Colors';
import CourseImageUpload from '../../component/courses/CourseImageUpload';
import AssessmentSection from '../../component/Assessments/AssessmentSection';
import BetterPicker from '../../component/courses/BetterPicker';
import { FileText, BookOpen, Save, Trash2, PlusCircle, Link as LinkIcon, UploadCloud } from 'lucide-react-native'; 
import { useAuth } from '../../Context/auth';
import * as DocumentPicker from 'expo-document-picker';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

const MAX_FILE_SIZE_MB = 200;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function CourseEditor() {
  const router = useRouter();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ course: string }>();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  const [modules, setModules] = useState<Module[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  
  const [uploadingLessonId, setUploadingLessonId] = useState<string | number | null>(null);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      if (!params.course) throw new Error('No course data provided');
      
      const parsedCourseParams = JSON.parse(params.course as string);
      if (!parsedCourseParams?.id) throw new Error('Invalid course ID in params');
      const courseId = parsedCourseParams.id;

      const { data: freshCourseData, error: fetchError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!freshCourseData) throw new Error('Course not found in the database.');

      setCourse(freshCourseData);
      setTitle(freshCourseData.title || '');
      setDescription(freshCourseData.description || '');
      setImage(freshCourseData.image || '');
      setStatus(freshCourseData.status || 'draft');

      const rawModules = freshCourseData.modules;
      
      const parsedModules: Module[] = (typeof rawModules === 'string' 
        ? JSON.parse(rawModules) 
        : Array.isArray(rawModules) ? rawModules : []);
      
      const modulesWithLessonIds = parsedModules.map(mod => ({
          ...mod,
          lessons: (mod.lessons || []).map(les => ({
              ...les,
              id: les.id || `lesson-${Date.now()}-${Math.random()}`
          }))
      }));

      setModules(modulesWithLessonIds);

      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments').select('*').eq('course_id', courseId);
      if (assessmentsError) throw assessmentsError;
      setAssessments(assessmentsData || []);

    } catch (error: any) {
      Alert.alert('Error Loading Data', error.message);
      console.error("Error in loadInitialData:", error); // Kept one console.error for debugging
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadInitialData(); 
  }, [params.course]);

  const handleSaveCourse = async () => {
    if (!course || !session?.user) return;
    setSaving(true);
    try {
      const { error: courseUpdateError } = await supabase
        .from('courses')
        .update({ 
            title, 
            description, 
            image, 
            status, 
            modules: modules,
            updated_at: new Date().toISOString() 
        })
        .eq('id', course.id);
      if (courseUpdateError) throw courseUpdateError;
      
       Alert.alert('Success', 'Course saved successfully!');
    } catch (error: any) {
      Alert.alert("Error Saving Course", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddModule = () => {
    const newModule: Module = {
      id: `section-${Date.now()}`,
      title: `New Module ${modules.length + 1}`,
      description: '',
      order: modules.length,
      lessons: [],
    };
    setModules([...modules, newModule]);
  };

   const handleAddLesson = (moduleIndex: number) => {
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: 'New Lesson',
      content: '', 
      type: 'text',
      duration: 5,
      order_index: modules[moduleIndex].lessons?.length || 0,
      moduleId: modules[moduleIndex].id,
      resources: [],
      discussionEnabled: false,
    };
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons = [...(updatedModules[moduleIndex].lessons || []), newLesson];
    setModules(updatedModules);
  };
  
  const handleUpdateLesson = (moduleIndex: number, lessonIndex: number, updatedLesson: Partial<Lesson>) => {
    const updatedModules = [...modules];
    const lessons = [...(updatedModules[moduleIndex].lessons || [])];
    if (updatedLesson.content) {
        updatedLesson.content = updatedLesson.content.trim();
    }
    lessons[lessonIndex] = { ...lessons[lessonIndex], ...updatedLesson };
    updatedModules[moduleIndex].lessons = lessons;
    setModules(updatedModules);
  };

  const handleUploadLessonContent = async (moduleIndex: number, lessonIndex: number) => {
    const lessonId = modules[moduleIndex].lessons[lessonIndex].id;
    setUploadingLessonId(lessonId);
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['video/*', 'application/pdf'],
            copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets) {
            setUploadingLessonId(null);
            return;
        }

        const asset = result.assets[0];

        if (asset.size && asset.size > MAX_FILE_SIZE_BYTES) {
            Alert.alert( "File Too Large", `The selected file is too large (${(asset.size / 1024 / 1024).toFixed(1)} MB). Please select a file smaller than ${MAX_FILE_SIZE_MB} MB.` );
            setUploadingLessonId(null);
            return;
        }

        const fileExt = asset.name.split('.').pop()?.toLowerCase() ?? 'tmp';
        const filePath = `${session!.user.id}/${course!.id}/${Date.now()}.${fileExt}`;
        
        const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        
        const { error: uploadError } = await supabase.storage
            .from('course-resources')
            .upload(filePath, decode(base64), { contentType: asset.mimeType });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('course-resources').getPublicUrl(filePath);
        
        handleUpdateLesson(moduleIndex, lessonIndex, { content: urlData.publicUrl });
        Alert.alert("Success", "Content uploaded. Save the course to make it permanent.");

    } catch (err: any) {
        Alert.alert("Upload Failed", err.message);
    } finally {
        setUploadingLessonId(null);
    }
  };
  
  const handleDeleteLesson = (moduleIndex: number, lessonIndex: number) => {
      const updatedModules = [...modules];
      updatedModules[moduleIndex].lessons.splice(lessonIndex, 1);
      setModules(updatedModules);
  };
  
  const handleDeleteModule = (moduleId: string | number) => {
    setModules(prev => prev.filter(m => m.id !== moduleId));
  };

  const handleAddAssessment = (moduleId: string) => {
    router.push({ pathname: '/(screens)/Courses_Section/AssessmentCreation', params: { courseId: course!.id, moduleId } });
  };
  
  const handleEditAssessment = (assessment: Assessment) => {
    router.push({ pathname: '/(screens)/Courses_Section/AssessmentCreation', params: { assessmentId: assessment.id } });
  };
  const handleToggleModuleDiscussion = (moduleIndex: number, isEnabled: boolean) => {
    const newModules = [...modules];
    newModules[moduleIndex].discussion_enabled = isEnabled;
    setModules(newModules);
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.PRIMARY} /></View>;
  }

  const getLessonIcon = (type: string) => {
    switch(type) {
        case 'quiz': return <FileText size={16} color={Colors.GRAY}/>
        default: return <BookOpen size={16} color={Colors.GRAY}/>
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#3b82f6" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Course</Text>
        <TouchableOpacity style={styles.headerAction} onPress={handleSaveCourse} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color={Colors.PRIMARY}/> : <Save size={22} color={Colors.PRIMARY} />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}><Text style={styles.sectionTitle}>Course Information</Text><CourseImageUpload image={image} setImage={setImage} setError={() => {}} /><Text style={styles.label}>Title</Text><TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Course Title" /><Text style={styles.label}>Description</Text><TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Course Description" multiline /></View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Modules & Content</Text><TouchableOpacity style={styles.addButton} onPress={handleAddModule}><Ionicons name="add-circle" size={24} color={Colors.PRIMARY} /><Text style={styles.addButtonText}>Add Module</Text></TouchableOpacity></View>
          
          {modules.map((module, moduleIndex) => (
            <View key={module.id} style={styles.moduleCard}>
              <View style={styles.moduleHeader}>
                <TextInput style={styles.moduleTitle} defaultValue={module.title} placeholder="Module Title" onEndEditing={(e) => {
                    const newModules = [...modules]; newModules[moduleIndex].title = e.nativeEvent.text; setModules(newModules);
                }}/>
                <TouchableOpacity onPress={() => handleDeleteModule(module.id)}><Ionicons name="trash-outline" size={24} color="#dc2626" /></TouchableOpacity>
              </View>
              
              <View style={styles.discussionToggleContainer}>
                <Text style={styles.discussionLabel}>Enable Discussion Forum</Text>
                <Switch
                    trackColor={{ false: "#767577", true: Colors.PRIMARY_LIGHT }}
                    thumbColor={module.discussion_enabled ? Colors.PRIMARY : "#f4f3f4"}
                    onValueChange={(value) => handleToggleModuleDiscussion(moduleIndex, value)}
                    value={module.discussion_enabled}
                />
              </View>

              <View style={styles.lessonsListContainer}>
                  <Text style={styles.lessonSectionTitle}>Lessons</Text>
                  {module.lessons?.map((lesson, lessonIndex) => (
                      <View key={lesson.id} style={styles.lessonCard}>
                          <View style={styles.lessonHeader}>
                            {getLessonIcon(lesson.type)}
                            <TextInput 
                                style={styles.lessonTitleInput} 
                                value={lesson.title} 
                                onChangeText={(text) => handleUpdateLesson(moduleIndex, lessonIndex, { title: text })} 
                            />
                            <TouchableOpacity onPress={() => handleDeleteLesson(moduleIndex, lessonIndex)}>
                                <Trash2 size={18} color={Colors.ERROR} />
                            </TouchableOpacity>
                          </View>
                          <BetterPicker 
                            value={lesson.type}
                            onValueChange={(value) => handleUpdateLesson(moduleIndex, lessonIndex, { type: value })}
                            items={[
                                { label: 'Text/Article', value: 'text' },
                                { label: 'Key Elements', value: 'key_elements_article'},
                                { label: 'Video', value: 'video' },
                                { label: 'PDF', value: 'pdf' },
                                { label: 'Quiz', value: 'quiz' }
                            ]}
                          />
                          {(lesson.type === 'video' || lesson.type === 'pdf') && (
                              <View style={styles.contentInputRow}>
                                  <View style={styles.urlDisplayBox}>
                                    <Text style={styles.urlDisplayText} numberOfLines={1}>
                                        {lesson.content || `No ${lesson.type} content added`}
                                    </Text>
                                  </View>
                                  <TouchableOpacity 
                                      style={styles.uploadContentButton}
                                      onPress={() => handleUploadLessonContent(moduleIndex, lessonIndex)}
                                      disabled={uploadingLessonId === lesson.id}
                                  >
                                      {uploadingLessonId === lesson.id ? (
                                          <ActivityIndicator size="small" color={Colors.PRIMARY} />
                                      ) : (
                                          <UploadCloud size={20} color={Colors.PRIMARY} />
                                      )}
                                  </TouchableOpacity>
                              </View>
                          )}
                      </View>
                  ))}
                  <TouchableOpacity style={styles.addContentButton} onPress={() => handleAddLesson(moduleIndex)}>
                      <PlusCircle size={16} color={Colors.PRIMARY}/><Text style={styles.addContentButtonText}>Add Lesson</Text>
                  </TouchableOpacity>
              </View>

              <View style={styles.subSection}><AssessmentSection assessments={assessments.filter(a => a.module_id === module.id)} onAddAssessment={() => handleAddAssessment(module.id)} onEditAssessment={handleEditAssessment} /></View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  backButton: { padding: 4 },
  headerAction: { padding: 4 },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  label: { fontSize: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  addButton: { flexDirection: 'row', alignItems: 'center' },
  addButtonText: { color: Colors.PRIMARY, marginLeft: 4, fontSize: 16, fontWeight: '500' },
  moduleCard: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 },
  moduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  moduleTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, padding: 8, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 4 },
  subSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lessonsListContainer: { marginBottom: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 16 },
  lessonSectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: Colors.BLACK },
  
  lessonCard: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  lessonHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  lessonTitleInput: { flex: 1, fontSize: 15, fontWeight: '500', padding: 8, backgroundColor: 'white', borderRadius: 4, borderWidth: 1, borderColor: '#d1d5db' },
  addContentButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 8, backgroundColor: '#eef2ff', borderRadius: 6 },
  addContentButtonText: { color: Colors.PRIMARY, fontWeight: '500' },
  discussionToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginVertical: 10,
  },
  discussionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.GRAY
  },
  contentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  urlDisplayBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
  },
  urlDisplayText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  uploadContentButton: {
    padding: 10,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
  },
});