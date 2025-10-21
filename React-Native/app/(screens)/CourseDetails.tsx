import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Image,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Course, Module as CourseModule, CourseInclusion, Lesson, Resource as ResourceType, Assessment } from '../../types/courses';
import Colors from '../../constant/Colors';
import {
  ArrowLeft,
  BookOpen,
  Star as StarIconLucide,
  Users,
  Clock,
  Video,
  FileText,
  Link as LinkIcon,
  Award,
  Download,
  MonitorSmartphone,
  ChevronDown,
  ChevronUp,
  Settings,
  Edit,
  Lock,
  MessageSquare // <-- Import the Forum icon
} from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';
import { supabase } from '../../lib/Superbase';
import { useAuth } from '../../Context/auth';
import CourseFeedback from '../../component/courses/CourseFeedback';

const getImageUrl = (imagePath?: string | null) => {
  if (!imagePath) return "https://via.placeholder.com/400x240/e0e0e0/999999?Text=No+Image";
  if (imagePath.startsWith("http")) return imagePath;
  return `https://dxhsmurbnfhkohqmmwuo.supabase.co/storage/v1/object/public/course-images/${imagePath}`;
};

const DetailItem: React.FC<{ icon: React.ReactNode; text: string | null | undefined }> = ({ icon, text }) => {
    if (!text) return null;
    return (
        <View style={styles.statItem}>
            {icon}
            <Text style={styles.statText}>{text}</Text>
        </View>
    );
};

const CourseDetailsScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ course?: string; courseId?: string }>();
  const { session, isLoading: authIsLoading } = useAuth();
  const currentUserId = session?.user?.id;

  const [course, setCourse] = useState<Course | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const fetchFullCourseDetails = useCallback(async (id: string) => {
    setLoading(true);
    try {
      // --- THIS IS THE FIX: Fetch modules as a separate query ---
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`*, course_settings(*)`)
        .eq('id', id)
        .single();
      
      if (courseError) throw courseError;
      if (!courseData) throw new Error('Course not found.');

      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', id);

      if (modulesError) throw modulesError;
      // --- END OF FIX ---

      let instructorName = 'Unknown Instructor';
      if (courseData.user_id) {
        const { data: profileData } = await supabase.from('profiles').select('name').eq('id', courseData.user_id).single();
        if (profileData?.name) instructorName = profileData.name;
      }

      setCourse({ ...(courseData as any), instructor: instructorName, modules: modulesData || [] });

      const { data: ratingsData, count } = await supabase
        .from('course_feedback')
        .select('rating', { count: 'exact' })
        .eq('course_id', id);

      if (ratingsData && count && count > 0) {
        const totalRating = ratingsData.reduce((sum, f) => sum + f.rating, 0);
        setAverageRating(totalRating / count);
        setReviewCount(count);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not load course details.");
    } finally {
      setLoading(false);
    }
  }, []);

  const checkEnrollment = useCallback(async (courseId: string) => {
    if (!currentUserId) { setIsEnrolled(false); return; }
    try {
      const { data } = await supabase.from('course_enrollments').select('id').eq('course_id', courseId).eq('user_id', currentUserId).maybeSingle();
      setIsEnrolled(!!data);
    } catch (e) {
      setIsEnrolled(false);
    }
  }, [currentUserId]);
  
  useFocusEffect(useCallback(() => {
      const courseIdToLoad = params.courseId || (params.course && JSON.parse(params.course as string).id);
      if (courseIdToLoad) {
          fetchFullCourseDetails(courseIdToLoad);
          if (!authIsLoading) {
            checkEnrollment(courseIdToLoad);
          }
      } else {
        Alert.alert("Error", "No course specified.");
        if(router.canGoBack()) router.back();
      }
  }, [params.courseId, params.course, fetchFullCourseDetails, checkEnrollment, authIsLoading]));

  const handleEnroll = async () => {
    if (!course || !currentUserId) {
        router.push('/auth/SignIn');
        return;
    }
    setEnrollmentLoading(true);
    try {
        const settings = Array.isArray(course.course_settings) ? course.course_settings[0] : course.course_settings;
        const isPaidCourse = settings ? settings.is_paid : course.is_paid;
        const coursePrice = settings ? settings.price : course.price;
        const courseCurrency = settings ? settings.currency : course.currency;

        if (isPaidCourse && coursePrice > 0) {
            router.push({
                pathname: "/(screens)/CheckoutScreen",
                params: { 
                    courseId: course.id, 
                    courseTitle: course.title, 
                    amount: coursePrice.toString(), 
                    currency: courseCurrency 
                },
            });
        } else {
            const { error } = await supabase.from('course_enrollments').insert({ 
                course_id: course.id, 
                user_id: currentUserId, 
                status: 'active' 
            });
            if (error) throw error;
            setIsEnrolled(true);
            Alert.alert('Enrollment Successful!', 'You can now start learning.');
            router.push({ pathname: '/(screens)/StudentCourseContent', params: { courseId: course.id } });
        }
    } catch (e: any) {
        Alert.alert("Enrollment Failed", e.message);
    } finally {
        setEnrollmentLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));

  const renderStars = (rating: number) => {
    return <Text style={styles.ratingText}>{rating > 0 ? rating.toFixed(1) : 'No rating'} ({reviewCount} reviews)</Text>;
  };
  
  const handleContentPress = (item: Lesson | ResourceType | Assessment, type: 'lesson' | 'resource' | 'assessment', moduleId: string) => {
    if (!course) return;
    if (type === 'assessment') {
        router.push({ pathname: '/(screens)/Courses_Section/TakeAssessmentScreen', params: { assessmentId: item.id } });
    } else {
        router.push({
            pathname: '/(screens)/StudentCourseContent',
            params: { courseId: course.id, initialItemId: String(item.id), initialItemType: type, initialModuleId: moduleId }
        });
    }
  };

  if (loading || authIsLoading || !course) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.skeletonImage}></View>
            <View style={{ padding: 16 }}>
                <View style={styles.skeletonTitle}></View>
                <View style={styles.skeletonLine}></View>
                <View style={[styles.skeletonLine, { width: '60%' }]}></View>
            </View>
        </SafeAreaView>
    );
  }
  
  const isPublisher = course.user_id && currentUserId === course.user_id;
  const canAccessCourseContent = isEnrolled || isPublisher;
  const courseSettings = Array.isArray(course.course_settings) ? course.course_settings[0] : course.course_settings;
  const price = courseSettings?.price ?? course.price ?? 0;
  
  // --- NEW: Check if any module has a forum enabled ---
  const hasActiveForum = course.modules?.some(m => m.discussion_enabled);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image source={{ uri: getImageUrl(course.thumbnail_url || course.image) }} style={styles.courseImage} />
        <Pressable onPress={() => router.back()} style={styles.backButton}><ArrowLeft size={24} color={Colors.WHITE} /></Pressable>

        <View style={styles.contentPadding}>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.instructorInfo}>By {course.instructor || 'N/A'}</Text>
          <View style={styles.ratingSection}>{renderStars(averageRating)}</View>

          {isPublisher ? (
            <View style={styles.publisherActionsContainer}>
              <Text style={styles.sectionTitle}>Manage Course</Text>
              <View style={styles.publisherButtonRow}>
                <Button icon={() => <Edit size={18} color={Colors.PRIMARY}/>} mode="outlined" onPress={() => router.push({ pathname: "/(screens)/CourseEditor", params: { course: JSON.stringify(course) }})}>Edit</Button>
                <Button icon={() => <MaterialIcons name="people-outline" size={18} color={Colors.PRIMARY}/>} mode="outlined" onPress={() => router.push({ pathname: "/(screens)/EnrollmentManagement", params: { courseId: course.id, courseTitle: course.title }})}>Enrollment</Button>
                {hasActiveForum && (
                    <Button icon={() => <MessageSquare size={18} color={Colors.PRIMARY}/>} mode="outlined" onPress={() => router.push({ pathname: "/(screens)/StudentCourseContent", params: { courseId: course.id }})}>Forum</Button>
                )}
                <Button icon={() => <Settings size={18} color={Colors.PRIMARY}/>} mode="outlined" onPress={() => router.push({ pathname: "/(screens)/CourseSettings", params: { course: JSON.stringify(course) }})}>Settings</Button>
              </View>
            </View>
          ) : (
            <View style={styles.priceEnrollContainer}>
              <Text style={styles.priceText}>{courseSettings?.is_paid && price > 0 ? `${courseSettings?.currency || '₹'}${price}` : 'Free'}</Text>
              <Button
                  mode="contained"
                  onPress={canAccessCourseContent ? () => router.push({ pathname: '/(screens)/StudentCourseContent', params: { courseId: course.id } }) : handleEnroll}
                  style={[styles.enrollButton, canAccessCourseContent && { backgroundColor: Colors.SUCCESS }]}
                  labelStyle={styles.enrollButtonText}
                  loading={enrollmentLoading}
                  disabled={enrollmentLoading}
              >
                  {canAccessCourseContent ? 'Continue Learning' : 'Enroll Now'}
              </Button>
            </View>
          )}
        </View>

        <View style={styles.statsBar}>
          <DetailItem icon={<BookOpen size={20} color={Colors.PRIMARY} />} text={`${course.modules?.length || 0} Modules`} />
          <DetailItem icon={<Users size={20} color={Colors.PRIMARY} />} text={course.level} />
          <DetailItem icon={<Clock size={20} color={Colors.PRIMARY} />} text={course.duration} />
        </View>
        
        <View style={styles.contentPadding}>
            <Text style={styles.sectionTitle}>Course Content</Text>
            {!canAccessCourseContent && (
                <View style={styles.lockedOverlay}>
                    <Lock size={32} color={Colors.PRIMARY} />
                    <Text style={styles.lockedText}>Enroll to view full course content</Text>
                </View>
            )}
            {course.modules?.map((moduleItem: CourseModule) => (
                <View key={String(moduleItem.id)} style={styles.moduleContainer}>
                    <TouchableOpacity style={styles.moduleHeader} onPress={() => toggleModule(String(moduleItem.id))} disabled={!canAccessCourseContent}>
                        <Text style={styles.moduleTitleText}>{moduleItem.title}</Text>
                        <ChevronDown size={20} color={Colors.GRAY} style={{ transform: [{ rotate: expandedModules[String(moduleItem.id)] ? '180deg' : '0deg' }] }} />
                    </TouchableOpacity>
                    {expandedModules[String(moduleItem.id)] && canAccessCourseContent && (
                        <View style={styles.moduleDetailContent}>
                            {moduleItem.lessons?.map((lesson: Lesson) => (
                                <TouchableOpacity key={String(lesson.id)} style={styles.lessonItem} onPress={() => handleContentPress(lesson, 'lesson', String(moduleItem.id))}>
                                    <BookOpen size={16} color={Colors.GRAY} />
                                    <Text style={styles.lessonItemTitle}>{lesson.title}</Text>
                                </TouchableOpacity>
                            ))}
                            {moduleItem.assessments?.map((assessment: Assessment) => (
                                <TouchableOpacity key={String(assessment.id)} style={styles.lessonItem} onPress={() => handleContentPress(assessment, 'assessment', String(moduleItem.id))}>
                                    <Award size={16} color={Colors.GRAY} />
                                    <Text style={styles.lessonItemTitle}>Quiz: {assessment.title}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            ))}
        </View>
        
        <View style={styles.contentPadding}>
          <CourseFeedback courseId={course.id} publisherId={course.user_id || ''} isEnrolled={isEnrolled} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.WHITE },
  scrollContainer: { paddingBottom: 40 },
  skeletonImage: { width: '100%', height: 240, backgroundColor: '#e0e0e0' },
  skeletonTitle: { width: '80%', height: 24, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 10 },
  skeletonLine: { width: '90%', height: 16, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 8 },
  courseImage: { width: '100%', height: 240 },
  backButton: { position: 'absolute', top: 40, left: 15, backgroundColor: 'rgba(0,0,0,0.4)', padding: 8, borderRadius: 20 },
  contentPadding: { paddingHorizontal: 16, marginTop: 20 },
  courseTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.BLACK },
  instructorInfo: { fontSize: 15, color: Colors.GRAY, marginTop: 4, marginBottom: 10 },
  ratingSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  ratingText: { fontSize: 14, color: Colors.GRAY, marginLeft: 8 },
  publisherActionsContainer: { marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderColor: '#e9ecef' },
  publisherButtonRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  priceEnrollContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingTop: 15 },
  priceText: { fontSize: 22, fontWeight: 'bold', color: Colors.PRIMARY },
  enrollButton: { borderRadius: 8, paddingHorizontal: 10 },
  enrollButtonText: { fontSize: 16, fontWeight: 'bold', color: Colors.WHITE },
  statsBar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#f8f9fa', paddingVertical: 12, marginTop: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e9ecef' },
  statItem: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  statText: { fontSize: 14, color: Colors.GRAY },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: Colors.BLACK },
  lockedOverlay: { position: 'absolute', top: 50, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 8, padding: 20 },
  lockedText: { marginTop: 8, fontSize: 16, fontWeight: '600', color: Colors.PRIMARY, textAlign: 'center' },
  moduleContainer: { backgroundColor: Colors.WHITE, borderRadius: 8, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e9ecef' },
  moduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#f8f9fa' },
  moduleTitleText: { fontSize: 16, fontWeight: '600', color: Colors.BLACK },
  moduleDetailContent: { padding: 16, borderTopWidth: 1, borderTopColor: '#e9ecef' },
  lessonItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  lessonItemTitle: { fontSize: 15, color: Colors.BLACK },
});

export default CourseDetailsScreen;