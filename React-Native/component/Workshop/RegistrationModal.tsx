import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import Colors from '../../constant/Colors';
import { useAuth } from '../../Context/auth';
import { ArrowLeft, X } from 'lucide-react-native';
import { supabase } from '../../lib/Superbase';

interface RegistrationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onProceed: (registrationData: any) => void;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ isVisible, onClose, onProceed }) => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [designation, setDesignation] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [city, setCity] = useState('');

  // Pre-fill form with logged-in user's data
  useEffect(() => {
    const fetchUserData = async () => {
      if (isVisible && session?.user) {
        setLoading(true);
        // Pre-fill from auth session first
        setEmail(session.user.email || '');
        setFullName(session.user.user_metadata?.full_name || '');
        
        // Then try to get more details from the profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('phoneNumber, occupation')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setMobile(profile.phoneNumber || '');
          setDesignation(profile.occupation || '');
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [isVisible, session]);

  const handleProceedClick = () => {
    if (!fullName.trim() || !email.trim() || !mobile.trim()) {
      Alert.alert("Required Fields Missing", "Please fill in your name, email, and mobile number.");
      return;
    }

    const registrationData = {
      fullName,
      email,
      mobile,
      designation,
      schoolName,
      city,
    };
    onProceed(registrationData);
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <ArrowLeft size={24} color={Colors.BLACK} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Registration for the Workshop</Text>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <X size={24} color={Colors.BLACK} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator style={{ padding: 40 }} size="large" color={Colors.PRIMARY} />
          ) : (
            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Full Name*</Text>
              <TextInput style={styles.input} placeholder="Enter your full name" value={fullName} onChangeText={setFullName} />

              <Text style={styles.label}>Email ID*</Text>
              <TextInput style={styles.input} placeholder="Enter your Email ID" value={email} onChangeText={setEmail} keyboardType="email-address" />

              <Text style={styles.label}>Mobile No*</Text>
              <TextInput style={styles.input} placeholder="Enter your mobile number" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />

              <Text style={styles.label}>Designation/Role*</Text>
              <TextInput style={styles.input} placeholder="e.g., Teacher, HOD, Principal" value={designation} onChangeText={setDesignation} />

              <Text style={styles.label}>School Name/Institute Name</Text>
              <TextInput style={styles.input} placeholder="Enter your school or institute name" value={schoolName} onChangeText={setSchoolName} />

              <Text style={styles.label}>City*</Text>
              <TextInput style={styles.input} placeholder="Enter your city" value={city} onChangeText={setCity} />
            </ScrollView>
          )}

          <TouchableOpacity style={styles.proceedButton} onPress={handleProceedClick}>
            <Text style={styles.proceedButtonText}>Proceed</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    paddingBottom: 16,
    marginBottom: 16,
  },
  headerButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.BLACK,
  },
  formContainer: {
    flexGrow: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.GRAY,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  proceedButton: {
    backgroundColor: Colors.PRIMARY,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  proceedButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegistrationModal;