// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   ActivityIndicator,
//   TouchableOpacity,
//   TextInput,
//   Modal,
//   ScrollView,
//   RefreshControl,
//   Platform,
//   Alert,
// } from 'react-native';
// import { Search, Sliders, X, MapPin } from 'lucide-react-native';
// import Colors from '../../constant/Colors';
// import { supabase } from '../../lib/Superbase';
// import { Job } from '../../types/jobs';
// import JobListItemCard from '../../component/jobs/JobListItemCard';
// import { useRouter } from 'expo-router';
// import { useAuth } from '../../Context/auth';
import { useRoleChecker } from '../../utils/roleChecker';
import { 
  ShowForAdmin, 
  ShowForTeacher, 
  ShowForJobCreation,
  ShowForJobManagement,
  ShowForJobViewing,
  ShowForJobApplications,
  ShowForJobApplicationCreation,
  ShowForJobApplicationTracking,
  ShowForInterviewManagement,
  ShowForJobAnalytics,
  ShowForPanelMembersManagement
} from '../../component/RoleBasedUI';

// const PAGE_SIZE = 10;

// const jobTypeOptions = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship'];
// const workModeOptions = ['All', 'On-site', 'Remote', 'Hybrid'];
// const experienceLevelOptions = ['All', 'Entry-level', '0-2 years', '2-5 years', '5+ years'];
// const sortByOptions = [
//   { label: 'Relevance', value: 'relevance' },
//   { label: 'Date Posted (Newest)', value: 'created_at_desc' },
//   { label: 'Date Posted (Oldest)', value: 'created_at_asc' },
// ];
// const quickFilterOptions = ['All Jobs', 'Applied', 'Saved'];


// export default function JobListingsScreen() {
//   const router = useRouter();
//   const { session, isLoading: authIsLoading } = useAuth();
//   const currentUserId = session?.user?.id;

//   const [jobs, setJobs] = useState<Job[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [searchQuery, setSearchQuery] = useState('');
//   const [locationQuery, setLocationQuery] = useState('');
//   const [activeQuickFilter, setActiveQuickFilter] = useState(quickFilterOptions[0]);

//   const [showFilterModal, setShowFilterModal] = useState(false);
//   const [modalJobType, setModalJobType] = useState<string>(jobTypeOptions[0]);
//   const [modalWorkMode, setModalWorkMode] = useState<string>(workModeOptions[0]);
//   const [modalExperienceLevel, setModalExperienceLevel] = useState<string>(experienceLevelOptions[0]);
//   const [modalSortBy, setModalSortBy] = useState(sortByOptions[0].value);
//   const [bookmarkedJobIds, setBookmarkedJobIds] = useState<number[]>([]);
  
//   // --- FIX 1: DECLARE THE MISSING STATE ---
//   const [appliedJobIds, setAppliedJobIds] = useState<number[]>([]);

//   const fetchBookmarkedJobIds = useCallback(async () => {
//     if (!currentUserId) {
//       setBookmarkedJobIds([]);
//       return;
//     }
//     try {
//       const { data, error } = await supabase
//         .from('bookmarked_jobs')
//         .select('job_id')
//         .eq('user_id', currentUserId);
//       if (error) throw error;
//       setBookmarkedJobIds(data ? data.map(b => b.job_id) : []);
//     } catch (err) {
//       console.error("Error fetching bookmarked job IDs:", err);
//       setBookmarkedJobIds([]);
//     }
//   }, [currentUserId]);

//   // --- FIX 2: ADD THE FUNCTION TO FETCH APPLIED JOB IDs ---
//   const fetchAppliedJobIds = useCallback(async () => {
//     if (!currentUserId) {
//         setAppliedJobIds([]);
//         return;
//     }
//     try {
//         const { data, error } = await supabase
//             .from('job_applications')
//             .select('job_id')
//             .eq('user_id', currentUserId);
//         if (error) throw error;
//         setAppliedJobIds(data ? data.map(app => app.job_id) : []);
//     } catch (err) {
//         console.error("Error fetching applied job IDs:", err);
//         setAppliedJobIds([]);
//     }
//   }, [currentUserId]);

//   // --- FIX 3: CALL THE NEW FUNCTION IN useEffect ---
//   useEffect(() => {
//     if (!authIsLoading && currentUserId) {
//         fetchBookmarkedJobIds();
//         fetchAppliedJobIds(); // Fetch applied jobs when the user is available
//     }
//   }, [authIsLoading, currentUserId, fetchBookmarkedJobIds, fetchAppliedJobIds]);

//   const fetchJobs = useCallback(async (pageNum: number, isRefresh = false, isSearchOrFilterTrigger = false) => {
//     if (isLoading && !isRefresh && !isSearchOrFilterTrigger) {
//         console.log("Fetch skipped: Already loading");
//         return;
//     }
//     if (!hasMore && pageNum > 1 && !isRefresh && !isSearchOrFilterTrigger) {
//         console.log(`Fetch skipped: No more data (page: ${pageNum}, hasMore: ${hasMore})`);
//         return;
//     }

//     console.log(`Fetching jobs - Page: ${pageNum}, Filter: ${activeQuickFilter}, UserID: ${currentUserId}`);
//     setIsLoading(true);
//     if (!isRefresh) setError(null);

//     try {
//       let query;
//       let jobIdsToFetch: number[] | null = null; // To store IDs for Applied/Saved jobs

//       if (activeQuickFilter === 'Applied') {
//         jobIdsToFetch = appliedJobIds; // Use the fetched state
//         if (jobIdsToFetch.length === 0) {
//           setJobs([]); setHasMore(false); setIsLoading(false); setIsRefreshing(false); return;
//         }
//       } else if (activeQuickFilter === 'Saved') {
//         jobIdsToFetch = bookmarkedJobIds; // Use the state which is already fetched
//         if (jobIdsToFetch.length === 0) {
//           setJobs([]); setHasMore(false); setIsLoading(false); setIsRefreshing(false); return;
//         }
//       }

//       if (jobIdsToFetch !== null) { // If filtering by Applied or Saved
//         query = supabase.from('jobs').select('*').in('id', jobIdsToFetch).eq('status', 'Active');
//       } else { // Standard query for 'All Jobs' or other general filters
//         query = supabase.from('jobs').select('*').eq('status', 'Active');

//         // Logic to hide applied jobs from the "All Jobs" list
//         if (activeQuickFilter === 'All Jobs' && currentUserId && appliedJobIds.length > 0) {
//             query = query.not('id', 'in', `(${appliedJobIds.join(',')})`);
//         }

//         if (activeQuickFilter !== 'All Jobs') {
//             if (['Remote', 'On-site', 'Hybrid'].includes(activeQuickFilter)) {
//                 query = query.eq('work_mode', activeQuickFilter);
//             } else if (jobTypeOptions.includes(activeQuickFilter) && activeQuickFilter !== 'All') {
//                 query = query.eq('job_type', activeQuickFilter);
//             }
//         }
//       }

//       // Apply search and location queries universally
//       if (searchQuery.trim()) {
//         const searchTrimmed = `%${searchQuery.trim()}%`;
//         query = query.or(`job_name.ilike.${searchTrimmed},job_title.ilike.${searchTrimmed},company_name.ilike.${searchTrimmed},required_skills.ilike.${searchTrimmed}`);
//       }
//       if (locationQuery.trim()) {
//         query = query.ilike('preferred_location', `%${locationQuery.trim()}%`);
//       }

//       // Apply advanced modal filters if this fetch was triggered by modal apply
//       if (isSearchOrFilterTrigger && showFilterModal === false) {
//           if (modalJobType !== 'All') query = query.eq('job_type', modalJobType);
//           if (modalWorkMode !== 'All') query = query.eq('work_mode', modalWorkMode);
//           if (modalExperienceLevel !== 'All') {
//             if (modalExperienceLevel === '0-2 years') query = query.lte('experience', 2);
//             else if (modalExperienceLevel === '2-5 years') query = query.gte('experience', 2).lte('experience', 5);
//             else if (modalExperienceLevel === '5+ years') query = query.gte('experience', 5);
//           }
//       }

//       // Apply sorting
//       switch (modalSortBy) { // Using modalSortBy for all sorting for consistency
//         case 'created_at_asc': query = query.order('created_at', { ascending: true }); break;
//         default: query = query.order('created_at', { ascending: false }); break;
//       }

//       const from = (pageNum - 1) * PAGE_SIZE;
//       const to = pageNum * PAGE_SIZE - 1;
//       query = query.range(from, to);

//       const { data, error: dbError } = await query;
//       if (dbError) throw dbError;

//       const fetchedJobs = (data || []).map(job => ({
//           ...job,
//           isBookmarked: bookmarkedJobIds.includes(job.id)
//       })) as Job[];

//       setJobs(prev => (pageNum === 1 || isRefresh || isSearchOrFilterTrigger) ? fetchedJobs : [...prev, ...fetchedJobs]);
//       setHasMore(fetchedJobs.length === PAGE_SIZE);
//       setPage(pageNum);

//     } catch (err: any) {
//       console.error("Error fetching jobs:", err.message);
//       setError(err.message || "Failed to fetch jobs.");
//       if (pageNum === 1 || isRefresh || isSearchOrFilterTrigger) setJobs([]);
//     } finally {
//       setIsLoading(false);
//       setIsRefreshing(false);
//     }
//   }, [
//     searchQuery, locationQuery, activeQuickFilter,
//     modalJobType, modalWorkMode, modalExperienceLevel, modalSortBy,
//     currentUserId, bookmarkedJobIds, appliedJobIds // Ensure appliedJobIds is in the dependency array
//   ]);

//   useEffect(() => {
//     if(!authIsLoading){
//         fetchJobs(1, false, true); // Initial fetch
//     }
//   }, [activeQuickFilter, authIsLoading, currentUserId]); // Re-fetch on filter/user change

//   const handleSearchSubmit = () => {
//     setPage(1);
//     setHasMore(true);
//     fetchJobs(1, false, true);
//   };

//   const handleQuickFilterChange = (filter: string) => {
//     if ((filter === 'Applied' || filter === 'Saved') && !currentUserId && !authIsLoading) {
//         Alert.alert("Login Required", "Please sign in to view this section.", [
//             { text: "OK" },
//             { text: "Sign In", onPress: () => router.push('/auth/SignIn') }
//         ]);
//         return;
//     }
//     setPage(1);
//     setHasMore(true);
//     setActiveQuickFilter(filter);
//   };

//   const applyAdvancedFilters = () => {
//     setShowFilterModal(false);
//     setPage(1);
//     setHasMore(true);
//     fetchJobs(1, false, true);
//   };

//   const resetAdvancedFilters = () => {
//     setModalJobType(jobTypeOptions[0]);
//     setModalWorkMode(workModeOptions[0]);
//     setModalExperienceLevel(experienceLevelOptions[0]);
//     setModalSortBy(sortByOptions[0].value);
//   };

//   const handleRefresh = () => {
//     if (!authIsLoading) {
//         setIsRefreshing(true);
//         setPage(1);
//         setHasMore(true);
//         if (currentUserId) {
//             fetchBookmarkedJobIds();
//             fetchAppliedJobIds(); // Also refresh applied jobs list
//         }
//         fetchJobs(1, true, false);
//     }
//   };

//   const handleLoadMore = () => {
//     if (hasMore && !isLoading && !isRefreshing && !authIsLoading) {
//       fetchJobs(page + 1, false, false);
//     }
//   };

//   const handleToggleBookmark = async (jobId: number, currentIsBookmarked: boolean) => {
//     if (!currentUserId) {
//         Alert.alert("Login Required", "Please sign in to bookmark jobs.");
//         return;
//     }
//     try {
//         if (currentIsBookmarked) {
//             const { error } = await supabase.from('bookmarked_jobs').delete().match({ user_id: currentUserId, job_id: jobId });
//             if (error) throw error;
//             setBookmarkedJobIds(prev => prev.filter(id => id !== jobId));
//         } else {
//             const { error } = await supabase.from('bookmarked_jobs').insert({ user_id: currentUserId, job_id: jobId });
//             if (error) throw error;
//             setBookmarkedJobIds(prev => [...prev, jobId]);
//         }
//         setJobs(prevJobs => prevJobs.map(j => j.id === jobId ? { ...j, isBookmarked: !currentIsBookmarked } : j));

//         if (activeQuickFilter === 'Saved') {
//             handleRefresh();
//         }
//     } catch (err: any) {
//         Alert.alert("Error", `Could not update bookmark: ${err.message}`);
//     }
//   };

//   const navigateToJobDetails = (job: Job) => {
//     router.push({
//       pathname: '/(screens)/JobDetailsScreen',
//       params: { jobId: job.id.toString() }
//     });
//   };

//   const renderFilterModalContent = () => (
//     <View style={styles.modalOverlay}>
//         <View style={styles.modalContainer}>
//             <ScrollView showsVerticalScrollIndicator={false}>
//                 <View style={styles.modalHeader}>
//                     <Text style={styles.modalTitle}>Filters & Sort</Text>
//                     <TouchableOpacity onPress={() => setShowFilterModal(false)}>
//                         <X size={24} color={Colors.GRAY} />
//                     </TouchableOpacity>
//                 </View>
//                 <Text style={styles.modalSectionTitle}>Job Type</Text>
//                 <View style={styles.chipGroup}>
//                     {jobTypeOptions.map(type => (
//                         <TouchableOpacity key={type} style={[styles.chip, modalJobType === type && styles.chipSelected]} onPress={() => setModalJobType(type)}>
//                             <Text style={[styles.chipText, modalJobType === type && styles.chipTextSelected]}>{type}</Text>
//                         </TouchableOpacity>
//                     ))}
//                 </View>
//                 <Text style={styles.modalSectionTitle}>Work Mode</Text>
//                 <View style={styles.chipGroup}>
//                     {workModeOptions.map(mode => (
//                         <TouchableOpacity key={mode} style={[styles.chip, modalWorkMode === mode && styles.chipSelected]} onPress={() => setModalWorkMode(mode)}>
//                             <Text style={[styles.chipText, modalWorkMode === mode && styles.chipTextSelected]}>{mode}</Text>
//                         </TouchableOpacity>
//                     ))}
//                 </View>
//                 <Text style={styles.modalSectionTitle}>Experience Level</Text>
//                  <View style={styles.chipGroup}>
//                     {experienceLevelOptions.map(level => (
//                         <TouchableOpacity key={level} style={[styles.chip, modalExperienceLevel === level && styles.chipSelected]} onPress={() => setModalExperienceLevel(level)}>
//                             <Text style={[styles.chipText, modalExperienceLevel === level && styles.chipTextSelected]}>{level}</Text>
//                         </TouchableOpacity>
//                     ))}
//                 </View>
//                 <Text style={styles.modalSectionTitle}>Sort By</Text>
//                 {sortByOptions.map(option => (
//                      <TouchableOpacity key={option.value} style={[styles.sortOptionItem, modalSortBy === option.value && styles.sortOptionItemSelected]} onPress={() => setModalSortBy(option.value)}>
//                         <Text style={[styles.sortOptionText, modalSortBy === option.value && styles.sortOptionTextSelected]}>{option.label}</Text>
//                     </TouchableOpacity>
//                 ))}
//             </ScrollView>
//             <View style={styles.modalActions}>
//                 <TouchableOpacity style={styles.modalResetButton} onPress={resetAdvancedFilters}>
//                     <Text style={styles.modalResetButtonText}>Reset</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={styles.modalApplyButton} onPress={applyAdvancedFilters}>
//                     <Text style={styles.modalApplyButtonText}>Apply</Text>
//                 </TouchableOpacity>
//             </View>
//         </View>
//     </View>
//   );

//   return (
//     <View style={styles.safeArea}>
//       <View style={styles.searchControlsContainer}>
//         <View style={styles.inputRow}>
//             <View style={styles.inputContainer}>
//                 <Search size={20} color={Colors.GRAY} style={styles.inputIcon} />
//                 <TextInput
//                     style={styles.textInput}
//                     placeholder="Job title, keyword, company"
//                     value={searchQuery}
//                     onChangeText={setSearchQuery}
//                     onSubmitEditing={handleSearchSubmit}
//                     returnKeyType="search"
//                     placeholderTextColor={Colors.GRAY}
//                 />
//                 {searchQuery.length > 0 && (
//                     <TouchableOpacity onPress={() => {setSearchQuery(''); handleSearchSubmit();}}>
//                         <X size={18} color={Colors.GRAY} />
//                     </TouchableOpacity>
//                 )}
//             </View>
//         </View>
//         <View style={styles.inputRow}>
//             <View style={styles.inputContainer}>
//                 <MapPin size={20} color={Colors.GRAY} style={styles.inputIcon} />
//                 <TextInput
//                     style={styles.textInput}
//                     placeholder="Location (e.g., City, State)"
//                     value={locationQuery}
//                     onChangeText={setLocationQuery}
//                     onSubmitEditing={handleSearchSubmit}
//                     returnKeyType="search"
//                     placeholderTextColor={Colors.GRAY}
//                 />
//                 {locationQuery.length > 0 && (
//                     <TouchableOpacity onPress={() => {setLocationQuery(''); handleSearchSubmit();}}>
//                         <X size={18} color={Colors.GRAY} />
//                     </TouchableOpacity>
//                 )}
//             </View>
//         </View>
//          <View style={styles.mainActionButtons}>
//             <TouchableOpacity style={styles.searchActionButton} onPress={handleSearchSubmit}>
//                 <Text style={styles.searchActionButtonText}>Search Jobs</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.filterIconButton} onPress={() => setShowFilterModal(true)}>
//                 <Sliders size={22} color={Colors.PRIMARY} />
//             </TouchableOpacity>
//         </View>
//       </View>

//       <View style={styles.quickFiltersBar}>
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFiltersContent}>
//           {quickFilterOptions.map(filter => (
//             <TouchableOpacity
//               key={filter}
//               style={[styles.quickFilterButton, activeQuickFilter === filter && styles.quickFilterButtonActive]}
//               onPress={() => handleQuickFilterChange(filter)}
//             >
//               <Text style={[styles.quickFilterText, activeQuickFilter === filter && styles.quickFilterTextActive]}>
//                 {filter}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>
//       </View>

//       {(isLoading && jobs.length === 0 && !isRefreshing) || authIsLoading ? (
//         <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.activityIndicator} />
//       ) : error ? (
//         <View style={styles.messageContainer}>
//           <Text style={styles.errorText}>{error}</Text>
//           <TouchableOpacity style={styles.actionButton} onPress={handleRefresh}>
//             <Text style={styles.actionButtonText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       ) : jobs.length === 0 && !isLoading && !isRefreshing ? (
//          <View style={styles.messageContainer}>
//           <Text style={styles.emptyText}>No jobs found. Try adjusting your search or filters.</Text>
//         </View>
//       ) : (
//         <FlatList
//           data={jobs}
//           renderItem={({ item }) => (
//             <JobListItemCard
//                 job={item}
//                 onPress={() => navigateToJobDetails(item)}
//                 isBookmarked={item.isBookmarked}
//                 onToggleBookmark={handleToggleBookmark}
//             />
//           )}
//           keyExtractor={(item) => item.id.toString()}
//           onEndReached={handleLoadMore}
//           onEndReachedThreshold={0.5}
//           ListFooterComponent={isLoading && page > 1 && !isRefreshing ? <ActivityIndicator size="small" color={Colors.PRIMARY} style={{ marginVertical: 20 }} /> : null}
//           refreshControl={
//             <RefreshControl
//               refreshing={isRefreshing}
//               onRefresh={handleRefresh}
//               colors={[Colors.PRIMARY]}
//               tintColor={Colors.PRIMARY}
//             />
//           }
//           contentContainerStyle={styles.listContainer}
//           extraData={{ bookmarkedJobIds, appliedJobIds }}
//         />
//       )}

//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={showFilterModal}
//         onRequestClose={() => setShowFilterModal(false)}
//       >
//         {renderFilterModalContent()}
//       </Modal>
//     </View>
//   );
// }

// // Styles (remain the same)
// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//   },
//   searchControlsContainer: {
//     paddingHorizontal: 16,
//     paddingTop: 16,
//     paddingBottom: 12,
//     backgroundColor: Colors.WHITE,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   inputRow: {
//     marginBottom: 12,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f0f2f5',
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     height: 48,
//   },
//   inputIcon: {
//     marginRight: 8,
//   },
//   textInput: {
//     flex: 1,
//     fontSize: 15,
//     color: Colors.BLACK,
//   },
//   mainActionButtons: {
//     flexDirection: 'row',
//     marginTop: 4,
//   },
//   searchActionButton: {
//     flex: 1,
//     backgroundColor: Colors.PRIMARY,
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginRight: 8,
//   },
//   searchActionButtonText: {
//     color: Colors.WHITE,
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   filterIconButton: {
//     backgroundColor: '#e7f3ff',
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   quickFiltersBar: {
//     paddingVertical: 10,
//     backgroundColor: Colors.WHITE,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   quickFiltersContent: {
//     paddingHorizontal: 16,
//   },
//   quickFilterButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     backgroundColor: '#eef0f2',
//     marginRight: 8,
//     borderWidth: 1,
//     borderColor: 'transparent',
//   },
//   quickFilterButtonActive: {
//     backgroundColor: Colors.PRIMARY,
//     borderColor: Colors.PRIMARY,
//   },
//   quickFilterText: {
//     fontSize: 13,
//     color: Colors.GRAY,
//     fontWeight: '500',
//   },
//   quickFilterTextActive: {
//     color: Colors.WHITE,
//   },
//   listContainer: {
//     paddingBottom: 20,
//   },
//   activityIndicator: {
//     marginTop: 50,
//   },
//   messageContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   errorText: {
//     fontSize: 16,
//     color: Colors.ERROR,
//     textAlign: 'center',
//     marginBottom: 15,
//   },
//   actionButton: {
//     backgroundColor: Colors.PRIMARY,
//     paddingVertical: 10,
//     paddingHorizontal: 25,
//     borderRadius: 5,
//   },
//   actionButtonText: {
//     color: Colors.WHITE,
//     fontSize: 16,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: Colors.GRAY,
//     textAlign: 'center',
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     justifyContent: 'flex-end',
//   },
//   modalContainer: {
//     backgroundColor: Colors.WHITE,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     paddingHorizontal: 20,
//     paddingTop: 20,
//     paddingBottom: Platform.OS === 'ios' ? 30 : 20,
//     maxHeight: '80%',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: Colors.BLACK,
//   },
//   modalSectionTitle: {
//     fontSize: 17,
//     fontWeight: '600',
//     color: Colors.PRIMARY,
//     marginTop: 15,
//     marginBottom: 12,
//   },
//   chipGroup: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     marginBottom: 10,
//   },
//   chip: {
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//     borderRadius: 20,
//     backgroundColor: '#f0f2f5',
//     marginRight: 10,
//     marginBottom: 10,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   chipSelected: {
//     backgroundColor: Colors.PRIMARY,
//     borderColor: Colors.PRIMARY,
//   },
//   chipText: {
//     fontSize: 14,
//     color: Colors.GRAY,
//   },
//   chipTextSelected: {
//     color: Colors.WHITE,
//     fontWeight: '500',
//   },
//   sortOptionItem: {
//     paddingVertical: 14,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f2f5',
//   },
//   sortOptionItemSelected: {},
//   sortOptionText: {
//     fontSize: 16,
//     color: Colors.BLACK,
//   },
//   sortOptionTextSelected: {
//     color: Colors.PRIMARY,
//     fontWeight: '600',
//   },
//   modalActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 25,
//     paddingTop: 15,
//     borderTopWidth: 1,
//     borderTopColor: '#e0e0e0',
//   },
//   modalResetButton: {
//     backgroundColor: '#f0f2f5',
//     paddingVertical: 13,
//     borderRadius: 8,
//     alignItems: 'center',
//     flex: 1,
//     marginRight: 10,
//   },
//   modalResetButtonText: {
//     color: Colors.PRIMARY,
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   modalApplyButton: {
//     backgroundColor: Colors.PRIMARY,
//     paddingVertical: 13,
//     borderRadius: 8,
//     alignItems: 'center',
//     flex: 1,
//   },
//   modalApplyButtonText: {
//     color: Colors.WHITE,
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// app/(screens)/JobListingsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { Search, Sliders, X, MapPin } from 'lucide-react-native';
import Colors from '../../constant/Colors';
import { supabase } from '../../lib/Superbase';
import { Job } from '../../types/jobs';
import JobListItemCard from '../../component/jobs/JobListItemCard';
import { useRouter } from 'expo-router';
import { useAuth } from '../../Context/auth';

const PAGE_SIZE = 10;

const jobTypeOptions = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship'];
const workModeOptions = ['All', 'On-site', 'Remote', 'Hybrid'];
const experienceLevelOptions = ['All', 'Entry-level', '0-2 years', '2-5 years', '5+ years'];
const sortByOptions = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Date Posted (Newest)', value: 'created_at_desc' },
  { label: 'Date Posted (Oldest)', value: 'created_at_asc' },
];
const quickFilterOptions = ['All Jobs', 'Applied', 'Saved'];


export default function JobListingsScreen() {
  const router = useRouter();
  const { session, isLoading: authIsLoading, userProfile, userRole } = useAuth();
  const roleChecker = useRoleChecker();
  const currentUserId = session?.user?.id;

  const [jobs, setJobs] = useState<any[]>([]); // Use `any[]` to allow for the temporary status field
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState(quickFilterOptions[0]);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [modalJobType, setModalJobType] = useState<string>(jobTypeOptions[0]);
  const [modalWorkMode, setModalWorkMode] = useState<string>(workModeOptions[0]);
  const [modalExperienceLevel, setModalExperienceLevel] = useState<string>(experienceLevelOptions[0]);
  const [modalSortBy, setModalSortBy] = useState(sortByOptions[0].value);
  const [bookmarkedJobIds, setBookmarkedJobIds] = useState<number[]>([]);
  
  const [appliedJobIds, setAppliedJobIds] = useState<number[]>([]);

  const fetchBookmarkedJobIds = useCallback(async () => {
    if (!currentUserId) {
      setBookmarkedJobIds([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('bookmarked_jobs')
        .select('job_id')
        .eq('user_id', currentUserId);
      if (error) throw error;
      setBookmarkedJobIds(data ? data.map(b => b.job_id) : []);
    } catch (err) {
      console.error("Error fetching bookmarked job IDs:", err);
      setBookmarkedJobIds([]);
    }
  }, [currentUserId]);
  
  const fetchAppliedJobIds = useCallback(async () => {
    if (!currentUserId) {
        setAppliedJobIds([]);
        return;
    }
    try {
        const { data, error } = await supabase
            .from('job_applications')
            .select('job_id')
            .eq('user_id', currentUserId);
        if (error) throw error;
        setAppliedJobIds(data ? data.map(app => app.job_id) : []);
    } catch (err) {
        console.error("Error fetching applied job IDs:", err);
        setAppliedJobIds([]);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!authIsLoading && currentUserId) {
        fetchBookmarkedJobIds();
        fetchAppliedJobIds();
    }
  }, [authIsLoading, currentUserId, fetchBookmarkedJobIds, fetchAppliedJobIds]);

  const fetchJobs = useCallback(async (pageNum: number, isRefresh = false, isSearchOrFilterTrigger = false) => {
    // --- FIX: Corrected typo 'isRefreshOrFilterTrigger' ---
    if (isLoading && !isRefresh && !isSearchOrFilterTrigger) return;
    if (!hasMore && pageNum > 1 && !isRefresh && !isSearchOrFilterTrigger) return;
    
    setIsLoading(true);
    if (!isRefresh) setError(null);

    try {
        let query;
        let jobIdsToFetch: number[] | null = null;
        let applicationsMap = new Map();

        if (activeQuickFilter === 'Applied') {
            if (!currentUserId) {
                setJobs([]); setHasMore(false); setIsLoading(false); setIsRefreshing(false);
                Alert.alert("Login Required", "Please sign in to see your applied jobs.");
                return;
            }
            const { data: applicationsData, error: appliedError } = await supabase
                .from('job_applications')
                .select('job_id, status')
                .eq('user_id', currentUserId);

            if (appliedError) throw appliedError;
            
            jobIdsToFetch = applicationsData?.map(app => {
                applicationsMap.set(app.job_id, app.status);
                return app.job_id;
            }) || [];
            
            if (jobIdsToFetch.length === 0) {
                setJobs([]); setHasMore(false); setIsLoading(false); setIsRefreshing(false); return;
            }
        } else if (activeQuickFilter === 'Saved') {
            if (!currentUserId) {
                setJobs([]); setHasMore(false); setIsLoading(false); setIsRefreshing(false);
                Alert.alert("Login Required", "Please sign in to see your saved jobs.");
                return;
            }
            jobIdsToFetch = bookmarkedJobIds;
            if (jobIdsToFetch.length === 0) {
                setJobs([]); setHasMore(false); setIsLoading(false); setIsRefreshing(false); return;
            }
        }
        
        if (jobIdsToFetch !== null) {
            query = supabase.from('jobs').select('*').in('id', jobIdsToFetch).eq('status', 'Active');
        } else {
            query = supabase.from('jobs').select('*').eq('status', 'Active');
            if (activeQuickFilter === 'All Jobs' && currentUserId && appliedJobIds.length > 0) {
                query = query.not('id', 'in', `(${appliedJobIds.join(',')})`);
            }
        }

        if (searchQuery.trim()) {
            const searchTrimmed = `%${searchQuery.trim()}%`;
            query = query.or(`job_name.ilike.${searchTrimmed},job_title.ilike.${searchTrimmed},company_name.ilike.${searchTrimmed},required_skills.ilike.${searchTrimmed}`);
        }
        if (locationQuery.trim()) {
            query = query.ilike('preferred_location', `%${locationQuery.trim()}%`);
        }

        if (isSearchOrFilterTrigger && showFilterModal === false) {
            if (modalJobType !== 'All') query = query.eq('job_type', modalJobType);
            if (modalWorkMode !== 'All') query = query.eq('work_mode', modalWorkMode);
            if (modalExperienceLevel !== 'All') {
                if (modalExperienceLevel === '0-2 years') query = query.lte('experience', 2);
                else if (modalExperienceLevel === '2-5 years') query = query.gte('experience', 2).lte('experience', 5);
                else if (modalExperienceLevel === '5+ years') query = query.gte('experience', 5);
            }
        }

        switch (modalSortBy) {
            case 'created_at_asc': query = query.order('created_at', { ascending: true }); break;
            default: query = query.order('created_at', { ascending: false }); break;
        }

        const from = (pageNum - 1) * PAGE_SIZE;
        const to = pageNum * PAGE_SIZE - 1;
        query = query.range(from, to);

        const { data, error: dbError } = await query;
        if (dbError) throw dbError;
      
        const fetchedJobs = (data || []).map(job => ({
            ...job,
            isBookmarked: bookmarkedJobIds.includes(job.id),
            // --- FIX: Use a temporary field for the status ---
            application_status: applicationsMap.get(job.id) || null 
        }));

        setJobs(prev => (pageNum === 1 || isRefresh || isSearchOrFilterTrigger) ? fetchedJobs : [...prev, ...fetchedJobs]);
        setHasMore(fetchedJobs.length === PAGE_SIZE);
        setPage(pageNum);

    } catch (err: any) {
        setError(err.message || "Failed to fetch jobs.");
        if (pageNum === 1 || isRefresh || isSearchOrFilterTrigger) setJobs([]);
    } finally {
        setIsLoading(false);
        setIsRefreshing(false);
    }
  }, [searchQuery, locationQuery, activeQuickFilter, modalJobType, modalWorkMode, modalExperienceLevel, modalSortBy, currentUserId, bookmarkedJobIds, appliedJobIds, isLoading, hasMore, page, showFilterModal]);

  useEffect(() => {
    if(!authIsLoading){
        fetchJobs(1, true, true);
    }
  }, [activeQuickFilter, authIsLoading, currentUserId]);

  const handleSearchSubmit = () => {
    setPage(1);
    setHasMore(true);
    fetchJobs(1, false, true);
  };

  const handleQuickFilterChange = (filter: string) => {
    if ((filter === 'Applied' || filter === 'Saved') && !currentUserId && !authIsLoading) {
        Alert.alert("Login Required", "Please sign in to view this section.", [
            { text: "OK" },
            { text: "Sign In", onPress: () => router.push('/auth/SignIn') }
        ]);
        return;
    }
    setActiveQuickFilter(filter);
  };

  const applyAdvancedFilters = () => {
    setShowFilterModal(false);
    setPage(1);
    setHasMore(true);
    fetchJobs(1, false, true);
  };

  const resetAdvancedFilters = () => {
    setModalJobType(jobTypeOptions[0]);
    setModalWorkMode(workModeOptions[0]);
    setModalExperienceLevel(experienceLevelOptions[0]);
    setModalSortBy(sortByOptions[0].value);
  };

  const handleRefresh = () => {
    if (!authIsLoading) {
        setIsRefreshing(true);
        setPage(1);
        setHasMore(true);
        if (currentUserId) {
            fetchBookmarkedJobIds();
            fetchAppliedJobIds();
        }
        fetchJobs(1, true, false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading && !isRefreshing && !authIsLoading) {
      fetchJobs(page + 1, false, false);
    }
  };

  const handleToggleBookmark = async (jobId: number, currentIsBookmarked: boolean) => {
    if (!currentUserId) {
        Alert.alert("Login Required", "Please sign in to bookmark jobs.");
        return;
    }
    try {
        if (currentIsBookmarked) {
            await supabase.from('bookmarked_jobs').delete().match({ user_id: currentUserId, job_id: jobId });
            setBookmarkedJobIds(prev => prev.filter(id => id !== jobId));
        } else {
            await supabase.from('bookmarked_jobs').insert({ user_id: currentUserId, job_id: jobId });
            setBookmarkedJobIds(prev => [...prev, jobId]);
        }
        setJobs(prevJobs => prevJobs.map(j => j.id === jobId ? { ...j, isBookmarked: !currentIsBookmarked } : j));
        if (activeQuickFilter === 'Saved') {
            handleRefresh();
        }
    } catch (err: any) {
        Alert.alert("Error", `Could not update bookmark: ${err.message}`);
    }
  };

  const navigateToJobDetails = (job: Job) => {
    router.push({
      pathname: '/(screens)/JobDetailsScreen',
      params: { jobId: job.id.toString() }
    });
  };

  const navigateToInterviewDetails = (applicationId: string) => {
    router.push({
      pathname: '/(screens)/InterviewDetailsScreen',
      params: { applicationId }
    });
  };

  const renderFilterModalContent = () => (
    <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Filters & Sort</Text>
                    <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                        <X size={24} color={Colors.GRAY} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.modalSectionTitle}>Job Type</Text>
                <View style={styles.chipGroup}>
                    {jobTypeOptions.map(type => (
                        <TouchableOpacity key={type} style={[styles.chip, modalJobType === type && styles.chipSelected]} onPress={() => setModalJobType(type)}>
                            <Text style={[styles.chipText, modalJobType === type && styles.chipTextSelected]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={styles.modalSectionTitle}>Work Mode</Text>
                <View style={styles.chipGroup}>
                    {workModeOptions.map(mode => (
                        <TouchableOpacity key={mode} style={[styles.chip, modalWorkMode === mode && styles.chipSelected]} onPress={() => setModalWorkMode(mode)}>
                            <Text style={[styles.chipText, modalWorkMode === mode && styles.chipTextSelected]}>{mode}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={styles.modalSectionTitle}>Experience Level</Text>
                 <View style={styles.chipGroup}>
                    {experienceLevelOptions.map(level => (
                        <TouchableOpacity key={level} style={[styles.chip, modalExperienceLevel === level && styles.chipSelected]} onPress={() => setModalExperienceLevel(level)}>
                            <Text style={[styles.chipText, modalExperienceLevel === level && styles.chipTextSelected]}>{level}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={styles.modalSectionTitle}>Sort By</Text>
                {sortByOptions.map(option => (
                     <TouchableOpacity key={option.value} style={[styles.sortOptionItem, modalSortBy === option.value && styles.sortOptionItemSelected]} onPress={() => setModalSortBy(option.value)}>
                        <Text style={[styles.sortOptionText, modalSortBy === option.value && styles.sortOptionTextSelected]}>{option.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalResetButton} onPress={resetAdvancedFilters}>
                    <Text style={styles.modalResetButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalApplyButton} onPress={applyAdvancedFilters}>
                    <Text style={styles.modalApplyButtonText}>Apply</Text>
                </TouchableOpacity>
            </View>
        </View>
    </View>
  );

  return (
    <View style={styles.safeArea}>
      {/* Role-based welcome section */}
      <View style={styles.roleWelcomeSection}>
        <ShowForAdmin>
          <Text style={styles.roleWelcomeText}>
            👑 Admin View: You can see all jobs and manage applications
          </Text>
        </ShowForAdmin>
        
        <ShowForTeacher>
          <Text style={styles.roleWelcomeText}>
            📚 Teacher View: Browse jobs and apply for positions
          </Text>
        </ShowForTeacher>
      </View>
      
      <View style={styles.searchControlsContainer}>
        <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
                <Search size={20} color={Colors.GRAY} style={styles.inputIcon} />
                <TextInput
                    style={styles.textInput}
                    placeholder="Job title, keyword, company"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearchSubmit}
                    returnKeyType="search"
                    placeholderTextColor={Colors.GRAY}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => {setSearchQuery(''); handleSearchSubmit();}}>
                        <X size={18} color={Colors.GRAY} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
        <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
                <MapPin size={20} color={Colors.GRAY} style={styles.inputIcon} />
                <TextInput
                    style={styles.textInput}
                    placeholder="Location (e.g., City, State)"
                    value={locationQuery}
                    onChangeText={setLocationQuery}
                    onSubmitEditing={handleSearchSubmit}
                    returnKeyType="search"
                    placeholderTextColor={Colors.GRAY}
                />
                {locationQuery.length > 0 && (
                    <TouchableOpacity onPress={() => {setLocationQuery(''); handleSearchSubmit();}}>
                        <X size={18} color={Colors.GRAY} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
         <View style={styles.mainActionButtons}>
            <TouchableOpacity style={styles.searchActionButton} onPress={handleSearchSubmit}>
                <Text style={styles.searchActionButtonText}>Search Jobs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterIconButton} onPress={() => setShowFilterModal(true)}>
                <Sliders size={22} color={Colors.PRIMARY} />
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.quickFiltersBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFiltersContent}>
          {quickFilterOptions.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.quickFilterButton, activeQuickFilter === filter && styles.quickFilterButtonActive]}
              onPress={() => handleQuickFilterChange(filter)}
            >
              <Text style={[styles.quickFilterText, activeQuickFilter === filter && styles.quickFilterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {(isLoading && jobs.length === 0 && !isRefreshing) || authIsLoading ? (
        <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.activityIndicator} />
      ) : error ? (
        <View style={styles.messageContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleRefresh}>
            <Text style={styles.actionButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : jobs.length === 0 && !isLoading && !isRefreshing ? (
         <View style={styles.messageContainer}>
          <Text style={styles.emptyText}>No jobs found. Try adjusting your search or filters.</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          renderItem={({ item }) => (
            <JobListItemCard
                job={item}
                onPress={() => navigateToJobDetails(item)}
                isBookmarked={item.isBookmarked}
                onToggleBookmark={handleToggleBookmark}
                // --- Pass the status from the temporary field ---
                applicationStatus={item.application_status}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isLoading && page > 1 && !isRefreshing ? <ActivityIndicator size="small" color={Colors.PRIMARY} style={{ marginVertical: 20 }} /> : null}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.PRIMARY]}
              tintColor={Colors.PRIMARY}
            />
          }
          contentContainerStyle={styles.listContainer}
          extraData={{ bookmarkedJobIds, appliedJobIds }}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={showFilterModal}
        onRequestClose={() => setShowFilterModal(false)}
      >
        {renderFilterModalContent()}
      </Modal>
    </View>
  );
}

// Styles remain unchanged
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  roleWelcomeSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  roleWelcomeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  searchControlsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  inputRow: {
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.BLACK,
  },
  mainActionButtons: {
    flexDirection: 'row',
    marginTop: 4,
  },
  searchActionButton: {
    flex: 1,
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  searchActionButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  filterIconButton: {
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickFiltersBar: {
    paddingVertical: 10,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  quickFiltersContent: {
    paddingHorizontal: 16,
  },
  quickFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#eef0f2',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickFilterButtonActive: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  quickFilterText: {
    fontSize: 13,
    color: Colors.GRAY,
    fontWeight: '500',
  },
  quickFilterTextActive: {
    color: Colors.WHITE,
  },
  listContainer: {
    paddingBottom: 20,
  },
  activityIndicator: {
    marginTop: 50,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.ERROR,
    textAlign: 'center',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 5,
  },
  actionButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.GRAY,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.BLACK,
  },
  modalSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.PRIMARY,
    marginTop: 15,
    marginBottom: 12,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chipSelected: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  chipText: {
    fontSize: 14,
    color: Colors.GRAY,
  },
  chipTextSelected: {
    color: Colors.WHITE,
    fontWeight: '500',
  },
  sortOptionItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  sortOptionItemSelected: {},
  sortOptionText: {
    fontSize: 16,
    color: Colors.BLACK,
  },
  sortOptionTextSelected: {
    color: Colors.PRIMARY,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalResetButton: {
    backgroundColor: '#f0f2f5',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  modalResetButtonText: {
    color: Colors.PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
  modalApplyButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  modalApplyButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});