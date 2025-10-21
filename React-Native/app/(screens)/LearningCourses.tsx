import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, ActivityIndicator, Modal, RefreshControl, Alert } from 'react-native';
import { Course } from '../../types/courses';
import Colors from '../../constant/Colors';
import CourseListItemCard from '../../component/courses/CourseListItemCard';
import { Filter, ChevronDown, ChevronUp, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/Superbase';

const PAGE_SIZE = 6;

const initialSubjectFilters = [
  { id: 'pd', name: 'Personality Development', subItems: [{ id: 'cs', name: 'Communication Skills' }] },
  { id: 'cm', name: 'Class Management', subItems: [{ id: 'ce', name: 'Class Engagement' }] },
  { id: 'pm', name: 'Project Management', subItems: [{ id: 'agile', name: 'Agile Methodologies'}] },
  { id: 'bs', name: 'Business', subItems: [{ id: 'strategy', name: 'Strategy'}] }
];

type SortOption = 'popularity' | 'rating' | 'newest';

const LearningCourses: React.FC = () => {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [currentSort, setCurrentSort] = useState<SortOption>('popularity');

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: 'Popularity', value: 'popularity' },
    { label: 'Rating (High to Low)', value: 'rating' },
    { label: 'Newest First', value: 'newest' },
  ];

  const fetchCoursesFromSupabase = useCallback(async (pageNum: number, isRefreshOrFilter = false) => {
    if (isLoading && !isRefreshOrFilter) return;
    if (!hasMore && pageNum > page && !isRefreshOrFilter) return;

    if (isRefreshOrFilter) {
      setIsLoading(true);
    } else {
      setIsLoading(true); 
    }
    setError(null);

    try {
      let query = supabase
        .from('courses')
        .select('*')
        .eq('status', 'published');

      switch (currentSort) {
        case 'rating': query = query.order('rating', { ascending: false, nullsFirst: false }); break;
        case 'newest': query = query.order('created_at', { ascending: false }); break;
        case 'popularity': default: query = query.order('enrollmentcount', { ascending: false, nullsFirst: false }); break;
      }

      const from = (pageNum - 1) * PAGE_SIZE;
      const to = pageNum * PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error: dbError } = await query;
      if (dbError) throw dbError;

      const newCourses = data || [];
      setCourses(prev => isRefreshOrFilter ? newCourses : [...prev, ...newCourses]);
      setHasMore(newCourses.length === PAGE_SIZE);
      setPage(pageNum);

    } catch (err: any) {
      setError(err.message || "Failed to fetch courses.");
      if (isRefreshOrFilter) setCourses([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedFilters, currentSort, isLoading, hasMore, page]);

  useEffect(() => {
    fetchCoursesFromSupabase(1, true);
  }, [currentSort, selectedFilters]); 

  const onRefresh = () => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchCoursesFromSupabase(1, true);
  };
  
  const handleLoadMore = () => {
    if (hasMore && !isLoading && !isRefreshing) {
      fetchCoursesFromSupabase(page + 1);
    }
  };
  const handleViewCourse = async (courseSummary: Course) => {
    setIsLoading(true); 
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseSummary.id)
        .single();
      if (courseError) throw courseError;
      if (!courseData) throw new Error("Course not found.");

      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseSummary.id)
        .order('order', { ascending: true });
      if (modulesError) throw modulesError;

      const moduleIds = (modulesData || []).map(m => m.id);
      let allLessons = [], allResources = [], allAssessments = [];
      
      if (moduleIds.length > 0) {
        const [lessonsRes, resourcesRes, assessmentsRes] = await Promise.all([
          supabase.from('lessons').select('*').in('module_id', moduleIds),
          supabase.from('course_resources').select('*').in('module_id', moduleIds),
          supabase.from('assessments').select('*').in('module_id', moduleIds).eq('is_published', true)
        ]);

        if (lessonsRes.error) throw lessonsRes.error;
        if (resourcesRes.error) throw resourcesRes.error;
        if (assessmentsRes.error) throw assessmentsRes.error;

        allLessons = lessonsRes.data || [];
        allResources = resourcesRes.data || [];
        allAssessments = assessmentsRes.data || [];
      }
      
      const enrichedModules = (modulesData || []).map(module => ({
        ...module,
        lessons: allLessons.filter(l => l.module_id === module.id),
        resources: allResources.filter(r => r.module_id === module.id),
        assessments: allAssessments.filter(a => a.module_id === module.id)
      }));

      const fullCourseData = { ...courseData, modules: enrichedModules };

      router.push({
        pathname: '/(screens)/CourseDetails',
        params: { course: JSON.stringify(fullCourseData) },
      });

    } catch (err: any) {
      console.error("Error fetching full course details:", err);
      Alert.alert("Error", "Could not load course details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFilter = (filterSubItemName: string) => {
    setSelectedFilters(prev => ({ ...prev, [filterSubItemName]: !prev[filterSubItemName] }));
  };

  const applyFiltersAndSort = () => {
    setFilterModalVisible(false);
    setSortModalVisible(false);
  };

  const resetFilters = () => {
    setSelectedFilters({});
    setExpandedCategories({});
  };

  const renderFilterModal = () => (
    <Modal
      animationType="slide" transparent={true} visible={filterModalVisible}
      onRequestClose={() => setFilterModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeaderContainer}>
            <Text style={styles.modalTitle}>Filter By</Text>
            <TouchableOpacity onPress={resetFilters}><Text style={styles.resetButtonText}>Reset</Text></TouchableOpacity>
          </View>
          <FlatList
            data={initialSubjectFilters}
            keyExtractor={cat => cat.id}
            renderItem={({ item: category }) => (
                <View>
                <TouchableOpacity style={styles.categoryHeader} onPress={() => setExpandedCategories(prev => ({ ...prev, [category.id]: !prev[category.id] }))}>
                    <Text style={styles.categoryTitle}>{category.name}</Text>
                    {expandedCategories[category.id] ? <ChevronUp size={20} color={Colors.PRIMARY} /> : <ChevronDown size={20} color={Colors.PRIMARY} />}
                </TouchableOpacity>
                {expandedCategories[category.id] && category.subItems?.map(item => (
                    <TouchableOpacity key={item.id} style={styles.filterItem} onPress={() => toggleFilter(item.name)}>
                    <View style={[styles.checkbox, selectedFilters[item.name] && styles.checkboxChecked]}>
                        {selectedFilters[item.name] && <Check size={14} color={Colors.WHITE} />}
                    </View>
                    <Text style={styles.filterItemText}>{item.name}</Text>
                    </TouchableOpacity>
                ))}
                </View>
            )}
          />
          <TouchableOpacity style={styles.applyButton} onPress={applyFiltersAndSort}><Text style={styles.applyButtonText}>Apply Filters</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderSortModal = () => (
    <Modal
      animationType="slide" transparent={true} visible={sortModalVisible}
      onRequestClose={() => setSortModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Sort By</Text>
          {sortOptions.map(option => (
            <TouchableOpacity key={option.value} style={styles.sortItem} onPress={() => { setCurrentSort(option.value); setSortModalVisible(false); }}>
              <Text style={[styles.sortItemText, currentSort === option.value && styles.sortItemTextSelected]}>{option.label}</Text>
              {currentSort === option.value && <Check size={20} color={Colors.PRIMARY} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterSortBar}>
        <TouchableOpacity style={styles.filterSortButton} onPress={() => setFilterModalVisible(true)}>
          <Filter size={18} color={Colors.PRIMARY} /><Text style={styles.filterSortText}>Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterSortButton} onPress={() => setSortModalVisible(true)}>
          <Text style={styles.filterSortText}>{sortOptions.find(opt => opt.value === currentSort)?.label || 'Sort By'}</Text>
          <ChevronDown size={18} color={Colors.PRIMARY} />
        </TouchableOpacity>
      </View>
      
      {error && !isLoading && (
        <View style={styles.errorDisplay}><Text style={styles.errorTextDisplay}>{error}</Text></View>
      )}

      <FlatList
        data={courses}
        renderItem={({ item }) => <CourseListItemCard course={item} onViewCourse={handleViewCourse} />}
        keyExtractor={item => item.id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.PRIMARY]} tintColor={Colors.PRIMARY}/>}
        ListFooterComponent={isLoading && !isRefreshing ? <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ marginVertical: 20 }} /> : null}
        ListEmptyComponent={!isLoading && !isRefreshing && courses.length === 0 && !error ? <Text style={styles.emptyText}>No courses found.</Text> : null}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }} 
      />
      {renderFilterModal()}
      {renderSortModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  filterSortBar: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.WHITE, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  filterSortButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e7f0ff' },
  filterSortText: { marginLeft: 6, marginRight: 4, fontSize: 14, color: Colors.PRIMARY, fontWeight: '500' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: Colors.GRAY },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30, maxHeight: '70%' },
  modalHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.BLACK },
  resetButtonText: { fontSize: 14, color: Colors.PRIMARY, fontWeight: '500' },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  categoryTitle: { fontSize: 16, fontWeight: '500', color: Colors.BLACK },
  filterItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingLeft: 15 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 1.5, borderColor: Colors.PRIMARY, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkboxChecked: { backgroundColor: Colors.PRIMARY },
  filterItemText: { fontSize: 15, color: Colors.BLACK },
  applyButton: { backgroundColor: Colors.PRIMARY, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  applyButtonText: { color: Colors.WHITE, fontSize: 16, fontWeight: 'bold' },
  sortItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  sortItemText: { fontSize: 16, color: Colors.BLACK },
  sortItemTextSelected: { fontWeight: 'bold', color: Colors.PRIMARY },
  errorDisplay: { alignItems: 'center', padding: 20, backgroundColor: Colors.WHITE },
  errorTextDisplay: { color: Colors.ERROR, fontSize: 16, textAlign: 'center', marginBottom: 10 },
  retryButton: { backgroundColor: Colors.PRIMARY, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  retryButtonText: { color: Colors.WHITE, fontSize: 16 },
});

export default LearningCourses;