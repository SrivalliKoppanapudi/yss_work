// components/socialmedia/SimpleConfirmationModal.tsx
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SimpleConfirmationModal({ visible, onClose }: Props) {
  const router = useRouter();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.title}>Event is Registered!</Text>
          <Text style={styles.subtext}>You've successfully registered for the event</Text>
          <Text style={styles.subtext}>A confirmation email with the event link and details will be sent to your registered email shortly.</Text>

          <View style={styles.buttonsRow}>
            <TouchableOpacity onPress={() => router.replace('/socialmedia/event')} style={styles.outlineBtn}>
              <Text style={styles.outlineBtnText}>Browse More Events</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace('/socialmedia/event')} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000090',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#3CB371',
  },
  subtext: {
    fontSize: 13,
    color: '#444',
    textAlign: 'center',
    marginBottom: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  outlineBtnText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#004080',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
