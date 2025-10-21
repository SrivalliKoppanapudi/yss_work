// component/onboarding/BubbleBackground.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient'; // <-- LinearGradientProps ko import karein

const { height, width } = Dimensions.get('window');

const BUBBLE_COUNT = 7; // Aapke design ke hisab se 7 bubbles
const DURATION_RANGE = { min: 20000, max: 32000 };

const bubbleData = [
  // Blue Gradient Bubbles
  { id: 1, size: width * 0.4, initialX: width * -0.1, initialY: height * 0.8, colors: ['#A1B1FF', '#FFFFFF'] as const },
  { id: 2, size: width * 0.15, initialX: width * 0.8, initialY: height * 0.95, colors: ['#A1B1FF', '#FFFFFF'] as const },
  { id: 3, size: width * 0.1, initialX: width * 0.25, initialY: height * 0.5, colors: ['#A1B1FF', '#FFFFFF'] as const },
  { id: 4, size: width * 0.08, initialX: width * 0.9, initialY: height * 0.6, colors: ['#A1B1FF', '#FFFFFF'] as const },
  // Teal/Green Gradient Bubbles
  { id: 5, size: width * 0.35, initialX: width * 0.75, initialY: height * 0.1, colors: ['#AEECEE', '#FFFFFF'] as const },
  { id: 6, size: width * 0.12, initialX: width * 0.05, initialY: height * 0.3, colors: ['#AEECEE', '#FFFFFF'] as const },
  { id: 7, size: width * 0.09, initialX: width * 0.4, initialY: height * -0.05, colors: ['#AEECEE', '#FFFFFF'] as const },
];

interface BubbleProps {
    id: number;
    size: number;
    initialX: number;
    initialY: number;
    colors: LinearGradientProps['colors']; // <-- Sahi type use karein
}

const Bubble: React.FC<BubbleProps> = ({ size, initialX, initialY, colors }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        const speed = Math.random() * (DURATION_RANGE.max - DURATION_RANGE.min) + DURATION_RANGE.min;
        const delay = Math.random() * speed;
        setTimeout(() => {
            progress.value = withRepeat(
                withTiming(1, { duration: speed, easing: Easing.linear }),
                -1,
                false
            );
        }, delay);
    }, []);

    const horizontalMovement = (Math.random() - 0.5) * (width * 0.2);

    const animatedStyle = useAnimatedStyle((): any => {
        const translateY = interpolate(
            progress.value,
            [0, 1],
            [initialY, initialY - height - (size * 2)]
        );
        const translateX = interpolate(
            progress.value,
            [0, 0.5, 1],
            [initialX, initialX + horizontalMovement, initialX]
        );
        // === FIX 1: `transform` ko ek single array mein combine karein ===
        return {
            transform: [{ translateY }, { translateX }],
            opacity: 0.7, // <-- Opacity ko yahan rakhein
        };
    });

    return (
        // === FIX 2: Style prop ko aache se handle karein ===
        <Animated.View
            style={[
                styles.bubble,
                {
                    width: size,
                    height: size,
                    left: 0, // Initial position, jise transform handle karega
                    top: 0,
                },
                animatedStyle,
            ]}
        >
            <LinearGradient
                colors={colors}
                style={[styles.gradient, { borderRadius: size / 2 }]} // borderRadius ko yahan set karein
            />
        </Animated.View>
    );
};

const BubbleBackground = () => {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {bubbleData.map((bubble) => (
                <Bubble
                    key={bubble.id}
                    {...bubble}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    bubble: {
        position: 'absolute',
    },
    gradient: {
        flex: 1,
    },
});

export default BubbleBackground;
