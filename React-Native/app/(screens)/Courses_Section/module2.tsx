import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Dimensions, Switch } from 'react-native';

const { width } = Dimensions.get('window');
const isMobile = width < 900;

const questionTypes = [
  { label: 'Multiple Choice', icon: '🏷️' },
  { label: 'True/False Choice', icon: '✔️' },
];
const openEnded = [
  { label: 'Open ended', icon: '📝' },
  { label: 'Poll', icon: '📊' },
];
const interactive = [
  { label: 'Reorder', icon: '🔀' },
  { label: 'Match', icon: '🔗' },
];
const spatial = [
  { label: 'Drag & Drop', icon: '🧲' },
  { label: 'Sequencing', icon: '🔢' },
];
const sectionTabs = [
  'Add subsection',
  'Introduction to Physics...',
  'Introduction to Physics...',
  'Quizzes',
  'Introduction to Physics...'
];

export default function EditSection() {
  const [multipleAnswers, setMultipleAnswers] = useState(false);
  const [multipleAnswers2, setMultipleAnswers2] = useState(true);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FAF6D9' }} contentContainerStyle={{ padding: isMobile ? 6 : 32 }}>
      {/* Top Bar */}
      <View style={[styles.topBar, isMobile && styles.topBarMobile]}>
        <Text style={[styles.topBarTitle, isMobile && styles.topBarTitleMobile]}>Week 2 - Quiz -Introduction to Physics</Text>
        <Text style={[styles.topBarSub, isMobile && styles.topBarSubMobile]}>Add/ Customised section</Text>
        <View style={[styles.topBarRight, isMobile && styles.topBarRightMobile]}>
          <Text style={[styles.saveStatus, isMobile && styles.saveStatusMobile]}>Changes saved 2 min ago</Text>
          <TouchableOpacity style={[styles.previewBtn, isMobile && styles.previewBtnMobile]}><Text style={[styles.previewBtnText, isMobile && styles.previewBtnTextMobile]}>Preview</Text></TouchableOpacity>
        </View>
      </View>
      {/* Section Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.tabsRow, isMobile && styles.tabsRowMobile]}>
        {sectionTabs.map((tab, idx) => (
          <TouchableOpacity key={idx} style={[styles.tabBtn, isMobile && styles.tabBtnMobile]}>
            <Text style={[styles.tabBtnText, isMobile && styles.tabBtnTextMobile]} numberOfLines={1}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={[styles.container, isMobile && styles.containerMobile]}>
        {/* Sidebar */}
        <View style={[styles.leftSidebar, isMobile && styles.leftSidebarMobile]}>
          <Text style={styles.sidebarTitle}>Add a new question</Text>
          {questionTypes.map((q, i) => (
            <TouchableOpacity key={i} style={styles.sidebarBtn}><Text>{q.icon} {q.label}</Text></TouchableOpacity>
          ))}
          <Text style={styles.sidebarTitle}>Open ended response</Text>
          {openEnded.map((q, i) => (
            <TouchableOpacity key={i} style={styles.sidebarBtn}><Text>{q.icon} {q.label}</Text></TouchableOpacity>
          ))}
          <Text style={styles.sidebarTitle}>Interactive thinking</Text>
          {interactive.map((q, i) => (
            <TouchableOpacity key={i} style={styles.sidebarBtn}><Text>{q.icon} {q.label}</Text></TouchableOpacity>
          ))}
          <Text style={styles.sidebarTitle}>Spacial thinking</Text>
          {spatial.map((q, i) => (
            <TouchableOpacity key={i} style={styles.sidebarBtn}><Text>{q.icon} {q.label}</Text></TouchableOpacity>
          ))}
        </View>
        {/* Main Quiz Module */}
        <View style={[styles.main, isMobile && styles.mainMobile]}>
          <Text style={styles.moduleTitle}>Module 1</Text>
          {/* Question 1 */}
          <View style={styles.quizBox}>
            <View style={styles.quizHeaderRow}>
              <TouchableOpacity style={styles.quizTypeBtn}><Text>+ Multiple choice</Text></TouchableOpacity>
              <TouchableOpacity style={styles.quizTypeBtn}><Text>No time limits</Text></TouchableOpacity>
              <TouchableOpacity style={styles.quizTypeBtn}><Text>Points</Text></TouchableOpacity>
              <TouchableOpacity style={styles.quizTypeBtn}><Text>📋</Text></TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Question 1" />
            <TouchableOpacity style={styles.addMediaBtn}><Text style={styles.addMediaText}>Add a media</Text></TouchableOpacity>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Allow multiple answers</Text>
              <Switch value={multipleAnswers} onValueChange={setMultipleAnswers} />
            </View>
            <View style={styles.answerRow}>
              <View style={styles.radioDot} />
              <TextInput style={styles.input} placeholder="Answer option 1" />
              <TouchableOpacity style={styles.deleteBtn}><Text>🗑️</Text></TouchableOpacity>
            </View>
            <View style={styles.answerRow}>
              <View style={styles.radioDot} />
              <TextInput style={styles.input} placeholder="Answer option 2" />
              <TouchableOpacity style={styles.deleteBtn}><Text>🗑️</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.addChoiceBtn}><Text>Add Choice</Text></TouchableOpacity>
          </View>
          {/* Question 2 */}
          <View style={styles.quizBox}>
            <View style={styles.quizHeaderRow}>
              <TouchableOpacity style={styles.quizTypeBtn}><Text>+ Multiple choice</Text></TouchableOpacity>
              <TouchableOpacity style={styles.quizTypeBtn}><Text>No time limits</Text></TouchableOpacity>
              <TouchableOpacity style={styles.quizTypeBtn}><Text>Points</Text></TouchableOpacity>
              <TouchableOpacity style={styles.quizTypeBtn}><Text>📋</Text></TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Question 2" />
            <TouchableOpacity style={styles.addMediaBtn}><Text style={styles.addMediaText}>Add a media</Text></TouchableOpacity>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Allow multiple answers</Text>
              <Switch value={multipleAnswers2} onValueChange={setMultipleAnswers2} />
            </View>
            <View style={styles.answerRow}>
              <View style={styles.radioDot} />
              <TextInput style={styles.input} placeholder="Answer option 1" />
              <TouchableOpacity style={styles.deleteBtn}><Text>🗑️</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.addChoiceBtn}><Text>Add Choice</Text></TouchableOpacity>
          </View>
        </View>
        {/* Right Sidebar */}
        <View style={[styles.rightSidebar, isMobile && styles.rightSidebarMobile]}>
          <View style={styles.bulkBox}>
            <Text style={styles.bulkTitle}>Bulk up questions</Text>
            <View style={styles.bulkRow}><Text>Time</Text><Text>No time limits</Text></View>
            <View style={styles.bulkRow}><Text>Points</Text><Text>50 Points</Text></View>
          </View>
          <View style={styles.bulkBox}>
            <Text style={styles.bulkTitle}>Quiz overview</Text>
            <TextInput style={styles.input} placeholder="Description" multiline numberOfLines={2} />
            <TouchableOpacity style={styles.addMediaBtn}><Text style={styles.addMediaText}>Add media</Text></TouchableOpacity>
          </View>
          <View style={styles.bulkBox}>
            <Text style={styles.bulkTitle}>Introduction to Physics..........</Text>
            <View style={styles.progressRow}>
              <View style={styles.progressCircle} />
              <Text style={styles.progressName}>Ankita ...</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '78%' }]} />
              </View>
              <Text style={styles.progressPercent}>78%</Text>
            </View>
          </View>
        </View>
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
    width: 160,
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
  main: {
    flex: 2,
    minWidth: 0,
  },
  mainMobile: {
    width: '100%',
  },
  moduleTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
    color: '#222',
    textAlign: isMobile ? 'center' : 'left',
  },
  quizBox: {
    backgroundColor: '#EAF6FB',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
  },
  quizHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  quizTypeBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#EAF6FB',
    marginRight: 6,
    marginBottom: 4,
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
  addMediaBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#EAF6FB',
  },
  addMediaText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 8,
  },
  switchLabel: {
    fontSize: 15,
    color: '#222',
    flex: 1,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  radioDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1CB5E0',
    marginRight: 6,
  },
  deleteBtn: {
    marginLeft: 6,
    padding: 4,
  },
  addChoiceBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#EAF6FB',
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
  bulkBox: {
    backgroundColor: '#EAF6FB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  bulkTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 6,
    color: '#222',
  },
  bulkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  progressCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1CB5E0',
  },
  progressName: {
    fontSize: 14,
    color: '#222',
    flex: 1,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#1CB5E0',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 13,
    color: '#1CB5E0',
    fontWeight: 'bold',
  },
  // Top bar and tabs
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
  tabBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 7,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EAF6FB',
  },
  tabBtnText: {
    color: '#1CB5E0',
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
  tabBtnTextMobile: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
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
});
