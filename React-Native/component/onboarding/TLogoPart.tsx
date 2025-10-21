// component/onboarding/TLogoPart.tsx
import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

interface TLogoPartProps {
  showShadow?: boolean;
}

const TLogoPart: React.FC<TLogoPartProps> = ({ showShadow = false }) => (
    <View style={styles.container}>
        <Image
            source={require('../../assets/images/onboarding/t_logo_icon.png')}
            style={styles.iconImage}
        />
        {showShadow && <View style={styles.shadow} />}
    </View>
);

const styles = StyleSheet.create({
    container: {
        width: 40,
        height: 52, 
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconImage: {
        width: 38,
        height: 48,
        resizeMode: 'contain',
    },
    shadow: {
        position: 'absolute',
        bottom: 0,
        width: 30,
        height: 6,
        // === YEH BADLAAV HAI: Opacity ko 0.4 se 0.7 kar diya hai taaki shadow dark dikhe ===
        backgroundColor: 'rgba(0, 0, 0, 0.7)', 
        borderRadius: 3,
        elevation: 1,
    },
});

export default TLogoPart;