import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Share,
  Platform,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';

interface TicketModalProps {
  visible: boolean;
  onClose: () => void;
  ticketDetails: {
    name: string;
    regId: string;
    date: string;
    time: string;
    venue: string;
    title: string;
    ticketCount: number;
    amount: number;
  };
}

export default function TicketSuccessModal({ visible, onClose, ticketDetails }: TicketModalProps) {
  const viewShotRef = useRef<any>(null);
  const router = useRouter();

  const handleShare = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri);
    } catch (err) {
      Alert.alert('Error', 'Unable to share ticket.');
    }
  };

  const handleDownload = async () => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Enable media access to save ticket.');
        return;
      }

      const uri = await viewShotRef.current.capture();
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('EventTickets', asset, false);
      Alert.alert('Saved', 'Ticket downloaded to gallery.');
    } catch (err) {
      Alert.alert('Error', 'Failed to save ticket.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.title}>Event is Registered!</Text>
          <Text style={styles.subtext}>Ticket shared on the contact details provided. Have it handy on your phone while entering the venue.</Text>

          {/* Share / Download */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Text style={styles.actionText}>Share ticket</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
              <Text style={styles.actionText}>Download ticket</Text>
            </TouchableOpacity>
          </View>

          {/* Ticket */}
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
            <View style={styles.ticketCard}>
              <Text style={styles.ticketTitle}>{ticketDetails.title}</Text>
              <Text style={styles.ticketVenue}>At {ticketDetails.venue}</Text>

              <View style={styles.ticketInfo}>
                <Text style={styles.ticketRow}>👤 Name: {ticketDetails.name}</Text>
                <Text style={styles.ticketRow}>🆔 Reg ID: {ticketDetails.regId}</Text>
                <Text style={styles.ticketRow}>📅 Date: {ticketDetails.date}</Text>
                <Text style={styles.ticketRow}>⏰ Time: {ticketDetails.time}</Text>
                <Text style={styles.ticketRow}>🏢 Venue: {ticketDetails.venue}</Text>
                <Text style={styles.ticketRow}>🎟 Ticket: {ticketDetails.ticketCount}</Text>
                <Text style={styles.ticketRow}>💵 Total: ₹ {ticketDetails.amount}</Text>
              </View>

              <QRCode value={ticketDetails.regId} size={120} />
              <Text style={styles.checkinNote}>Show this ticket at the entrance for check-in</Text>
              <Text style={styles.noCancelNote}>Cancellation unavailable for live events</Text>
            </View>
          </ViewShot>

          {/* Footer Buttons */}
          <View style={styles.footerButtons}>
            <TouchableOpacity onPress={() => router.replace('/socialmedia/event')}>
              <Text style={styles.browseLink}>Browse More Events</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dashboardButton} onPress={() => router.replace('/socialmedia/event')}>
              <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
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
    backgroundColor: '#00000099',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3CB371',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
  },
  ticketCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ticketVenue: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  ticketInfo: {
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  ticketRow: {
    fontSize: 14,
    marginBottom: 4,
  },
  checkinNote: {
    fontSize: 12,
    marginTop: 10,
    color: '#444',
  },
  noCancelNote: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  footerButtons: {
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  browseLink: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 12,
  },
  dashboardButton: {
    backgroundColor: '#004080',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  dashboardButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
