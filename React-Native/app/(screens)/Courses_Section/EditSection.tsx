import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import { Module, Lesson } from '../../../types/courses';

const { width } = Dimensions.get('window');
const isMobile = width < 900;

const leftComponents = [
  'Image', 'Gallery', 'Video', 'List', 'Attachment', 'Table', 'Quiz', 'Case Studies'
];

const paletteColors = [
  '#FF4B4B', '#FFB84B', '#FFE14B', '#4BFF7B', '#4BFFEC', '#4B8BFF', '#B44BFF', '#FF4BBA',
  '#222', '#888', '#fff', '#EAF6FB'
];

const mobileTabs = [
  { key: 'components', label: 'Components' },
  { key: 'main', label: 'Content' },
  { key: 'settings', label: 'Settings' },
];

export default function EditSection() {
  const [selectedColor, setSelectedColor] = useState(paletteColors[0]);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontWeight, setFontWeight] = useState('200');
  const [fontSize, setFontSize] = useState('20px');
  const [alignment, setAlignment] = useState('left');
  const [style, setStyle] = useState({ bold: false, italic: false, underline: false });
  const [mobileTab, setMobileTab] = useState('main');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessonContent, setLessonContent] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const router = useRouter();
  const params = useLocalSearchParams();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;

  useEffect(() => {
    loadModuleData();
  }, [moduleId]);

  const loadModuleData = async () => {
    try {
      setLoading(true);
      if (moduleId) {
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .select('*')
          .eq('id', moduleId)
          .single();
        if (moduleError) throw moduleError;
        setModule(moduleData);
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('module_id', moduleId)
          .order('order_index', { ascending: true });
        if (lessonsError) throw lessonsError;
        setLessons(lessonsData || []);
        if (lessonsData && lessonsData.length > 0) {
          setCurrentLesson(lessonsData[0]);
          setLessonContent(lessonsData[0].content || '');
          setLessonTitle(lessonsData[0].title || '');
        }
      }
    } catch (error) {
      console.error('Error loading module data:', error);
      Alert.alert('Error', 'Failed to load module data');
    } finally {
      setLoading(false);
    }
  };

  const selectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setLessonContent(lesson.content || '');
    setLessonTitle(lesson.title || '');
  };

  const addComponent = (componentType: string) => {
    let newContent = lessonContent;
    switch (componentType) {
      case 'Image':
        newContent += '\n\n![Image](image-url)\n';
        break;
      case 'Video':
        newContent += '\n\n<video src="video-url" controls></video>\n';
        break;
      case 'List':
        newContent += '\n\n- List item 1\n- List item 2\n- List item 3\n';
        break;
      case 'Table':
        newContent += '\n\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Data 1   | Data 2   | Data 3   |\n';
        break;
      case 'Quiz':
        newContent += '\n\n**Quiz Question:**\nWhat is the answer to this question?\n\n- [ ] Option A\n- [ ] Option B\n- [ ] Option C\n- [ ] Option D\n';
        break;
      default:
        newContent += `\n\n**${componentType} Component**\nAdd your ${componentType.toLowerCase()} content here.\n`;
    }
    setLessonContent(newContent);
  };

  const addNewLesson = async () => {
    if (!module) return;
    try {
      setSaving(true);
      const newLesson: Partial<Lesson> = {
        title: 'New Lesson',
        content: '',
        type: 'text',
        duration: 0,
        order: lessons.length + 1,
        resources: [],
        discussionEnabled: false,
        moduleId: module.id
      };
      const { data: lesson, error } = await supabase
        .from('lessons')
        .insert([newLesson])
        .select()
        .single();
      if (error) throw error;
      setLessons([...lessons, lesson]);
      setCurrentLesson(lesson);
      setLessonContent('');
      setLessonTitle('New Lesson');
    } catch (error) {
      console.error('Error adding lesson:', error);
      Alert.alert('Error', 'Failed to add lesson');
    } finally {
      setSaving(false);
    }
  };

  const saveLesson = async () => {
    if (!currentLesson) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          title: lessonTitle,
          content: lessonContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentLesson.id);
      if (error) throw error;
      setLessons(lessons.map(lesson =>
        lesson.id === currentLesson.id
          ? { ...lesson, title: lessonTitle, content: lessonContent }
          : lesson
      ));
      Alert.alert('Success', 'Lesson saved successfully!');
    } catch (error) {
      console.error('Error saving lesson:', error);
      Alert.alert('Error', 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  // Sidebar Components
  const ComponentsSidebar = (
    <View style={[styles.leftSidebar, isMobile && styles.leftSidebarMobile]}>
      <Text style={[styles.sidebarTitle, isMobile && styles.sidebarTitleMobile]}>Components</Text>
      {leftComponents.map((comp, idx) => (
        <TouchableOpacity key={idx} style={[styles.sidebarBtn, isMobile && styles.sidebarBtnMobile]} onPress={() => addComponent(comp)}>
          <Text style={[styles.sidebarBtnText, isMobile && styles.sidebarBtnTextMobile]}>{comp}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Main Content
  const MainContent = (
    <View style={[styles.main, isMobile && styles.mainMobile]}>
      {/* Top Bar */}
      <View style={[styles.topBar, isMobile && styles.topBarMobile]}>
        <Text style={[styles.topBarTitle, isMobile && styles.topBarTitleMobile]}>Week 1 - Beginners -Introduction to Physics</Text>
        <Text style={[styles.topBarSub, isMobile && styles.topBarSubMobile]}>Add / Customised section</Text>
        <View style={[styles.topBarRight, isMobile && styles.topBarRightMobile]}>
          <Text style={[styles.saveStatus, isMobile && styles.saveStatusMobile]}>Changes saved 2 min ago</Text>
          <TouchableOpacity
            style={[styles.previewBtn, isMobile && styles.previewBtnMobile]}
            onPress={() => router.push({ pathname: '/Courses_section/QuixEdit', params: { courseId, moduleId } })}
          >
            <Text style={[styles.previewBtnText, isMobile && styles.previewBtnTextMobile]}>Preview</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Section Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.tabsRow, isMobile && styles.tabsRowMobile]}>
        <TouchableOpacity style={[styles.addSubsectionBtn, isMobile && styles.addSubsectionBtnMobile]} onPress={addNewLesson}>
          <Text style={[styles.addSubsectionText, isMobile && styles.addSubsectionTextMobile]}>Add lesson</Text>
        </TouchableOpacity>
        {lessons.map((lesson, idx) => (
          <TouchableOpacity
            key={lesson.id}
            style={[styles.tabBtn, currentLesson?.id === lesson.id && styles.tabBtnActive, isMobile && styles.tabBtnMobile]}
            onPress={() => selectLesson(lesson)}
          >
            <Text style={[styles.tabBtnText, currentLesson?.id === lesson.id && styles.tabBtnTextActive, isMobile && styles.tabBtnTextMobile]} numberOfLines={1}>{lesson.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Editor Content */}
      {currentLesson && (
        <View style={[styles.editorBox, isMobile && styles.editorBoxMobile]}>
          <TextInput
            style={[styles.lessonTitleInput, isMobile && styles.lessonTitleInputMobile]}
            value={lessonTitle}
            onChangeText={setLessonTitle}
            placeholder="Lesson title"
          />
          <TextInput
            style={[styles.editorTextArea, isMobile && styles.editorTextAreaMobile]}
            value={lessonContent}
            onChangeText={setLessonContent}
            multiline
            placeholder="Enter lesson content here..."
            textAlignVertical="top"
          />
          <View style={[styles.saveRow, isMobile && styles.saveRowMobile]}>
            <TouchableOpacity style={[styles.saveBtn, isMobile && styles.saveBtnMobile]} onPress={saveLesson} disabled={saving}>
              <Text style={[styles.saveBtnText, isMobile && styles.saveBtnTextMobile]}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelBtn, isMobile && styles.cancelBtnMobile]} onPress={() => router.back()}>
              <Text style={[styles.cancelBtnText, isMobile && styles.cancelBtnTextMobile]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  // Settings Sidebar
  const SettingsSidebar = (
    <View style={[styles.rightSidebar, isMobile && styles.rightSidebarMobile]}>
      <Text style={[styles.sidebarTitle, isMobile && styles.sidebarTitleMobile]}>Position</Text>
      <View style={styles.alignRow}>
        {['left', 'center', 'right', 'justify'].map((align, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.alignBtn, alignment === align && styles.alignBtnActive]}
            onPress={() => setAlignment(align)}
          >
            <Text style={styles.alignIcon}>{align === 'left' ? '≡' : align === 'center' ? '≣' : align === 'right' ? '≡' : '≋'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.sidebarTitle, isMobile && styles.sidebarTitleMobile]}>Typography</Text>
      <View style={styles.typographyRow}>
        <Text style={styles.typographyLabel}>Font family</Text>
        <Text style={styles.typographyValue}>{fontFamily}</Text>
      </View>
      <View style={styles.typographyRow}>
        <Text style={styles.typographyLabel}>Font weight</Text>
        <TextInput style={styles.typographyInput} value={fontWeight} onChangeText={setFontWeight} keyboardType="numeric" />
        <Text style={styles.typographyLabel}>Font size</Text>
        <TextInput style={styles.typographyInput} value={fontSize} onChangeText={setFontSize} />
      </View>
      <Text style={[styles.sidebarTitle, isMobile && styles.sidebarTitleMobile]}>Alignment</Text>
      <View style={styles.alignRow}>
        {['left', 'center', 'right', 'justify'].map((align, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.alignBtn, alignment === align && styles.alignBtnActive]}
            onPress={() => setAlignment(align)}
          >
            <Text style={styles.alignIcon}>{align === 'left' ? '≡' : align === 'center' ? '≣' : align === 'right' ? '≡' : '≋'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.sidebarTitle, isMobile && styles.sidebarTitleMobile]}>Style</Text>
      <View style={styles.styleRow}>
        <TouchableOpacity onPress={() => setStyle(s => ({ ...s, bold: !s.bold }))} style={[styles.styleBtn, style.bold && styles.styleBtnActive]}><Text style={styles.styleBtnText}>B</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setStyle(s => ({ ...s, italic: !s.italic }))} style={[styles.styleBtn, style.italic && styles.styleBtnActive]}><Text style={styles.styleBtnText}>I</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setStyle(s => ({ ...s, underline: !s.underline }))} style={[styles.styleBtn, style.underline && styles.styleBtnActive]}><Text style={styles.styleBtnText}>U</Text></TouchableOpacity>
      </View>
      <Text style={[styles.sidebarTitle, isMobile && styles.sidebarTitleMobile]}>Palette</Text>
      <View style={styles.paletteRow}>
        {paletteColors.map((color, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.paletteBtn, { backgroundColor: color }, selectedColor === color && styles.paletteBtnActive]}
            onPress={() => setSelectedColor(color)}
          />
        ))}
      </View>
    </View>
  );

  // Main render
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF6D9' }}>
        <ActivityIndicator size="large" color="#1CB5E0" />
        <Text style={{ marginTop: 10, fontSize: 16, color: '#666' }}>Loading module...</Text>
      </View>
    );
  }

  if (isMobile) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#FAF6D9' }} contentContainerStyle={{ padding: 6 }}>
        <View style={styles.mobileTabBar}>
          {mobileTabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.mobileTabBtn, mobileTab === tab.key && styles.mobileTabBtnActive]}
              onPress={() => setMobileTab(tab.key)}
            >
              <Text style={[styles.mobileTabBtnText, mobileTab === tab.key && styles.mobileTabBtnTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {mobileTab === 'components' && ComponentsSidebar}
        {mobileTab === 'main' && MainContent}
        {mobileTab === 'settings' && SettingsSidebar}
      </ScrollView>
    );
  }

  // Desktop layout
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FAF6D9' }} contentContainerStyle={{ padding: 32 }}>
      <View style={styles.container}>
        {ComponentsSidebar}
        {MainContent}
        {SettingsSidebar}
      </View>
    </ScrollView>
  );
}

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
  leftSidebar: {
    width: 140,
    backgroundColor: '#EAF6FB',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    minHeight: 600,
  },
  leftSidebarMobile: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 0,
    marginBottom: 10,
    gap: 4,
  },
  sidebarTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 8,
    color: '#222',
  },
  sidebarBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sidebarBtnText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 14,
  },
  main: {
    flex: 2,
    minWidth: 0,
  },
  mainMobile: {
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  topBarTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#222',
    flex: 1,
  },
  topBarSub: {
    fontSize: 14,
    color: '#888',
    marginLeft: 8,
    flex: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  saveStatus: {
    fontSize: 13,
    color: '#888',
    marginRight: 8,
  },
  previewBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#1CB5E0',
  },
  previewBtnText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  addSubsectionBtn: {
    backgroundColor: '#1CB5E0',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  addSubsectionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  tabBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 7,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EAF6FB',
  },
  tabBtnActive: {
    backgroundColor: '#1CB5E0',
    borderColor: '#1CB5E0',
  },
  tabBtnText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  editorBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 18,
    minHeight: 400,
  },
  editorTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 10,
    color: '#222',
  },
  editorText: {
    fontSize: 15,
    color: '#222',
    marginBottom: 10,
  },
  videoBox: {
    alignItems: 'center',
    marginVertical: 10,
  },
  videoThumb: {
    width: 220,
    height: 120,
    backgroundColor: '#EAF6FB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIcon: {
    fontSize: 38,
    color: '#1CB5E0',
  },
  listBox: {
    marginVertical: 10,
    marginLeft: 8,
  },
  listItem: {
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
  },
  imgRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
  },
  imgBox: {
    width: 90,
    height: 90,
    backgroundColor: '#EAF6FB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgIcon: {
    fontSize: 38,
    color: '#1CB5E0',
  },
  saveRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    justifyContent: 'center',
  },
  saveBtn: {
    backgroundColor: '#1CB5E0',
    borderRadius: 6,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1CB5E0',
  },
  cancelBtnText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rightSidebar: {
    width: 220,
    backgroundColor: '#EAF6FB',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    minHeight: 600,
  },
  rightSidebarMobile: {
    width: '100%',
    marginTop: 10,
    minHeight: 0,
  },
  alignRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  alignBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#EAF6FB',
  },
  alignBtnActive: {
    backgroundColor: '#1CB5E0',
    borderColor: '#1CB5E0',
  },
  alignIcon: {
    fontSize: 18,
    color: '#1CB5E0',
  },
  typographyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  typographyLabel: {
    fontSize: 13,
    color: '#222',
    fontWeight: '500',
  },
  typographyValue: {
    fontSize: 13,
    color: '#1CB5E0',
    fontWeight: 'bold',
  },
  typographyInput: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d0e3f1',
    padding: 6,
    fontSize: 13,
    minWidth: 40,
  },
  styleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  styleBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#EAF6FB',
  },
  styleBtnActive: {
    backgroundColor: '#1CB5E0',
    borderColor: '#1CB5E0',
  },
  styleBtnText: {
    fontSize: 16,
    color: '#1CB5E0',
    fontWeight: 'bold',
  },
  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  paletteBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  paletteBtnActive: {
    borderColor: '#1CB5E0',
    borderWidth: 2,
  },
  mobileTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  mobileTabBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#EAF6FB',
  },
  mobileTabBtnActive: {
    backgroundColor: '#1CB5E0',
    borderColor: '#1CB5E0',
  },
  mobileTabBtnText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  mobileTabBtnTextActive: {
    color: '#fff',
  },
  topBarMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  topBarTitleMobile: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#222',
    flex: 1,
  },
  topBarSubMobile: {
    fontSize: 14,
    color: '#888',
    marginLeft: 8,
    flex: 1,
  },
  topBarRightMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  saveStatusMobile: {
    fontSize: 13,
    color: '#888',
    marginRight: 8,
  },
  previewBtnMobile: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#1CB5E0',
  },
  previewBtnTextMobile: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  tabsRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  addSubsectionBtnMobile: {
    backgroundColor: '#1CB5E0',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  addSubsectionTextMobile: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  tabBtnMobile: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 7,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EAF6FB',
  },
  editorBoxMobile: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 18,
    minHeight: 400,
  },
  editorTitleMobile: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 10,
    color: '#222',
  },
  editorTextMobile: {
    fontSize: 15,
    color: '#222',
    marginBottom: 10,
  },
  videoBoxMobile: {
    alignItems: 'center',
    marginVertical: 10,
  },
  videoThumbMobile: {
    width: 220,
    height: 120,
    backgroundColor: '#EAF6FB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIconMobile: {
    fontSize: 38,
    color: '#1CB5E0',
  },
  listBoxMobile: {
    marginVertical: 10,
    marginLeft: 8,
  },
  listItemMobile: {
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
  },
  imgRowMobile: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
  },
  imgBoxMobile: {
    width: 90,
    height: 90,
    backgroundColor: '#EAF6FB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgIconMobile: {
    fontSize: 38,
    color: '#1CB5E0',
  },
  saveRowMobile: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    justifyContent: 'center',
  },
  saveBtnMobile: {
    backgroundColor: '#1CB5E0',
    borderRadius: 6,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  saveBtnTextMobile: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtnMobile: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1CB5E0',
  },
  cancelBtnTextMobile: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 16,
  },
  lessonTitleInput: {
    borderWidth: 1,
    borderColor: '#d0e3f1',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    color: '#222',
    marginBottom: 12,
  },
  lessonTitleInputMobile: {
    fontSize: 16,
  },
  editorTextArea: {
    borderWidth: 1,
    borderColor: '#d0e3f1',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    color: '#222',
    minHeight: 100,
    maxHeight: 300,
  },
  editorTextAreaMobile: {
    fontSize: 16,
  },
});