import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '../../../constant/Colors';
import { supabase } from '../../../lib/Superbase';
import { useStripe } from '@stripe/stripe-react-native';
import { useAuth } from '../../../Context/auth';

export default function WebinarRegistrationScreen() {
  const { webinarId, slotId } = useLocalSearchParams<{ webinarId: string; slotId: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [webinar, setWebinar] = useState<any>(null);
  const [slot, setSlot] = useState<any>(null);
  const [initializing, setInitializing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) {
      Alert.alert('Login Required', 'Please log in to register for webinars.');
      router.replace('/auth/SignIn');
      return;
    }

    const fetchWebinarAndSlot = async () => {
      try {
        const [webinarResult, slotResult] = await Promise.all([
          supabase
            .from('webinars')
            .select('*')
            .eq('id', webinarId)
            .single(),
          supabase
            .from('webinar_slots')
            .select('*')
            .eq('id', slotId)
            .single()
        ]);

        if (webinarResult.error) throw webinarResult.error;
        if (slotResult.error) throw slotResult.error;

        setWebinar(webinarResult.data);
        setSlot(slotResult.data);
      } catch (error: any) {
        Alert.alert('Error', error.message);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchWebinarAndSlot();
  }, [webinarId, slotId, session]);

  const handleRegister = async () => {
    if (!session?.user?.id || !webinar || !slot) return;

    try {
      const { error } = await supabase
        .from('webinar_registrations')
        .insert([{
          webinar_id: webinarId,
          slot_id: slotId,
          user_id: session.user.id,
          name,
          email: session.user.email.toLowerCase(),
          status: 'confirmed'
        }]);

      if (error) throw error;

      // Update booked seats count
      const { error: updateError } = await supabase
        .from('webinar_slots')
        .update({ booked_seats: (slot.booked_seats || 0) + 1 })
        .eq('id', slotId);

      if (updateError) throw updateError;

      router.push({
        pathname: '/Webinar/RegistrationSuccessScreen',
        params: {
          webinarTitle: webinar.title,
          isOnline: webinar.mode === 'Online' ? 'true' : 'false',
          registrationId: webinarId,
          startTime: slot.start_time,
          endTime: slot.end_time,
          venue: webinar.location,
          price: webinar.price,
        }
      });
    } catch (error: any) {
      Alert.alert('Registration Error', error.message);
    }
  };

  const handlePaidRegistration = async () => {
    if (!session?.user?.id || !webinar) return;

    setInitializing(true);
    try {
      const amountInPaise = Math.round(Number(webinar.price) * 100);
      const payload = {
        amount: amountInPaise,
        currency: 'inr',
        userId: session.user.id,
        itemId: webinar.id,
        itemTitle: webinar.title,
        userEmail: session.user.email,
      };

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: payload
      });

      if (error) throw error;

      const { clientSecret, customer, ephemeralKey } = data;
      const { error: initError } = await initPaymentSheet({
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Lynkt Webinars',
        allowsDelayedPaymentMethods: true,
        returnURL: 'myapp://stripe-redirect',
        defaultBillingDetails: {
          name: name,
          email: session.user.email,
        },
      });

      if (initError) throw initError;
      setInitializing(false);
      setProcessingPayment(true);

      const { error: paymentError } = await presentPaymentSheet();
      if (paymentError) {
        if (paymentError.code === 'Canceled') {
          setProcessingPayment(false);
          return;
        }
        throw paymentError;
      }

      // On successful payment, register the user
      await handleRegister();
    } catch (err: any) {
      Alert.alert('Payment Error', err.message || 'Could not complete payment.');
    } finally {
      setInitializing(false);
      setProcessingPayment(false);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register for Webinar</Text>
      <Text style={styles.webinarTitle}>{webinar?.title}</Text>
      <Text style={styles.facilitator}>Facilitator: {webinar?.facilitator}</Text>
      <Text style={styles.details}>
        Date: {new Date(webinar?.date).toLocaleDateString()}
      </Text>
      {slot && (
        <Text style={styles.details}>
          Time: {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
        </Text>
      )}
      <Text style={styles.details}>
        Mode: {webinar?.mode}
        {webinar?.mode === 'Offline' && ` (${webinar?.location})`}
      </Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Your Name"
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, { color: '#666' }]}
        value={session?.user?.email || ''}
        editable={false}
        placeholder="Your Email"
        placeholderTextColor="#888"
      />

      <TouchableOpacity
        style={[
          styles.registerButton,
          (initializing || processingPayment || !name) && styles.disabledButton
        ]}
        onPress={webinar?.price === 'Free' ? handleRegister : handlePaidRegistration}
        disabled={initializing || processingPayment || !name}
      >
        <Text style={styles.registerButtonText}>
          {initializing ? 'Initializing...' :
           processingPayment ? 'Processing...' :
           webinar?.price === 'Free' ? 'Register' :
           `Pay ₹${webinar?.price} & Register`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  webinarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  facilitator: {
    fontSize: 16,
    color: Colors.GRAY,
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: Colors.GRAY,
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  registerButton: {
    backgroundColor: Colors.PRIMARY,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  registerButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
}); 