import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/Superbase';
import { useAuth } from '../../Context/auth'; 
import Colors from '../../constant/Colors'; 
import { Button } from 'react-native-paper';
import { useStripe, PaymentSheetError } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    courseId: string;
    courseTitle: string;
    amount: string;
    currency: string;
  }>();
  const { session } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [initializing, setInitializing] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [courseDetails, setCourseDetails] = useState({
    title: params.courseTitle || 'Course',
    amount: parseFloat(params.amount || '0'),
    currency: params.currency || 'INR',
  });
  const hasInitializedPaymentSheet = useRef(false); 

  useEffect(() => {
    if (
      params.courseId &&
      params.amount &&
      params.currency &&
      session &&
      !hasInitializedPaymentSheet.current 
    ) {
      console.log("CheckoutScreen: Conditions met, attempting to initialize payment sheet.");
      initializePaymentSheetWrapper();
    } else if (!session && initializing) {
      Alert.alert("Authentication Error", "Your session has expired. Please log in again.");
      router.replace('/auth/SignIn');
      setInitializing(false);
    } else if ((!params.courseId || !params.amount || !params.currency) && initializing) {
      Alert.alert("Error", "Missing payment details. Please try again.");
      if (router.canGoBack()) router.back(); else router.replace('/(screens)/Home');
      setInitializing(false);
    }
  }, [params.courseId, params.amount, params.currency, session]); 

  const fetchPaymentSheetParams = async () => {
    try {
      if (!session?.user?.id) {
        throw new Error("User not authenticated. Please sign in.");
      }
      if (!params.courseId) {
        throw new Error("Course ID is missing.");
      }

      const amountInSmallestUnit = Math.round(courseDetails.amount * 100);
      if (isNaN(amountInSmallestUnit) || amountInSmallestUnit <= 0) {
        console.error("Invalid amount for payment:", courseDetails.amount);
        throw new Error("Invalid course amount specified for payment.");
      }

      console.log("Invoking 'create-payment-intent' with:", {
        amount: amountInSmallestUnit,
        currency: courseDetails.currency.toLowerCase(),
        userId: session.user.id,
        courseId: params.courseId,
        courseTitle: courseDetails.title,
        userEmail: session.user.email,
      });

      const { data, error: functionError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: amountInSmallestUnit,
          currency: courseDetails.currency.toLowerCase(),
          userId: session.user.id,
          courseId: params.courseId,
          courseTitle: courseDetails.title,
          userEmail: session.user.email,
        },
      });

      if (functionError) {
        console.error("Supabase function invocation error details:", functionError);
        throw new Error(functionError.message || "Failed to communicate with payment server.");
      }
      if (!data || !data.clientSecret || !data.ephemeralKey || !data.customer) {
          console.error("Server response missing parameters:", data);
          throw new Error("Failed to retrieve all required payment parameters from server.");
      }
      
      console.log("Payment sheet params fetched from server:", data);
      return {
        paymentIntentClientSecret: data.clientSecret,
        ephemeralKeySecret: data.ephemeralKey,
        customerId: data.customer,
      };
    } catch (err: any) {
      console.error("Error in fetchPaymentSheetParams:", err);
      Alert.alert("Payment Setup Error", err.message || "Could not initialize payment setup.");
      return null;
    }
  };

  const initializePaymentSheetWrapper = async () => {
    if (!session) {
      console.log("initializePaymentSheetWrapper: No session, returning.");
      setInitializing(false); 
      return;
    }

    setInitializing(true);
    hasInitializedPaymentSheet.current = true; 

    try {
        const paymentParams = await fetchPaymentSheetParams();
        if (!paymentParams) {
          hasInitializedPaymentSheet.current = false;
          return; // Exit if params couldn't be fetched
        }

        const { paymentIntentClientSecret, ephemeralKeySecret, customerId } = paymentParams;

        const { error: initError } = await initPaymentSheet({
          merchantDisplayName: "Lynkt Academy",
          customerId: customerId,
          customerEphemeralKeySecret: ephemeralKeySecret,
          paymentIntentClientSecret: paymentIntentClientSecret,
          allowsDelayedPaymentMethods: true,
          returnURL: 'myapp://stripe-redirect', 
          defaultBillingDetails: {
            name: session?.user?.user_metadata?.full_name || 'Customer Name',
            email: session?.user?.email,
          }
        });

        if (initError) {
          Alert.alert(`Payment Sheet Init Error: ${initError.code}`, initError.message);
          console.error("Stripe initPaymentSheet error:", initError);
          hasInitializedPaymentSheet.current = false;
        } else {
          console.log("Payment Sheet Initialized Successfully");
        }
    } catch (e: any) {
        console.error("Error during payment sheet initialization wrapper:", e);
        Alert.alert("Initialization Error", e.message || "Could not prepare for payment.");
        hasInitializedPaymentSheet.current = false; // Allow re-try
    } finally {
        setInitializing(false); 
    }
  };

  const handlePayment = async () => {
    if (initializing) {
      Alert.alert("Please wait", "Payment system is still initializing.");
      return;
    }
    setPaymentProcessing(true);
    const { error: paymentError } = await presentPaymentSheet();

    if (paymentError) {
      if (paymentError.code !== PaymentSheetError.Canceled) {
        Alert.alert(`Payment Error: ${paymentError.code}`, paymentError.message);
        console.error("Stripe presentPaymentSheet error:", paymentError);
      }
    } else {
      Alert.alert("Payment Successful!", "You have successfully enrolled in the course.");
      await enrollUserInCourse();
    }
    setPaymentProcessing(false);
  };

  const enrollUserInCourse = async () => {
    try {
      if (!session?.user?.id || !params.courseId) {
        throw new Error("User or Course ID missing for enrollment.");
      }

      const { error: enrollError } = await supabase
        .from('course_enrollments')
        .insert({
          course_id: params.courseId,
          user_id: session.user.id,
          enrolled_at: new Date().toISOString(), // Corrected column name
          status: 'active',
          progress: 0, 
        });

      if (enrollError) {
        console.error("Error inserting into course_enrollments:", enrollError);
        throw enrollError;
      }
      console.log("Successfully inserted into course_enrollments");

      const { data: courseData, error: courseFetchError } = await supabase
        .from('courses')
        .select('enrollmentcount')
        .eq('id', params.courseId)
        .single();

      if (courseFetchError) {
        console.error("Error fetching course enrollment count:", courseFetchError);
        throw courseFetchError;
      }
      console.log("Fetched course enrollment count:", courseData?.enrollmentcount);

      const newEnrollmentCount = (courseData?.enrollmentcount || 0) + 1;
      const { error: updateError } = await supabase
        .from('courses')
        .update({ enrollmentcount: newEnrollmentCount })
        .eq('id', params.courseId);

      if (updateError) {
        console.warn("Failed to update course enrollment count:", updateError.message);
      } else {
        console.log("Successfully updated course enrollment count to:", newEnrollmentCount);
      }
      
      router.replace({ pathname: '/(screens)/StudentCourseContent', params: { courseId: params.courseId } });

    } catch (err: any) {
      console.error("Error enrolling user after payment:", err);
      Alert.alert("Enrollment Error", "Payment was successful, but there was an issue enrolling you in the course. Please contact support.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Enrollment</Text>
        </View>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Course:</Text>
            <Text style={styles.summaryItemValue}>{courseDetails.title}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Price:</Text>
            <Text style={styles.summaryItemValue}>
              {courseDetails.currency.toUpperCase()} {courseDetails.amount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalItemLabel}>Total Amount:</Text>
            <Text style={styles.totalItemValue}>
              {courseDetails.currency.toUpperCase()} {courseDetails.amount.toFixed(2)}
            </Text>
          </View>
        </View>

        {initializing ? (
          <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.loader} />
        ) : (
          <Button
            mode="contained"
            onPress={handlePayment}
            disabled={paymentProcessing || initializing}
            loading={paymentProcessing}
            style={styles.payButton}
            labelStyle={styles.payButtonLabel}
            textColor={Colors.WHITE} 
          >
            {paymentProcessing ? 'Processing...' : `Pay ${courseDetails.currency.toUpperCase()} ${courseDetails.amount.toFixed(2)}`}
          </Button>
        )}
        <Text style={styles.securePaymentText}>
          🔒 Secure payment powered by Stripe
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: { padding: 6, marginRight: 10 },
  headerTitle: {
    fontSize: Platform.OS === 'web' ? 20 : 18,
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
    padding: 25,
    width: '100%',
    maxWidth: 450,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 20, 
    fontWeight: 'bold',
    color: Colors.PRIMARY, 
    marginBottom: 20, 
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
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
    color: Colors.BLACK,
    fontWeight: '500',
  },
  totalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20, 
    paddingTop: 20, 
    borderTopWidth: 2, 
    borderTopColor: Colors.PRIMARY, 
  },
  totalItemLabel: {
    fontSize: 18,
    color: Colors.BLACK,
    fontWeight: 'bold',
  },
  totalItemValue: {
    fontSize: 18,
    color: Colors.PRIMARY,
    fontWeight: 'bold',
  },
  payButton: {
    width: '100%',
    maxWidth: 450,
    paddingVertical: 10, 
    borderRadius: 8,
    backgroundColor: Colors.SUCCESS, 
    elevation: 2, 
  },
  payButtonLabel: {
    fontSize: 18, 
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 40, 
  },
  securePaymentText: {
    marginTop: 25, 
    fontSize: 13, 
    color: Colors.GRAY,
    textAlign: 'center',
  }
});
