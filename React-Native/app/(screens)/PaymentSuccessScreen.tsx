import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import Colors from '../../constant/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';

const PaymentSuccessScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ courseTitle?: string; totalAmount?: string; currency?: string; courseId?: string }>();

  const { courseTitle, totalAmount, currency, courseId } = params;

  const handleContinue = () => {
    router.replace({ pathname: '/(screens)/StudentCourseContent', params: { courseId } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <CheckCircle2 size={80} color={Colors.SUCCESS} />
        <Text style={styles.title}>Payment Successful!</Text>
        {courseTitle && (
          <Text style={styles.message}>
            You have successfully enrolled in "{courseTitle}".
          </Text>
        )}
        {totalAmount && currency && (
             <Text style={styles.amountDetails}>
             Amount Paid: {currency} {totalAmount}
           </Text>
        )}
        <Text style={styles.infoText}>
          You can now access the course content.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue Learning</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 30,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.SUCCESS,
    marginTop: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: Colors.BLACK,
    textAlign: 'center',
    marginBottom: 8,
  },
  amountDetails: {
    fontSize: 14,
    color: Colors.GRAY,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: Colors.GRAY,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentSuccessScreen;