// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
//   Dimensions,
//   Platform,
//   Alert
// } from 'react-native';
// import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
// import { Course, Module as CourseModule, Lesson, Resource as ResourceType } from '../../types/courses';
// import Colors from '../../constant/Colors';
// import { ArrowLeft, CheckCircle, ChevronDown, ChevronUp, FileText, Play, Link as LinkIcon, BookOpen, Video } from 'lucide-react-native';
// import KeyElementsLessonDisplay from '../../component/courses/KeyElementsLessonDisplay';
// import { useAuth } from '../../Context/auth';
// import ResourceViewer from '../../component/courses/ResourceViewer';
// import { supabase } from '../../lib/Superbase';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width } = Dimensions.get('window');
// const SIDEBAR_WIDTH = Platform.OS === 'web'
//     ? (width * 0.28 > 300 ? 300 : Math.max(200, width * 0.28))
//     : (width * 0.38 > 280 ? 280 : Math.max(150, width * 0.38));

// type SelectableItem =
//   | (Lesson & { itemType: 'lesson'; moduleId: string; })
//   | (ResourceType & { itemType: 'resource'; moduleId: string; });

// const ASYNC_STORAGE_COMPLETION_PREFIX = '@item_completed_';


// const StudentCourseContentScreen: React.FC = () => {
//   const router = useRouter();
//   const params = useLocalSearchParams<{ 
//     courseId?: string; 
//     initialItemId?: string; 
//     initialItemType?: 'lesson' | 'resource';
//     initialModuleId?: string; // Added to help restore state
//   }>();

//   const [course, setCourse] = useState<Course | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedItem, setSelectedItem] = useState<SelectableItem | null>(null);
//   const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
//   const [resourceViewerVisible, setResourceViewerVisible] = useState(false);
//   const [currentResourceForPdfViewer, setCurrentResourceForPdfViewer] = useState<ResourceType | null>(null);
//   const { session } = useAuth();
//   const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
//   const [courseProgress, setCourseProgress] = useState(0);
//   const [devAllCompleted, setDevAllCompleted] = useState(false);
//   // Add state for certificate availability
//   const [certificateAvailable, setCertificateAvailable] = useState(false);
//   const [savingCompletion, setSavingCompletion] = useState(false);

//   const updateCourseProgress = useCallback((currentCourse: Course | null, currentCompletedItems: Record<string, boolean>) => {
//     if (!currentCourse || !currentCourse.modules || currentCourse.modules.length === 0) {
//       setCourseProgress(0);
//       console.log('[SCC] updateCourseProgress: No course or modules, progress set to 0.');
//       return;
//     }

//     let totalCompletableItems = 0;
//     let completedItemsCount = 0;

//     currentCourse.modules.forEach(module => {
//       if (module.lessons && Array.isArray(module.lessons)) {
//         totalCompletableItems += module.lessons.length;
//         module.lessons.forEach(lesson => {
//           if (currentCompletedItems[String(lesson.id)]) {
//             completedItemsCount++;
//           }
//         });
//       }
//       if (module.resources && Array.isArray(module.resources)) {
//         module.resources.forEach(resource => {
//           if (resource.type === 'video') { // Only counting module-level videos for progress for now
//             totalCompletableItems++;
//             if (currentCompletedItems[String(resource.id)]) {
//               completedItemsCount++;
//             }
//           }
//         });
//       }
//     });

//     const progress = totalCompletableItems > 0 ? Math.round((completedItemsCount / totalCompletableItems) * 100) : 0;
//     setCourseProgress(progress);
//     console.log(`[SCC] updateCourseProgress: Calculated course progress: ${completedItemsCount}/${totalCompletableItems} = ${progress}%`);

//     if (session?.user && currentCourse.id) {
//       supabase
//         .from('course_enrollments')
//         .update({ progress: progress, last_active: new Date().toISOString() })
//         .eq('user_id', session.user.id)
//         .eq('course_id', currentCourse.id)
//         .then(({ error: dbError }) => {
//           if (dbError) console.error("[SCC] Error updating overall course progress in DB:", dbError);
//           else console.log(`[SCC] Overall course progress ${progress}% saved to DB for course ${currentCourse.id}.`);
//         });
//     }
//   }, [session?.user]);

//   // Helper to update course completion/certificate status
//   const updateCourseCompletionStatus = useCallback(async (progress: number) => {
//     if (!course || !session?.user) return;
//     setSavingCompletion(true);
//     try {
//       if (progress === 100) {
//         // Mark as completed
//         const { data: courseMeta, error: courseError } = await supabase
//           .from('courses')
//           .select('title, instructor')
//           .eq('id', course.id)
//           .single();
//         if (courseError) throw courseError;
//         await supabase.from('course_completions').upsert({
//           user_id: session.user.id,
//           course_id: course.id,
//           completed_at: new Date().toISOString(),
//           course_title: courseMeta?.title || course.title,
//           instructor: courseMeta?.instructor || '',
//         });
//         setCertificateAvailable(true);
//       } else {
//         // Remove completion
//         await supabase.from('course_completions')
//           .delete()
//           .eq('user_id', session.user.id)
//           .eq('course_id', course.id);
//         setCertificateAvailable(false);
//       }
//     } catch (e) {
//       console.error('Error updating course completion/certificate:', e);
//     } finally {
//       setSavingCompletion(false);
//     }
//   }, [course, session?.user]);

//   // Watch courseProgress and update completion/certificate
//   useEffect(() => {
//     if (course && session?.user) {
//       updateCourseCompletionStatus(courseProgress);
//     }
//   }, [courseProgress, course, session?.user, updateCourseCompletionStatus]);


//   const fetchItemProgress = useCallback(async (courseIdToLoad: string, userId: string) => {
//     if (!courseIdToLoad || !userId) return {};
//     console.log(`[SCC] Fetching item progress for course ${courseIdToLoad}, user ${userId}`);
//     try {
//       const { data, error: dbError } = await supabase
//         .from('student_lesson_progress') // Table stores both lesson and resource completions
//         .select('lesson_id') // This 'lesson_id' column holds the ID of the completed item
//         .eq('course_id', courseIdToLoad)
//         .eq('user_id', userId);

//       if (dbError) throw dbError;

//       const completed: Record<string, boolean> = {};
//       (data || []).forEach(item => {
//         if(item.lesson_id) {
//             completed[String(item.lesson_id)] = true;
//         }
//       });
//       console.log('[SCC] Fetched completed items from DB:', completed);
//       return completed;
//     } catch (e) {
//       console.error("[SCC] Failed to fetch item progress:", e);
//       return {};
//     }
//   }, []);

//   const markItemAsCompleted = useCallback(async (itemId: string | number, moduleIdForItem: string, itemType: 'lesson' | 'resource') => {
//     if (!course || !session?.user) {
//       Alert.alert("Error", "Cannot mark item as complete. User or course data missing.");
//       return;
//     }
//     const itemIdStr = String(itemId);

//     if (completedItems[itemIdStr]) {
//         console.log(`[SCC] Item ${itemIdStr} (${itemType}) already marked complete.`);
//         return; // Already marked, no need to proceed
//     }

//     console.log(`[SCC] Marking item ${itemIdStr} (${itemType}) in module ${moduleIdForItem} as complete.`);
//     const newCompletedItemsState = { ...completedItems, [itemIdStr]: true };
//     setCompletedItems(newCompletedItemsState); // Optimistic UI update
//     updateCourseProgress(course, newCompletedItemsState); // Recalculate progress

//     try {
//       const { error: dbError } = await supabase
//         .from('student_lesson_progress')
//         .insert({
//           user_id: session.user.id,
//           course_id: course.id,
//           lesson_id: itemIdStr, 
//           module_id: moduleIdForItem,
//         });

//       if (dbError) {
//         console.error(`[SCC] Failed to save ${itemType} progress to DB for item ${itemIdStr}:`, dbError);
//         // Revert optimistic UI update on failure
//         const revertedCompletedItemsState = { ...completedItems };
//         delete revertedCompletedItemsState[itemIdStr];
//         setCompletedItems(revertedCompletedItemsState);
//         updateCourseProgress(course, revertedCompletedItemsState);
//         Alert.alert("Error", "Could not save your progress. Please try again.");
//       } else {
//         console.log(`[SCC] Item ${itemIdStr} (${itemType}) successfully marked complete in DB.`);
//       }
//     } catch (e) {
//       console.error(`[SCC] Error in marking ${itemType} ${itemIdStr} complete (DB):`, e);
//       const revertedCompletedItemsState = { ...completedItems };
//       delete revertedCompletedItemsState[itemIdStr];
//       setCompletedItems(revertedCompletedItemsState);
//       updateCourseProgress(course, revertedCompletedItemsState);
//       Alert.alert("Error", "An unexpected error occurred while saving progress.");
//     }
//   }, [course, session?.user, completedItems, updateCourseProgress]); // Dependencies for useCallback


//   useEffect(() => {
//     const loadCourseAndProgress = async () => {
//       let courseIdToLoad = params.courseId;
//       if (!courseIdToLoad ) {
//         setError('Course ID not provided.');
//         setLoading(false);
//         return;
//       }

//       try {
//         setLoading(true);
//         setError(null);

//         const { data: courseDataFromServer, error: fetchError } = await supabase
//             .from('courses')
//             .select('*')
//             .eq('id', courseIdToLoad)
//             .single();
//         if (fetchError) throw fetchError;
//         if (!courseDataFromServer) throw new Error('Course not found.');

//         const rawModules = courseDataFromServer.modules;
//         let parsedModulesData: any[] = [];
//         if (typeof rawModules === 'string') {
//           try { parsedModulesData = JSON.parse(rawModules); }
//           catch (e) { console.error("[SCC] Error parsing modules JSON for progress:", e); }
//         } else if (Array.isArray(rawModules)) {
//           parsedModulesData = rawModules;
//         }

//         const processedModules: CourseModule[] = Array.isArray(parsedModulesData) ? parsedModulesData.map((mod: any, mIdx: number) => {
//             const moduleId = mod.id || `module-${courseDataFromServer.id}-${mIdx}-${Date.now()}`;
//             return {
//             ...mod,
//             id: moduleId,
//             title: mod.title || `Module ${mIdx + 1}`,
//             description: mod.description || '',
//             lessons: Array.isArray(mod.lessons) ? mod.lessons.map((les: any, lIdx: number) => ({
//               ...les,
//               id: les.id || `lesson-${moduleId}-${lIdx}-${Date.now()}`,
//               title: les.title || `Lesson ${lIdx + 1}`,
//               content: (typeof les.content === 'string' ? les.content : JSON.stringify(les.content || {})),
//               type: les.type || 'text',
//               moduleId: moduleId
//             })) : [],
//              resources: Array.isArray(mod.resources) ? mod.resources.map((res: any, rIdx: number) => ({
//                 ...res,
//                 id: res.id || `mod-res-${moduleId}-${rIdx}-${Date.now()}`,
//                 title: res.title || `Resource ${rIdx + 1}`,
//                 type: res.type || (res.url && (res.url.includes('.pdf') ? 'pdf' : res.url.includes('youtu') || res.url.includes('vimeo') || res.url.endsWith('.mp4') || res.url.endsWith('.mov') ? 'video' : 'link')),
//                 url: res.url || '',
//                 moduleId: moduleId // Crucial: ensure module-level resources also have moduleId
//             })) : [],
//           }}) : [];

//         const processedCourseData = {
//           ...courseDataFromServer,
//           modules: processedModules
//         };
//         setCourse(processedCourseData as Course);

//         // Initial item selection & module expansion
//         let initialItemFound = false;
//         if (params.initialItemId && params.initialItemType && processedCourseData.modules) {
//             const targetModuleId = params.initialModuleId || // Use provided moduleId if available
//                                   (processedCourseData.modules.find(m =>
//                                     (params.initialItemType === 'lesson' && m.lessons?.some(l => String(l.id) === params.initialItemId)) ||
//                                     (params.initialItemType === 'resource' && m.resources?.some(r => String(r.id) === params.initialItemId))
//                                   ))?.id;

//             if (targetModuleId) {
//                 const moduleToExpand = processedCourseData.modules.find(m => m.id === targetModuleId);
//                 if (moduleToExpand) {
//                     if (params.initialItemType === 'lesson' && moduleToExpand.lessons) {
//                         const lesson = moduleToExpand.lessons.find((l: Lesson) => String(l.id) === params.initialItemId);
//                         if (lesson) {
//                             handleSelectItem({ ...lesson, itemType: 'lesson', moduleId: moduleToExpand.id });
//                             initialItemFound = true;
//                         }
//                     } else if (params.initialItemType === 'resource' && moduleToExpand.resources) {
//                         const resource = moduleToExpand.resources.find((r: ResourceType) => String(r.id) === params.initialItemId);
//                         if (resource) {
//                             handleSelectItem({ ...resource, itemType: 'resource', moduleId: moduleToExpand.id });
//                             initialItemFound = true;
//                         }
//                     }
//                     if (initialItemFound) {
//                          setExpandedModules(prev => ({ ...prev, [moduleToExpand.id]: true }));
//                     }
//                 }
//             }
//         }

//         if (!initialItemFound && processedCourseData.modules && processedCourseData.modules.length > 0) {
//             const firstModule = processedCourseData.modules[0];
//             if (firstModule.lessons && firstModule.lessons.length > 0) {
//                 handleSelectItem({ ...firstModule.lessons[0], itemType: 'lesson', moduleId: firstModule.id });
//             } else if (firstModule.resources && firstModule.resources.length > 0) {
//                 // Prefer video resources if available, then any other resource
//                 const firstVideoResource = firstModule.resources.find(r => r.type === 'video');
//                 if (firstVideoResource) {
//                     handleSelectItem({ ...firstVideoResource, itemType: 'resource', moduleId: firstModule.id });
//                 } else {
//                     handleSelectItem({ ...firstModule.resources[0], itemType: 'resource', moduleId: firstModule.id });
//                 }
//             } else { setSelectedItem(null); }
//             if (firstModule) setExpandedModules(prev => ({ ...prev, [firstModule.id]: true }));
//         } else if (!initialItemFound) { setSelectedItem(null); }


//         if (session?.user?.id && courseIdToLoad) {
//           const initialCompleted = await fetchItemProgress(courseIdToLoad, session.user.id);
//           setCompletedItems(initialCompleted);
//           updateCourseProgress(processedCourseData as Course, initialCompleted);
//         } else {
//           setCompletedItems({});
//           updateCourseProgress(processedCourseData as Course, {});
//         }

//       } catch (error: any) {
//         console.error('[SCC] Error loading course/progress:', error);
//         setError(error.message || 'Failed to load course content');
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (params.courseId) {
//       if (session !== undefined) {
//          loadCourseAndProgress();
//       }
//     } else {
//       setError('Course ID not provided.');
//       setLoading(false);
//     }
//   }, [params.courseId, session, fetchItemProgress, updateCourseProgress, params.initialItemId, params.initialItemType, params.initialModuleId]);


//   const completedItemsRef = useRef(completedItems);
//   useEffect(() => {
//     completedItemsRef.current = completedItems;
//   }, [completedItems]);

//   useFocusEffect(
//     useCallback(() => {
//       let isActive = true;
//       const checkPendingCompletions = async () => {
//         if (course && course.modules && session?.user?.id && isActive) {
//           let madeChanges = false;
//           let currentSnapshot = { ...completedItemsRef.current };

//           for (const module of course.modules) {
//             // Check lessons
//             if (module.lessons) {
//               for (const lesson of module.lessons) {
//                 const itemIdStr = String(lesson.id);
//                 const storageKey = `${ASYNC_STORAGE_COMPLETION_PREFIX}${course.id}_${itemIdStr}`;
//                 if (!currentSnapshot[itemIdStr]) {
//                   const flag = await AsyncStorage.getItem(storageKey);
//                   if (flag === 'true') {
//                     console.log(`[SCC Focus] Found completion flag for lesson ${itemIdStr}.`);
//                     currentSnapshot[itemIdStr] = true;
//                     madeChanges = true;
//                     if (session?.user && course?.id && module.id) {
//                         markItemAsCompleted(itemIdStr, module.id, 'lesson');
//                     }
//                     await AsyncStorage.removeItem(storageKey);
//                   }
//                 }
//               }
//             }
//             // Check module-level video resources
//             if (module.resources) {
//               for (const resource of module.resources) {
//                 if (resource.type === 'video') { // Only track video resources for now
//                   const itemIdStr = String(resource.id);
//                   const storageKey = `${ASYNC_STORAGE_COMPLETION_PREFIX}${course.id}_${itemIdStr}`;
//                   if (!currentSnapshot[itemIdStr]) {
//                     const flag = await AsyncStorage.getItem(storageKey);
//                     if (flag === 'true') {
//                       console.log(`[SCC Focus] Found completion flag for module video resource ${itemIdStr}.`);
//                       currentSnapshot[itemIdStr] = true;
//                       madeChanges = true;
//                       if (session?.user && course?.id && module.id) {
//                           markItemAsCompleted(itemIdStr, module.id, 'resource');
//                       }
//                       await AsyncStorage.removeItem(storageKey);
//                     }
//                   }
//                 }
//               }
//             }
//           }
//           if (madeChanges && isActive) {
//             console.log("[SCC Focus] Updating local completedItems and course progress due to flags.");
//             setCompletedItems(currentSnapshot);
//             updateCourseProgress(course, currentSnapshot);
//           }
//         }
//       };

//       checkPendingCompletions();
      
//       return () => {
//         isActive = false;
//       };
//     }, [course, session?.user?.id, updateCourseProgress, markItemAsCompleted])
//   );


//   const toggleModule = (moduleId: string) => {
//     setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
//   };

//   const handleSelectItem = (item: SelectableItem) => {
//     console.log("[SCC] handleSelectItem:", item);
//     setSelectedItem(item);
//     setCurrentResourceForPdfViewer(null);
//     setResourceViewerVisible(false);

//     if (item.itemType === 'lesson') {
//       if (item.type === 'text' || item.type === 'key_elements_article') {
//         markItemAsCompleted(item.id, item.moduleId, 'lesson');
//       }
//     }
//     // For video/pdf lessons or module resources, completion is handled when content is viewed/finished
//   };
  
//   const handleNavigateToContentScreen = (itemToDisplay: SelectableItem) => {
//     if (!course) return;

//     let paramsForScreen: any = {
//         contentType: itemToDisplay.type,
//         contentTitle: itemToDisplay.title,
//         courseId: course.id,
//         itemId: String(itemToDisplay.id), // This is the ID of the lesson or module resource
//         itemType: itemToDisplay.itemType,
//         moduleId: itemToDisplay.moduleId, // Crucial for context and progress tracking
//     };

//     if (itemToDisplay.itemType === 'lesson') {
//         // If lesson itself IS the video/pdf (content field is a URL)
//         if ((itemToDisplay.type === 'video' || itemToDisplay.type === 'pdf') && typeof itemToDisplay.content === 'string' && itemToDisplay.content.startsWith('http')) {
//             paramsForScreen.contentUrl = itemToDisplay.content;
//             // For direct content URLs in lessons, resourceId can be same as itemId (lessonId)
//             paramsForScreen.resourceId = String(itemToDisplay.id); 
//         } 
//         // If lesson HAS resources, and the lesson type implies it needs a primary resource (video/pdf)
//         else if ((itemToDisplay.type === 'video' || itemToDisplay.type === 'pdf') && itemToDisplay.resources && itemToDisplay.resources.length > 0) {
//             const primaryResource = itemToDisplay.resources.find(r => r.type === itemToDisplay.type) || itemToDisplay.resources[0];
//             paramsForScreen.contentUrl = primaryResource.url;
//             paramsForScreen.contentType = primaryResource.type; // Use resource's type
//             paramsForScreen.contentTitle = primaryResource.title; // Use resource's title
//             paramsForScreen.resourceId = primaryResource.resource_id || String(primaryResource.id);
//         } else if (itemToDisplay.type !== 'text' && itemToDisplay.type !== 'key_elements_article') {
//             // This lesson type might need a resource but doesn't have one or a direct content URL
//              Alert.alert("Content Missing", `This ${itemToDisplay.type} lesson does not have associated content to display.`);
//              return;
//         }
//         // For 'text' or 'key_elements_article', they are rendered directly, no navigation to ContentDisplayScreen for them
//     } else if (itemToDisplay.itemType === 'resource') { // Module-level resource
//         paramsForScreen.contentUrl = itemToDisplay.url;
//         paramsForScreen.resourceId = itemToDisplay.resource_id || String(itemToDisplay.id);
//     }

//     // If we intend to navigate but don't have a URL for displayable content types
//     if (!paramsForScreen.contentUrl && (paramsForScreen.contentType === 'video' || paramsForScreen.contentType === 'pdf' || paramsForScreen.contentType === 'link') ) {
//         Alert.alert("Content Error", `No URL found for this ${paramsForScreen.contentType}. Please check the course setup.`);
//         return;
//     }

//     router.push({
//       pathname: '/(screens)/ContentDisplayScreen',
//       params: paramsForScreen,
//     });
//   };

//   const handleContinue = () => {
//     if (!course || !selectedItem) return;

//     if (selectedItem.itemType === 'lesson' || (selectedItem.itemType === 'resource' && selectedItem.type === 'video')) {
//       markItemAsCompleted(selectedItem.id, selectedItem.moduleId, selectedItem.itemType);
//     }

//     let currentModuleIndex = course.modules.findIndex(m => m.id === selectedItem.moduleId);
//     if (currentModuleIndex === -1) return;

//     const currentModule = course.modules[currentModuleIndex];
//     let currentItemIndex = -1;
//     let currentListIsLessons = selectedItem.itemType === 'lesson';

//     if (currentListIsLessons) {
//         currentItemIndex = (currentModule.lessons || []).findIndex(it => it.id === selectedItem.id);
//         // Try to find next lesson in current module
//         if (currentItemIndex !== -1 && currentItemIndex < (currentModule.lessons || []).length - 1) {
//             const nextLesson = (currentModule.lessons || [])[currentItemIndex + 1];
//             handleSelectItem({ ...nextLesson, itemType: 'lesson', moduleId: currentModule.id });
//             return;
//         }
//         // If no more lessons, try first module-level video resource
//         const firstModuleVideoResource = (currentModule.resources || []).find(r => r.type === 'video');
//         if (firstModuleVideoResource) {
//             handleSelectItem({ ...firstModuleVideoResource, itemType: 'resource', moduleId: currentModule.id });
//             return;
//         }
//     } else { // Current item is a module-level video resource
//         const moduleVideoResources = (currentModule.resources || []).filter(r => r.type === 'video');
//         currentItemIndex = moduleVideoResources.findIndex(it => it.id === selectedItem.id);
//         if (currentItemIndex !== -1 && currentItemIndex < moduleVideoResources.length - 1) {
//             const nextModuleVideoResource = moduleVideoResources[currentItemIndex + 1];
//             handleSelectItem({ ...nextModuleVideoResource, itemType: 'resource', moduleId: currentModule.id });
//             return;
//         }
//     }

//     // Move to the next module
//     currentModuleIndex++;
//     while (currentModuleIndex < course.modules.length) {
//       const nextModule = course.modules[currentModuleIndex];
//       setExpandedModules(prev => ({...prev, [String(nextModule.id)]: true })); // Expand next module

//       if (nextModule.lessons && nextModule.lessons.length > 0) {
//         handleSelectItem({ ...nextModule.lessons[0], itemType: 'lesson', moduleId: String(nextModule.id) });
//         return;
//       }
//       const firstNextModuleVideo = (nextModule.resources || []).find(r => r.type === 'video');
//       if (firstNextModuleVideo) {
//         handleSelectItem({ ...firstNextModuleVideo, itemType: 'resource', moduleId: String(nextModule.id) });
//         return;
//       }
//       currentModuleIndex++; // Skip module if it has no lessons or trackable resources
//     }

//     Alert.alert("Congratulations!", "You have completed all trackable content in this course.");
//   };
//   const getResourceDisplayIcon = (type: ResourceType['type']) => {
//     switch (type) {
//       case 'video': return <Video size={18} color={Colors.PRIMARY} style={styles.resourceIconStyle} />;
//       case 'pdf': return <FileText size={18} color={Colors.PRIMARY} style={styles.resourceIconStyle} />;
//       case 'link': return <LinkIcon size={18} color={Colors.PRIMARY} style={styles.resourceIconStyle} />;
//       default: return <BookOpen size={18} color={Colors.GRAY} style={styles.resourceIconStyle} />;
//     }
//   };
//   const renderLessonContent = () => {
//     if (!selectedItem) return <View style={styles.placeholderContainer}><Text style={styles.placeholderText}>Select an item from the sidebar to view its content.</Text></View>;
  
//     let itemTitle = selectedItem.title;
  
//     if (selectedItem.itemType === 'lesson') {
//       const lesson = selectedItem;
//       itemTitle = lesson.title;

//       if (lesson.type === 'key_elements_article') {
//         return <KeyElementsLessonDisplay lesson={lesson} />;
//       }
//       if (lesson.type === 'text') {
//         return (
//           <>
//             <Text style={styles.lessonTitleTextInContent}>{lesson.title}</Text>
//             <ScrollView style={styles.textContentScrollView} contentContainerStyle={styles.textContentContainer}>
//                 <Text style={styles.lessonContentText}>{lesson.content || "No textual content for this lesson."}</Text>
//             </ScrollView>
//           </>
//         );
//       }
      
//       // For lessons of type video or pdf that might have direct content or resources
//       if (lesson.type === 'video' || lesson.type === 'pdf') {
//         let resourceToDisplayForLesson: ResourceType | undefined;
//         if (typeof lesson.content === 'string' && lesson.content.startsWith('http')) { // Direct URL in content
//             resourceToDisplayForLesson = {
//                 id: String(lesson.id), title: lesson.title, type: lesson.type as 'video' | 'pdf', 
//                 url: lesson.content, resource_id: String(lesson.id) 
//             };
//         } else if (lesson.resources && lesson.resources.length > 0) { // Lesson has associated resources
//             resourceToDisplayForLesson = lesson.resources.find(r => r.type === lesson.type) || lesson.resources[0];
//         }

//         if (resourceToDisplayForLesson) {
//             const buttonTitle = resourceToDisplayForLesson.type === 'video' ? 'Play Video' 
//                               : resourceToDisplayForLesson.type === 'pdf' ? 'View PDF' : 'Open Content';
//             const ButtonIcon = resourceToDisplayForLesson.type === 'video' ? Play 
//                              : resourceToDisplayForLesson.type === 'pdf' ? FileText : LinkIcon;
            
//             const onPressAction = () => {
//                 if (resourceToDisplayForLesson?.type === 'pdf') {
//                     setCurrentResourceForPdfViewer(resourceToDisplayForLesson);
//                     setResourceViewerVisible(true);
//                 } else { // Video or other types handled by ContentDisplayScreen
//                     handleNavigateToContentScreen(selectedItem);
//                 }
//             };

//             return (
//                 <View style={styles.centeredContent}>
//                   <Text style={styles.lessonTitleTextInContent}>{itemTitle}</Text>
//                   {/* Show lesson content if it's not just a URL placeholder for video/pdf */}
//                   {(typeof lesson.content === 'string' && !lesson.content.startsWith('http') && lesson.content.trim() !== '') && (
//                      <ScrollView style={styles.textContentScrollViewShort} contentContainerStyle={styles.textContentContainer}>
//                         <Text style={styles.lessonContentText}>{lesson.content}</Text>
//                      </ScrollView>
//                   )}
//                   <Text style={styles.resourceInfoText}>
//                     This lesson includes a {resourceToDisplayForLesson.type}. Click below to access it.
//                   </Text>
//                   <TouchableOpacity onPress={onPressAction} style={styles.viewContentButton}>
//                     <ButtonIcon size={20} color={Colors.WHITE} />
//                     <Text style={styles.viewContentButtonText}>{buttonTitle}</Text>
//                   </TouchableOpacity>
//                 </View>
//               );
//         } else {
//             // Lesson is video/pdf but no URL in content and no resources
//             return (
//                 <>
//                   <Text style={styles.lessonTitleTextInContent}>{lesson.title}</Text>
//                   <View style={styles.placeholderContainer}><Text style={styles.placeholderText}>No content available for this {lesson.type} lesson.</Text></View>
//                 </>
//             );
//         }
//       }
//       // Fallback for other unhandled lesson types
//       return (
//         <>
//           <Text style={styles.lessonTitleTextInContent}>{lesson.title}</Text>
//           <ScrollView style={styles.textContentScrollView} contentContainerStyle={styles.textContentContainer}>
//             <Text style={styles.lessonContentText}>{lesson.content || `Content for this ${lesson.type} lesson will be shown here.`}</Text>
//           </ScrollView>
//         </>
//       );
//     } 
//     // Handle Module-Level Resources
//     else if (selectedItem.itemType === 'resource') {
//         const resource = selectedItem;
//         itemTitle = resource.title;

//         if (resource.type === 'video' || resource.type === 'pdf' || resource.type === 'link') {
//             const buttonTitle = resource.type === 'video' ? 'Play Video' 
//                               : resource.type === 'pdf' ? 'View PDF' : 'Open Link';
//             const ButtonIcon = resource.type === 'video' ? Play 
//                              : resource.type === 'pdf' ? FileText : LinkIcon;
            
//             const onPressAction = () => {
//                 if (resource.type === 'pdf') {
//                     setCurrentResourceForPdfViewer(resource);
//                     setResourceViewerVisible(true);
//                 } else { 
//                     handleNavigateToContentScreen(selectedItem);
//                 }
//             };

//             return (
//                 <View style={styles.centeredContent}>
//                   <Text style={styles.lessonTitleTextInContent}>{itemTitle}</Text>
//                   <Text style={styles.resourceInfoText}>
//                     This is a module-level {resource.type}. Click below to access it.
//                   </Text>
//                   <TouchableOpacity onPress={onPressAction} style={styles.viewContentButton}>
//                     <ButtonIcon size={20} color={Colors.WHITE} />
//                     <Text style={styles.viewContentButtonText}>{buttonTitle}</Text>
//                   </TouchableOpacity>
//                 </View>
//               );
//         }
//     }
    
//     return <View style={styles.placeholderContainer}><Text style={styles.placeholderText}>Content for "{itemTitle}" will be displayed here.</Text></View>;
//   };

//   if (loading) { return <View style={styles.centerContainer}><ActivityIndicator size="large" color={Colors.PRIMARY} /></View>; }
//   if (error) { return <View style={styles.centerContainer}><Text style={styles.errorText}>{error}</Text></View>; }
//   if (!course) { return <View style={styles.centerContainer}><Text>Course data not found.</Text></View>; }
  
//   let currentModuleTitleForBreadcrumb = 'Module';
//   if (selectedItem?.moduleId && course?.modules) {
//     const mod = course.modules.find(m => m.id === selectedItem.moduleId);
//     if (mod) currentModuleTitleForBreadcrumb = mod.title;
//   }

//   // Toggle all items as completed or reset
//   const toggleAllCompletedDev = () => {
//     if (!course) return;
//     if (!devAllCompleted) {
//       // Mark all as completed
//       let allCompleted: Record<string, boolean> = {};
//       course.modules.forEach(module => {
//         if (module.lessons && Array.isArray(module.lessons)) {
//           module.lessons.forEach(lesson => {
//             allCompleted[String(lesson.id)] = true;
//           });
//         }
//         if (module.resources && Array.isArray(module.resources)) {
//           module.resources.forEach(resource => {
//             if (resource.type === 'video') {
//               allCompleted[String(resource.id)] = true;
//             }
//           });
//         }
//       });
//       setCompletedItems(allCompleted);
//       updateCourseProgress(course, allCompleted);
//       setDevAllCompleted(true);
//     } else {
//       // Reset all progress
//       setCompletedItems({});
//       updateCourseProgress(course, {});
//       setDevAllCompleted(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(screens)/Home')} style={styles.backButton}>
//           <ArrowLeft size={24} color={Colors.PRIMARY} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle} numberOfLines={1}>{course.title}</Text>
//       </View>

//       {/* Progress Bar Section */}
//       <View style={{padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff'}}>
//         <Text style={{fontSize: 14, color: '#555', marginBottom: 6}}>{courseProgress}% Complete</Text>
//         <View style={{flexDirection: 'row', alignItems: 'center'}}>
//           <View style={{flex: 1}}>
//             <View style={{height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden'}}>
//               <View style={{height: 8, width: `${courseProgress}%`, backgroundColor: '#28a745', borderRadius: 4}} />
//             </View>
//           </View>
//         </View>
//         {savingCompletion && (
//           <Text style={{color: '#888', marginTop: 6}}>Saving completion status...</Text>
//         )}
//         {certificateAvailable && (
//           <Text style={{color: 'green', marginTop: 6, fontWeight: 'bold'}}>Course marked as completed! Your certificate will be available in Certificates.</Text>
//         )}
//         {course && (
//           <TouchableOpacity style={{backgroundColor: '#28a745', padding: 10, marginTop: 10, borderRadius: 8}} onPress={toggleAllCompletedDev}>
//             <Text style={{color: 'white', textAlign: 'center', fontWeight: 'bold'}}>
//               {devAllCompleted ? 'Reset All Progress' : 'Mark All Completed'}
//             </Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       <View style={styles.body}>
//         <View style={styles.sidebar}>
//           <ScrollView contentContainerStyle={styles.sidebarScrollViewContent}>
//             {course.modules.length === 0 && (
//               <Text style={styles.noModulesText}>No modules available for this course.</Text>
//             )}
//             {course.modules.map((moduleItem) => (
//               <View key={String(moduleItem.id)} style={styles.moduleEntry}>
//                 <TouchableOpacity onPress={() => toggleModule(String(moduleItem.id))} style={styles.moduleHeader}>
//                   <Text style={styles.moduleTitle} numberOfLines={2}>{moduleItem.title}</Text>
//                   {expandedModules[String(moduleItem.id)] ? <ChevronUp size={18} color={Colors.GRAY} /> : <ChevronDown size={18} color={Colors.GRAY} />}
//                 </TouchableOpacity>
//                 {expandedModules[String(moduleItem.id)] && (
//                   <View style={styles.itemsContainer}>
//                     {(!moduleItem.lessons || moduleItem.lessons.length === 0) && (!moduleItem.resources || moduleItem.resources.length === 0) && (
//                       <Text style={styles.noLessonsText}>No content in this module.</Text>
//                     )}
//                     {/* Render Module-Level Resources */} 
//                     {/* Render Lessons */}
//                     {moduleItem.lessons?.map((lesson) => (
//                       <TouchableOpacity
//                         key={`lesson-${String(lesson.id)}`}
//                         style={[
//                             styles.itemRow,
//                             selectedItem?.itemType === 'lesson' && selectedItem.id === lesson.id && styles.selectedItemRow,
//                             completedItems[String(lesson.id)] && styles.completedItemRow
//                         ]}
//                         onPress={() => handleSelectItem({ ...lesson, itemType: 'lesson', moduleId: String(moduleItem.id) })}
//                       >
//                         {completedItems[String(lesson.id)] ? <CheckCircle size={16} color={Colors.SUCCESS} style={styles.itemIcon} /> : <BookOpen size={16} color={Colors.GRAY} style={styles.itemIcon} />}
//                         <Text
//                           style={[
//                               styles.itemText,
//                               selectedItem?.itemType === 'lesson' && selectedItem.id === lesson.id && styles.selectedItemText,
//                               completedItems[String(lesson.id)] && styles.completedItemText
//                           ]}
//                           numberOfLines={2}
//                         >
//                           {lesson.title}
//                         </Text>
//                       </TouchableOpacity>
//                     ))}
//                     {/* Render Module-level Video Resources */}
//                     {moduleItem.resources?.map((resource) => (
//     <TouchableOpacity
//     key={`resource-${String(resource.id)}`}
//     style={[ styles.itemRow, styles.resourceSidebarItem, 
//                 selectedItem?.itemType === 'resource' && selectedItem.id === resource.id && styles.selectedItemRow,
//                 completedItems[String(resource.id)] && styles.completedItemRow
//             ]}
//     onPress={() => handleSelectItem({ ...resource, itemType: 'resource', moduleId: String(moduleItem.id) })}
//     >
//     {completedItems[String(resource.id)] 
//         ? <CheckCircle size={16} color={Colors.SUCCESS} style={styles.itemIcon} /> 
//         : getResourceDisplayIcon(resource.type) // Use dynamic icon based on resource type
//     }
//     <Text
//         style={[ styles.itemText, 
//                     selectedItem?.itemType === 'resource' && selectedItem.id === resource.id && styles.selectedItemText,
//                     completedItems[String(resource.id)] && styles.completedItemText
//                 ]}
//         numberOfLines={2}
//     >
//         {resource.title}
//     </Text>
//     </TouchableOpacity>
//                     ))}
//                   </View>
//                 )}
//               </View>
//             ))}
//           </ScrollView>
//         </View>

//         <View style={styles.mainContent}>
//           {selectedItem && (
//             <View style={styles.breadcrumbContainer}>
//                 <Text style={styles.breadcrumbText} numberOfLines={1}>
//                     {currentModuleTitleForBreadcrumb} <Text style={styles.breadcrumbSeparator}>›</Text> {selectedItem.title}
//                 </Text>
//             </View>
//           )}
//           <View style={styles.lessonContentWrapper}>
//             {renderLessonContent()}
//           </View>
//           {selectedItem && (
//             <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
//               <Text style={styles.continueButtonText}>Continue</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//         {currentResourceForPdfViewer && resourceViewerVisible && course && (
//             <ResourceViewer
//               resourceUrl={currentResourceForPdfViewer.url}
//               resourceType="pdf"
//               resourceTitle={currentResourceForPdfViewer.title}
//               isVisible={resourceViewerVisible}
//               onClose={() => {
//                 setResourceViewerVisible(false);
//                  if (selectedItem?.itemType === 'resource' && selectedItem.type === 'pdf' && course?.id && selectedItem.id && selectedItem.moduleId) {
//                     markItemAsCompleted(selectedItem.id, selectedItem.moduleId, 'resource');
//                 }
//               }}
//               courseId={course.id}
//               lessonId={selectedItem?.itemType === 'lesson' ? String(selectedItem.id) : undefined}
//               resourceId={currentResourceForPdfViewer.resource_id || String(currentResourceForPdfViewer.id)}
//               onPdfViewed={() => { // This prop needs to be added to ResourceViewer if not present
//                  if (selectedItem?.itemType === 'resource' && selectedItem.type === 'pdf' && course?.id && selectedItem.id && selectedItem.moduleId) {
//                     markItemAsCompleted(selectedItem.id, selectedItem.moduleId, 'resource');
//                 }
//               }}
//             />
//         )}
//     </SafeAreaView>
//   );
// };

// // Styles (mostly unchanged, check diff for minor adjustments)
// const styles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: Colors.WHITE },
//   header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: Colors.WHITE, },
//   backButton: { padding: 6, marginRight: 10 },
//   headerTitle: { fontSize: Platform.OS === 'web' ? 20 : 18, fontWeight: '600', color: Colors.BLACK, flex: 1 },
//   body: { flexDirection: 'row', flex: 1 },
//   sidebar: { width: SIDEBAR_WIDTH, backgroundColor: '#f7f7f7', borderRightWidth: 1, borderRightColor: '#cccccc', },
//   sidebarScrollViewContent: { paddingBottom: 20, },
//   moduleEntry: { borderBottomWidth: 1, borderBottomColor: '#dddddd', },
//   moduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#f0f0f0', },
//   moduleTitle: { fontSize: Platform.OS === 'web' ? 14 : 15, fontWeight: 'bold', color: Colors.BLACK, flex: 1, marginRight: 8 },
//   itemsContainer: { backgroundColor: Colors.WHITE, },
//   itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', },
//   completedItemRow: { backgroundColor: '#e6ffeeAA', /* Semi-transparent green */ },
//   resourceSidebarItem: { /* Can add specific styling if needed */ },
//   selectedItemRow: { backgroundColor: Colors.PRIMARY, borderLeftWidth: 4, borderLeftColor: Colors.PRIMARY, paddingLeft: 12, },
//   itemIcon: { marginRight: 10, /* Default color handled by completed/not-completed logic */ },
//   itemText: { fontSize: Platform.OS === 'web' ? 13 : 14, color: '#333333', flex: 1 },
//   selectedItemText: { color: Colors.WHITE, fontWeight: '600' }, // White text for selected item
//   completedItemText: { color: Colors.SUCCESS, /* fontWeight: '500' */ }, // Keep original color, maybe slightly bolder
//   mainContent: { flex: 1, flexDirection: 'column', backgroundColor: '#ffffff', },
//   breadcrumbContainer: { paddingHorizontal: Platform.OS === 'web' ? 24 : 20, paddingVertical: Platform.OS === 'web' ? 14 : 12, backgroundColor: '#f8f9fa', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', flexDirection: 'row', alignItems: 'center', },
//   breadcrumbText: { fontSize: Platform.OS === 'web' ? 14 : 13, color: Colors.GRAY, fontWeight: '500', },
//   breadcrumbSeparator: { marginHorizontal: 4, color: Colors.GRAY, fontSize: Platform.OS === 'web' ? 14 : 13, },
//   lessonContentWrapper: { flex: 1, },
//   placeholderContainer: { flex:1, justifyContent: 'center', alignItems: 'center', padding: 20, },
//   placeholderText: { textAlign: 'center', fontSize: 17, color: Colors.GRAY, lineHeight: 24, },
//   continueButton: { backgroundColor: Colors.PRIMARY, paddingVertical: Platform.OS === 'web' ? 16 : 14, alignItems: 'center', marginHorizontal: Platform.OS === 'web' ? 24 : 20, marginBottom: Platform.OS === 'web' ? 24 : 20, borderRadius: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, },
//   continueButtonText: { color: Colors.WHITE, fontSize: 16, fontWeight: 'bold' },
//   centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: Colors.WHITE },
//   errorText: { color: Colors.ERROR, fontSize: 16, textAlign: 'center' },
//   lessonTitleTextInContent: { fontSize: Platform.OS === 'web' ? 22 : 20, fontWeight: 'bold', marginBottom: 16, color: Colors.BLACK, paddingHorizontal: Platform.OS === 'web' ? 24 : 20, paddingTop: Platform.OS === 'web' ? 24 : 20, },
//   lessonContentText: { fontSize: Platform.OS === 'web' ? 16 : 15, lineHeight: Platform.OS === 'web' ? 28 : 26, color: '#333333' },
//   textContentScrollView: { flex: 1, },
//   textContentScrollViewShort: { maxHeight: 150, marginBottom: 10, },
//   textContentContainer: { paddingHorizontal: Platform.OS === 'web' ? 24 : 20, paddingBottom: 16, },
//   viewContentButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.PRIMARY, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginTop: 20, alignSelf: 'center', },
//   viewContentButtonText: { color: Colors.WHITE, marginLeft: 10, fontWeight: 'bold', fontSize: 16, },
//   resourceInfoText: { fontSize: 15, color: Colors.GRAY, textAlign: 'center', marginBottom: 16, paddingHorizontal: 20, },
//   centeredContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, },
//   noModulesText: { padding: 20, textAlign: 'center', color: Colors.GRAY, fontSize: 15, fontStyle: 'italic', },
//   noLessonsText: { paddingVertical: 12, paddingHorizontal: 16, color: Colors.GRAY, fontSize: 14, fontStyle: 'italic', },
//   resourceIconStyle: { // Style for resource icons
//     marginRight: 8,
//   },
// });

// export default StudentCourseContentScreen;


// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
//   Dimensions,
//   Platform,
//   Alert
// } from 'react-native';
// import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
// import { Course, Module as CourseModule, Lesson, Resource as ResourceType, Assessment } from '../../types/courses';
// import Colors from '../../constant/Colors';
// import { ArrowLeft, CheckCircle, ChevronDown, ChevronUp, FileText, Play, Link as LinkIcon, BookOpen, Video, Award, MessageSquare } from 'lucide-react-native';
// import KeyElementsLessonDisplay from '../../component/courses/KeyElementsLessonDisplay';
// import { useAuth } from '../../Context/auth';
// import { supabase } from '../../lib/Superbase';
// import { SafeAreaView } from 'react-native-safe-area-context';

// const { width } = Dimensions.get('window');
// const SIDEBAR_WIDTH = Platform.OS === 'web'
//     ? (width * 0.28 > 300 ? 300 : Math.max(200, width * 0.28))
//     : (width * 0.38 > 280 ? 280 : Math.max(150, width * 0.38));

// type SelectableItem =
//   | (Lesson & { itemType: 'lesson'; moduleId: string; })
//   | (ResourceType & { itemType: 'resource'; moduleId: string; });

// const StudentCourseContentScreen: React.FC = () => {
//   const router = useRouter();
//   const params = useLocalSearchParams<{ 
//     courseId?: string; 
//     initialItemId?: string; 
//     initialItemType?: 'lesson' | 'resource';
//     initialModuleId?: string;
//   }>();

//   const [course, setCourse] = useState<Course | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedItem, setSelectedItem] = useState<SelectableItem | null>(null);
//   const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
//   const { session } = useAuth();
  
  
//   useEffect(() => {
//     const loadCourseAndProgress = async () => {
//       const courseIdToLoad = params.courseId;
//       if (!courseIdToLoad) { setError('Course ID not provided.'); setLoading(false); return; }
//       try {
//         setLoading(true); setError(null);
//         const { data: courseData, error: courseError } = await supabase.from('courses').select('*').eq('id', courseIdToLoad).single();
//         if (courseError) throw courseError; if (!courseData) throw new Error('Course not found.');
//         const { data: modulesData, error: modulesError } = await supabase.from('modules').select('*').eq('course_id', courseIdToLoad).order('order', { ascending: true });
//         if (modulesError) throw modulesError;
//         const enrichedModules = await Promise.all(
//           (modulesData || []).map(async (module) => {
//             const [lessonsRes, resourcesRes, assessmentsRes] = await Promise.all([
//               supabase.from('lessons').select('*').eq('module_id', module.id),
//               supabase.from('course_resources').select('*').eq('module_id', module.id),
//               supabase.from('assessments').select('*').eq('module_id', module.id).eq('is_published', true)
//             ]);
//             return { ...module, lessons: lessonsRes.data || [], resources: resourcesRes.data || [], assessments: assessmentsRes.data || [] };
//           })
//         );
//         const processedCourseData = { ...courseData, modules: enrichedModules };
//         setCourse(processedCourseData as Course);
//         // Set initial selected item and expand module
//         if (processedCourseData.modules?.[0]?.lessons?.[0]) {
//             setSelectedItem({ ...processedCourseData.modules[0].lessons[0], itemType: 'lesson', moduleId: processedCourseData.modules[0].id });
//             setExpandedModules({ [processedCourseData.modules[0].id]: true });
//         }

//       } catch (error: any) {
//         setError(error.message || 'Failed to load course content');
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (params.courseId && session !== undefined) {
//       loadCourseAndProgress();
//     }
//   }, [params.courseId, session]);

//   const handleSelectItem = (item: SelectableItem) => {
//     setSelectedItem(item);
//   };

//   const handleTakeAssessment = (assessment: Assessment) => {
//     router.push({ 
//         pathname: '/(screens)/Courses_Section/QuizScoresScreen', 
//         params: { assessmentId: assessment.id, moduleId: assessment.module_id } 
//     });
//   };

//   const renderLessonContent = (): React.ReactNode => {
//     if (!selectedItem) return <View style={styles.placeholderContainer}><Text style={styles.placeholderText}>Select an item to begin.</Text></View>;
    
//     if (selectedItem.itemType === 'lesson') {
//       const lesson = selectedItem;
//       if (lesson.type === 'key_elements_article') return <KeyElementsLessonDisplay lesson={lesson} />;
//       if (lesson.type === 'text') return ( <ScrollView contentContainerStyle={styles.contentPadding}><Text style={styles.lessonTitleTextInContent}>{lesson.title}</Text><Text style={styles.lessonContentText}>{lesson.content || "..."}</Text></ScrollView> );
//       return <View style={styles.centeredContent}><Text style={styles.lessonTitleTextInContent}>{lesson.title}</Text><Text style={styles.resourceInfoText}>This is a {lesson.type} item. Please check its resources.</Text></View>;
//     }
//     return <View style={styles.placeholderContainer}><Text style={styles.placeholderText}>Content will appear here.</Text></View>;
//   };
  
//   if (loading || !course) { return <View style={styles.centerContainer}><ActivityIndicator size="large" color={Colors.PRIMARY} /></View>; }
//   if (error) { return <View style={styles.centerContainer}><Text style={styles.errorText}>{error}</Text></View>; }

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(screens)/Home')} style={styles.backButton}>
//           <ArrowLeft size={24} color={Colors.PRIMARY} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle} numberOfLines={1}>{course.title}</Text>
//       </View>
//       <View style={styles.body}>
//         <View style={styles.sidebar}>
//           <ScrollView contentContainerStyle={styles.sidebarScrollViewContent}>
//             {course.modules.map((moduleItem) => (
//               <View key={String(moduleItem.id)} style={styles.moduleEntry}>
//                 <TouchableOpacity onPress={() => setExpandedModules(p => ({ ...p, [String(moduleItem.id)]: !p[String(moduleItem.id)] }))} style={styles.moduleHeader}>
//                   <Text style={styles.moduleTitle} numberOfLines={2}>{moduleItem.title}</Text>
//                   {expandedModules[String(moduleItem.id)] ? <ChevronUp size={18} color={Colors.GRAY} /> : <ChevronDown size={18} color={Colors.GRAY} />}
//                 </TouchableOpacity>
//                 {expandedModules[String(moduleItem.id)] && (
//                   <View style={styles.itemsContainer}>
//                     {moduleItem.lessons?.map((lesson) => (
//                       <TouchableOpacity
//                         key={`lesson-${String(lesson.id)}`}
//                         style={[styles.itemRow, selectedItem?.itemType === 'lesson' && selectedItem.id === lesson.id && styles.selectedItemRow]}
//                         onPress={() => handleSelectItem({ ...lesson, itemType: 'lesson', moduleId: String(moduleItem.id) })}>
//                         <BookOpen size={16} color={Colors.GRAY} style={styles.itemIcon} />
//                         <Text style={[styles.itemText, selectedItem?.itemType === 'lesson' && selectedItem.id === lesson.id && styles.selectedItemText]} numberOfLines={2}>{lesson.title}</Text>
//                       </TouchableOpacity>
//                     ))}
//                     {moduleItem.assessments?.map((assessment: Assessment) => (
//                       <TouchableOpacity
//                         key={`assessment-${String(assessment.id)}`}
//                         style={styles.itemRow}
//                         onPress={() => handleTakeAssessment(assessment)}>
//                         <Award size={16} color={Colors.GRAY} style={styles.itemIcon} />
//                         <Text style={styles.itemText} numberOfLines={2}>Quiz: {assessment.title}</Text>
//                       </TouchableOpacity>
//                     ))}
//                     {moduleItem.discussion_enabled && (
//                         <TouchableOpacity
//                             key={`forum-${String(moduleItem.id)}`}
//                             style={styles.itemRow}
//                             onPress={() => router.push({ 
//                                 pathname: '/(screens)/Courses_Section/DiscussionForumScreen', 
//                                 params: { courseId: course.id, moduleId: moduleItem.id } 
//                             })}
//                         >
//                             <MessageSquare size={16} color={Colors.GRAY} style={styles.itemIcon} />
//                             <Text style={styles.itemText} numberOfLines={2}>
//                                 Discussion Forum
//                             </Text>
//                         </TouchableOpacity>
//                     )}
//                   </View>
//                 )}
//               </View>
//             ))}
//           </ScrollView>
//         </View>
//         <View style={styles.mainContent}>
//           {renderLessonContent()}
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: Colors.WHITE },
//   header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
//   backButton: { padding: 6, marginRight: 10 },
//   headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.BLACK, flex: 1 },
//   body: { flexDirection: 'row', flex: 1 },
//   sidebar: { width: SIDEBAR_WIDTH, backgroundColor: '#f7f7f7', borderRightWidth: 1, borderRightColor: '#cccccc' },
//   sidebarScrollViewContent: { paddingBottom: 20 },
//   moduleEntry: { borderBottomWidth: 1, borderBottomColor: '#dddddd' },
//   moduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#f0f0f0' },
//   moduleTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.BLACK, flex: 1, marginRight: 8 },
//   itemsContainer: { backgroundColor: Colors.WHITE },
//   itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
//   selectedItemRow: { backgroundColor: Colors.PRIMARY_LIGHT, borderLeftWidth: 4, borderLeftColor: Colors.PRIMARY, paddingLeft: 12 },
//   itemIcon: { marginRight: 10 },
//   itemText: { fontSize: 14, color: '#333333', flex: 1 },
//   selectedItemText: { color: Colors.PRIMARY, fontWeight: '600' },
//   mainContent: { flex: 1, flexDirection: 'column', backgroundColor: '#ffffff' },
//   placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
//   placeholderText: { textAlign: 'center', fontSize: 17, color: Colors.GRAY, lineHeight: 24 },
//   centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
//   errorText: { color: Colors.ERROR, fontSize: 16, textAlign: 'center' },
//   lessonTitleTextInContent: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: Colors.BLACK },
//   lessonContentText: { fontSize: 16, lineHeight: 26, color: '#333' },
//   contentPadding: { padding: 20 },
//   centeredContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
//   resourceInfoText: { fontSize: 15, color: Colors.GRAY, textAlign: 'center', marginBottom: 16 },
// });

// export default StudentCourseContentScreen;

// D:/LynkTT/React-Native/app/(screens)/StudentCourseContent.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Course, Module as CourseModule, Lesson, Resource as ResourceType, Assessment } from '../../types/courses';
import Colors from '../../constant/Colors';
import { ArrowLeft, CheckCircle, ChevronDown, ChevronUp, FileText, Play, Link as LinkIcon, BookOpen, Video, Award, MessageSquare } from 'lucide-react-native';
import KeyElementsLessonDisplay from '../../component/courses/KeyElementsLessonDisplay';
import { useAuth } from '../../Context/auth';
import { supabase } from '../../lib/Superbase';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Platform.OS === 'web'
    ? (width * 0.28 > 300 ? 300 : Math.max(200, width * 0.28))
    : (width * 0.38 > 280 ? 280 : Math.max(150, width * 0.38));

type SelectableItem =
  | (Lesson & { itemType: 'lesson'; moduleId: string; });

const StudentCourseContentScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId?: string; }>();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectableItem | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const { session } = useAuth();
  
  const loadCourseData = useCallback(async () => {
    const courseIdToLoad = params.courseId;
    if (!courseIdToLoad) {
      setError('Course ID not provided.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseIdToLoad)
        .single();
      
      if (courseError) throw courseError;
      if (!courseData) throw new Error('Course not found.');

      const rawModules = courseData.modules;
      let parsedModules: CourseModule[] = (typeof rawModules === 'string' 
        ? JSON.parse(rawModules) 
        : Array.isArray(rawModules) ? rawModules : []);
      
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select('*')
        .eq('course_id', courseIdToLoad)
        .eq('is_published', true);

      if (assessmentsError) throw assessmentsError;

      if (assessmentsData && assessmentsData.length > 0) {
        parsedModules = parsedModules.map(module => {
          return {
            ...module,
            assessments: assessmentsData.filter(assessment => assessment.module_id === module.id)
          };
        });
      }
      
      const processedCourseData = { ...courseData, modules: parsedModules };
      setCourse(processedCourseData as Course);
      
      if (parsedModules?.[0]?.lessons?.[0]) {
        setSelectedItem({
          ...parsedModules[0].lessons[0],
          itemType: 'lesson',
          moduleId: parsedModules[0].id
        });
        setExpandedModules({ [parsedModules[0].id]: true });
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to load course content.');
    } finally {
      setLoading(false);
    }
  }, [params.courseId]);
  
  useFocusEffect(
    useCallback(() => {
      loadCourseData();
    }, [loadCourseData])
  );

  const handleSelectItem = (item: SelectableItem) => {
    if (item.itemType === 'lesson' && (item.type === 'video' || item.type === 'pdf')) {
        if (!item.content) {
            Alert.alert("Content Missing", "The URL for this lesson is not available.");
            return;
        }
        router.push({
            pathname: '/(screens)/ContentDisplayScreen',
            params: {
                contentUrl: item.content,
                contentType: item.type,
                contentTitle: item.title,
                courseId: course?.id,
                itemId: String(item.id),
                itemType: 'lesson',
                moduleId: item.moduleId,
            }
        });
    } else {
        setSelectedItem(item);
    }
  };

  // --- THIS IS THE FIX ---
  // The function now correctly accepts two arguments as expected.
  const handleTakeAssessment = (assessment: Assessment, moduleId: string) => {
    router.push({ 
        pathname: '/(screens)/Courses_Section/QuizScoresScreen', 
        params: { assessmentId: assessment.id, moduleId: moduleId } 
    });
  };
  // --- END OF FIX ---

  const getLessonIcon = (type: string) => {
    switch(type) {
      case 'video': return <Video size={16} color={Colors.GRAY} style={styles.itemIcon} />;
      case 'pdf': return <FileText size={16} color={Colors.GRAY} style={styles.itemIcon} />;
      case 'quiz': return <Award size={16} color={Colors.GRAY} style={styles.itemIcon} />;
      case 'forum': return <MessageSquare size={16} color={Colors.GRAY} style={styles.itemIcon} />;
      default: return <BookOpen size={16} color={Colors.GRAY} style={styles.itemIcon} />;
    }
  };

  const renderLessonContent = (): React.ReactNode => {
    if (!selectedItem) return <View style={styles.placeholderContainer}><Text style={styles.placeholderText}>Select an item to begin.</Text></View>;
    
    if (selectedItem.itemType === 'lesson') {
      const lesson = selectedItem;
      if (lesson.type === 'key_elements_article') return <KeyElementsLessonDisplay lesson={lesson} />;
      if (lesson.type === 'text') {
        return (
          <ScrollView contentContainerStyle={styles.contentPadding}>
            <Text style={styles.lessonTitleTextInContent}>{lesson.title}</Text>
            <Text style={styles.lessonContentText}>{lesson.content || "This lesson has no text content."}</Text>
          </ScrollView>
        );
      }
      return (
        <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>This content will open in a dedicated viewer.</Text>
        </View>
      );
    }
    return <View style={styles.placeholderContainer}><Text style={styles.placeholderText}>Content will appear here.</Text></View>;
  };
  
  if (loading || !course) { return <View style={styles.centerContainer}><ActivityIndicator size="large" color={Colors.PRIMARY} /></View>; }
  if (error) { return <View style={styles.centerContainer}><Text style={styles.errorText}>{error}</Text></View>; }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(screens)/Home')} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{course.title}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.sidebar}>
          <ScrollView contentContainerStyle={styles.sidebarScrollViewContent}>
            {course.modules?.map((moduleItem) => (
              <View key={String(moduleItem.id)} style={styles.moduleEntry}>
                <TouchableOpacity onPress={() => setExpandedModules(p => ({ ...p, [String(moduleItem.id)]: !p[String(moduleItem.id)] }))} style={styles.moduleHeader}>
                  <Text style={styles.moduleTitle} numberOfLines={2}>{moduleItem.title}</Text>
                  {expandedModules[String(moduleItem.id)] ? <ChevronUp size={18} color={Colors.GRAY} /> : <ChevronDown size={18} color={Colors.GRAY} />}
                </TouchableOpacity>
                {expandedModules[String(moduleItem.id)] && (
                  <View style={styles.itemsContainer}>
                    {moduleItem.lessons?.map((lesson: Lesson) => (
                      <TouchableOpacity
                        key={`lesson-${String(lesson.id)}`}
                        style={[styles.itemRow, selectedItem?.itemType === 'lesson' && selectedItem.id === lesson.id && styles.selectedItemRow]}
                        onPress={() => handleSelectItem({ ...lesson, itemType: 'lesson', moduleId: String(moduleItem.id) })}>
                        {getLessonIcon(lesson.type)}
                        <Text style={[styles.itemText, selectedItem?.itemType === 'lesson' && selectedItem.id === lesson.id && styles.selectedItemText]} numberOfLines={2}>{lesson.title}</Text>
                      </TouchableOpacity>
                    ))}
                    
                    {moduleItem.assessments?.map((assessment: Assessment) => (
                      <TouchableOpacity
                        key={`assessment-${String(assessment.id)}`}
                        style={styles.itemRow}
                        onPress={() => handleTakeAssessment(assessment, String(moduleItem.id))}>
                        {getLessonIcon('quiz')}
                        <Text style={styles.itemText} numberOfLines={2}>Quiz: {assessment.title}</Text>
                      </TouchableOpacity>
                    ))}
                    
                    {moduleItem.discussion_enabled && (
                        <TouchableOpacity
                            key={`forum-${String(moduleItem.id)}`}
                            style={styles.itemRow}
                            onPress={() => router.push({ 
                                pathname: '/(screens)/Courses_Section/DiscussionForumScreen', 
                                params: { courseId: course.id, moduleId: moduleItem.id } 
                            })}
                        >
                            {getLessonIcon('forum')}
                            <Text style={styles.itemText} numberOfLines={2}>
                                Discussion Forum
                            </Text>
                        </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
        <View style={styles.mainContent}>
          {renderLessonContent()}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.WHITE },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  backButton: { padding: 6, marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.BLACK, flex: 1 },
  body: { flexDirection: 'row', flex: 1 },
  sidebar: { width: SIDEBAR_WIDTH, backgroundColor: '#f7f7f7', borderRightWidth: 1, borderRightColor: '#cccccc' },
  sidebarScrollViewContent: { paddingBottom: 20 },
  moduleEntry: { borderBottomWidth: 1, borderBottomColor: '#dddddd' },
  moduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#f0f0f0' },
  moduleTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.BLACK, flex: 1, marginRight: 8 },
  itemsContainer: { backgroundColor: Colors.WHITE },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  selectedItemRow: { backgroundColor: Colors.PRIMARY_LIGHT, borderLeftWidth: 4, borderLeftColor: Colors.PRIMARY, paddingLeft: 12 },
  itemIcon: { marginRight: 10 },
  itemText: { fontSize: 14, color: '#333333', flex: 1 },
  selectedItemText: { color: Colors.PRIMARY, fontWeight: '600' },
  mainContent: { flex: 1, flexDirection: 'column', backgroundColor: '#ffffff' },
  placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  placeholderText: { textAlign: 'center', fontSize: 17, color: Colors.GRAY, lineHeight: 24 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: Colors.ERROR, fontSize: 16, textAlign: 'center' },
  lessonTitleTextInContent: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: Colors.BLACK },
  lessonContentText: { fontSize: 16, lineHeight: 26, color: '#333' },
  contentPadding: { padding: 20 },
});

export default StudentCourseContentScreen;