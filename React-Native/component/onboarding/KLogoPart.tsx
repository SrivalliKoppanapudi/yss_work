// component/onboarding/KLogoPart.tsx
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Colors from '../../constant/Colors';

const KLogoPart = () => <Text style={styles.logoText}>k</Text>;

const styles = StyleSheet.create({
    logoText: {
        fontSize: 56,
        fontWeight: 'bold',
        color: Colors.BLACK,
    },
});

export default KLogoPart;