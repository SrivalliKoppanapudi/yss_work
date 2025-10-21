
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, TouchableWithoutFeedback } from 'react-native';
import Checkbox from 'expo-checkbox';
import { Ionicons } from '@expo/vector-icons';

const REPORT_REASONS = [
  'Sexual content',
  'Violent and repulsive content',
  'Hateful or abusive content',
  'Harmful or dangerous acts',
  'Spam or misleading',
  'Child abuse',
];

const ReportModal = ({ visible, onClose, onSubmit, videoId, onRemoveVideo }) => {
  const [selectedReasons, setSelectedReasons] = useState({});
  const [showOverlay, setShowOverlay] = useState(false);

  const handleCheckbox = (reason) => {
    setSelectedReasons((prev) => ({ ...prev, [reason]: !prev[reason] }));
  };

  const handleSubmit = async () => {
    setShowOverlay(true);
    // Optionally, send report to backend here
    if (onSubmit) {
      await onSubmit({ videoId, reasons: Object.keys(selectedReasons).filter((r) => selectedReasons[r]) });
    }
    if (onRemoveVideo && videoId) {
      onRemoveVideo(videoId);
    }
    setTimeout(() => {
      setShowOverlay(false);
      setSelectedReasons({});
      onClose();
    }, 30000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlayBg}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>Report image or title</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={28} color="#222" />
          </TouchableOpacity>
          <ScrollView style={{ marginTop: 16 }}>
            {REPORT_REASONS.map((reason) => (
              <View key={reason} style={styles.reasonRow}>
                <Checkbox
                  value={!!selectedReasons[reason]}
                  onValueChange={() => handleCheckbox(reason)}
                  color={selectedReasons[reason] ? '#0072ff' : undefined}
                  style={{ marginRight: 12 }}
                />
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Submit</Text>
          </TouchableOpacity>
        </View>
        {/* Overlay for Report Submitted */}
        {showOverlay && (
          <TouchableWithoutFeedback
            onPress={() => {
              setShowOverlay(false);
              setSelectedReasons({});
              onClose();
            }}
          >
            <View style={styles.fullOverlay}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={80} color="#fff" />
              </View>
              <Text style={styles.overlayText}>Report Submitted</Text>
            </View>
          </TouchableWithoutFeedback>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 28,
    width: 350,
    alignItems: 'stretch',
    position: 'relative',
    zIndex: 10,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 22,
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 20,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  reasonText: {
    fontSize: 16,
    color: '#222',
  },
  submitBtn: {
    backgroundColor: '#0072ff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  fullOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  checkCircle: {
    backgroundColor: '#43d167',
    borderRadius: 60,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  overlayText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 28,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ReportModal; 