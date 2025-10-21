// component/forms/CalendarModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import Colors from '../../constant/Colors';

interface CalendarModalProps {
  isVisible: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  currentDate?: Date | null;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isVisible, onClose, onDateSelect, currentDate }) => {
  const [displayDate, setDisplayDate] = useState(currentDate || new Date());
  const selectedDate = currentDate;

  useEffect(() => {
    setDisplayDate(currentDate || new Date());
  }, [currentDate]);

  const changeMonth = (amount: number) => {
    const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth() + amount, 1);
    setDisplayDate(newDate);
  };

  const generateMatrix = () => {
    const matrix: (number | null)[][] = [];
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();

    let counter = 1;
    for (let row = 0; row < 6; row++) {
      matrix[row] = [];
      for (let col = 0; col < 7; col++) {
        if (row === 0 && col < firstDay) {
          matrix[row][col] = null;
        } else if (counter > numDays) {
          matrix[row][col] = null;
        } else {
          matrix[row][col] = counter++;
        }
      }
    }
    return matrix;
  };

  const matrix = generateMatrix();
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const onDayPress = (day: number) => {
    if (!day) return;
    const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
    onDateSelect(newDate);
  };

  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.headerButton}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDateSelect(displayDate)}>
              <Text style={[styles.headerButton, styles.doneButton]}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.monthSelector}>
            <Text style={styles.monthText}>
              {displayDate.toLocaleString('default', { month: 'long' })} {displayDate.getFullYear()}
            </Text>
            <View style={styles.monthArrows}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowButton}>
                <ChevronLeft size={20} color={Colors.PRIMARY} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowButton}>
                <ChevronRight size={20} color={Colors.PRIMARY} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.weekDaysContainer}>
            {weekDays.map(day => (
              <Text key={day} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {matrix.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.calendarRow}>
                {row.map((day, colIndex) => (
                  <TouchableOpacity
                    key={colIndex}
                    style={styles.dayCell}
                    onPress={() => day && onDayPress(day)}
                    disabled={!day}
                  >
                    <View style={[
                      styles.dayContainer,
                      selectedDate?.getFullYear() === displayDate.getFullYear() &&
                      selectedDate?.getMonth() === displayDate.getMonth() &&
                      selectedDate?.getDate() === day &&
                      styles.selectedDayContainer
                    ]}>
                      <Text style={[
                        styles.dayText,
                        !day && styles.emptyDayText,
                        selectedDate?.getFullYear() === displayDate.getFullYear() &&
                        selectedDate?.getMonth() === displayDate.getMonth() &&
                        selectedDate?.getDate() === day &&
                        styles.selectedDayText
                      ]}>
                        {day}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: '#2C2C2E', // Dark mode background color
        borderRadius: 14,
        padding: 16,
        width: '100%',
        maxWidth: 350,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 12,
    },
    headerButton: {
        fontSize: 17,
        color: Colors.PRIMARY,
    },
    doneButton: {
        fontWeight: '600',
    },
    monthSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    monthText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.WHITE,
    },
    monthArrows: {
        flexDirection: 'row',
    },
    arrowButton: {
        padding: 8,
    },
    weekDaysContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    weekDayText: {
        fontSize: 12,
        color: 'rgba(235, 235, 245, 0.6)',
        width: '14.28%',
        textAlign: 'center',
        fontWeight: '500',
    },
    calendarGrid: {},
    calendarRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 4,
    },
    dayCell: {
        width: '14.28%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayContainer: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
    },
    selectedDayContainer: {
        backgroundColor: Colors.PRIMARY,
    },
    dayText: {
        fontSize: 16,
        color: Colors.WHITE,
    },
    selectedDayText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
    },
    emptyDayText: {
        color: 'transparent',
    },
});

export default CalendarModal;