import React, { useEffect } from 'react';
import { View, StyleSheet, Text, SafeAreaView, Dimensions, Image, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withSequence,
    withDelay,
    runOnJS,
    Easing,
} from 'react-native-reanimated';
import Colors from '../../constant/Colors';

// Logo Components
import TLogoPart from '../../component/onboarding/TLogoPart';
import KLogoPart from '../../component/onboarding/KLogoPart';
import LynLogoPart from '../../component/onboarding/LynLogoPart';
import BubbleBackground from '../../component/onboarding/BubbleBackground';
import EllipseShape from '../../component/onboarding/Ellipse';

const { height, width } = Dimensions.get('window');
const ellipseContainerWidth = width * 0.85;

interface GamifiedIntroProps {
  onFinish: () => void;
}

const GamifiedIntro: React.FC<GamifiedIntroProps> = ({ onFinish }) => {
  const bubbleOpacity = useSharedValue(0);
  const revealStageOpacity = useSharedValue(0);
  const tLogoRevealY = useSharedValue(20); 
  const ellipseOpacity = useSharedValue(0);
  const mainLogoStageOpacity = useSharedValue(0);
  const logoDropY = useSharedValue(-height / 2);
  const lynkTextX = useSharedValue(-100);
  const lynkTextOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const welcomeStageOpacity = useSharedValue(0);
  const welcomeContentOpacity = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      const REVEAL_DURATION = 2000;
      const MAIN_LOGO_START_DELAY = REVEAL_DURATION + 300;
      const MAIN_LOGO_DURATION = 4000;
      const WELCOME_START_DELAY = MAIN_LOGO_START_DELAY + MAIN_LOGO_DURATION;

      bubbleOpacity.value = withSequence(withTiming(1, { duration: 500 }), withDelay(WELCOME_START_DELAY - 1000, withTiming(1)), withTiming(0, { duration: 500 }));
      revealStageOpacity.value = withSequence(withTiming(1, { duration: 200 }), withDelay(REVEAL_DURATION - 500, withTiming(1)), withTiming(0, { duration: 300 }));
      ellipseOpacity.value = withSequence(withDelay(200, withTiming(1, { duration: 400 })), withDelay(REVEAL_DURATION - 1000, withTiming(0, { duration: 600 })));
      tLogoRevealY.value = withDelay(400, withTiming(-(height * 1.2), { duration: REVEAL_DURATION - 600, easing: Easing.in(Easing.cubic) }));
      mainLogoStageOpacity.value = withSequence(withDelay(MAIN_LOGO_START_DELAY, withTiming(1, { duration: 200 })), withDelay(MAIN_LOGO_DURATION - 700, withTiming(1)), withTiming(0, { duration: 500 }));
      logoDropY.value = withDelay(MAIN_LOGO_START_DELAY + 200, withSpring(0, { damping: 12, stiffness: 90, mass: 1.2 }));
      lynkTextOpacity.value = withDelay(MAIN_LOGO_START_DELAY + 1200, withTiming(1, { duration: 600 }));
      lynkTextX.value = withDelay(MAIN_LOGO_START_DELAY + 1200, withTiming(0, { duration: 700, easing: Easing.out(Easing.ease) }));
      taglineOpacity.value = withDelay(MAIN_LOGO_START_DELAY + 2000, withTiming(1, { duration: 800 }));
      welcomeStageOpacity.value = withDelay(WELCOME_START_DELAY, withTiming(1, { duration: 500 }));
      welcomeContentOpacity.value = withDelay(WELCOME_START_DELAY + 200, withTiming(1, { duration: 800 }));
    };

    startAnimation();
  }, []);

  // Animated styles
  const bubbleStyle = useAnimatedStyle(() => ({ opacity: bubbleOpacity.value }));
  const revealStageStyle = useAnimatedStyle(() => ({ opacity: revealStageOpacity.value }));
  const tLogoRevealStyle = useAnimatedStyle(() => ({ transform: [{ translateY: tLogoRevealY.value }] }));
  const ellipseStyle = useAnimatedStyle(() => ({ opacity: ellipseOpacity.value }));
  const mainLogoStageStyle = useAnimatedStyle(() => ({ opacity: mainLogoStageOpacity.value }));
  const logoDropStyle = useAnimatedStyle(() => ({ transform: [{ translateY: logoDropY.value }] }));
  const lynkTextStyle = useAnimatedStyle(() => ({ opacity: lynkTextOpacity.value, transform: [{ translateX: lynkTextX.value }] }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const welcomeStageStyle = useAnimatedStyle(() => ({ opacity: welcomeStageOpacity.value }));
  const welcomeContentStyle = useAnimatedStyle(() => ({ opacity: welcomeContentOpacity.value }));

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, bubbleStyle]}><BubbleBackground /></Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, styles.revealContainer, revealStageStyle]}>
          <Animated.View style={[styles.ellipseContainer, ellipseStyle]}>
            <EllipseShape width={ellipseContainerWidth} />
          </Animated.View>
          <Animated.View style={tLogoRevealStyle}><TLogoPart showShadow={false} /></Animated.View>
      </Animated.View>
      
      <Animated.View style={[StyleSheet.absoluteFill, styles.centeredContent, mainLogoStageStyle]}>
        <View>
          <View style={styles.logoContainer}>
            <Animated.View style={lynkTextStyle}><LynLogoPart /></Animated.View>
            <Animated.View style={lynkTextStyle}><KLogoPart /></Animated.View>
            <Animated.View style={logoDropStyle}><TLogoPart showShadow={true} /></Animated.View>
          </View>
        </View>
        <Animated.Text style={[styles.tagline, taglineStyle]}>Grow as a teacher. Lead as a mentor. Learn for a lifetime</Animated.Text>
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, welcomeStageStyle]}>
        <Image source={require('../../assets/images/onboarding/welcome.png')} style={styles.welcomeIllustrationBackground}/>
        <View style={styles.welcomeForeground}>
            <Animated.View style={[styles.welcomeTopContent, welcomeContentStyle]}>
                <Text style={styles.mainTitle}>Welcome to LynkT!</Text>
                <Text style={styles.subTitle}>Enhance your skills, get rewarded, and take your teaching to the next level.</Text>
            </Animated.View>
            <Animated.View style={[styles.welcomeBottomContent, welcomeContentStyle]}>
              <TouchableOpacity style={styles.nextButton} onPress={() => runOnJS(onFinish)()}>
                  <Text style={styles.nextButtonText}>Let's Start</Text>
              </TouchableOpacity>
            </Animated.View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.WHITE, overflow: 'hidden' },
  revealContainer: { justifyContent: 'flex-end', alignItems: 'center', paddingBottom: height * 0.1 },
  ellipseContainer: {
    position: 'absolute',
  },
  centeredContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'transparent' },
  logoContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  tagline: { marginTop: 24, fontSize: 16, color: '#64748b', textAlign: 'center' },
  welcomeIllustrationBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', resizeMode: 'cover' },
  welcomeForeground: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: '25%', paddingBottom: 50 },
  welcomeTopContent: { alignItems: 'center' },
  welcomeBottomContent: { width: '100%', alignItems: 'center' },
  mainTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, color: '#1e293b' },
  subTitle: { fontSize: 16, textAlign: 'center', color: '#475569', lineHeight: 24 },
  nextButton: { backgroundColor: '#007AFF', paddingVertical: 16, width: '100%', maxWidth: 350, borderRadius: 12, alignItems: 'center', elevation: 8 },
  nextButtonText: { color: 'white', fontSize: 18, fontWeight: '600' },
});

export default GamifiedIntro;