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
      workshopTitle: string; 
      isOnline: string;
      registrationId: string;
      startTime: string;
      endTime: string;
      venue: string;
      price: string;
  }>();

  const { workshopTitle, registrationId, startTime, endTime, venue, price } = params;
  const isOnlineWorkshop = params.isOnline === 'true';

  const navigateToDashboard = () => {
    router.replace('/(screens)/Home');
  };

  const navigateToBrowse = () => {
    router.replace('/(screens)/Workshop');
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTimeRange = (start: string, end: string) => {
    if (!start || !end) return 'N/A';
    const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const startStr = new Date(start).toLocaleTimeString('en-US', options);
    const endStr = new Date(end).toLocaleTimeString('en-US', options);
    return `${startStr} - ${endStr}`;
  };

  return (
    <View style={styles.outerContainer}>
        <View style={styles.card}>
            <View style={styles.successHeader}>
                <CheckCircle2 size={32} color={Colors.SUCCESS} />
                <Text style={styles.title}>Workshop Registered!</Text>
            </View>
            
            {isOnlineWorkshop ? (
                <View style={styles.onlineContainer}>
                    <Text style={styles.message}>You've successfully registered for the workshop.</Text>
                    <Text style={styles.subMessage}>A confirmation email with the workshop link and details will be sent to your registered email shortly.</Text>
                    <TouchableOpacity style={styles.reminderButton}>
                        <Bell size={16} color={Colors.PRIMARY} />
                        <Text style={styles.reminderText}>Set Reminder</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView style={styles.offlineScrollView} contentContainerStyle={{alignItems: 'center'}}>
                    <Text style={styles.bookingTitle}>Booking Details</Text>
                    <View style={styles.ticketInfoBox}>
                        <Ticket size={24} color="#f59e0b" />
                        <Text style={styles.ticketInfoText}>Ticket shared on the contact details & Email ID provided. Have it handy on your phone while entering the venue.</Text>
                    </View>
                    
                    <View style={styles.ticketContainer}>
                        <View style={styles.ticketHeader}>
                            <Text style={styles.ticketLogoText}>Lynk T</Text> 
                            <Text style={styles.ticketType}>M - Ticket</Text>
                        </View>
                        <View style={styles.ticketBody}>
                            <Text style={styles.ticketWorkshopTitle}>{workshopTitle}</Text>
                            <Text style={styles.ticketVenue}>{venue}</Text>
                            
                            <View style={styles.ticketDetailsGrid}>
                                <View style={styles.ticketDetailRow}>
                                    <Text style={styles.ticketLabel}>Name</Text>
                                    <Text style={styles.ticketValue}>{session?.user?.user_metadata?.full_name || 'N/A'}</Text>
                                </View>
                                <View style={styles.ticketDetailRow}>
                                    <Text style={styles.ticketLabel}>Registration ID</Text>
                                    <Text style={styles.ticketValue}>{registrationId?.substring(0, 8)}</Text>
                                </View>
                                <View style={styles.ticketDetailRow}>
                                    <Text style={styles.ticketLabel}>Date</Text>
                                    <Text style={styles.ticketValue}>{formatDate(startTime || '')}</Text>
                                </View>
                                 <View style={styles.ticketDetailRow}>
                                    <Text style={styles.ticketLabel}>Time</Text>
                                    <Text style={styles.ticketValue}>{formatTimeRange(startTime || '', endTime || '')}</Text>
                                </View>
                                 <View style={styles.ticketDetailRow}>
                                    <Text style={styles.ticketLabel}>Venue</Text>
                                    <Text style={styles.ticketValue}>{venue}</Text>
                                </View>
                                 <View style={styles.ticketDetailRow}>
                                    <Text style={styles.ticketLabel}>Ticket</Text>
                                    <Text style={styles.ticketValue}>1</Text>
                                </View>
                                 <View style={styles.ticketDetailRow}>
                                    <Text style={styles.ticketLabel}>Total</Text>
                                    <Text style={styles.ticketValue}>₹{price}</Text>
                                </View>
                            </View>

                            <View style={styles.qrCodeContainer}>
                                {registrationId ? (
                                    <QRCode value={registrationId} size={110} />
                                ) : ( <Text>QR Code Unavailable</Text> )}
                                <Text style={styles.qrText}>Show this ticket at the entrance for check-in</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.cancellationButton} disabled>
                            <Text style={styles.cancellationText}>Cancellation unavailable for live Events</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.browseButton} onPress={navigateToBrowse}>
                    <Text style={styles.browseButtonText}>Browse More Workshops</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dashboardButton} onPress={navigateToDashboard}>
                    <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
                </TouchableOpacity>
            </View>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 500,
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    successHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    onlineContainer: {
        alignItems: 'center',
        width: '100%',
        paddingVertical: 10,
    },
    message: {
        fontSize: 18,
        color: Colors.GRAY,
        marginBottom: 8,
        lineHeight: 22,
    },
    subMessage: {
        fontSize: 14,
        color: Colors.GRAY,
        marginBottom: 24,
        lineHeight: 20,
    },
    reminderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    reminderText: {
        color: Colors.PRIMARY,
        fontWeight: '600',
    },
    offlineScrollView: {
        width: '100%',
        maxHeight: 500,
    },
    bookingTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 16,
        textAlign: 'center',
    },
    ticketInfoBox: {
        flexDirection: 'row',
        backgroundColor: '#fffbeb',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
        gap: 8,
    },
    ticketInfoText: {
        flex: 1,
        color: '#b45309',
        fontSize: 13,
        lineHeight: 18,
    },
    ticketContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        padding: 16,
        alignItems: 'center',
        width: '100%',
        alignSelf: 'center',
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    ticketLogoText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    ticketType: {
        fontWeight: 'bold',
    },
    ticketBody: {
        width: '100%',
        marginTop: 16,
    },
    ticketWorkshopTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: Colors.BLACK,
    },
    ticketVenue: {
        fontSize: 14,
        color: Colors.GRAY,
        textAlign: 'center',
        marginBottom: 16,
    },
    ticketDetailsGrid: {
        borderTopWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#ccc',
        paddingTop: 16,
    },
    ticketDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    ticketLabel: {
        color: Colors.GRAY,
        fontSize: 14,
    },
    ticketValue: {
        color: Colors.BLACK,
        fontSize: 14,
        fontWeight: '500',
    },
    qrCodeContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    qrText: {
        color: Colors.GRAY,
        fontSize: 12,
        marginTop: 8,
    },
    cancellationButton: {
        marginTop: 16,
        backgroundColor: '#f0f0f0',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    cancellationText: {
        color: Colors.GRAY,
        fontSize: 12,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 24,
    },
    browseButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: Colors.PRIMARY,
        alignItems: 'center',
        marginRight: 8,
    },
    browseButtonText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    dashboardButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        backgroundColor: Colors.PRIMARY,
        alignItems: 'center',
        marginLeft: 8,
    },
    dashboardButtonText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
    },
});

export default RegistrationSuccessScreen;