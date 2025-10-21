import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Colors from '../../../constant/Colors';
import { JobApplication } from '../../../types/jobs';
import { CalendarDays } from 'lucide-react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";

interface Step1PersonalInfoProps {
  data: Partial<JobApplication>;
  onUpdate: (field: keyof JobApplication, value?: any) => void;
}

const Step1PersonalInfo: React.FC<Step1PersonalInfoProps> = ({ data, onUpdate }) => {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const handleInputChange = (field: keyof JobApplication, value: string) => {
    onUpdate(field, value);
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDate = (selectedDate: Date) => {
    if (selectedDate > new Date()) {
      Alert.alert("Invalid Date", "Date of birth cannot be in the future.");
      hideDatePicker();
      return;
    }

    const year = selectedDate.getFullYear();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = selectedDate.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    onUpdate('dob', formattedDate);
    hideDatePicker();
  };
  
  const displayDob = data.dob 
    ? new Date(data.dob + 'T00:00:00').toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : "Select Date of Birth";

  return (
    <View style={styles.container}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>First Name*</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your first name"
          value={data.first_name || ''}
          onChangeText={(text) => handleInputChange('first_name', text)}
          placeholderTextColor={Colors.GRAY}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Last Name*</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your last name"
          value={data.last_name || ''}
          onChangeText={(text) => handleInputChange('last_name', text)}
          placeholderTextColor={Colors.GRAY}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date of Birth</Text>
        <TouchableOpacity onPress={showDatePicker} style={styles.datePickerButton}>
          <Text style={data.dob ? styles.datePickerText : styles.datePickerPlaceholderText}>
            {displayDob}
          </Text>
          <CalendarDays size={20} color={Colors.GRAY} />
        </TouchableOpacity>
        
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={hideDatePicker}
          date={data.dob ? new Date(data.dob) : new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
          maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 16))}
          minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 70))}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Street Address</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., 123 Main St, Apt 4B"
          value={data.street_address || ''}
          onChangeText={(text) => handleInputChange('street_address', text)}
          placeholderTextColor={Colors.GRAY}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Your city"
            value={data.city || ''}
            onChangeText={(text) => handleInputChange('city', text)}
            placeholderTextColor={Colors.GRAY}
          />
        </View>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>State / Province</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Your state"
            value={data.state || ''}
            onChangeText={(text) => handleInputChange('state', text)}
            placeholderTextColor={Colors.GRAY}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>PIN Code / Zip Code</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your PIN code"
          value={data.pin_code || ''}
          onChangeText={(text) => handleInputChange('pin_code', text)}
          keyboardType="number-pad"
          placeholderTextColor={Colors.GRAY}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.GRAY,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.BLACK,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 48.5,
  },
  datePickerText: {
    fontSize: 15,
    color: Colors.BLACK,
  },
  datePickerPlaceholderText: {
      fontSize: 15,
      color: Colors.GRAY,
  }
});

export default Step1PersonalInfo;