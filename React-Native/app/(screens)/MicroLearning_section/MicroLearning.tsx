import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions, ActivityIndicator, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/Superbase';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const isMobile = width < 700;

const sidebarData = [
  {
    title: 'Personality Development',
    items: ['Body language', 'Communication Skills', 'Social Networking'],
  },
  {
    title: 'Class Management',
    items: ['Creative Session Planning', 'Class Engagement', 'Assessment and courses creation'],
  },
  {
    title: 'Personality Development',
    items: ['Body language', 'Communication Skills', 'Social Networking'],
  },
  {
    title: 'Class Management',
    items: ['Creative Session Planning', 'Class Engagement', 'Assessment and courses creation'],
  },
  {
    title: 'Personality Development',
    items: ['Body language', 'Communication Skills'],
  },
];

const Tab = ({ label, active }) => (
  <View style={[styles.tab, active && styles.activeTab]}>
    <Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text>
  </View>
);

// Helper to get image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://via.placeholder.com/300x180?text=No+Image';
  if (imagePath.startsWith('http')) return imagePath;
  // Replace <your-project-id> and <bucket-name> with your actual values
  return `https://dxhsmurbnfhkohqmmwuo.supabase.co/storage/v1/object/public/course-images/${imagePath}`;
};

const CourseCard = ({ item, onView }) => (
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
      <TouchableOpacity onPress={() => onView(item)}><Text style={styles.viewCourse}>View Course</Text></TouchableOpacity>
    </View>
  </View>
);

export default function MicroLearning() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const [filters, setFilters] = useState({
    duration: [],
    skill: [],
    price: [],
    format: [],
  });
  const [sort, setSort] = useState('Relevance');
  const [displayedCourses, setDisplayedCourses] = useState([]);
  const router = useRouter();

  const filterOptions = {
    duration: ['Under 5 Min', '5 to 10 Min', '10 to 20 min'],
    skill: ['Beginner', 'Intermediate', 'Advanced'],
    price: ['Free', 'Paid'],
    format: ['Video', 'Info-graphic'],
  };
  const sortOptions = ['Relevance', 'Highest Rated', 'Newest'];

  const toggleFilter = (type, value) => {
    setFilters(f => {
      const arr = f[type] || [];
      return {
        ...f,
        [type]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  };
  const clearAll = () => setFilters({ duration: [], skill: [], price: [], format: [] });

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

  useEffect(() => {
    let filtered = [...courses];
    // Duration filter
    if (filters.duration.length) {
      filtered = filtered.filter(c => {
        if (!c.duration) return false;
        if (filters.duration.includes('Under 5 Min') && c.duration.toLowerCase().includes('5 min')) return true;
        if (filters.duration.includes('5 to 10 Min') && c.duration.toLowerCase().includes('10 min')) return true;
        if (filters.duration.includes('10 to 20 min') && c.duration.toLowerCase().includes('20 min')) return true;
        return false;
      });
    }
    // Skill filter
    if (filters.skill.length) {
      filtered = filtered.filter(c => filters.skill.includes(c.level));
    }
    // Price filter
    if (filters.price.length) {
      filtered = filtered.filter(c => {
        if (filters.price.includes('Free') && (c.price === 'FREE' || c.price === 0 || c.price === '0')) return true;
        if (filters.price.includes('Paid') && c.price && c.price !== 'FREE' && c.price !== 0 && c.price !== '0') return true;
        return false;
      });
    }
    // Format filter
    if (filters.format.length) {
      filtered = filtered.filter(c => {
        if (filters.format.includes('Video') && c.format && c.format.toLowerCase().includes('video')) return true;
        if (filters.format.includes('Info-graphic') && c.format && c.format.toLowerCase().includes('info')) return true;
        return false;
      });
    }
    // Sorting
    if (sort === 'Highest Rated') {
      filtered.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else if (sort === 'Newest') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    setDisplayedCourses(filtered);
  }, [courses, filters, sort]);

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
            <Text style={styles.sidebarToggleText}>{sidebarOpen ? 'Hide Filters ▲' : 'Show Filters ▼'}</Text>
          </TouchableOpacity>
          {sidebarOpen && (
            <View style={styles.sidebarMobile}>
              <Text style={styles.sidebarTitle}>Subject</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {sidebarData.map((section, idx) => (
                  <View key={idx} style={styles.sidebarSection}>
                    <Text style={styles.sidebarSectionTitle}>{section.title}</Text>
                    {section.items.map((item, i) => (
                      <View key={i} style={styles.sidebarItemRow}>
                        <Text style={styles.sidebarItem}>{item}</Text>
                        <Text style={styles.sidebarArrow}>{'>'}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </>
      ) : (
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>Subject</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {sidebarData.map((section, idx) => (
              <View key={idx} style={styles.sidebarSection}>
                <Text style={styles.sidebarSectionTitle}>{section.title}</Text>
                {section.items.map((item, i) => (
                  <View key={i} style={styles.sidebarItemRow}>
                    <Text style={styles.sidebarItem}>{item}</Text>
                    <Text style={styles.sidebarArrow}>{'>'}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      {/* Filters Row */}
      <View style={[styles.mainContent, isMobile && { margin: 0, borderRadius: 0, padding: 12 }]}> 
        <View style={[styles.filtersRow, isMobile && { marginBottom: 10 }]}> 
          <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterVisible(true)}><Text style={styles.filterText}>Filters ▼</Text></TouchableOpacity>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setSortVisible(true)}><Text style={styles.filterText}>Sort By ▼</Text></TouchableOpacity>
        </View>
      </View>
      {/* Filter Modal */}
      <Modal visible={filterVisible} animationType="slide" transparent onRequestClose={() => setFilterVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalBox}>
            <View style={styles.filterRow}>
              <View style={styles.filterCol}>
                <TouchableOpacity style={styles.filterDrop}><Text style={styles.filterDropText}>Duration ▼</Text></TouchableOpacity>
                {filterOptions.duration.map(opt => (
                  <TouchableOpacity key={opt} style={styles.checkRow} onPress={() => toggleFilter('duration', opt)}>
                    <Text style={styles.checkBox}>{filters.duration.includes(opt) ? '☑' : '☐'}</Text>
                    <Text style={styles.checkLabel}>{opt}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.filterDrop}><Text style={styles.filterDropText}>Price ▼</Text></TouchableOpacity>
                {filterOptions.price.map(opt => (
                  <TouchableOpacity key={opt} style={styles.checkRow} onPress={() => toggleFilter('price', opt)}>
                    <Text style={styles.checkBox}>{filters.price.includes(opt) ? '☑' : '☐'}</Text>
                    <Text style={styles.checkLabel}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.filterCol}>
                <TouchableOpacity style={styles.filterDrop}><Text style={styles.filterDropText}>Skill level ▼</Text></TouchableOpacity>
                {filterOptions.skill.map(opt => (
                  <TouchableOpacity key={opt} style={styles.checkRow} onPress={() => toggleFilter('skill', opt)}>
                    <Text style={styles.checkBox}>{filters.skill.includes(opt) ? '☑' : '☐'}</Text>
                    <Text style={styles.checkLabel}>{opt}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.filterDrop}><Text style={styles.filterDropText}>Format ▼</Text></TouchableOpacity>
                {filterOptions.format.map(opt => (
                  <TouchableOpacity key={opt} style={styles.checkRow} onPress={() => toggleFilter('format', opt)}>
                    <Text style={styles.checkBox}>{filters.format.includes(opt) ? '☑' : '☐'}</Text>
                    <Text style={styles.checkLabel}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.filterFooter}>
              <TouchableOpacity style={styles.applyBtn} onPress={() => setFilterVisible(false)}><Text style={styles.applyBtnText}>Apply</Text></TouchableOpacity>
              <TouchableOpacity onPress={clearAll}><Text style={styles.clearAllText}>Clear All</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Sort Modal */}
      <Modal visible={sortVisible} animationType="fade" transparent onRequestClose={() => setSortVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sortModalBox}>
            {sortOptions.map(opt => (
              <TouchableOpacity key={opt} onPress={() => { setSort(opt); setSortVisible(false); }}>
                <Text style={[styles.sortOption, sort === opt && styles.sortOptionActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <ActivityIndicator size="large" color="#1CB5E0" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</Text>
      ) : (
        <FlatList
          data={displayedCourses}
          renderItem={({ item }) => <CourseCard item={item} onView={(course) => router.push({ pathname: '/(screens)/MicroLearning_section/MicroCoursesDetails', params: { course: JSON.stringify(course) } })} />}
          keyExtractor={item => item.id?.toString() || String(item.id)}
          numColumns={isMobile ? 1 : 4}
          columnWrapperStyle={isMobile ? undefined : styles.cardRow}
          contentContainerStyle={isMobile ? styles.cardsContainerMobile : styles.cardsContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={<TouchableOpacity style={styles.loadMoreBtn}><Text style={styles.loadMoreText}>Load More</Text></TouchableOpacity>}
        />
      )}
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
    maxHeight: 600,
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
  sidebarSection: {
    marginBottom: 18,
  },
  sidebarSectionTitle: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 6,
  },
  sidebarItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sidebarItem: {
    fontSize: 13,
    color: '#222',
    flex: 1,
  },
  sidebarArrow: {
    fontSize: 13,
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
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 18,
  },
  filterBtn: {
    marginLeft: 18,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
  },
  filterText: {
    color: '#222',
    fontSize: 14,
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
    width: isMobile ? '100%' : 210,
    marginRight: 0,
    marginBottom: 12,
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
    height: 90,
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
  loadMoreBtn: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 32,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
  },
  loadMoreText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
    maxHeight: '80%',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  filterCol: {
    flex: 1,
  },
  filterDrop: {
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    marginBottom: 10,
  },
  filterDropText: {
    color: '#222',
    fontSize: 14,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkBox: {
    marginRight: 8,
  },
  checkLabel: {
    color: '#222',
    fontSize: 14,
  },
  filterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applyBtn: {
    padding: 12,
    backgroundColor: '#1CB5E0',
    borderRadius: 6,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  clearAllText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  sortModalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
    maxHeight: '80%',
  },
  sortOption: {
    padding: 12,
    color: '#222',
    fontSize: 14,
  },
  sortOptionActive: {
    fontWeight: 'bold',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EAF6FB',
  },
  activeTab: {
    backgroundColor: '#1CB5E0',
    borderColor: '#1CB5E0',
  },
  tabText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  activeTabText: {
    color: '#fff',
  },
});
