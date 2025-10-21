import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '../../../constant/Colors';
import { CheckCircle2, Ticket, Bell } from 'lucide-react-native';
import { useAuth } from '../../../Context/auth';
import QRCode from 'react-native-qrcode-svg';

const RegistrationSuccessScreen = () => {
  const router = useRouter();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ 
    webinarTitle: string; 
    isOnline: string;
    registrationId: string;
    startTime: string;
    endTime: string;
    venue: string;
    price: string;
  }>();

  const { webinarTitle, registrationId, startTime, endTime, venue, price } = params;
  const isOnlineWebinar = params.isOnline === 'true';

  const navigateToDashboard = () => {
    router.replace('/(screens)/Home');
  };

  const navigateToBrowse = () => {
    router.replace('/(screens)/Webinar/webinar');
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTimeRange = (start: string, end: string) => {
    if (!start || !end) return 'N/A';
    const options: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    };
    const startStr = new Date(start).toLocaleTimeString('en-US', options);
    const endStr = new Date(end).toLocaleTimeString('en-US', options);
    return `${startStr} - ${endStr}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <CheckCircle2 size={64} color={Colors.SUCCESS} />
          <Text style={styles.title}>Registration Successful!</Text>
          <Text style={styles.subtitle}>
            You're all set for the webinar
          </Text>
        </View>

        <View style={styles.ticketContainer}>
          <View style={styles.ticketHeader}>
            <Ticket size={20} color={Colors.PRIMARY} />
            <Text style={styles.ticketTitle}>Webinar Details</Text>
          </View>

          <View style={styles.qrContainer}>
            <QRCode
              value={registrationId}
              size={120}
              color={Colors.BLACK}
              backgroundColor={Colors.WHITE}
            />
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.webinarTitle}>{webinarTitle}</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{formatDate(startTime)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time:</Text>
              <Text style={styles.detailValue}>{formatTimeRange(startTime, endTime)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mode:</Text>
              <Text style={styles.detailValue}>{isOnlineWebinar ? 'Online' : 'Offline'}</Text>
            </View>

            {venue && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Venue:</Text>
                <Text style={styles.detailValue}>{venue}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price:</Text>
              <Text style={styles.detailValue}>
                {price === 'Free' ? 'Free' : `₹${price}`}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{session?.user?.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.reminderContainer}>
          <Bell size={20} color={Colors.PRIMARY} />
          <Text style={styles.reminderText}>
            We'll send you a reminder email before the webinar starts
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={navigateToDashboard}
          >
            <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={navigateToBrowse}
          >
            <Text style={styles.secondaryButtonText}>Browse More Webinars</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.SUCCESS,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.GRAY,
    textAlign: 'center',
  },
  ticketContainer: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 20,
    marginVertical: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    paddingTop: 20,
  },
  webinarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    width: 80,
    fontSize: 14,
    color: Colors.GRAY,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: Colors.BLACK,
    fontWeight: '500',
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  reminderText: {
    marginLeft: 12,
    fontSize: 14,
    color: Colors.GRAY,
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.PRIMARY,
  },
  secondaryButton: {
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
  },
  primaryButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: Colors.PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegistrationSuccessScreen; 