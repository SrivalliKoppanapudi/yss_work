import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import Colors from '../../constant/Colors';

const CommunitySuccessModal = ({ isVisible }) => {
    return (
        <Modal visible={isVisible} transparent={true} animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <CheckCircle2 size={64} color={Colors.SUCCESS} />
                    <Text style={styles.successText}>Community Created Successfully !</Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    successText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        color: '#333',
    },
});

export default CommunitySuccessModal;