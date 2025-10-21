import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import Colors from '../../constant/Colors';
import { Plus, Trash2, Clock } from 'lucide-react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";

export type Slot = {
  start_time: Date;
  end_time: Date;
  total_seats: number;
};

interface Props {
  slots: Slot[];
  onSlotsChange: (slots: Slot[]) => void;
  defaultDate?: Date | null;
}

const SlotManager: React.FC<Props> = ({ slots, onSlotsChange, defaultDate }) => {
  const [isStartTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisible] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number>(-1);

  const addNewSlot = () => {
    const baseDate = defaultDate || new Date();
    const newSlot: Slot = {
      start_time: new Date(baseDate),
      end_time: new Date(baseDate.setHours(baseDate.getHours() + 1)),
      total_seats: 20,
    };
    onSlotsChange([...slots, newSlot]);
  };

  const removeSlot = (index: number) => {
    const newSlots = slots.filter((_, i) => i !== index);
    onSlotsChange(newSlots);
  };

  const updateSlotSeats = (index: number, seats: string) => {
    const newSlots = [...slots];
    newSlots[index] = {
      ...newSlots[index],
      total_seats: parseInt(seats) || 0,
    };
    onSlotsChange(newSlots);
  };

  const handleTimeConfirm = (date: Date, isStart: boolean) => {
    if (editingSlotIndex === -1) return;

    const newSlots = [...slots];
    if (isStart) {
      newSlots[editingSlotIndex].start_time = date;
      setStartTimePickerVisible(false);
    } else {
      newSlots[editingSlotIndex].end_time = date;
      setEndTimePickerVisible(false);
    }
    onSlotsChange(newSlots);
    setEditingSlotIndex(-1);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Time Slots</Text>
        <TouchableOpacity style={styles.addButton} onPress={addNewSlot}>
          <Plus size={20} color={Colors.PRIMARY} />
          <Text style={styles.addButtonText}>Add Slot</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.slotsList}>
        {slots.map((slot, index) => (
          <View key={index} style={styles.slotItem}>
            <View style={styles.timeContainer}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => {
                  setEditingSlotIndex(index);
                  setStartTimePickerVisible(true);
                }}
              >
                <Clock size={16} color={Colors.GRAY} />
                <Text style={styles.timeText}>{formatTime(slot.start_time)}</Text>
              </TouchableOpacity>
              <Text style={styles.toText}>to</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => {
                  setEditingSlotIndex(index);
                  setEndTimePickerVisible(true);
                }}
              >
                <Clock size={16} color={Colors.GRAY} />
                <Text style={styles.timeText}>{formatTime(slot.end_time)}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.seatsContainer}>
              <TextInput
                style={styles.seatsInput}
                value={slot.total_seats.toString()}
                onChangeText={(text) => updateSlotSeats(index, text)}
                keyboardType="number-pad"
                placeholder="Seats"
              />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeSlot(index)}
              >
                <Trash2 size={20} color={Colors.ERROR} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <DateTimePickerModal
        isVisible={isStartTimePickerVisible}
        mode="time"
        onConfirm={(date) => handleTimeConfirm(date, true)}
        onCancel={() => {
          setStartTimePickerVisible(false);
          setEditingSlotIndex(-1);
        }}
      />

      <DateTimePickerModal
        isVisible={isEndTimePickerVisible}
        mode="time"
        onConfirm={(date) => handleTimeConfirm(date, false)}
        onCancel={() => {
          setEndTimePickerVisible(false);
          setEditingSlotIndex(-1);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.GRAY,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  addButtonText: {
    color: Colors.PRIMARY,
    marginLeft: 4,
    fontWeight: '600',
  },
  slotsList: {
    maxHeight: 200,
  },
  slotItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  timeText: {
    marginLeft: 4,
    color: Colors.BLACK,
  },
  toText: {
    marginHorizontal: 8,
    color: Colors.GRAY,
  },
  seatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatsInput: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
});

export default SlotManager; 