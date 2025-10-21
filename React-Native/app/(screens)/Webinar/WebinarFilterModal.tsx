import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import Colors from '../../../constant/Colors';

const FOCUS_OPTIONS = ['Instructional Strategies', 'Student Engagement'];
const SUBJECT_OPTIONS = ['Mathematics', 'Science'];
const PRICE_OPTIONS = ['Free', 'Paid'];
const DATE_OPTIONS = ['Today', 'Tomorrow', 'This Weekend'];

export default function WebinarFilterModal({ onClose, onChangeFilters, initialFilters }: { onClose: () => void, onChangeFilters: (filters: any) => void, initialFilters: any }) {
  const [search, setSearch] = useState(initialFilters.search || '');
  const [date, setDate] = useState(initialFilters.date || '');
  const [focus, setFocus] = useState(initialFilters.focus || '');
  const [subject, setSubject] = useState(initialFilters.subject || '');
  const [price, setPrice] = useState(initialFilters.price || '');

  const handleApply = () => {
    onChangeFilters({ search, date, focus, subject, price });
    onClose();
  };
  const handleClear = () => {
    setSearch(''); setDate(''); setFocus(''); setSubject(''); setPrice('');
    onChangeFilters({ search: '', date: '', focus: '', subject: '', price: '' });
    onClose();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
      <ScrollView>
        <TextInput style={styles.searchInput} placeholder="Search" value={search} onChangeText={setSearch} />
        <Text style={styles.sectionTitle}>Date</Text>
        <View style={styles.row}>
          {DATE_OPTIONS.map(opt => (
            <TouchableOpacity key={opt} style={[styles.chip, date === opt && styles.chipSelected]} onPress={() => setDate(opt === date ? '' : opt)}>
              <Text style={date === opt ? styles.chipTextSelected : styles.chipText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.sectionTitle}>Focus</Text>
        <View style={styles.row}>
          {FOCUS_OPTIONS.map(opt => (
            <TouchableOpacity key={opt} style={[styles.chip, focus === opt && styles.chipSelected]} onPress={() => setFocus(opt === focus ? '' : opt)}>
              <Text style={focus === opt ? styles.chipTextSelected : styles.chipText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.sectionTitle}>Subject</Text>
        <View style={styles.row}>
          {SUBJECT_OPTIONS.map(opt => (
            <TouchableOpacity key={opt} style={[styles.chip, subject === opt && styles.chipSelected]} onPress={() => setSubject(opt === subject ? '' : opt)}>
              <Text style={subject === opt ? styles.chipTextSelected : styles.chipText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.sectionTitle}>Price</Text>
        <View style={styles.row}>
          {PRICE_OPTIONS.map(opt => (
            <TouchableOpacity key={opt} style={[styles.chip, price === opt && styles.chipSelected]} onPress={() => setPrice(opt === price ? '' : opt)}>
              <Text style={price === opt ? styles.chipTextSelected : styles.chipText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}><Text style={styles.clearButtonText}>Clear</Text></TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}><Text style={styles.applyButtonText}>Apply</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    padding: 16,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  closeButtonText: {
    color: Colors.PRIMARY || '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.GRAY,
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: Colors.PRIMARY || '#007AFF',
  },
  chipText: {
    color: Colors.GRAY,
  },
  chipTextSelected: {
    color: Colors.WHITE,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  clearButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  clearButtonText: {
    color: Colors.GRAY,
    fontWeight: 'bold',
  },
  applyButton: {
    backgroundColor: Colors.PRIMARY || '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  applyButtonText: {
    color: Colors.WHITE,
    fontWeight: 'bold',
  },
}); 