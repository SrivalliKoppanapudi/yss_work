import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Colors from '../../constant/Colors';

const CommunityHeader = () => {
    const router = useRouter();
    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={24} color={Colors.BLACK} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Community Forums</Text>
            {/* --- FIX: The empty spacer View has been removed --- */}
            <View style={styles.spacer} /> 
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        // No style needed, it will take its own space
    },
    headerTitle: {
        // --- FIX: Use flexbox to center the title correctly ---
        flex: 1,
        textAlign: 'center',
        // -----------------------------------------------------
        fontSize: 18,
        fontWeight: 'bold',
    },
    // --- FIX: Define a spacer with a specific width ---
    spacer: {
        width: 24, // Matches the size of the icon for perfect balance
    },
});

export default CommunityHeader;