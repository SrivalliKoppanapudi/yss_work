import React from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Flag, Volume, EyeOff, Trash2 } from 'lucide-react-native';
import Colors from '../../constant/Colors';

const ThreeDotsMenu = ({ visible, onClose, onReport, onMute, isOwner, isAdmin, onDelete }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.menuContainer}>
          {/* --- FIX: Conditionally render the Delete option --- */}
          {(isOwner || isAdmin) && (
            <TouchableOpacity style={styles.menuItem} onPress={() => { onDelete(); onClose(); }}>
              <Trash2 size={20} color={Colors.ERROR} />
              <Text style={[styles.menuText, styles.deleteText]}>Delete Post</Text>
            </TouchableOpacity>
          )}

          {/* Standard options for non-owners */}
          {!isOwner && (
            <>
              <TouchableOpacity style={styles.menuItem} onPress={() => { onReport(); onClose(); }}>
                <Flag size={20} color={Colors.GRAY} />
                <Text style={styles.menuText}>Report Post</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { /* Add logic */ onClose(); }}>
                <EyeOff size={20} color={Colors.GRAY} />
                <Text style={styles.menuText}>Not Interested</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { onMute(); onClose(); }}>
                <Volume size={20} color={Colors.GRAY} />
                <Text style={styles.menuText}>Mute this user</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 10,
    paddingBottom: 30, // For safe area
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 15,
  },
  menuText: {
    fontSize: 16,
    color: Colors.BLACK,
  },
  deleteText: {
    color: Colors.ERROR,
    fontWeight: '500',
  }
});

export default ThreeDotsMenu;