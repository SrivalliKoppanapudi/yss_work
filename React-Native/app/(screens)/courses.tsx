import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/Superbase';
import { useRouter } from 'expo-router';
import { useAuth } from '../../Context/auth';
import { ShowForCourseCreation } from '../../component/RoleBasedUI';
import Colors from '../../constant/Colors';

const { width } = Dimensions.get('window');
const isMobile = width < 700;

const sidebarMenu = [
  { label: 'All' },
  { label: 'Draft' },
  { label: 'Published' },
  { label: 'Create new' },
  { label: 'Trash' },
];

const courseImgs = [
  'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?w=600',
  'https://images.pexels.com/photos/1134063/pexels-photo-1134063.jpeg?w=600',
  'https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?w=600',
  'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?w=600',
  'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?w=600',
  'https://images.pexels.com/photos/1134063/pexels-photo-1134063.jpeg?w=600',
  'https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?w=600',
  'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?w=600',
];

const getNumColumns = (width) => {
  if (width < 500) return 1;
  if (width < 900) return 2;
  if (width < 1300) return 3;
  return 4;
};

// Helper to get image URL
const getImageUrl = (imagePath: string | null) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `https://dxhsmurbnfhkohqmmwuo.supabase.co/storage/v1/object/public/course-covers/${imagePath}`;
};

const CourseCard = ({ item }) => {
  const router = useRouter();
  return (
    <View style={styles.card}>
      <Image style={styles.cardImg} source={{ uri: getImageUrl(item.image) }} />
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardAuthor}>{item.author || item.instructor || ''}</Text>
      <View style={styles.ratingRow}>
        <Text style={styles.rating}>{item.rating || ''} </Text>
        <Text style={styles.stars}>★★★★★</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>{item.duration || ''}</Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.infoText}>{item.level || 'Beginner'}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.price}>{item.price || 'FREE'}</Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/(screens)/MicroLearning_section/MicroCoursesDetails', params: { course: JSON.stringify(item) } })}>
          <Text style={styles.viewCourse}>View Course</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function CoursesScreen() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const numCols = getNumColumns(width);
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setCourses(data || []);
      } catch (err) {
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Compose header for FlatList
  const ListHeader = () => (
    <View style={[styles.outerContainer, isMobile && { flexDirection: 'column' }]}> 
      {/* Sidebar */}
      {isMobile ? (
        <>
          <TouchableOpacity
            style={styles.sidebarToggle}
            onPress={() => setSidebarOpen(!sidebarOpen)}
          >
            <Text style={styles.sidebarToggleText}>{sidebarOpen ? 'Hide Menu ▲' : 'Show Menu ▼'}</Text>
          </TouchableOpacity>
          {sidebarOpen && (
            <View style={styles.sidebarMobile}>
              <Text style={styles.sidebarTitle}>Courses</Text>
              {sidebarMenu.map((item, idx) => (
                <View key={idx} style={styles.sidebarItemRow}>
                  <Text style={styles.sidebarItem}>{item.label}</Text>
                  <Text style={styles.sidebarArrow}>{'>'}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>Courses</Text>
          {sidebarMenu.map((item, idx) => (
            <View key={idx} style={styles.sidebarItemRow}>
              <Text style={styles.sidebarItem}>{item.label}</Text>
              <Text style={styles.sidebarArrow}>{'>'}</Text>
            </View>
          ))}
        </View>
      )}
             <ShowForCourseCreation>
         <TouchableOpacity 
           style={[styles.fab, isMobile && { right: 20, bottom: 20, width: 50, height: 50, borderRadius: 25 }] }
           onPress={() => router.push('../Courses_section/CreateCourse')}
         >
           <Text style={[styles.fabIcon, isMobile && { fontSize: 28 }]}>＋</Text>
         </TouchableOpacity>
       </ShowForCourseCreation>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#1CB5E0" style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</Text>
        ) : (
      <FlatList
            data={courses}
            renderItem={CourseCard}
            keyExtractor={item => item.id?.toString() || String(item.id)}
            numColumns={isMobile ? 1 : numCols}
            columnWrapperStyle={isMobile ? undefined : styles.cardRow}
            contentContainerStyle={isMobile ? styles.cardsContainerMobile : styles.cardsContainer}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={ListHeader}
          />
        )}
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF6D9',
  },
  outerContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FAF6D9',
  },
  sidebar: {
    width: 220,
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    padding: 18,
    margin: 16,
    marginRight: 0,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sidebarMobile: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    maxHeight: 300,
  },
  sidebarToggle: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  sidebarToggleText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  sidebarTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 18,
  },
  sidebarItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sidebarItem: {
    fontSize: 15,
    color: '#222',
    flex: 1,
  },
  sidebarArrow: {
    fontSize: 15,
    color: '#888',
    marginLeft: 4,
  },
  mainContent: {
    flex: 1,
    margin: 16,
    marginLeft: 0,
    backgroundColor: '#fff',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardsContainer: {
    paddingBottom: 24,
  },
  cardsContainerMobile: {
    paddingBottom: 24,
    paddingHorizontal: 2,
  },
  cardRow: {
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    width: isMobile ? '100%' : 240,
    marginRight: 0,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignSelf: isMobile ? 'center' : 'flex-start',
  },
  cardImg: {
    width: '100%',
    height: 110,
    backgroundColor: '#E9E9E9',
    borderRadius: 6,
    marginBottom: 10,
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 2,
  },
  cardAuthor: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  rating: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#222',
  },
  stars: {
    color: '#FFD700',
    fontSize: 13,
    marginLeft: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#888',
  },
  dot: {
    fontSize: 12,
    color: '#888',
    marginHorizontal: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  price: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 14,
  },
  viewCourse: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    right: 40,
    bottom: 40,
    backgroundColor: '#1CB5E0',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: -2,
  },
});