// component/onboarding/LynLogoPart.tsx
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Colors from '../../constant/Colors';

const LynLogoPart = () => <Text style={styles.logoText}>Lyn</Text>;

const styles = StyleSheet.create({
    logoText: {
        fontSize: 56,
        fontWeight: 'bold',
        color: Colors.BLACK,
    },
});

export default LynLogoPart;