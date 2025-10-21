import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/Superbase';
import Colors from '../../constant/Colors';
import { ArrowLeft, X } from 'lucide-react-native';

interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  total_seats: number;
  booked_seats: number;
}

interface SlotSelectionModalProps {
  workshopId: string;
  workshopTitle: string;
  facilitatorName: string;
  isVisible: boolean;
  onClose: () => void;
  onSlotSelect: (slot: Slot) => void;
}

const SlotSelectionModal: React.FC<SlotSelectionModalProps> = ({
  workshopId,
  workshopTitle,
  facilitatorName,
  isVisible,
  onClose,
  onSlotSelect,
}) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  useEffect(() => {
    if (isVisible) {
      fetchSlots();
    }
  }, [isVisible, workshopId]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workshop_slots')
        .select('*')
        .eq('workshop_id', workshopId)
        .eq('is_active', true)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      setSlots(data || []);
    } catch (error: any) {
      Alert.alert("Error", "Could not fetch available slots.");
      console.error("Error fetching slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (selectedSlot) {
      onSlotSelect(selectedSlot);
    } else {
      Alert.alert("No Slot Selected", "Please select a time slot to proceed.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const renderSlotItem = ({ item }: { item: Slot }) => {
    const isSelected = selectedSlot?.id === item.id;
    const isFull = item.booked_seats >= item.total_seats;

    return (
      <TouchableOpacity
        style={[styles.slotItem, isSelected && styles.slotItemSelected, isFull && styles.slotItemFull]}
        onPress={() => setSelectedSlot(item)}
        disabled={isFull}
      >
        <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]} />
        <Text style={[styles.slotText, isFull && styles.slotTextFull]}>
          Time: {formatTime(item.start_time)} to {formatTime(item.end_time)}
        </Text>
        {isFull && <Text style={styles.fullText}>(Full)</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <ArrowLeft size={24} color={Colors.BLACK} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.modalTitle} numberOfLines={1}>{workshopTitle}</Text>
              <Text style={styles.facilitatorName}>{facilitatorName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <X size={24} color={Colors.BLACK} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ marginVertical: 40 }} />
          ) : (
            <FlatList
              data={slots}
              renderItem={renderSlotItem}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={<Text style={styles.dateHeader}>Date: {slots.length > 0 ? formatDate(slots[0].start_time) : 'No dates available'}</Text>}
              ListEmptyComponent={<Text style={styles.emptyText}>No available slots for this workshop.</Text>}
            />
          )}

          <TouchableOpacity
            style={[styles.proceedButton, !selectedSlot && styles.disabledButton]}
            onPress={handleProceed}
            disabled={!selectedSlot || loading}
          >
            <Text style={styles.proceedButtonText}>Proceed</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 500,
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
        paddingBottom: 16,
        marginBottom: 16,
    },
    headerButton: {
        padding: 4,
    },
    headerTextContainer: {
        flex: 1,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.BLACK,
    },
    facilitatorName: {
        fontSize: 14,
        color: Colors.GRAY,
        marginTop: 2,
    },
    dateHeader: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.PRIMARY,
        marginBottom: 16,
        textAlign: 'center',
    },
    slotItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        marginBottom: 12,
    },
    slotItemSelected: {
        borderColor: Colors.PRIMARY,
        backgroundColor: Colors.PRIMARY_LIGHT,
    },
    slotItemFull: {
        backgroundColor: '#f8f8f8',
        borderColor: '#e0e0e0',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Colors.GRAY,
        marginRight: 12,
    },
    radioButtonSelected: {
        borderColor: Colors.PRIMARY,
        backgroundColor: Colors.PRIMARY,
    },
    slotText: {
        fontSize: 16,
        fontWeight: '500',
    },
    slotTextFull: {
        color: Colors.GRAY,
        textDecorationLine: 'line-through',
    },
    fullText: {
        marginLeft: 'auto',
        color: Colors.ERROR,
        fontWeight: 'bold',
        fontSize: 12,
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.GRAY,
        marginVertical: 20,
    },
    proceedButton: {
        backgroundColor: Colors.PRIMARY,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    proceedButtonText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: Colors.GRAY,
    },
});


export default SlotSelectionModal;