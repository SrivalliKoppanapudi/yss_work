// D:/LynkT/React-Native/component/courses/KeyElementsLessonDisplay.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Lesson, KeyElementsContentSection, SummaryChecklistItem } from '../../types/courses';
import Colors from '../../constant/Colors';
import { CheckCircle } from 'lucide-react-native';

interface KeyElementsLessonDisplayProps {
  lesson: Lesson; // Assuming lesson.content is parsed into keyElementsContent, summaryChecklist, reflectivePrompt
}

const KeyElementsLessonDisplay: React.FC<KeyElementsLessonDisplayProps> = ({ lesson }) => {
  const { keyElementsContent, summaryChecklist, reflectivePrompt } = lesson;

  if (!keyElementsContent) {
    return <Text style={styles.errorText}>Lesson content is not available in the expected format.</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      {keyElementsContent.sections.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.points.map((point, pIndex) => (
            <View key={pIndex} style={styles.pointItem}>
              <CheckCircle size={16} color={Colors.SUCCESS} style={styles.pointIcon} />
              <Text style={styles.pointText}>{point}</Text>
            </View>
          ))}
          {section.example && (
            <View style={styles.exampleBox}>
              <Text style={styles.exampleLabel}>Example:</Text>
              <Text style={styles.exampleText}>"{section.example}"</Text>
              {section.exampleExplanation && (
                <Text style={styles.exampleExplanationText}>{section.exampleExplanation}</Text>
              )}
            </View>
          )}
        </View>
      ))}

      {summaryChecklist && summaryChecklist.length > 0 && (
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Summary Checklist</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 2 }]}>Element</Text>
              <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 3 }]}>Look For</Text>
              <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 3 }]}>Try This</Text>
            </View>
            {summaryChecklist.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.element}</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>{item.lookFor}</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>{item.tryThis}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {reflectivePrompt && (
        <View style={styles.reflectiveSection}>
          <Text style={styles.sectionTitle}>Reflective Prompt</Text>
          <Text style={styles.reflectiveText}>{reflectivePrompt}</Text>
          {/* You could add a TextInput here for user input if needed */}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginBottom: 10,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pointIcon: {
    marginRight: 8,
    marginTop: 3,
  },
  pointText: {
    fontSize: 15,
    color: Colors.BLACK,
    lineHeight: 22,
    flex: 1,
  },
  exampleBox: {
    backgroundColor: '#e6f7f2', // Light green background
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.SUCCESS,
  },
  exampleLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.SUCCESS,
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    color: Colors.BLACK,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  exampleExplanationText: {
    fontSize: 13,
    color: Colors.GRAY,
    marginTop: 6,
    lineHeight: 18,
  },
  summarySection: {
    marginBottom: 20,
  },
  table: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  tableCell: {
    padding: 8,
    fontSize: 13,
    color: Colors.BLACK,
    borderRightWidth: 1,
    borderColor: '#eee',
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  },
  reflectiveSection: {
    marginBottom: 20,
  },
  reflectiveText: {
    fontSize: 15,
    color: Colors.BLACK,
    lineHeight: 22,
    backgroundColor: '#fff3e0', // Light orange background
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffa726',
  },
  errorText: {
    padding: 16,
    fontSize: 16,
    color: Colors.ERROR,
    textAlign: 'center',
  },
});

export default KeyElementsLessonDisplay;