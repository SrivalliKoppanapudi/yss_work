import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, TextInput } from 'react-native';
import Colors from '../../constant/Colors';
import { Plus, Trash2, Calendar, Clock } from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

export interface Slot {
  id?: string; // Optional for new slots
  start_time: Date;
  end_time: Date;
  total_seats: number;
}

interface SlotManagerProps {
  slots: Slot[];
  onSlotsChange: (slots: Slot[]) => void;
  defaultDate: Date | null;
}

const SlotManager: React.FC<SlotManagerProps> = ({ slots, onSlotsChange, defaultDate }) => {
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number | null>(null);
  const [pickerField, setPickerField] = useState<'start_time' | 'end_time' | null>(null);

  const showPicker = (index: number, field: 'start_time' | 'end_time', mode: 'date' | 'time') => {
    setCurrentSlotIndex(index);
    setPickerField(field);
    setPickerMode(mode);
    setPickerVisible(true);
  };

  const handleConfirmPicker = (date: Date) => {
    if (currentSlotIndex !== null && pickerField) {
      const updatedSlots = [...slots];
      const currentSlot = updatedSlots[currentSlotIndex];
      const existingDate = new Date(currentSlot[pickerField]);

      if (pickerMode === 'date') {
        existingDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      } else { // time
        existingDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
      }
      
      updatedSlots[currentSlotIndex] = { ...currentSlot, [pickerField]: existingDate };
      onSlotsChange(updatedSlots);
    }
    setPickerVisible(false);
  };

  const handleAddSlot = () => {
    const baseDate = defaultDate || new Date();
    const startTime = new Date(baseDate);
    startTime.setHours(10, 0, 0, 0);
    const endTime = new Date(baseDate);
    endTime.setHours(11, 0, 0, 0);
    
    const newSlot: Slot = {
      start_time: startTime,
      end_time: endTime,
      total_seats: 10,
    };
    onSlotsChange([...slots, newSlot]);
  };

  const handleRemoveSlot = (index: number) => {
    Alert.alert("Remove Slot", "Are you sure you want to delete this slot?", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        onSlotsChange(slots.filter((_, i) => i !== index));
      }}
    ]);
  };

  const handleSeatsChange = (index: number, text: string) => {
    const seats = parseInt(text, 10);
    if (!isNaN(seats) || text === '') {
        const updatedSlots = [...slots];
        updatedSlots[index] = { ...updatedSlots[index], total_seats: isNaN(seats) ? 0 : seats };
        onSlotsChange(updatedSlots);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Manage Available Slots</Text>
      {slots.map((slot, index) => (
        <View key={index} style={styles.slotCard}>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleRemoveSlot(index)}>
            <Trash2 size={18} color={Colors.ERROR} />
          </TouchableOpacity>
          <Text style={styles.slotTitle}>Slot #{index + 1}</Text>

          <View style={styles.dateTimeRow}>
            <TouchableOpacity style={styles.dateButton} onPress={() => showPicker(index, 'start_time', 'date')}>
              <Calendar size={16} color={Colors.PRIMARY} />
              <Text style={styles.dateText}>{slot.start_time.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateTimeRow}>
            <TouchableOpacity style={styles.timeButton} onPress={() => showPicker(index, 'start_time', 'time')}>
              <Clock size={16} color={Colors.PRIMARY} />
              <Text style={styles.dateText}>Start: {slot.start_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.timeButton} onPress={() => showPicker(index, 'end_time', 'time')}>
               <Clock size={16} color={Colors.PRIMARY} />
              <Text style={styles.dateText}>End: {slot.end_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
          </View>

          <View>
            <Text style={styles.label}>Total Seats</Text>
            <TextInput
              style={styles.input}
              value={String(slot.total_seats)}
              onChangeText={(text) => handleSeatsChange(index, text)}
              keyboardType="number-pad"
            />
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={handleAddSlot}>
        <Plus size={18} color={Colors.WHITE} />
        <Text style={styles.addButtonText}>Add New Slot</Text>
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={isPickerVisible}
        mode={pickerMode}
        onConfirm={handleConfirmPicker}
        onCancel={() => setPickerVisible(false)}
        date={currentSlotIndex !== null && pickerField ? new Date(slots[currentSlotIndex]?.[pickerField]) : new Date()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
    },
    heading: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        borderTopWidth: 1,
        borderColor: '#eee',
        paddingTop: 16,
    },
    slotCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        position: 'relative',
    },
    deleteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 4,
    },
    slotTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    dateTimeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        width: '100%',
    },
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        width: '48%',
    },
    dateText: {
        marginLeft: 8,
        fontSize: 14,
    },
    label: {
        fontSize: 14,
        color: Colors.GRAY,
        marginBottom: 4,
    },
    input: {
        backgroundColor: Colors.WHITE,
        padding: 10,
        borderRadius: 6,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.PRIMARY,
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    addButtonText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});


export default SlotManager;