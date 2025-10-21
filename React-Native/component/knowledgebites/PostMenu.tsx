import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PostMenu = ({ visible, onClose, onNotInterested, onReport, onMute,  style }) => {
  if (!visible) return null;
  return (
    <View style={[styles.menuDropdown, style]}>
      
      <TouchableOpacity style={styles.menuItem} onPress={() => { onNotInterested && onNotInterested(); onClose && onClose(); }}>
        <Ionicons name="close-circle-outline" size={18} color="#333" style={{ marginRight: 8 }} />
        <Text style={styles.menuText}>Not Interested</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => { onReport && onReport(); onClose && onClose(); }}>
        <Ionicons name="flag-outline" size={18} color="#333" style={{ marginRight: 8 }} />
        <Text style={styles.menuText}>Report</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => { onMute && onMute(); onClose && onClose(); }}>
        <Ionicons name="volume-mute-outline" size={18} color="#333" style={{ marginRight: 8 }} />
        <Text style={styles.menuText}>Mute Account</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  menuDropdown: {
    position: 'absolute',
    top: 30,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 50,
    zIndex: 99999,
    minWidth: 160,
    paddingVertical: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 15,
    color: '#222',
  },
});

export default PostMenu; 

