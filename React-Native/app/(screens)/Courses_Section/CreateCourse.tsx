import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import CourseImageUpload from '../../../component/courses/CourseImageUpload';
import { supabase } from '../../../lib/Superbase';
import { useAuth } from '../../../Context/auth';
import { courseService } from '../../../lib/courseService';
import { ShowForCourseCreation } from '../../../component/RoleBasedUI';
import Colors from '../../../constant/Colors';

const { width } = Dimensions.get('window');
const isMobile = width < 700;

const CreateCourse = () => {
  const router = useRouter();

  return (
    <ShowForCourseCreation
      fallback={
        <View style={styles.container}>
          <Text style={styles.errorText}>⛔ Access Denied</Text>
          <Text style={styles.errorSubtext}>Only administrators can create courses.</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <CreateCourseContent />
    </ShowForCourseCreation>
  );
};

const CreateCourseContent = () => {
  const router = useRouter();
  const { session } = useAuth();
  
  const [name, setName] = useState('Beginners -Introduction to Physics');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [imageError, setImageError] = useState(null);
  const [status, setStatus] = useState('Published');
  const [level, setLevel] = useState('Beginner');
  const [university, setUniversity] = useState('Any');
  const [specialization, setSpecialization] = useState('Science');
  const [tags, setTags] = useState(['popularcourse', 'technology', 'tech']);
  const [tagInput, setTagInput] = useState('');
  const [price, setPrice] = useState('500');
  const [discount, setDiscount] = useState('10');
  const [final, setFinal] = useState('450');
  const [sections, setSections] = useState([
    {
      id: 'section-1',
      title: 'Week 1 - Introduction',
      lessons: [],
    },
    {
      id: 'section-2',
      title: 'Week 2 - Foundation',
      lessons: [
        { id: 'lesson-1', type: 'text', title: 'Read ...', duration: '4 min' },
        { id: 'lesson-2', type: 'video', title: 'Introduction to...', duration: '1 hr 20 min' },
        { id: 'lesson-3', type: 'video', title: 'Introduction to...', duration: '1 hr 20 min' },
        { id: 'lesson-4', type: 'video', title: 'Introduction to...', duration: '1 hr 20 min' },
        { id: 'lesson-5', type: 'quiz', title: 'Practice', duration: '5 Questions' },
        { id: 'lesson-6', type: 'quiz', title: 'Module 1', duration: '24 Questions' },
      ],
    },
    {
      id: 'section-3',
      title: 'Week 3 - Foundation',
      lessons: [],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);

  // Debug authentication status
  React.useEffect(() => {
    console.log('CreateCourse component loaded');
    console.log('Session:', session);
    console.log('User ID:', session?.user?.id);
    console.log('Is authenticated:', !!session?.user?.id);
  }, [session]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Section and lesson handlers
  const handleAddSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      title: `Week ${sections.length + 1} - New Section`,
      lessons: []
    };
    setSections([...sections, newSection]);
  };

  const handleUpdateSectionTitle = (sectionId, newTitle) => {
    setSections(sections.map(section =>
      section.id === sectionId ? { ...section, title: newTitle } : section
    ));
  };

  const handleDeleteSection = (sectionId) => {
    Alert.alert('Delete Section', 'Are you sure you want to delete this section?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setSections(sections.filter(s => s.id !== sectionId)) }
    ]);
  };

  const handleAddLesson = (sectionId) => {
    const newLesson = {
      id: `lesson-${Date.now()}`,
      title: 'New Lesson',
      content: '',
      type: 'text',
      duration: '0',
      order: 0,
      resources: [],
      discussionEnabled: false,
      moduleId: sectionId
    };
    setSections(sections.map(section =>
      section.id === sectionId ? { ...section, lessons: [...section.lessons, newLesson] } : section
    ));
  };

  const handleUpdateLesson = (sectionId, lessonId, updates) => {
    setSections(sections.map(section =>
      section.id === sectionId ? {
        ...section,
        lessons: section.lessons.map(lesson => lesson.id === lessonId ? { ...lesson, ...updates } : lesson)
      } : section
    ));
  };

  const handleDeleteLesson = (sectionId, lessonId) => {
    setSections(sections.map(section =>
      section.id === sectionId ? {
        ...section,
        lessons: section.lessons.filter(lesson => lesson.id !== lessonId)
      } : section
    ));
  };

  const handleEditSection = (sectionId) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) {
      Alert.alert('Error', 'Section not found.');
      return;
    }
    router.push({
      pathname: './EditSection',
      params: {
        courseId: courseId || '',
        moduleId: sectionId,
        sectionTitle: section.title,
        lessons: JSON.stringify(section.lessons),
      }
    });
  };

  const handleEditLesson = (sectionId, lessonId) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) {
      Alert.alert('Error', 'Section not found.');
      return;
    }
    const lesson = section.lessons.find(l => l.id === lessonId);
    if (!lesson) {
      Alert.alert('Error', 'Lesson not found.');
      return;
    }
    router.push({
      pathname: './QuixEdit',

      params: {
        courseId: courseId || '',
        moduleId: sectionId,
        lessonId: lessonId,
        lesson: JSON.stringify(lesson),
      }
    });
  };

  const handleSave = async () => {
    console.log('handleSave called, session:', session);
    console.log('User ID:', session?.user?.id);
    
    if (!session?.user?.id) {
      Alert.alert('Error', 'You must be logged in to create a course. Please sign in first.');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a course title');
      return;
    }

    setSaving(true);
    try {
      console.log('Creating course with data:', {
        title: name,
        description: description || '',
        image: coverImage,
        status: 'draft',
        user_id: session.user.id
      });

      const courseData = {
        title: name,
        description: description || '',
        image: coverImage,
        status: 'draft' as const,
        level: level.toLowerCase(),
        university: university === 'Any' ? null : university,
        specialization: specialization,
        tags: tags,
        price: parseFloat(price) || 0,
        discount: parseFloat(discount) || 0,
        final_price: parseFloat(final) || 0,
        is_paid: parseFloat(price) > 0,
        currency: 'USD',
        instructor: session.user.email || session.user.id,
        modules: sections.map((section, index) => ({
          id: section.id,
          title: section.title,
          order: index,
          lessons: section.lessons.map((lesson, lessonIndex) => ({
            id: lesson.id,
            title: lesson.title,
            type: lesson.type,
            duration: lesson.duration,
            order: lessonIndex,
            content: '',
            discussionEnabled: false
          }))
        })),
        user_id: session.user.id
      };

      console.log('Calling courseService.createCourse with:', courseData);
      const course = await courseService.createCourse(courseData);
      
      console.log('Course creation result:', course);
      
      if (course) {
        setCourseId(course.id);
        Alert.alert('Success', 'Course saved as draft!');
      } else {
        throw new Error('Failed to create course');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      Alert.alert('Error', `Failed to save course: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!session?.user?.id) {
      Alert.alert('Error', 'You must be logged in to create a course');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a course title');
      return;
    }

    setSaving(true);
    try {
      const courseData = {
        title: name,
        description: description || '',
        image: coverImage,
        status: 'published' as const,
        level: level.toLowerCase(),
        university: university === 'Any' ? null : university,
        specialization: specialization,
        tags: tags,
        price: parseFloat(price) || 0,
        discount: parseFloat(discount) || 0,
        final_price: parseFloat(final) || 0,
        is_paid: parseFloat(price) > 0,
        currency: 'USD',
        instructor: session.user.email || session.user.id,
        modules: sections.map((section, index) => ({
          id: section.id,
          title: section.title,
          order: index,
          lessons: section.lessons.map((lesson, lessonIndex) => ({
            id: lesson.id,
            title: lesson.title,
            type: lesson.type,
            duration: lesson.duration,
            order: lessonIndex,
            content: '',
            discussionEnabled: false
          }))
        })),
        user_id: session.user.id
      };

      const course = await courseService.createCourse(courseData);
      
      if (course) {
        setCourseId(course.id);
        Alert.alert('Success', 'Course published successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        throw new Error('Failed to publish course');
      }
    } catch (error) {
      console.error('Error publishing course:', error);
      Alert.alert('Error', `Failed to publish course: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    // Always allow previewing the current in-memory state
    const courseData = {
      name,
      description,
      coverImage,
      status,
      level,
      university,
      specialization,
      tags,
      price,
      discount,
      final,
      sections,
    };
    router.push({
      pathname: './CoursePreview',
      params: { course: JSON.stringify(courseData) },
    });
  };

  const handleResetPricing = () => {
    setPrice('500');
    setDiscount('10');
    setFinal('450');
  };

  const handleApplyPricing = () => {
    // Simple calculation, you can enhance as needed
    const p = parseFloat(price) || 0;
    const d = parseFloat(discount) || 0;
    setFinal((p - (p * d) / 100).toString());
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FAF6D9' }} contentContainerStyle={{ padding: isMobile ? 8 : 32 }}>
      <View style={[styles.container, isMobile && styles.containerMobile]}>
        {/* Main Left */}
        <View style={[styles.left, isMobile && styles.leftMobile]}>
          <Text style={styles.title}>Beginners -Introduction to Physics</Text>
          {/* Basic Info */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Basic Info</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholder="Description"
            />
            <Text style={styles.descCount}>200/450</Text>
            <Text style={styles.label}>Cover image</Text>
            <CourseImageUpload image={coverImage} setImage={setCoverImage} setError={setImageError} />
            {imageError && <Text style={{ color: 'red', marginBottom: 8 }}>{imageError}</Text>}
          </View>
          {/* Content */}
          <View style={styles.sectionBox}>
            <View style={styles.contentHeader}>
              <Text style={styles.sectionTitle}>Content</Text>
              <TouchableOpacity onPress={handleAddSection}>
                <Text style={styles.addSection}>Add Section</Text>
              </TouchableOpacity>
            </View>
            {sections.map((section, idx) => (
              <View key={section.id} style={styles.sectionItem}>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionDrag}>≡</Text>
                  <TextInput
                    style={styles.sectionName}
                    value={section.title}
                    onChangeText={text => handleUpdateSectionTitle(section.id, text)}
                  />
                  <TouchableOpacity style={styles.editBtn} onPress={() => handleEditSection(section.id)}>
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sectionMenu} onPress={() => handleDeleteSection(section.id)}>
                    <Text style={styles.sectionMenuText}>×</Text>
                  </TouchableOpacity>
                </View>
                {section.lessons.length > 0 && (
                  <View style={styles.lessonList}>
                    {section.lessons.map((lesson, lidx) => (
                      <View key={lesson.id} style={styles.lessonRow}>
                        <Text style={styles.lessonIcon}>{lesson.type === 'video' ? '▶️' : lesson.type === 'quiz' ? '❓' : '📄'}</Text>
                        <TextInput
                          style={styles.lessonTitleInput}
                          value={lesson.title}
                          onChangeText={text => handleUpdateLesson(section.id, lesson.id, { title: text })}
                          placeholder="Lesson title"
                        />
                        <Text style={styles.lessonDuration}>{lesson.duration}</Text>
                        <TouchableOpacity style={styles.editBtn} onPress={() => handleEditLesson(section.id, lesson.id)}>
                          <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteLessonBtn} onPress={() => handleDeleteLesson(section.id, lesson.id)}>
                          <Text style={styles.deleteLessonText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                <TouchableOpacity style={styles.addLessonBtn} onPress={() => handleAddLesson(section.id)}>
                  <Text style={styles.addLessonText}>+ Add Lesson</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
        {/* Right Sidebar */}
        <View style={[styles.right, isMobile && styles.rightMobile]}>
          <View style={styles.sidebarBox}>
            <View style={styles.sidebarRow}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.publishBtn} onPress={handlePublish} disabled={saving}>
                <Text style={styles.publishBtnText}>{saving ? 'Saving...' : 'Publish'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.previewBtn} onPress={handlePreview}>
              <Text style={styles.previewBtnText}>Preview</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sidebarBox}>
            <Text style={styles.sidebarLabel}>Course Status</Text>
            <Text style={styles.sidebarSubLabel}>Status</Text>
            <TouchableOpacity style={styles.dropdown}><Text>{status}</Text></TouchableOpacity>
          </View>
          <View style={styles.sidebarBox}>
            <Text style={styles.sidebarLabel}>Course Level</Text>
            <TouchableOpacity style={styles.dropdown}><Text>{level}</Text></TouchableOpacity>
          </View>
          <View style={styles.sidebarBox}>
            <Text style={styles.sidebarLabel}>Organizations</Text>
            <Text style={styles.sidebarSubLabel}>University</Text>
            <TouchableOpacity style={styles.dropdown}><Text>{university}</Text></TouchableOpacity>
            <Text style={styles.sidebarSubLabel}>Specialization</Text>
            <TouchableOpacity style={styles.dropdown}><Text>{specialization}</Text></TouchableOpacity>
            <Text style={styles.sidebarSubLabel}>Course tags</Text>
            <View style={styles.tagsRow}>
              {tags.map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(tag)}><Text style={styles.removeTag}>×</Text></TouchableOpacity>
                </View>
              ))}
              <TextInput
                style={styles.tagInput}
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Add"
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity onPress={handleAddTag}><Text style={styles.addTagBtn}>Add</Text></TouchableOpacity>
            </View>
          </View>
          <View style={styles.sidebarBox}>
            <Text style={styles.sidebarLabel}>Pricing</Text>
            <Text style={styles.sidebarSubLabel}>Price</Text>
            <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />
            <Text style={styles.sidebarSubLabel}>Discount</Text>
            <TextInput style={styles.input} value={discount} onChangeText={setDiscount} keyboardType="numeric" />
            <Text style={styles.sidebarSubLabel}>Final</Text>
            <TextInput style={styles.input} value={final} onChangeText={setFinal} keyboardType="numeric" />
            <View style={styles.sidebarRow}>
              <TouchableOpacity style={styles.resetBtn} onPress={handleResetPricing}><Text style={styles.resetBtnText}>Reset</Text></TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={handleApplyPricing}><Text style={styles.applyBtnText}>Apply</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 32,
  },
  containerMobile: {
    flexDirection: 'column',
    gap: 12,
  },
  left: {
    flex: 2,
    minWidth: 0,
  },
  leftMobile: {
    width: '100%',
  },
  right: {
    flex: 1,
    minWidth: 260,
    maxWidth: 340,
    marginLeft: 24,
    gap: 16,
  },
  rightMobile: {
    width: '100%',
    marginLeft: 0,
    marginTop: 18,
    maxWidth: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#222',
    textAlign: isMobile ? 'center' : 'left',
  },
  sectionBox: {
    backgroundColor: '#EAF6FB',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    color: '#222',
  },
  label: {
    fontSize: 14,
    color: '#222',
    marginTop: 8,
    marginBottom: 2,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d0e3f1',
    padding: 8,
    fontSize: 15,
    marginBottom: 4,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  descCount: {
    fontSize: 12,
    color: '#888',
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  coverImageBox: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d0e3f1',
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  coverImageText: {
    color: '#222',
    fontSize: 15,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addSection: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  sectionItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionDrag: {
    fontSize: 18,
    marginRight: 8,
    color: '#888',
  },
  sectionName: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
  },
  editBtn: {
    backgroundColor: '#EAF6FB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 8,
  },
  editBtnText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionMenu: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sectionMenuText: {
    fontSize: 20,
    color: '#888',
  },
  lessonList: {
    marginTop: 6,
    marginLeft: 18,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  lessonIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  lessonTitleInput: {
    flex: 1,
    fontSize: 14,
    color: '#222',
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d0e3f1',
    padding: 8,
    marginBottom: 4,
  },
  lessonDuration: {
    fontSize: 13,
    color: '#888',
    marginLeft: 8,
  },
  sidebarBox: {
    backgroundColor: '#EAF6FB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  sidebarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  publishBtn: {
    backgroundColor: '#1CB5E0',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  publishBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#1CB5E0',
  },
  cancelBtnText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  previewBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#1CB5E0',
    alignSelf: 'flex-end',
  },
  previewBtnText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  sidebarLabel: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 6,
    color: '#222',
  },
  sidebarSubLabel: {
    fontSize: 13,
    color: '#222',
    marginTop: 6,
    marginBottom: 2,
    fontWeight: '500',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d0e3f1',
    padding: 8,
    marginBottom: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1CB5E0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    color: '#1CB5E0',
    fontSize: 13,
    marginRight: 2,
  },
  removeTag: {
    color: '#1CB5E0',
    fontSize: 15,
    marginLeft: 2,
  },
  tagInput: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d0e3f1',
    padding: 6,
    fontSize: 13,
    minWidth: 60,
    marginRight: 2,
  },
  addTagBtn: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 2,
  },
  resetBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#1CB5E0',
  },
  resetBtnText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  applyBtn: {
    backgroundColor: '#1CB5E0',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#1CB5E0',
    marginRight: 8,
  },
  saveBtnText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  addLessonBtn: {
    marginTop: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  addLessonText: {
    color: '#1CB5E0',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteLessonBtn: {
    marginLeft: 8,
    paddingHorizontal: 4,
  },
  deleteLessonText: {
    fontSize: 16,
    color: '#FF4B4B',
  },
  errorText: {
    fontSize: 18,
    color: '#FF4B4B',
    textAlign: 'center',
    marginTop: 20,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 5,
  },
  backButton: {
    backgroundColor: '#1CB5E0',
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 20,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CreateCourse;