import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/Superbase';

export const useMuteAccount = () => {
  const [toastVisible, setToastVisible] = useState(false);

  // Call this function to mute an account
  const muteAccount = async (accountId, currentUserId) => {
    if (!accountId || !currentUserId) return;
    // Fetch current muted_accounts array
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('muted_accounts')
      .eq('id', currentUserId)
      .single();
    if (fetchError) {
      console.error('Failed to fetch profile for muting:', fetchError.message);
      return;
    }
    const prevMuted = Array.isArray(profile?.muted_accounts) ? profile.muted_accounts : [];
    if (prevMuted.includes(accountId)) {
      setToastVisible(true);
      return;
    }
    const newMuted = [...prevMuted, accountId];
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ muted_accounts: newMuted })
      .eq('id', currentUserId);
    if (updateError) {
      console.error('Failed to mute account:', updateError.message);
      return;
    }
    setToastVisible(true);
  };

  // Toast UI
  const MuteToast = () => toastVisible ? (
    <View style={styles.toastContainer}>
      <Ionicons name="checkmark-circle" size={22} color="#43d167" style={styles.toastIcon} />
      <Text style={styles.toastText}>Muted contents from this account</Text>
      <TouchableOpacity onPress={() => setToastVisible(false)} style={styles.toastClose}>
        <Ionicons name="close" size={18} color="#333" />
      </TouchableOpacity>
    </View>
  ) : null;

  return { muteAccount, MuteToast };
};

const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6fbe6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    position: 'absolute',
    bottom: 40,
    left: 10,
    zIndex: 200,
  },
  toastIcon: {
    marginRight: 8,
  },
  toastText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
    flex: 1,
  },
  toastClose: {
    marginLeft: 8,
    padding: 2,
  },
}); 