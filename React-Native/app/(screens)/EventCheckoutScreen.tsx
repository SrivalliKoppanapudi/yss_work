import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Alert, ScrollView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStripe, PaymentSheetError } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import { supabase } from '../../lib/Superbase';
import Colors from '../../constant/Colors';
import { useAuth } from '../../Context/auth';
import TicketSuccessModal from '../../component/socialmedia/TicketSuccessModal';
import SimpleConfirmationModal from '../../component/socialmedia/SimpleConfirmationModal';


export default function EventCheckoutScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const params = useLocalSearchParams<{
    eventId: string;
    eventTitle: string;
    amount: string;
    currency: string;
    fullName: string;
    email: string;
    mobile: string;
    designation: string;
    city: string;
  }>();




  const [initializing, setInitializing] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showOnlineSuccessModal, setShowOnlineSuccessModal] = useState(false);
const [showOfflineSuccessModal, setShowOfflineSuccessModal] = useState(false);

  const [ticketDetails, setTicketDetails] = useState(null);

  const [eventDetails, setEventDetails] = useState({
    title: params.eventTitle || 'Event',
    amount: parseFloat(params.amount || '0'),
    currency: params.currency || 'INR',
  });

  const hasInitializedSheet = useRef(false);

  useEffect(() => {
    if (!session || !session.user?.id) {
      Alert.alert('Login Required', 'Please log in to register for events.');
      router.replace('/auth/SignIn');
      return;
    }

    if (isNaN(eventDetails.amount)) {
      Alert.alert('Error', 'Invalid event amount provided.');
      router.back();
      return;
    }

    if (eventDetails.amount <= 0 || params.amount.toLowerCase() === 'free') {
      handleFreeEventRegistration();
    } else if (!hasInitializedSheet.current) {
      initializePaymentSheetWrapper();
    }
  }, [session]);

  const generateRandomId = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};


  const fetchStripeParams = async () => {
    const amountInPaise = Math.round(eventDetails.amount * 100);

    const payload = {
      amount: amountInPaise,
      currency: eventDetails.currency.toLowerCase(),
      userId: session.user.id,
      itemId: params.eventId,
      itemTitle: eventDetails.title,
      userEmail: session.user.email,
      fullName: params.fullName,
      mobile: params.mobile,
      designation: params.designation,
      city: params.city,
    };

    console.log('🔁 Sending to create-payment-intent:', payload);

    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: payload,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('❌ Stripe function error:', error);
      Alert.alert('Error', error.message || 'Unable to initiate payment.');
      return null;
    }

    return {
      clientSecret: data.clientSecret,
      customerId: data.customer,
      ephemeralKey: data.ephemeralKey,
    };
  };

  const initializePaymentSheetWrapper = async () => {
    setInitializing(true);
    hasInitializedSheet.current = true;

    const paymentData = await fetchStripeParams();
    if (!paymentData) {
      setInitializing(false);
      return;
    }

    const { clientSecret, customerId, ephemeralKey } = paymentData;

    const { error } = await initPaymentSheet({
      customerId,
      customerEphemeralKeySecret: ephemeralKey,
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'Event Portal',
      returnURL: 'myapp://stripe-redirect',
      allowsDelayedPaymentMethods: true,
    });

    if (error) {
      console.error('Stripe Init Error:', error);
      Alert.alert('Stripe Error', error.message);
      hasInitializedSheet.current = false;
    }

    setInitializing(false);
  };

  const handleFreeEventRegistration = async () => {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', params.eventId)
        .eq('user_id', session.user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (existing) {
        Alert.alert('Already Registered', 'You have already registered for this event.');
        router.replace('/socialmedia/event');
        return;
      }

      const { error } = await supabase.from('event_registrations').insert({
        event_id: params.eventId,
        user_id: session.user.id,
        full_name: params.fullName,
        email: params.email,
        mobile: params.mobile,
        designation: params.designation,
        city: params.city,
        registered_at: new Date().toISOString(),
        status: 'registered',
      });

      if (error) throw error;

      await fetchEventDetailsAndSetTicket();

    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not complete registration.');
    }
  };

  const handlePaidRegistration = async () => {
    setProcessingPayment(true);
    const { error } = await presentPaymentSheet();

    if (error && error.code !== PaymentSheetError.Canceled) {
      Alert.alert('Payment Failed', error.message);
    } else {
      // Alert.alert('Success', 'You are registered for the event!');
      
      await handleFreeEventRegistration(); // Keep this as it inserts to DB


    }

    setProcessingPayment(false);
  };

  const fetchEventDetailsAndSetTicket = async () => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('name, event_date, start_time, end_time, location, registration_fee, event_mode')
      .eq('id', params.eventId)
      .single();

    if (error) throw error;

    console.log("🎯 Event Mode:", data.event_mode);



    if (data?.event_mode?.trim().toLowerCase() === 'offline') {
 
      // Offline event => generate ticket
      const eventDate = new Date(data.event_date).toDateString();
      const start = new Date(data.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const end = new Date(data.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Set ticket data
  const ticket = {
    name: params.fullName,
    regId: generateRandomId(),
    date: eventDate,
    time: `${start} - ${end}`,
    venue: data.location,
    title: data.name,
    ticketCount: 1,
    amount: parseFloat(data.registration_fee || '0'),
  };
console.log(ticket)
  setTicketDetails(ticket);
  setShowOfflineSuccessModal(true);
    } else {
      // Online event => show simple modal
      setShowOnlineSuccessModal(true);
    }
  } catch (err) {
    console.error('Error fetching event data:', err);
    Alert.alert('Error', 'Unable to load event details.');
  }
};


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Event Summary</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Event:</Text>
            <Text style={styles.summaryItemValue}>{eventDetails.title}</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalItemLabel}>Amount:</Text>
            <Text style={styles.totalItemValue}>
              {eventDetails.currency.toUpperCase()} {eventDetails.amount.toFixed(2)}
            </Text>
          </View>
        </View>

        {initializing ? (
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
        ) : eventDetails.amount <= 0 ? (
          <Button mode="contained" onPress={handleFreeEventRegistration} style={styles.payButton}>
            Register (Free)
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={handlePaidRegistration}
            loading={processingPayment}
            disabled={processingPayment}
            style={styles.payButton}
          >
            Pay {eventDetails.currency.toUpperCase()} {eventDetails.amount.toFixed(2)}
          </Button>
        )}

        <Text style={styles.securePaymentText}>🔒 Powered by Stripe</Text>
        
     {ticketDetails && (
  <TicketSuccessModal
    visible={showOfflineSuccessModal}
    onClose={() => setShowOfflineSuccessModal(false)}
    ticketDetails={ticketDetails}
  />
)}

<SimpleConfirmationModal
  visible={showOnlineSuccessModal}
  onClose={() => setShowOnlineSuccessModal(false)}
/>


      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.WHITE },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: { padding: 6, marginRight: 10 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.BLACK,
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f9fc',
  },
  summaryCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 450,
    marginBottom: 20,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginBottom: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItemLabel: {
    fontSize: 16,
    color: Colors.GRAY,
  },
  summaryItemValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalItemLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.BLACK,
  },
  totalItemValue: {
    fontSize: 18,
    color: Colors.PRIMARY,
    fontWeight: 'bold',
  },
  payButton: {
    width: '100%',
    maxWidth: 450,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.SUCCESS,
    marginTop: 20,
  },
  securePaymentText: {
    marginTop: 15,
    fontSize: 13,
    color: Colors.GRAY,
    textAlign: 'center',
  },
});
