import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import Colors from '../../../constant/Colors';
import { JobApplication, EducationEntry } from '../../../types/jobs';
import { PlusCircle, Trash2, CalendarDays } from 'lucide-react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";

interface Step2EducationProps {
  data: Partial<JobApplication>;
  onUpdate: (field: keyof JobApplication, value?: any) => void;
}

const initialEducationEntry: EducationEntry = {
  id: Date.now().toString(),
  institutionName: '',
  degree: '',
  fieldOfStudy: '',
  startDate: '',
  endDate: '',
  gpa: '',
  isCurrent: false, // <-- Add default value
};

const Step2Education: React.FC<Step2EducationProps> = ({ data, onUpdate }) => {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<{ index: number; field: 'startDate' | 'endDate' } | null>(null);

  const educations = data.education && data.education.length > 0 ? data.education : [initialEducationEntry];

  const handleAddEducation = () => {
    const newEducations = [...educations, { ...initialEducationEntry, id: Date.now().toString() }];
    onUpdate('education', newEducations);
  };

  const handleRemoveEducation = (index: number) => {
    if (educations.length === 1) {
      Alert.alert("Cannot Remove", "At least one education entry is required.");
      return;
    }
    const newEducations = educations.filter((_, i) => i !== index);
    onUpdate('education', newEducations);
  };

  const handleInputChange = (index: number, field: keyof EducationEntry, value: string | boolean) => {
    const newEducations = [...educations];
    const currentEntry = { ...newEducations[index] };

    if (field === 'isCurrent' && typeof value === 'boolean') {
        currentEntry.isCurrent = value;
        if (value) currentEntry.endDate = ''; // Clear end date if they are currently studying
    } else if (typeof value === 'string') {
        (currentEntry as any)[field] = value;
    }

    newEducations[index] = currentEntry;
    onUpdate('education', newEducations);
  };

  const showDatePicker = (index: number, field: 'startDate' | 'endDate') => {
    setDatePickerTarget({ index, field });
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
    setDatePickerTarget(null);
  };

  const handleConfirmDate = (selectedDate: Date) => {
    if (datePickerTarget) {
      const { index, field } = datePickerTarget;
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      handleInputChange(index, field, formattedDate);
    }
    hideDatePicker();
  };

  const displayDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    return new Date(dateString + 'T00:00:00').toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepHeader}>Education</Text>

      {educations.map((edu, index) => (
        <View key={edu.id || index} style={styles.entryContainer}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryTitle}>Education #{index + 1}</Text>
            <TouchableOpacity onPress={() => handleRemoveEducation(index)}>
                <Trash2 size={20} color={Colors.ERROR} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Institution Name*</Text>
            <TextInput style={styles.textInput} placeholder="e.g., University of Example" value={edu.institutionName} onChangeText={(text) => handleInputChange(index, 'institutionName', text)} placeholderTextColor={Colors.GRAY} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Degree*</Text>
            <TextInput style={styles.textInput} placeholder="e.g., Bachelor of Science" value={edu.degree} onChangeText={(text) => handleInputChange(index, 'degree', text)} placeholderTextColor={Colors.GRAY} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Field of Study*</Text>
            <TextInput style={styles.textInput} placeholder="e.g., Computer Science" value={edu.fieldOfStudy} onChangeText={(text) => handleInputChange(index, 'fieldOfStudy', text)} placeholderTextColor={Colors.GRAY} />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Start Date*</Text>
              <TouchableOpacity onPress={() => showDatePicker(index, 'startDate')} style={styles.datePickerButton}>
                <Text style={edu.startDate ? styles.datePickerText : styles.datePickerPlaceholderText}>
                    {displayDate(edu.startDate) || "Start Date"}
                </Text>
                <CalendarDays size={20} color={Colors.GRAY} />
              </TouchableOpacity>
            </View>
            
            {/* --- Conditionally render the End Date field --- */}
            {!edu.isCurrent && (
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>End Date*</Text>
                <TouchableOpacity onPress={() => showDatePicker(index, 'endDate')} style={styles.datePickerButton}>
                   <Text style={edu.endDate ? styles.datePickerText : styles.datePickerPlaceholderText}>
                      {displayDate(edu.endDate) || "End Date"}
                   </Text>
                  <CalendarDays size={20} color={Colors.GRAY} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* --- NEW: "Currently studying here" Switch --- */}
          <View style={styles.switchContainer}>
            <Text style={styles.label}>I am currently studying here</Text>
            <Switch
              trackColor={{ false: "#d1d5db", true: Colors.PRIMARY_LIGHT }}
              thumbColor={edu.isCurrent ? Colors.PRIMARY : "#f4f3f4"}
              onValueChange={(value) => handleInputChange(index, 'isCurrent', value)}
              value={!!edu.isCurrent}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>GPA/Percentage (Optional)</Text>
            <TextInput style={styles.textInput} placeholder="e.g., 3.8/4.0 or 85%" value={edu.gpa || ''} onChangeText={(text) => handleInputChange(index, 'gpa', text)} placeholderTextColor={Colors.GRAY} />
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={handleAddEducation}>
        <PlusCircle size={20} color={Colors.PRIMARY} />
        <Text style={styles.addButtonText}>Add Another Education</Text>
      </TouchableOpacity>
      
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={hideDatePicker}
        date={datePickerTarget ? new Date(educations[datePickerTarget.index]?.[datePickerTarget.field] || new Date()) : new Date()}
        // --- UPDATED: Dynamic maximumDate ---
        maximumDate={datePickerTarget?.field === 'startDate' ? new Date() : new Date(new Date().setFullYear(new Date().getFullYear() + 10))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  stepHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginBottom: 20,
    textAlign: 'center',
  },
  entryContainer: {
    backgroundColor: '#fdfdff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.BLACK,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.GRAY,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.BLACK,
    borderWidth: 1,
    borderColor: '#d0d7de',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d0d7de',
    height: 48,
  },
  datePickerText: {
    fontSize: 15,
    color: Colors.BLACK,
  },
  datePickerPlaceholderText: {
      fontSize: 15,
      color: Colors.GRAY,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#e7f3ff',
    marginTop: 10,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.PRIMARY,
    marginLeft: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 8,
  },
});

export default Step2Education;