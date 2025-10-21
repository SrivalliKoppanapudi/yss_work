import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import Colors from '../../../constant/Colors';
import { JobApplication, ExperienceEntry } from '../../../types/jobs';
import { PlusCircle, Trash2, CalendarDays } from 'lucide-react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";

interface Step3ExperienceProps {
  data: Partial<JobApplication>;
  onUpdate: (field: keyof JobApplication | Partial<JobApplication>, value?: any) => void;
}

const initialExperienceEntry: ExperienceEntry = {
  id: Date.now().toString(),
  institution: '',
  position: '',
  location: '',
  startDate: '',
  endDate: '',
  isCurrentPosition: false,
  responsibilities: '',
  achievements: '',
};

const Step3Experience: React.FC<Step3ExperienceProps> = ({ data, onUpdate }) => {
  const initialIsExperienced = data.is_experienced ?? (data.experiences && data.experiences.length > 0);
  
  const [isExperienced, setIsExperienced] = useState<boolean>(initialIsExperienced);
  const [experiences, setExperiences] = useState<ExperienceEntry[]>(
    data.experiences && data.experiences.length > 0 ? data.experiences : (initialIsExperienced ? [{ ...initialExperienceEntry }] : [])
  );
  
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<{ index: number; field: 'startDate' | 'endDate' } | null>(null);

  const handleToggleExperienced = (value: boolean) => {
    setIsExperienced(value);
    if (value && experiences.length === 0) {
      const newExp = [{ ...initialExperienceEntry, id: Date.now().toString() }];
      setExperiences(newExp);
      onUpdate({ is_experienced: value, experiences: newExp });
    } else if (!value) {
      setExperiences([]);
      onUpdate({ is_experienced: value, experiences: [] });
    } else {
      onUpdate('is_experienced', value);
    }
  };

  const handleAddExperience = () => {
    const newEntry = { ...initialExperienceEntry, id: Date.now().toString() };
    const newExperiencesArray = [...experiences, newEntry];
    setExperiences(newExperiencesArray);
    onUpdate('experiences', newExperiencesArray);
  };

  const handleRemoveExperience = (index: number) => {
    const newExperiences = experiences.filter((_, i) => i !== index);
    setExperiences(newExperiences);
    onUpdate('experiences', newExperiences);
    if (newExperiences.length === 0) {
      setIsExperienced(false);
      onUpdate('is_experienced', false);
    }
  };

  const handleInputChange = (index: number, field: keyof ExperienceEntry, value: string | boolean) => {
    const newExperiences = [...experiences];
    const currentEntry = { ...newExperiences[index] };
    if (field === 'isCurrentPosition' && typeof value === 'boolean') {
      currentEntry.isCurrentPosition = value;
      if (value) currentEntry.endDate = '';
    } else if (typeof value === 'string') {
      (currentEntry as any)[field] = value;
    }
    newExperiences[index] = currentEntry;
    setExperiences(newExperiences);
    onUpdate('experiences', newExperiences);
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
      <Text style={styles.stepHeader}>Work Experience</Text>

      <View style={styles.switchGroup}>
        <Text style={styles.label}>Do you have work experience?</Text>
        <Switch
          trackColor={{ false: "#d1d5db", true: Colors.PRIMARY_LIGHT }}
          thumbColor={isExperienced ? Colors.PRIMARY : "#f4f3f4"}
          onValueChange={handleToggleExperienced}
          value={isExperienced}
        />
      </View>
      {!isExperienced && (
           <Text style={styles.fresherText}>Great! You can skip to the next step.</Text>
      )}

      {isExperienced && experiences.map((exp, index) => (
        <View key={exp.id || index} style={styles.entryContainer}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryTitle}>Experience #{index + 1}</Text>
            <TouchableOpacity onPress={() => handleRemoveExperience(index)}>
                <Trash2 size={20} color={Colors.ERROR} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Institution / Company Name*</Text>
            <TextInput style={styles.textInput} placeholder="e.g., Example Corp Ltd." value={exp.institution} onChangeText={(text) => handleInputChange(index, 'institution', text)} placeholderTextColor={Colors.GRAY} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Position / Role*</Text>
            <TextInput style={styles.textInput} placeholder="e.g., Senior Software Engineer" value={exp.position} onChangeText={(text) => handleInputChange(index, 'position', text)} placeholderTextColor={Colors.GRAY} />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Start Date*</Text>
              <TouchableOpacity onPress={() => showDatePicker(index, 'startDate')} style={styles.datePickerButton}>
                <Text style={exp.startDate ? styles.datePickerText : styles.datePickerPlaceholderText}>
                  {displayDate(exp.startDate) || "Select Start"}
                </Text>
                <CalendarDays size={20} color={Colors.GRAY} />
              </TouchableOpacity>
            </View>
            {!exp.isCurrentPosition && (
                <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>End Date*</Text>
                <TouchableOpacity onPress={() => showDatePicker(index, 'endDate')} style={styles.datePickerButton}>
                    <Text style={exp.endDate ? styles.datePickerText : styles.datePickerPlaceholderText}>
                    {displayDate(exp.endDate) || "Select End"}
                    </Text>
                    <CalendarDays size={20} color={Colors.GRAY} />
                </TouchableOpacity>
                </View>
            )}
          </View>

          <View style={[styles.switchGroup, { marginBottom: 5 }]}>
            <Text style={styles.label}>I currently work here</Text>
            <Switch
              trackColor={{ false: "#d1d5db", true: Colors.PRIMARY_LIGHT }}
              thumbColor={exp.isCurrentPosition ? Colors.PRIMARY : "#f4f3f4"}
              onValueChange={(value) => handleInputChange(index, 'isCurrentPosition', value)}
              value={exp.isCurrentPosition}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Key Responsibilities (Optional)</Text>
            <TextInput style={[styles.textInput, styles.textArea]} placeholder="Describe your main duties (use new lines for points)" value={exp.responsibilities || ''} onChangeText={(text) => handleInputChange(index, 'responsibilities', text)} multiline placeholderTextColor={Colors.GRAY}/>
          </View>
        </View>
      ))}

      {isExperienced && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddExperience}>
          <PlusCircle size={20} color={Colors.PRIMARY} />
          <Text style={styles.addButtonText}>Add Another Experience</Text>
        </TouchableOpacity>
      )}

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={hideDatePicker}
        date={data.dob ? new Date(data.dob) : new Date(new Date().setFullYear(new Date().getFullYear()))}
        maximumDate={new Date()}
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
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 8,
  },
  fresherText: {
    fontStyle: 'italic',
    color: Colors.GRAY,
    marginBottom: 15,
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
  textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
      paddingTop: 12,
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
});

export default Step3Experience;