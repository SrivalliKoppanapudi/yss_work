import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Dimensions, ActivityIndicator } from "react-native";
import { Course } from "../../types/courses";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/Superbase";
import ButtonComponent from "../ButtonComponent";
import Colors from "../../constant/Colors";
import { useAuth } from "../../Context/auth";

interface CourseListItemCardProps {
  course: Course;
  onViewCourse: (course: Course) => void;
}

const getImageUrl = (imagePath: string | null) => {
  if (!imagePath || imagePath.trim() === '') return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `https://dxhsmurbnfhkohqmmwuo.supabase.co/storage/v1/object/public/course-covers/${imagePath}`;
};

const screenWidth = Dimensions.get('window').width;

export default function CourseListItemCard({ course, onViewCourse }: CourseListItemCardProps) {
  const { session, isLoading: authIsLoading, userRole } = useAuth();
  const router = useRouter();
  
  const [isEnrolledLocally, setIsEnrolledLocally] = useState(false);
  const [loadingState, setLoadingState] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);

  const isCourseCreator = course.user_id && session?.user?.id === course.user_id;

  useFocusEffect(
    useCallback(() => {
      const checkEnrollmentStatus = async () => {
        if (!session?.user?.id || isCourseCreator) {
          setIsEnrolledLocally(false);
          setLoadingState(false);
          return;
        }
        setLoadingState(true);
        try {
          const { data, error } = await supabase
            .from('course_enrollments')
            .select('id')
            .eq('course_id', course.id)
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          if (error && error.code !== 'PGRST116') throw error;
          setIsEnrolledLocally(!!data);
        } catch (error) {
          console.error(`Error checking enrollment for course ${course.id}:`, error);
        } finally {
          setLoadingState(false);
        }
      };

      checkEnrollmentStatus(); // Call the async function inside the synchronous callback

    }, [course.id, session?.user?.id, isCourseCreator])
  );
  // --- END OF FIX #1 ---

  const handleEnrollOrView = async () => {
    if (isCourseCreator || (userRole?.is_teacher && !isEnrolledLocally)) {
      onViewCourse(course);
      return;
    }
    if (isEnrolledLocally) {
      router.push({ pathname: '/(screens)/StudentCourseContent', params: { courseId: course.id } });
      return;
    }
    if (!session?.user) {
      Alert.alert("Authentication Required", "Please sign in to enroll.", [{ text: "OK", onPress: () => router.push("/auth/SignIn") }]);
      return;
    }

    const isPaidCourse = course.is_paid === true || (typeof course.price === 'number' && course.price > 0);
    
    setLoadingAction(true);
    try {
      if (isPaidCourse) {
        router.push({
          pathname: "/(screens)/CheckoutScreen",
          params: { courseId: course.id, amount: String(course.final_price || course.price || '0'), currency: course.currency || 'INR', courseTitle: course.title }
        });
      } else {
        const { error } = await supabase.from('course_enrollments').insert({ course_id: course.id, user_id: session.user.id, status: 'active' });
        if (error) throw error;
        setIsEnrolledLocally(true);
        Alert.alert('Success', 'You have been enrolled!', [{ text: "OK", onPress: () => router.push({ pathname: '/(screens)/StudentCourseContent', params: { courseId: course.id } }) }]);
      }
    } catch (error: any) {
        Alert.alert('Action Failed', error.message || 'An unexpected error occurred.');
    } finally {
        setLoadingAction(false);
    }
  };
  
  if (loadingState || authIsLoading) {
    return <View style={[styles.card, styles.loadingCard]}><ActivityIndicator color={Colors.PRIMARY} /></View>;
  }

  const isPaidCourse = course.is_paid === true || (typeof course.price === 'number' && course.price > 0);
  const displayPrice = course.final_price || course.price || 0;
  
  let buttonTitle: string;
  if (isCourseCreator) buttonTitle = "Manage Course";
  else if (isEnrolledLocally) buttonTitle = "Continue Learning";
  else if (userRole?.is_teacher) buttonTitle = "View Details";
  else if (isPaidCourse) buttonTitle = `Buy Now for ₹${displayPrice}`;
  else buttonTitle = "Start Learning (Free)";

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => onViewCourse(course)}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: getImageUrl(course.image) }} style={styles.image} resizeMode="cover" />
          <View style={styles.imageOverlay} />
          <View style={[styles.priceBadge, !isPaidCourse && styles.freeBadge]}>
            <Text style={styles.priceBadgeText}>{isPaidCourse ? `₹${displayPrice}` : "Free"}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{course.title}</Text>
        <Text style={styles.instructor} numberOfLines={1}>{course.instructor || 'Lynkt Academy'}</Text>
        
        <View style={styles.metaRow}>
            <MaterialCommunityIcons name="school-outline" size={14} color={Colors.GRAY}/>
            <Text style={styles.metaText}>{course.level || 'All Levels'}</Text>
            <Text style={styles.metaSeparator}>•</Text>
            <Ionicons name="time-outline" size={14} color={Colors.GRAY} />
            {/* FIX #2: Accessing the 'duration' property which now exists on the type */}
            <Text style={styles.metaText}>{course.duration || 'Flexible'}</Text>
        </View>

        {isEnrolledLocally && (
             <View style={styles.progressSection}>
              <Progress.Bar progress={(course.completionrate || 0) / 100} width={null} height={4} color="#28a745" unfilledColor="#e9ecef" borderWidth={0} />
              <Text style={styles.completionRate}>{(course.completionrate || 0)}% Complete</Text>
            </View>
        )}
       
        <View style={styles.footer}>
            <ButtonComponent
                title={buttonTitle}
                onPress={handleEnrollOrView}
                style={styles.actionButton}
                loading={loadingAction}
                disabled={loadingAction || authIsLoading}
            />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginVertical: 8,
    marginHorizontal: 10, 
    width: screenWidth > 600 ? (screenWidth / 2) - 24 : screenWidth - 40,
  },
  loadingCard: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
  },
  imageContainer: {
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  priceBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(5, 150, 105, 0.9)", // emerald-600
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  freeBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.9)", // blue-500
  },
  priceBadgeText: {
    color: Colors.WHITE,
    fontSize: 12,
    fontWeight: "bold",
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1f2937",
    lineHeight: 20,
    minHeight: 40,
    marginBottom: 4,
  },
  instructor: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  metaText: {
    fontSize: 12,
    color: '#4b5563',
  },
  metaSeparator: {
    color: '#9ca3af',
    marginHorizontal: 2,
  },
  progressSection: {
    marginBottom: 10,
  },
  completionRate: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 4,
    alignSelf: 'flex-end'
  },
  footer: {
    marginTop: 'auto', 
  },
  actionButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 10,
  },
});