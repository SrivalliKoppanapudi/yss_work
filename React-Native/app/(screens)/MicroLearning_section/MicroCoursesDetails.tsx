import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');
const isMobile = width < 900;

const course = {
  id: 'mock-id',
  image: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?w=600',
  title: 'Classroom Management',
  author: 'Dr. Meera Nair | Ph.D.',
  instructor: 'Dr. Meera Nair',
  description: 'Classroom management is how teachers create a focused, respectful, and organized environment where students can learn effectively. It\'s about setting clear rules, encouraging good behavior, and preventing disruptions.',
  price: 'FREE',
  currency: 'INR',
  rating: 4.5,
  enrolled: 19552,
  level: 'Beginner',
  flexibility: 'Flexible',
  lastUpdated: '27/04/25',
  content: [
    { type: 'video', title: '5 Essentials of Effective Classroom Management', desc: 'This short video provides teachers with actionable strategies to maintain control and create a positive classroom environment.', min: 10 },
    { type: 'reading', title: 'Quick Guide to Practical Classroom Management', desc: 'A concise PDF or article-style reading that reinforces the video and offers additional tips teachers can apply immediately.', min: 10 },
  ],
  includes: [
    '10 Min videos',
    '2 Articles',
    'downloadable resources',
    'Access on mobile and TV',
    'English Language',
  ],
  reviews: [
    { stars: 5, count: 120 },
    { stars: 4, count: 30 },
    { stars: 3, count: 10 },
    { stars: 2, count: 2 },
    { stars: 1, count: 1 },
  ],
  testimonials: [
    { name: 'Prof. Wisdom', date: '15th Jan 2025', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi vulputate nulla lobortis. Sed auctor ex eu eros varius vehicula. Praesent finibus sodales diam et suscipit.' },
    { name: 'Prof. Wisdom', date: '15th Jan 2025', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi vulputate nulla lobortis. Sed auctor ex eu eros varius vehicula. Praesent finibus sodales diam et suscipit.' },
    { name: 'Prof. Wisdom', date: '15th Jan 2025', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi vulputate nulla lobortis. Sed auctor ex eu eros varius vehicula. Praesent finibus sodales diam et suscipit.' },
  ],
  similarCourses: [
    { title: 'Communication Skills and Self Evaluation Skills', author: 'IT, Oswaal', duration: '5 months', level: 'Intermediate', type: 'Diploma', image: 'https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?w=600' },
    { title: 'Communication Skills and Self Evaluation Skills', author: 'IT, Oswaal', duration: '3 weeks', level: 'Intermediate', type: 'Diploma', image: 'https://images.pexels.com/photos/1134063/pexels-photo-1134063.jpeg?w=600' },
    { title: 'Communication Skills and Self Evaluation Skills', author: 'IT, Oswaal', duration: '3 months', level: 'Intermediate', type: 'Diploma', image: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?w=600' },
  ],
  webinars: [
    { title: 'Future of Digital Learning', speaker: 'Jane Smith', date: '5th Apr 2025', time: '04:30pm IST', image: 'https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?w=600' },
    { title: 'Future of Digital Learning', speaker: 'Jane Smith', date: '6th Apr 2025', time: '04:30pm IST', image: 'https://images.pexels.com/photos/1134063/pexels-photo-1134063.jpeg?w=600' },
    { title: 'Future of Digital Learning', speaker: 'Jane Smith', date: '7th Apr 2025', time: '04:30pm IST', image: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?w=600' },
  ],
};

export default function MicroCoursesDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  let courseData = course;
  if (params.course) {
    try {
      courseData = JSON.parse(params.course as string);
    } catch (e) {
      // fallback to default
    }
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FAF6D9' }} contentContainerStyle={{ padding: isMobile ? 6 : 32 }}>
      {/* Header */}
      <View style={[styles.headerBox, isMobile && styles.headerBoxMobile]}>
        <Image source={{ uri: courseData.image }} style={styles.headerImg} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{courseData.title}</Text>
          <Text style={styles.headerAuthor}>{courseData.author || courseData.instructor || ''}</Text>
          <Text style={styles.headerDesc}>{courseData.description}</Text>
          <View style={styles.headerRow}>
            <Text style={styles.headerPrice}>Price {courseData.price || 'FREE'}</Text>
            {(courseData.price === 'FREE' || courseData.price === '' || courseData.price === undefined) ? (
              <TouchableOpacity
                style={styles.enrollBtn}
                onPress={async () => {
                  // Free course: enroll and start learning
                  try {
                    const { data: { user } } = await require('../../../lib/Superbase').supabase.auth.getUser();
                    if (!user) throw new Error('User not logged in');
                    await require('../../../lib/Superbase').supabase.from('course_enrollments').insert({
                      course_id: courseData.id,
                      user_id: user.id,
                      enrolled_at: new Date().toISOString(),
                      status: 'active',
                    });
                    router.push({ pathname: '/(screens)/StudentCourseContent', params: { courseId: courseData.id } });
                  } catch (err) {
                    alert('Enrollment failed. Please try again.');
                  }
                }}
              >
                <Text style={styles.enrollBtnText}>Start Learning</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.enrollBtn}
                onPress={() => router.push({
                  pathname: '/(screens)/CheckoutScreen',
                  params: {
                    courseId: courseData.id,
                    courseTitle: courseData.title,
                    amount: courseData.price,
                    currency: courseData.currency || 'INR',
                  },
                })}
              >
                <Text style={styles.enrollBtnText}>Enroll Now</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.headerUpdated}>Last Updated on {courseData.lastUpdated}</Text>
        </View>
      </View>
      {/* Rating, Level, Flexibility */}
      <View style={styles.infoBar}>
        <Text style={styles.infoStar}>⭐ {courseData.rating}</Text>
        <Text style={styles.infoEnrolled}>{courseData.enrolled} enrolled on this course</Text>
        <Text style={styles.infoLevel}>{courseData.level}</Text>
        <Text style={styles.infoFlex}>{courseData.flexibility}</Text>
      </View>
      {/* Course Content */}
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>Course Content</Text>
        {(courseData.content || []).map((c, i) => (
          <View key={i} style={styles.contentRow}>
            <Text style={styles.contentType}>{c.type === 'video' ? '1. Video Content :' : '2. Reading Material :'}</Text>
            <Text style={styles.contentTitle}>Title: "{c.title}"</Text>
            <Text style={styles.contentDesc}>{c.desc}</Text>
            <Text style={styles.contentMin}>{c.min} Min</Text>
          </View>
        ))}
      </View>
      {/* Course Includes */}
      <View style={styles.includesBox}>
        <Text style={styles.includesTitle}>This course includes:</Text>
        <View style={styles.includesRow}>
          {(courseData.includes || []).map((inc, i) => (
            <Text key={i} style={styles.includesItem}>{inc}</Text>
          ))}
        </View>
      </View>
      {/* Learner's Review */}
      <View style={styles.reviewBox}>
        <Text style={styles.sectionTitle}>Learner's review</Text>
        {(courseData.reviews || []).map((r, i) => (
          <View key={i} style={styles.reviewRow}>
            <Text style={styles.reviewStar}>{r.stars} star</Text>
            <View style={styles.reviewBarBg}><View style={[styles.reviewBarFill, { width: `${r.count * 2}%` }]} /></View>
            <Text style={styles.reviewCount}>{r.count}</Text>
          </View>
        ))}
        <View style={styles.testimonialsRow}>
          {(courseData.testimonials || []).map((t, i) => (
            <View key={i} style={styles.testimonialBox}>
              <Text style={styles.testimonialName}>⭐ {t.name}</Text>
              <Text style={styles.testimonialDate}>{t.date}</Text>
              <Text style={styles.testimonialText}>{t.text}</Text>
            </View>
          ))}
        </View>
      </View>
      {/* Similar Courses */}
      <View style={styles.similarBox}>
        <Text style={styles.sectionTitle}>Similar Courses</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.similarScroll}>
          {(courseData.similarCourses || []).map((c, i) => (
            <View key={i} style={styles.similarCard}>
              <Image source={{ uri: c.image }} style={styles.similarImg} />
              <Text style={styles.similarTitle}>{c.title}</Text>
              <Text style={styles.similarAuthor}>{c.author}</Text>
              <Text style={styles.similarInfo}>{c.duration} • {c.level} • {c.type}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
      {/* Similar Webinar/Workshop */}
      <View style={styles.similarBox}>
        <Text style={styles.sectionTitle}>Similar Webinar /Workshop</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.similarScroll}>
          {(courseData.webinars || []).map((w, i) => (
            <View key={i} style={styles.similarCard}>
              <Image source={{ uri: w.image }} style={styles.similarImg} />
              <Text style={styles.similarTitle}>{w.title}</Text>
              <Text style={styles.similarAuthor}>Speaker: {w.speaker}</Text>
              <Text style={styles.similarInfo}>{w.date} • {w.time}</Text>
              <TouchableOpacity style={styles.enrollBtnSm}><Text style={styles.enrollBtnText}>Enroll now</Text></TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 18,
    overflow: 'hidden',
  },
  headerBoxMobile: {
    flexDirection: 'column',
    borderRadius: 10,
    marginBottom: 10,
  },
  headerImg: {
    width: isMobile ? '100%' : 220,
    height: isMobile ? 180 : 220,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    resizeMode: 'cover',
  },
  headerContent: {
    flex: 1,
    padding: 16,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 22,
    marginBottom: 4,
    color: '#222',
  },
  headerAuthor: {
    fontSize: 15,
    color: '#888',
    marginBottom: 6,
  },
  headerDesc: {
    fontSize: 15,
    color: '#222',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 10,
  },
  headerPrice: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold',
    marginRight: 10,
  },
  enrollBtn: {
    backgroundColor: '#1CB5E0',
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  enrollBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerUpdated: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    justifyContent: 'space-between',
  },
  infoStar: {
    fontSize: 16,
    color: '#1CB5E0',
    fontWeight: 'bold',
  },
  infoEnrolled: {
    fontSize: 13,
    color: '#888',
  },
  infoLevel: {
    fontSize: 13,
    color: '#222',
  },
  infoFlex: {
    fontSize: 13,
    color: '#1CB5E0',
  },
  sectionBox: {
    backgroundColor: '#EAF6FB',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 10,
    color: '#222',
  },
  contentRow: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  contentType: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#1CB5E0',
  },
  contentTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
  },
  contentDesc: {
    fontSize: 14,
    color: '#222',
    marginBottom: 2,
  },
  contentMin: {
    fontSize: 13,
    color: '#888',
    alignSelf: 'flex-end',
  },
  includesBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
  },
  includesTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 8,
    color: '#222',
  },
  includesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  includesItem: {
    fontSize: 14,
    color: '#222',
    backgroundColor: '#EAF6FB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  reviewBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  reviewStar: {
    fontSize: 14,
    color: '#1CB5E0',
    width: 50,
  },
  reviewBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#EAF6FB',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  reviewBarFill: {
    height: 8,
    backgroundColor: '#1CB5E0',
    borderRadius: 4,
  },
  reviewCount: {
    fontSize: 13,
    color: '#222',
    width: 30,
    textAlign: 'right',
  },
  testimonialsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  testimonialBox: {
    backgroundColor: '#EAF6FB',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    minWidth: 180,
    maxWidth: 220,
    marginBottom: 8,
  },
  testimonialName: {
    fontWeight: 'bold',
    color: '#1CB5E0',
    fontSize: 14,
  },
  testimonialDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  testimonialText: {
    fontSize: 13,
    color: '#222',
  },
  similarBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
  },
  similarScroll: {
    marginTop: 8,
  },
  similarCard: {
    backgroundColor: '#EAF6FB',
    borderRadius: 8,
    padding: 10,
    marginRight: 12,
    width: 180,
    minHeight: 180,
    alignItems: 'center',
  },
  similarImg: {
    width: 160,
    height: 80,
    borderRadius: 6,
    marginBottom: 6,
    resizeMode: 'cover',
  },
  similarTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#222',
    marginBottom: 2,
    textAlign: 'center',
  },
  similarAuthor: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
    textAlign: 'center',
  },
  similarInfo: {
    fontSize: 12,
    color: '#1CB5E0',
    textAlign: 'center',
  },
  enrollBtnSm: {
    backgroundColor: '#1CB5E0',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 6,
  },
});
