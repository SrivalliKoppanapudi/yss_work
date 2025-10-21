import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import Colors from '../../constant/Colors';
import { X, Clock, Users } from 'lucide-react-native';
import { supabase } from '../../lib/Superbase';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  webinarId: string;
  webinarTitle: string;
  facilitatorName: string;
  onSlotSelect: (slot: any) => void;
}

const SlotSelectionModal: React.FC<Props> = ({
  isVisible,
  onClose,
  webinarId,
  webinarTitle,
  facilitatorName,
  onSlotSelect,
}) => {
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<any[]>([]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!isVisible || !webinarId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('webinar_slots')
          .select('*')
          .eq('webinar_id', webinarId)
          .order('start_time', { ascending: true });

        if (error) throw error;
        setSlots(data || []);
      } catch (error) {
        console.error('Error fetching slots:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [isVisible, webinarId]);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getAvailableSeats = (slot: any) => {
    return slot.total_seats - (slot.booked_seats || 0);
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Select Time Slot</Text>
              <Text style={styles.subtitle}>{webinarTitle}</Text>
              <Text style={styles.facilitator}>{facilitatorName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.GRAY} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator style={styles.loader} size="large" color={Colors.PRIMARY} />
          ) : slots.length === 0 ? (
            <Text style={styles.noSlots}>No slots available</Text>
          ) : (
            <ScrollView style={styles.slotsList}>
              {slots.map((slot) => {
                const availableSeats = getAvailableSeats(slot);
                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.slotItem,
                      availableSeats <= 0 && styles.disabledSlot,
                    ]}
                    onPress={() => availableSeats > 0 && onSlotSelect(slot)}
                    disabled={availableSeats <= 0}
                  >
                    <View style={styles.slotInfo}>
                      <View style={styles.timeContainer}>
                        <Clock size={16} color={Colors.GRAY} />
                        <Text style={styles.time}>
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </Text>
                      </View>
                      <View style={styles.seatsContainer}>
                        <Users size={16} color={Colors.GRAY} />
                        <Text style={styles.seats}>
                          {availableSeats} {availableSeats === 1 ? 'seat' : 'seats'} available
                        </Text>
                      </View>
                    </View>
                    {availableSeats <= 0 && (
                      <Text style={styles.fullText}>Fully Booked</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '50%',
    maxHeight: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.BLACK,
    marginBottom: 2,
  },
  facilitator: {
    fontSize: 14,
    color: Colors.GRAY,
  },
  closeButton: {
    padding: 4,
  },
  loader: {
    marginTop: 40,
  },
  noSlots: {
    textAlign: 'center',
    marginTop: 40,
    color: Colors.GRAY,
    fontSize: 16,
  },
  slotsList: {
    marginTop: 12,
  },
  slotItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  disabledSlot: {
    opacity: 0.6,
  },
  slotInfo: {
    flexDirection: 'column',
    gap: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  seatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seats: {
    marginLeft: 8,
    color: Colors.GRAY,
  },
  fullText: {
    color: Colors.ERROR,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
});

export default SlotSelectionModal; 