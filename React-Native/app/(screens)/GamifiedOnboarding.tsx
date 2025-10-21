// // app/(screens)/GamifiedOnboarding.tsx
// import React, { useState, useRef, useEffect } from 'react';
// import {
//   View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
//   Image, ActivityIndicator, Animated, Easing
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { supabase } from '../../lib/Superbase';
// import { useAuth } from '../../Context/auth';
// import Colors from '../../constant/Colors';
// import { ScrollView } from 'react-native-gesture-handler';
// import { Alert } from 'react-native';
// import GamifiedIntro from './GamifiedIntro'; // <-- NAYA IMPORT


// // --- Data for each step ---
// const teachingLevels = [
//     { key: 'primary', label: 'Primary', sublabel: '1st - 5th', image: require('../../assets/images/placeholder.png') },
//     { key: 'middle', label: 'Middle School', sublabel: '6th-10th', image: require('../../assets/images/placeholder.png') },
//     { key: 'high', label: 'High School', sublabel: '11th - 12th', image: require('../../assets/images/placeholder.png') },
//     { key: 'graduation', label: '12th+', sublabel: 'Graduation', image: require('../../assets/images/placeholder.png') },
//     { key: 'post_graduation', label: 'Post', sublabel: 'Graduation', image: require('../../assets/images/placeholder.png') },
// ];

// const superSkills = [
//     { key: 'motivator', label: 'Motivator', image: require('../../assets/images/placeholder.png') },
//     { key: 'creativity', label: 'Creativity', image: require('../../assets/images/placeholder.png') },
//     { key: 'communication', label: 'Communication', image: require('../../assets/images/placeholder.png') },
//     { key: 'management', label: 'Management', image: require('../../assets/images/placeholder.png') },
//     { key: 'technology', label: 'Technology', image: require('../../assets/images/placeholder.png') },
//     { key: 'collaboration', label: 'Collaboration', image: require('../../assets/images/placeholder.png') },
// ];

// const learningStyles = [
//     { key: 'reading', label: 'Reading articles and research', image: require('../../assets/images/placeholder.png') },
//     { key: 'watching', label: 'Watching video lessons', image: require('../../assets/images/placeholder.png') },
//     { key: 'interactive', label: 'Completing interactive challenges', image: require('../../assets/images/placeholder.png') },
//     { key: 'discussions', label: 'Engaging in discussions with peers', image: require('../../assets/images/placeholder.png') },
// ];

// const platformGoals = [
//     { key: 'improve_skills', label: 'Improve my teaching skills', image: require('../../assets/images/onboarding/goal1.png') },
//     { key: 'connect', label: 'Connect with other teachers', image: require('../../assets/images/onboarding/goal2.png') },
//     { key: 'new_strategies', label: 'Learn new teaching strategies', image: require('../../assets/images/onboarding/goal3.png') },
//     { key: 'certifications', label: 'Earn certifications for professional growth', image: require('../../assets/images/onboarding/goal4.png') },
// ];

// const experienceLevels = [
//     { key: 'novice', label: '0-1', sublabel: 'Novice', image: require('../../assets/images/placeholder.png') },
//     { key: 'emerging', label: '2-5', sublabel: 'Emerging', image: require('../../assets/images/placeholder.png') },
//     { key: 'experienced', label: '6-10', sublabel: 'Experienced', image: require('../../assets/images/placeholder.png') },
//     { key: 'master', label: '10+', sublabel: 'Master', image: require('../../assets/images/placeholder.png') },
// ];

// const genders = [
//     { key: 'male', image: require('../../assets/images/onboarding/male.png') },
//     { key: 'female', image: require('../../assets/images/onboarding/female.png') },
// ];

// const subjects = [
//     { key: 'math', label: 'Math' }, { key: 'science', label: 'Science' }, { key: 'geography', label: 'Geography' },
//     { key: 'history', label: 'History' }, { key: 'biology', label: 'Biology' }, { key: 'chemistry', label: 'Chemistry' },
//     { key: 'physics', label: 'Physics' }, { key: 'evs', label: 'EVS' }, { key: 'art_craft', label: 'Art/Craft' },
//     { key: 'languages', label: 'Languages' }, { key: 'computer', label: 'Computer' }, { key: 'technology', label: 'Technology' },
//     { key: 'engineering', label: 'Engineering' }, { key: 'it', label: 'IT' },
// ];

// const GamifiedOnboarding = () => {
//     const router = useRouter();
//     const { session } = useAuth();
//     const [step, setStep] = useState(0); // Start with animation
//     const [isSubmitting, setIsSubmitting] = useState(false);
    
//     // State to hold all collected data
//     const [onboardingData, setOnboardingData] = useState({
//         teaching_role: '',
//         super_skills: [] as string[],
//         learning_styles: [] as string[],
//         platform_goals: [] as string[],
//         experience_level: '',
//         gender: '',
//         subjects_interest: [] as string[],
//     });

//     const handleSingleSelect = (key: keyof typeof onboardingData, value: string) => {
//         setOnboardingData(prev => ({ ...prev, [key]: value }));
//     };

//     const handleMultiSelect = (key: keyof typeof onboardingData, value: string) => {
//         setOnboardingData(prev => {
//             const currentValues = prev[key] as string[];
//             const newValues = currentValues.includes(value)
//                 ? currentValues.filter(item => item !== value)
//                 : [...currentValues, value];
//             return { ...prev, [key]: newValues };
//         });
//     };

//     const handleOnboardingComplete = async () => {
//         setIsSubmitting(true);
//         try {
//             if (!session?.user?.id) throw new Error("User not authenticated.");

//             const { error } = await supabase
//                 .from('profiles')
//                 .update({
//                     teaching_role: onboardingData.teaching_role,
//                     super_skills: onboardingData.super_skills,
//                     learning_styles: onboardingData.learning_styles,
//                     platform_goals: onboardingData.platform_goals,
//                     experience_level: onboardingData.experience_level,
//                     gender: onboardingData.gender,
//                     subjects_interest: onboardingData.subjects_interest,
//                     gamified_completed: true,
//                 })
//                 .eq('id', session.user.id);
            
//             if (error) throw error;
            
//             router.replace('/(screens)/Home');

//         } catch (err: any) {
//             Alert.alert("Error", "Could not save your preferences. " + err.message);
//         } finally {
//             setIsSubmitting(false);
//         }
//     };
    
//     const nextStep = () => setStep(s => s + 1);
//     const prevStep = () => setStep(s => s - 1);
//     const skip = () => handleOnboardingComplete(); // Skip just completes with default values

//     const renderStepContent = () => {
// switch (step) {
//             // Case 0 ab poora animation aur welcome screen handle karega
//             case 0: return <GamifiedIntro onFinish={() => setStep(1)} />;
            
//             // Baaki ke steps ab 1 se shuru honge
//             case 1: return <SelectionStep title="What teaching level best describes your current role?" subTitle="Select the grades you currently teach" options={teachingLevels} selected={onboardingData.teaching_role} onSelect={(val) => handleSingleSelect('teaching_role', val)} onNext={nextStep} onSkip={skip} isSingleChoice />;
//             // ... (baaki saare cases ke number 1 se badha dein) ...
//             case 2: return <SelectionStep title='"Missing a Power? Choose the One You’d Love to Gain!"' subTitle="Power Up! Pick Your Super Skill" options={superSkills} selected={onboardingData.super_skills} onSelect={(val) => handleMultiSelect('super_skills', val)} onNext={nextStep} onSkip={skip} />;
//             case 3: return <SelectionStep title="How Do You Like to Level Up?" subTitle="Customize Your Learning Adventure!" options={learningStyles} selected={onboardingData.learning_styles} onSelect={(val) => handleMultiSelect('learning_styles', val)} onNext={nextStep} onSkip={skip} isHorizontal />;
//             case 4: return <SelectionStep title="What is your main goal for using this Platform?" subTitle="Select your goals to want to achieve" options={platformGoals} selected={onboardingData.platform_goals} onSelect={(val) => handleMultiSelect('platform_goals', val)} onNext={nextStep} onSkip={skip} isHorizontal />;
//             case 5: return <SelectionStep title='"Step Into the Spotlight: Tell Us About Your Teaching Adventure"' subTitle="Select your experience level?" options={experienceLevels} selected={onboardingData.experience_level} onSelect={(val) => handleSingleSelect('experience_level', val)} onNext={nextStep} onSkip={skip} />;
//             case 6: return <SelectionStep title='"Let’s Get to Know You Better!"' subTitle="Select your Gender" options={genders} selected={onboardingData.gender} onSelect={(val) => handleSingleSelect('gender', val)} onNext={nextStep} onSkip={skip} isSingleChoice largeCards />;
//             case 7: return <SubjectsStep selected={onboardingData.subjects_interest} onSelect={(val) => handleMultiSelect('subjects_interest', val)} onFinish={handleOnboardingComplete} onSkip={skip} isSubmitting={isSubmitting} />;
//             default: return null;
//         }
//     };

//     return <SafeAreaView style={styles.safeArea}>{renderStepContent()}</SafeAreaView>;
// };

// // --- Child Components for each step ---

// // NOTE: Replace `require('../../assets/images/placeholder.png')` with your actual asset paths.

// const IntroAnimation = ({ onFinish }: { onFinish: () => void }) => {
//     const fadeAnim = useRef(new Animated.Value(0)).current;
//     const translateYAnim = useRef(new Animated.Value(30)).current;

//     useEffect(() => {
//         Animated.sequence([
//             Animated.delay(500),
//             Animated.timing(fadeAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
//             Animated.timing(translateYAnim, { toValue: 0, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
//             Animated.delay(1000),
//         ]).start(onFinish);
//     }, []);

//     return (
//         <View style={styles.container}>
//             <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }}>
//                 <Image source={require('../../assets/images/Lynktt.png')} style={{ width: 150, height: 150 }} />
//                 <Text style={styles.brandText}>LynkT</Text>
//             </Animated.View>
//         </View>
//     );
// };

// const WelcomeScreen = ({ onNext }: { onNext: () => void }) => (
//     <View style={styles.container}>
//         <Image source={require('../../assets/images/placeholder.png')} style={styles.welcomeImage} />
//         <Text style={styles.mainTitle}>Welcome to LynkT!</Text>
//         <Text style={styles.subTitle}>Enhance your skills, get rewarded, and take your teaching to the next level.</Text>
//         <TouchableOpacity style={styles.nextButton} onPress={onNext}>
//             <Text style={styles.nextButtonText}>Let's Start</Text>
//         </TouchableOpacity>
//     </View>
// );

// const GreatChoiceScreen = ({ onNext }: { onNext: () => void }) => {
//     useEffect(() => {
//         const timer = setTimeout(onNext, 2000);
//         return () => clearTimeout(timer);
//     }, [onNext]);
//     return (
//         <View style={styles.container}>
//             {/* You can add a confetti or celebration animation here */}
//             <Text style={styles.mainTitle}>Your choice of interest are great!</Text>
//         </View>
//     );
// };


// const SelectionStep = ({ title, subTitle, options, selected, onSelect, onNext, onSkip, isSingleChoice = false, isHorizontal = false, largeCards = false }) => {
//     const isNextDisabled = isSingleChoice ? !selected : (selected as string[]).length === 0;

//     return (
//         <View style={styles.stepContainer}>
//             <Text style={styles.mainTitle}>{title}</Text>
//             <Text style={styles.subTitle}>{subTitle}</Text>
//             <ScrollView contentContainerStyle={isHorizontal ? styles.horizontalList : styles.gridList}>
//                 {options.map(option => {
//                     const isSelected = Array.isArray(selected) ? selected.includes(option.key) : selected === option.key;
//                     return (
//                         <TouchableOpacity 
//                             key={option.key} 
//                             style={[
//                                 styles.card, 
//                                 isHorizontal && styles.horizontalCard,
//                                 largeCards && styles.largeCard,
//                                 isSelected && styles.selectedCard
//                             ]} 
//                             onPress={() => onSelect(option.key)}
//                         >
//                             <Image source={option.image} style={largeCards ? styles.largeCardImage : styles.cardImage} />
//                             {option.label && <Text style={styles.cardLabel}>{option.label}</Text>}
//                             {option.sublabel && <Text style={styles.cardSublabel}>{option.sublabel}</Text>}
//                         </TouchableOpacity>
//                     );
//                 })}
//             </ScrollView>
//             <View style={styles.footer}>
//                 <TouchableOpacity style={[styles.nextButton, isNextDisabled && styles.disabledButton]} onPress={onNext} disabled={isNextDisabled}>
//                     <Text style={styles.nextButtonText}>Next</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity onPress={onSkip}>
//                     <Text style={styles.skipButtonText}>Skip</Text>
//                 </TouchableOpacity>
//             </View>
//         </View>
//     );
// };

// const SubjectsStep = ({ selected, onSelect, onFinish, onSkip, isSubmitting }) => {
//     const isFinishDisabled = selected.length === 0;
//     return (
//         <View style={styles.stepContainer}>
//             <Text style={styles.mainTitle}>For ENHANCING your experience</Text>
//             <Text style={styles.subTitle}>Teach me about your interests?</Text>
//             <ScrollView contentContainerStyle={styles.subjectsContainer}>
//                 {subjects.map(subject => {
//                     const isSelected = selected.includes(subject.key);
//                     return (
//                         <TouchableOpacity 
//                             key={subject.key} 
//                             style={[styles.subjectChip, isSelected && styles.selectedSubjectChip]} 
//                             onPress={() => onSelect(subject.key)}
//                         >
//                             <Text style={[styles.subjectChipText, isSelected && styles.selectedSubjectChipText]}>{subject.label}</Text>
//                         </TouchableOpacity>
//                     );
//                 })}
//             </ScrollView>
//              <View style={styles.footer}>
//                 <TouchableOpacity style={[styles.nextButton, (isFinishDisabled || isSubmitting) && styles.disabledButton]} onPress={onFinish} disabled={isFinishDisabled || isSubmitting}>
//                     {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextButtonText}>Finish</Text>}
//                 </TouchableOpacity>
//                 <TouchableOpacity onPress={onSkip}>
//                     <Text style={styles.skipButtonText}>Skip</Text>
//                 </TouchableOpacity>
//             </View>
//         </View>
//     );
// };


// // --- Styles ---
// const styles = StyleSheet.create({
//     safeArea: { flex: 1, backgroundColor: '#f0f4f8' },
//     container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
//     brandText: { fontSize: 48, fontWeight: 'bold', color: Colors.BLACK, textAlign: 'center', marginTop: 10 },
//     welcomeImage: { width: 250, height: 250, resizeMode: 'contain', marginBottom: 20 },
//     stepContainer: { flex: 1, padding: 20, paddingTop: 40 },
//     mainTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, color: '#1e293b' },
//     subTitle: { fontSize: 16, textAlign: 'center', marginBottom: 30, color: '#475569' },
//     gridList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15 },
//     horizontalList: { flexDirection: 'column', gap: 15 },
//     card: {
//         width: 150, height: 150, backgroundColor: 'white', borderRadius: 12, padding: 10,
//         alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent'
//     },
//     horizontalCard: { width: '100%', height: 'auto', flexDirection: 'row', justifyContent: 'flex-start', padding: 15 },
//     largeCard: { width: 180, height: 220 },
//     selectedCard: { borderColor: Colors.PRIMARY, backgroundColor: '#eff6ff' },
//     cardImage: { width: 60, height: 60, resizeMode: 'contain', marginBottom: 8 },
//     largeCardImage: { width: 120, height: 160, resizeMode: 'contain' },
//     cardLabel: { fontWeight: '600', textAlign: 'center', color: '#334155' },
//     cardSublabel: { fontSize: 12, color: '#64748b' },
//     subjectsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
//     subjectChip: { backgroundColor: 'white', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
//     selectedSubjectChip: { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
//     subjectChipText: { color: Colors.BLACK },
//     selectedSubjectChipText: { color: Colors.WHITE },
//     footer: { position: 'absolute', bottom: 20, left: 20, right: 20, alignItems: 'center' },
//     nextButton: { backgroundColor: Colors.PRIMARY, paddingVertical: 14, width: '100%', borderRadius: 8, alignItems: 'center' },
//     nextButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
//     disabledButton: { backgroundColor: '#94a3b8' },
//     skipButtonText: { color: '#64748b', marginTop: 15, fontSize: 16 },
// });

// export default GamifiedOnboarding;

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   SafeAreaView,
//   TouchableOpacity,
//   Image,
//   ActivityIndicator,
//   ScrollView,
//   Alert,
//   Dimensions
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { supabase } from '../../lib/Superbase';
// import { useAuth } from '../../Context/auth';
// import Colors from '../../constant/Colors';
// import { LinearGradient } from 'expo-linear-gradient';
// import GamifiedIntro from './GamifiedIntro';

// // --- Data Sources with Image Assets ---
// const avatars = [
//     { key: 'Edu Hero', label: 'Edu Hero', image: require('../../assets/images/onboarding/yourAvatar1.png') },
//     { key: 'Prof. Wisdom', label: 'Prof. Wisdom', image: require('../../assets/images/onboarding/yourAvatar2.png') },
//     { key: 'TeachMaster', label: 'TeachMaster', image: require('../../assets/images/onboarding/yourAvatar3.png') },
//     { key: 'Coach Spark', label: 'Coach Spark', image: require('../../assets/images/onboarding/yourAvatar4.png') },
//     { key: 'ScholarStar', label: 'ScholarStar', image: require('../../assets/images/onboarding/yourAvatar5.png') },
//     { key: 'InspireGuru', label: 'InspireGuru', image: require('../../assets/images/onboarding/yourAvatar6.png') },
//     { key: 'Bookwarm', label: 'Bookwarm', image: require('../../assets/images/onboarding/yourAvatar7.png') },
//     { key: 'Knowledge Ninja', label: 'Knowledge Ninja', image: require('../../assets/images/onboarding/yourAvatar8.png') },
//     { key: 'Chalk Master', label: 'Chalk Master', image: require('../../assets/images/onboarding/yourAvatar9.png') },
//     { key: 'Guiding star', label: 'Guiding star', image: require('../../assets/images/onboarding/yourAvatar10.png') },
//     { key: 'Brainstormer', label: 'Brainstormer', image: require('../../assets/images/onboarding/yourAvatar11.png') },
//     { key: 'Mind Crafte', label: 'Mind Crafte', image: require('../../assets/images/onboarding/yourAvatar12.png') },
//     { key: 'Brain Architect', label: 'Brain Architect', image: require('../../assets/images/onboarding/yourAvatar13.png') },
//     { key: 'YouthTech', label: 'YouthTech', image: require('../../assets/images/onboarding/yourAvatar14.png') },
// ];
// const genders = [
//     { key: 'male', image: require('../../assets/images/onboarding/male.png') },
//     { key: 'female', image: require('../../assets/images/onboarding/female.png') },
// ];
// const generationBadges = [
//     { key: '25-35', label: '25-35', sublabel: 'Novice', image: require('../../assets/images/onboarding/generationbadge1.png') },
//     { key: '36-45', label: '36-45', sublabel: 'Emerging', image: require('../../assets/images/onboarding/generationbadge2.png') },
//     { key: '46-55', label: '46-55', sublabel: 'Experienced', image: require('../../assets/images/onboarding/generationbadge3.png') },
//     { key: '56-65', label: '56-65', sublabel: 'Master', image: require('../../assets/images/onboarding/generationbadge4.png') },
// ];
// const experienceLevels = [
//     { key: '0-1', sublabel: 'Novice', image: require('../../assets/images/onboarding/novice.png') },
//     { key: '2-5', sublabel: 'Emerging', image: require('../../assets/images/onboarding/Emerging.png') },
//     { key: '6-10', sublabel: 'Experienced', image: require('../../assets/images/onboarding/experienced.png') },
//     { key: '10+', sublabel: 'Master', image: require('../../assets/images/onboarding/master.png') },
// ];
// const subjects = [
//     { key: 'math', label: 'Math', image: require('../../assets/images/onboarding/math.png') },
//     { key: 'science', label: 'Science', image: require('../../assets/images/onboarding/science.png') },
//     { key: 'geography', label: 'Geography', image: require('../../assets/images/onboarding/geography.png') },
//     { key: 'history', label: 'History', image: require('../../assets/images/onboarding/history.png') },
//     { key: 'biology', label: 'Biology', image: require('../../assets/images/onboarding/biology.png') },
//     { key: 'chemistry', label: 'Chemistry', image: require('../../assets/images/onboarding/chemistry.png') },
//     { key: 'physics', label: 'Physics', image: require('../../assets/images/onboarding/physics.png') },
//     { key: 'evs', label: 'EVS', image: require('../../assets/images/onboarding/evs.png') },
//     { key: 'art_craft', label: 'Art/Craft', image: require('../../assets/images/onboarding/art&craft.png') },
//     { key: 'languages', label: 'Languages', image: require('../../assets/images/onboarding/language.png') },
//     { key: 'computer', label: 'Computer', image: require('../../assets/images/onboarding/computer.png') },
//     { key: 'technology', label: 'Technology', image: require('../../assets/images/onboarding/technology.png') },
//     { key: 'engineering', label: 'Engineering', image: require('../../assets/images/onboarding/engineering.png') },
//     { key: 'it', label: 'IT', image: require('../../assets/images/onboarding/IT.png') },
// ];
// const teachingLevels = [
//     { key: 'primary', label: 'Primary', sublabel: '1st - 5th', image: require('../../assets/images/onboarding/primary.png') },
//     { key: 'middle', label: 'Middle School', sublabel: '6th-10th', image: require('../../assets/images/onboarding/middle.png') },
//     { key: 'high', label: 'High School', sublabel: '11th - 12th', image: require('../../assets/images/onboarding/highschool.png') },
//     { key: 'graduation', label: '12th+', sublabel: 'Graduation', image: require('../../assets/images/onboarding/12thgraduation.png') },
//     { key: 'post_graduation', label: 'Post', sublabel: 'Graduation', image: require('../../assets/images/onboarding/PG.png') },
// ];
// const teachingSkillsToImprove = [
//     { key: 'public_speaking', label: 'Public speaking & communication', image: require('../../assets/images/onboarding/teachingSkills1.png') },
//     { key: 'subject_knowledge', label: 'Subject Knowledge/understanding', image: require('../../assets/images/onboarding/teachingSkills2.png') },
//     { key: 'assessment_feedback', label: 'Assessment & feedback techniques', image: require('../../assets/images/onboarding/teachingSkills3.png') },
//     { key: 'student_engagement', label: 'Student engagement methods', image: require('../../assets/images/onboarding/teachingSkills4.png') },
//     { key: 'classroom_management', label: 'Classroom management strategies', image: require('../../assets/images/onboarding/teachingSkills3.png') },
//     { key: 'technology_tools', label: 'Technology & digital tools in education', image: require('../../assets/images/onboarding/teachingSkills4.png') },
// ];
// const superSkills = [
//     { key: 'motivator', label: 'Motivator', image: require('../../assets/images/onboarding/motivator.png') },
//     { key: 'creativity', label: 'Creativity', image: require('../../assets/images/onboarding/creativity.png') },
//     { key: 'communication', label: 'Communication', image: require('../../assets/images/onboarding/communication.png') },
//     { key: 'management', label: 'Management', image: require('../../assets/images/onboarding/managment.png') },
//     { key: 'technology', label: 'Technology', image: require('../../assets/images/onboarding/technology.png') },
//     { key: 'collaboration', label: 'Collaboration', image: require('../../assets/images/onboarding/collaboration.png') },
// ];
// const learningStyles = [
//     { key: 'reading', label: 'Reading articles and research', image: require('../../assets/images/onboarding/levelup1.png') },
//     { key: 'watching', label: 'Watching video lessons', image: require('../../assets/images/onboarding/levelup2.png') },
//     { key: 'interactive', label: 'Completing interactive challenges', image: require('../../assets/images/onboarding/levelup3.png') },
//     { key: 'discussions', label: 'Engaging in discussions with peers', image: require('../../assets/images/onboarding/levelup4.png') },
// ];
// const platformGoals = [
//     { key: 'improve_skills', label: 'Improve my teaching skills', image: require('../../assets/images/onboarding/goal1.png') },
//     { key: 'connect', label: 'Connect with other teachers', image: require('../../assets/images/onboarding/goal2.png') },
//     { key: 'new_strategies', label: 'Learn new teaching strategies', image: require('../../assets/images/onboarding/goal3.png') },
//     { key: 'certifications', label: 'Earn certifications for professional growth', image: require('../../assets/images/onboarding/goal4.png') },
// ];

// // --- Main Onboarding Component ---
// const GamifiedOnboarding = () => {
//     const router = useRouter();
//     const { session } = useAuth();
//     const [step, setStep] = useState(0);
//     const [isSubmitting, setIsSubmitting] = useState(false);

//     const [onboardingData, setOnboardingData] = useState({
//         avatar: '',
//         gender: '',
//         generation_badge: '',
//         experience_level: '',
//         subjects_interest: [] as string[],
//         teaching_role: '',
//         teaching_skills_to_improve: [] as string[],
//         super_skills: [] as string[],
//         learning_styles: [] as string[],
//         platform_goals: [] as string[],
//     });

//     const handleSingleSelect = (key: keyof typeof onboardingData, value: string) => {
//         setOnboardingData(prev => ({ ...prev, [key]: value }));
//     };

//     const handleMultiSelect = (key: keyof typeof onboardingData, value: string) => {
//         setOnboardingData(prev => {
//             const currentValues = prev[key] as string[];
//             const newValues = currentValues.includes(value)
//                 ? currentValues.filter(item => item !== value)
//                 : [...currentValues, value];
//             return { ...prev, [key]: newValues };
//         });
//     };

//     const handleOnboardingComplete = async (finalData: typeof onboardingData) => {
//         if (isSubmitting) return; 
//         setIsSubmitting(true);
//         console.log('--- [Submission Started] ---');

//         const userId = session?.user?.id;
//         if (!userId) {
//             Alert.alert("Authentication Error", "Your session is invalid. Please log in again.");
//             setIsSubmitting(false);
//             router.replace('/auth/SignIn');
//             return;
//         }

//         console.log(`[DEBUG] Attempting to update profile for user: ${userId}`);

//         try {
//             const updatePayload = {
//                 avatar: finalData.avatar,
//                 generation_badge: finalData.generation_badge,
//                 teaching_skills_to_improve: finalData.teaching_skills_to_improve,
//                 gender: finalData.gender,
//                 experience_level: finalData.experience_level,
//                 subjects_interest: finalData.subjects_interest,
//                 teaching_role: finalData.teaching_role,
//                 super_skills: finalData.super_skills,
//                 learning_styles: finalData.learning_styles,
//                 platform_goals: finalData.platform_goals,
//                 gamified_completed: true, 
//             };

//             console.log('[DEBUG] Final payload being sent to Supabase:', JSON.stringify(updatePayload, null, 2));

//             const { data, error } = await supabase
//                 .from('profiles')
//                 .update(updatePayload)
//                 .eq('id', userId)
//                 .select();

//             console.log('[DEBUG] Supabase response:', { data, error });

//             if (error) throw error;
//             if (!data || data.length === 0) throw new Error("Update was blocked by RLS policies or profile not found.");
            
//             if (data[0].gamified_completed === true) {
//                 console.log('[SUCCESS] Profile updated successfully in DB.');
//                 setStep(s => s + 1);
//             } else {
//                 throw new Error("Database update succeeded but the flag was not set to true.");
//             }

//         } catch (err: any) {
//             console.error("[SUBMISSION FAILED] Error:", err);
//             Alert.alert("Error Saving Preferences", `We couldn't save your details. Please try again.\n\nError: ${err.message}`);
//             setIsSubmitting(false);
//         }
//     };

//     const nextStep = () => setStep(s => s + 1);
//     const prevStep = () => setStep(s => s > 0 ? s - 1 : 0);
//     const exitOnboarding = () => router.replace('/(screens)/Home');

//     const renderStepContent = () => {
//         const commonProps = { onNext: nextStep, onSkip: nextStep, onBack: prevStep };

//         switch (step) {
//             case 0: return <GamifiedIntro onFinish={() => setStep(1)} />;
//             case 1: return <SelectSubjectsScreen {...commonProps} selected={onboardingData.subjects_interest} onSelect={(val) => handleMultiSelect('subjects_interest', val)} />;
//             case 2: return <GreatChoiceScreen onNext={nextStep} />;
//             case 3: return <SelectGenderScreen {...commonProps} selected={onboardingData.gender} onSelect={(val) => handleSingleSelect('gender', val)} />;
//             case 4: return <SelectExperienceScreen {...commonProps} selected={onboardingData.experience_level} onSelect={(val) => handleSingleSelect('experience_level', val)} />;
//             case 5: return <SelectPlatformGoalsScreen {...commonProps} selected={onboardingData.platform_goals} onSelect={(val) => handleMultiSelect('platform_goals', val)} />;
//             case 6: return <SelectLearningStyleScreen {...commonProps} selected={onboardingData.learning_styles} onSelect={(val) => handleMultiSelect('learning_styles', val)} />;
//             case 7: return <SelectSuperPowerScreen {...commonProps} selected={onboardingData.super_skills} onSelect={(val) => handleMultiSelect('super_skills', val)} />;
//             case 8: return <SelectCurrentRoleGradesScreen {...commonProps} selected={onboardingData.teaching_role} onSelect={(val) => handleSingleSelect('teaching_role', val)} />;
//             case 9: return <SelectCurrentRoleSkillsScreen {...commonProps} selected={onboardingData.teaching_skills_to_improve} onSelect={(val) => handleMultiSelect('teaching_skills_to_improve', val)} />;
//             case 10: return <SelectAgeGroupScreen {...commonProps} selected={onboardingData.generation_badge} onSelect={(val) => handleSingleSelect('generation_badge', val)} />;
//             case 11: return <SelectAvatarScreen {...commonProps} selected={onboardingData.avatar} onSelect={(val) => handleSingleSelect('avatar', val)} />;
//             case 12: return <CongratulationScreen onFinish={() => setStep(13)} />;
//             // case 13: return <CreatingAvatarScreen onFinish={() => handleOnboardingComplete(onboardingData)} isSubmitting={isSubmitting} />;
//             case 13: return <CreatingScreen onNext={() => setStep(14)} />; // Shows creating.gif
//             case 14: return <LoadingAvatarScreen onFinish={handleOnboardingComplete} isSubmitting={isSubmitting} />; // Shows loadingAvatar.gif and submits data
//             case 15: return <AvatarReadyScreen onFinish={exitOnboarding} selectedAvatarKey={onboardingData.avatar} />;
//             default: return null;
//         }
//     };

//     return (
//         <SafeAreaView style={styles.safeArea}>
//             <LinearGradient colors={['#F0F8FF', '#FFFFFF']} style={styles.gradientBg}>
//                 {renderStepContent()}
//             </LinearGradient>
//         </SafeAreaView>
//     );
// };

// // --- Reusable UI Components ---
// const Header = ({ onSkip, onBack }) => (
//     <View style={styles.header}>
//         <TouchableOpacity onPress={onBack}>
//             <Image source={require('../../assets/images/onboarding/back-arrow.png')} style={{width: 24, height: 24}}/>
//         </TouchableOpacity>
//         <TouchableOpacity onPress={onSkip}>
//             <Text style={styles.skipButtonText}>Skip</Text>
//         </TouchableOpacity>
//     </View>
// );

// const Footer = ({ onNext, isNextDisabled }) => (
//     <View style={styles.footer}>
//         <TouchableOpacity style={[styles.nextButton, isNextDisabled && styles.disabledButton]} onPress={onNext} disabled={isNextDisabled}>
//             <Text style={styles.nextButtonText}>Next</Text>
//         </TouchableOpacity>
//     </View>
// );

// // --- Screen Components for each step ---
// const SelectSubjectsScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => {
//     const isNextDisabled = selected.length === 0;
//     return (
//         <View style={styles.stepContainer}>
//             <Header onSkip={onSkip} onBack={onBack} />
//             <Text style={styles.mainTitle}>For ENHANCING your experience</Text>
//             <Text style={styles.subTitle}>Teach me about your interests?</Text>
//             <ScrollView contentContainerStyle={styles.gridList}>
//                 {subjects.map(option => (
//                     <TouchableOpacity key={option.key} style={[styles.card, styles.subjectCard, selected.includes(option.key) && styles.selectedCard]} onPress={() => onSelect(option.key)}>
//                         <Image source={option.image} style={styles.subjectImage} />
//                         <Text style={styles.cardLabel}>{option.label}</Text>
//                     </TouchableOpacity>
//                 ))}
//             </ScrollView>
//             <Footer onNext={onNext} isNextDisabled={isNextDisabled} />
//         </View>
//     );
// };

// const SelectGenderScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => {
//     const isNextDisabled = !selected;
//     return (
//         <View style={styles.stepContainer}>
//             <Header onSkip={onSkip} onBack={onBack} />
//             <Text style={styles.mainTitle}>"Let’s Get to Know You Better!"</Text>
//             <Text style={styles.subTitle}>Select your Gender</Text>
//             <View style={[styles.gridList, {justifyContent: 'center'}]}>
//                  {genders.map(option => (
//                     <TouchableOpacity key={option.key} style={[styles.card, styles.largeCard, selected === option.key && styles.selectedCard]} onPress={() => onSelect(option.key)}>
//                         <Image source={option.image} style={styles.largeCardImage} />
//                     </TouchableOpacity>
//                 ))}
//             </View>
//             <Footer onNext={onNext} isNextDisabled={isNextDisabled} />
//         </View>
//     );
// };

// const SelectExperienceScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => {
//     const isNextDisabled = !selected;
//     return (
//         <View style={styles.stepContainer}>
//             <Header onSkip={onSkip} onBack={onBack} />
//             <Text style={styles.mainTitle}>"Step Into the Spotlight: Tell Us About Your Teaching Adventure"</Text>
//             <Text style={styles.subTitle}>Select your experience level?</Text>
//             <View style={styles.gridList}>
//                  {experienceLevels.map(option => (
//                     <TouchableOpacity key={option.key} style={[styles.card, {width: '45%'}, selected === option.key && styles.selectedCard]} onPress={() => onSelect(option.key)}>
//                         <Image source={option.image} style={styles.cardImage} />
//                         <Text style={styles.cardSublabel}>{option.sublabel}</Text>
//                     </TouchableOpacity>
//                 ))}
//             </View>
//             <Footer onNext={onNext} isNextDisabled={isNextDisabled} />
//         </View>
//     );
// };

// const SelectPlatformGoalsScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => {
//     const isNextDisabled = selected.length === 0;
//     return (
//         <View style={styles.stepContainer}>
//             <Header onSkip={onSkip} onBack={onBack} />
//             <Text style={styles.mainTitle}>What is your main goal for using this Platform?</Text>
//             <Text style={styles.subTitle}>Select your goals to want to achieve</Text>
//             <ScrollView contentContainerStyle={styles.horizontalList}>
//                  {platformGoals.map(option => (
//                     <TouchableOpacity key={option.key} style={[styles.card, styles.horizontalCard, selected.includes(option.key) && styles.selectedCard]} onPress={() => onSelect(option.key)}>
//                          <Image source={option.image} style={styles.horizontalImage} />
//                         <Text style={[styles.cardLabel, styles.horizontalLabel]}>{option.label}</Text>
//                     </TouchableOpacity>
//                 ))}
//             </ScrollView>
//             <Footer onNext={onNext} isNextDisabled={isNextDisabled} />
//         </View>
//     );
// };

// const SelectLearningStyleScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => {
//     const isNextDisabled = selected.length === 0;
//     return (
//         <View style={styles.stepContainer}>
//             <Header onSkip={onSkip} onBack={onBack} />
//             <Text style={styles.mainTitle}>How Do You Like to Level Up?</Text>
//             <Text style={styles.subTitle}>Customize Your Learning Adventure!</Text>
//             <ScrollView contentContainerStyle={styles.horizontalList}>
//                  {learningStyles.map(option => (
//                     <TouchableOpacity key={option.key} style={[styles.card, styles.horizontalCard, selected.includes(option.key) && styles.selectedCard]} onPress={() => onSelect(option.key)}>
//                          <Image source={option.image} style={styles.horizontalImage} />
//                         <Text style={[styles.cardLabel, styles.horizontalLabel]}>{option.label}</Text>
//                     </TouchableOpacity>
//                 ))}
//             </ScrollView>
//             <Footer onNext={onNext} isNextDisabled={isNextDisabled} />
//         </View>
//     );
// };

// const SelectSuperPowerScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => {
//     const isNextDisabled = selected.length === 0;
//     return (
//         <View style={styles.stepContainer}>
//             <Header onSkip={onSkip} onBack={onBack} />
//             <Text style={styles.mainTitle}>"Missing a Power? Choose the One You'd Love to Gain!"</Text>
//             <Text style={styles.subTitle}>Power Up! Pick Your Super Skill</Text>
//             <View style={styles.gridList}>
//                  {superSkills.map(option => (
//                     <TouchableOpacity key={option.key} style={[styles.card, {width: '30%'}, selected.includes(option.key) && styles.selectedCard]} onPress={() => onSelect(option.key)}>
//                         <Image source={option.image} style={styles.cardImage} />
//                         <Text style={styles.cardLabel}>{option.label}</Text>
//                     </TouchableOpacity>
//                 ))}
//             </View>
//             <Footer onNext={onNext} isNextDisabled={isNextDisabled} />
//         </View>
//     );
// };

// const SelectCurrentRoleGradesScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => {
//     const isNextDisabled = !selected;
//     return (
//         <View style={styles.stepContainer}>
//             <Header onSkip={onSkip} onBack={onBack} />
//             <Text style={styles.mainTitle}>What teaching level best describes your current role?</Text>
//             <Text style={styles.subTitle}>Select the grades you currently teach</Text>
//             <View style={styles.gridList}>
//                  {teachingLevels.map(option => (
//                     <TouchableOpacity key={option.key} style={[styles.card, {width: '30%'}, selected === option.key && styles.selectedCard]} onPress={() => onSelect(option.key)}>
//                         <Image source={option.image} style={styles.cardImage} />
//                         <Text style={styles.cardLabel}>{option.label}</Text>
//                         <Text style={styles.cardSublabel}>{option.sublabel}</Text>
//                     </TouchableOpacity>
//                 ))}
//             </View>
//             <Footer onNext={onNext} isNextDisabled={isNextDisabled} />
//         </View>
//     );
// };

// const SelectCurrentRoleSkillsScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => {
//     const isNextDisabled = selected.length === 0;
//     return (
//         <View style={styles.stepContainer}>
//             <Header onSkip={onSkip} onBack={onBack} />
//             <Text style={styles.mainTitle}>What teaching level best describes your current role?</Text>
//             <Text style={styles.subTitle}>Select the teaching skills you'd like to improve</Text>
//             <ScrollView contentContainerStyle={styles.horizontalList}>
//                  {teachingSkillsToImprove.map(option => (
//                     <TouchableOpacity key={option.key} style={[styles.card, styles.horizontalCard, selected.includes(option.key) && styles.selectedCard]} onPress={() => onSelect(option.key)}>
//                          <Image source={option.image} style={styles.horizontalImage} />
//                         <Text style={[styles.cardLabel, styles.horizontalLabel]}>{option.label}</Text>
//                     </TouchableOpacity>
//                 ))}
//             </ScrollView>
//             <Footer onNext={onNext} isNextDisabled={isNextDisabled} />
//         </View>
//     );
// };

// const SelectAgeGroupScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => {
//     const isNextDisabled = !selected;
//     return (
//         <View style={styles.stepContainer}>
//             <Header onSkip={onSkip} onBack={onBack} />
//             <Text style={styles.mainTitle}>Pick Your Generation Badge</Text>
//             <Text style={styles.subTitle}>Select your Age group</Text>
//             <View style={styles.gridList}>
//                  {generationBadges.map(option => (
//                     <TouchableOpacity key={option.key} style={[styles.card, {width: '45%'}, selected === option.key && styles.selectedCard]} onPress={() => onSelect(option.key)}>
//                         <Image source={option.image} style={styles.cardImage} />
//                         <Text style={styles.cardLabel}>{option.label}</Text>
//                         <Text style={styles.cardSublabel}>{option.sublabel}</Text>
//                     </TouchableOpacity>
//                 ))}
//             </View>
//             <Footer onNext={onNext} isNextDisabled={isNextDisabled} />
//         </View>
//     );
// };

// const SelectAvatarScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => {
//     const isNextDisabled = !selected;
//     return (
//         <View style={styles.stepContainer}>
//             <Header onSkip={onSkip} onBack={onBack} />
//             <Text style={styles.mainTitle}>Let’s Create your Profile</Text>
//             <Text style={styles.subTitle}>Select your Avatar</Text>
//             <ScrollView contentContainerStyle={[styles.gridList, {paddingBottom: 80}]}>
//                  {avatars.map(option => (
//                     <TouchableOpacity key={option.key} style={[styles.card, styles.avatarCard, selected === option.key && styles.selectedCard]} onPress={() => onSelect(option.key)}>
//                         <Image source={option.image} style={styles.avatarImage} />
//                         <Text style={styles.cardLabel}>{option.label}</Text>
//                     </TouchableOpacity>
//                 ))}
//             </ScrollView>
//             <Footer onNext={onNext} isNextDisabled={isNextDisabled} />
//         </View>
//     );
// };

// const GreatChoiceScreen = ({ onNext }) => {
//     useEffect(() => {
//         const timer = setTimeout(onNext, 2500);
//         return () => clearTimeout(timer);
//     }, [onNext]);

//     return (
//         <View style={styles.centeredContainer}>
//             <View style={styles.animationContainer}>
//                 <Image source={require('../../assets/images/onboarding/yourChoiceOfIntrest2.gif')} style={styles.overlayAnimationGif} />
//                 <Image source={require('../../assets/images/onboarding/yourChoiceOfIntrest1.gif')} style={styles.mainAnimationGif} />
//             </View>
//             <Text style={[styles.mainTitle, { color: '#4A55A2', marginTop: 20 }]}>Your choice of interest are great!</Text>
//         </View>
//     );
// };

// const CongratulationScreen = ({ onFinish }) => (
//     <View style={styles.centeredContainer}>
//         <Text style={[styles.mainTitle, { fontSize: 32, marginBottom: 8 }]}>Congratulation!</Text>
//         <Text style={styles.subTitle}>on your first badges</Text>
//         <Image source={require('../../assets/images/onboarding/congrats.gif')} style={styles.badgeImage} />
//         <Text style={[styles.subTitle, { marginTop: 20, fontWeight: 'bold' }]}>Onboarding Completed!</Text>
//         <View style={styles.footer}>
//             <TouchableOpacity style={styles.nextButton} onPress={onFinish}>
//                 <Text style={styles.nextButtonText}>Continue</Text>
//             </TouchableOpacity>
//         </View>
//     </View>
// );

// // const CreatingAvatarScreen = ({ onFinish, isSubmitting }) => {
// //     useEffect(() => {
// //         // This effect will now call onFinish ONLY when isSubmitting becomes true
// //         if (isSubmitting) {
// //             const submissionTimer = setTimeout(() => {
// //                 onFinish();
// //             }, 2000); // Give it a bit more time to show the message
// //             return () => clearTimeout(submissionTimer);
// //         }
// //     }, [isSubmitting, onFinish]);

// //     return (
// //         <View style={styles.centeredContainer}>
// //              <Image source={require('../../assets/images/onboarding/loadingAvatar.gif')} style={styles.animationGif} />
// //              <Text style={[styles.mainTitle, { marginTop: 20 }]}>
// //                 {isSubmitting ? "Saving your preferences..." : "Almost there..."}
// //              </Text>
// //         </View>
// //     );
// // };
// const CreatingScreen = ({ onNext }) => {
//     useEffect(() => {
//         const timer = setTimeout(onNext, 2000); // 2 second delay
//         return () => clearTimeout(timer);
//     }, [onNext]);

//     return (
//         <View style={styles.centeredContainer}>
//             <Image source={require('../../assets/images/onboarding/creating.gif')} style={styles.animationGif} />
//             <Text style={[styles.mainTitle, { marginTop: 20 }]}>Creating...</Text>
//         </View>
//     );
// };
// const LoadingAvatarScreen = ({ onFinish, isSubmitting }) => {
//     useEffect(() => {
//         // Trigger the submission as soon as this screen appears
//         onFinish();
//     }, [onFinish]);

//     return (
//         <View style={styles.centeredContainer}>
//              <Image source={require('../../assets/images/onboarding/loadingAvatar.gif')} style={styles.animationGif} />
//              <Text style={[styles.mainTitle, { marginTop: 20 }]}>
//                 {isSubmitting ? "Saving your preferences..." : "Finalizing..."}
//              </Text>
//         </View>
//     );
// };

// const AvatarReadyScreen = ({ onFinish, selectedAvatarKey }) => {
//     const selectedAvatar = avatars.find(a => a.key === selectedAvatarKey);
//     return (
//         <View style={styles.centeredContainer}>
//             <TouchableOpacity onPress={onFinish} style={{ position: 'absolute', top: 60, right: 20 }}>
//                  <Image source={require('../../assets/images/onboarding/back-arrow.png')} style={{width: 24, height: 24, transform: [{rotate: '180deg'}] }}/>
//             </TouchableOpacity>
//             <Text style={styles.mainTitle}>Your Avatar is ready</Text>
//             <View style={styles.avatarReadyBox}>
//                 <Image source={selectedAvatar ? selectedAvatar.image : require('../../assets/images/onboarding/yourAvatar1.png')} style={styles.finalAvatarImage} />
//             </View>
//             <Text style={[styles.cardLabel, { marginTop: 15, fontSize: 18 }]}>{selectedAvatar?.label || "Your Avatar"}</Text>
//              <View style={styles.footer}>
//                 <TouchableOpacity onPress={onFinish} >
//                     <Text style={styles.skipButtonText}>Done</Text>
//                 </TouchableOpacity>
//             </View>
//         </View>
//     );
// };

// // --- STYLESHEET ---
// const styles = StyleSheet.create({
//     safeArea: {
//         flex: 1,
//         backgroundColor: '#F0F8FF',
//     },
//     gradientBg: {
//         flex: 1,
//     },
//     centeredContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         padding: 20,
//     },
//     stepContainer: {
//         flex: 1,
//         paddingHorizontal: 20,
//         paddingTop: 60,
//         paddingBottom: 100, // Make space for the absolute positioned footer
//     },
//     header: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 20,
//         paddingHorizontal: 5,
//     },
//     mainTitle: {
//         fontSize: 26,
//         fontWeight: 'bold',
//         textAlign: 'center',
//         marginBottom: 10,
//         color: '#1e293b',
//     },
//     subTitle: {
//         fontSize: 16,
//         textAlign: 'center',
//         marginBottom: 20,
//         color: '#475569',
//     },
//     gridList: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         justifyContent: 'space-around', // Use space-around for better alignment
//         gap: 15,
//     },
//     horizontalList: {
//         flexDirection: 'column',
//         gap: 15,
//     },
//     card: {
//         backgroundColor: 'rgba(255, 255, 255, 0.9)',
//         borderRadius: 12,
//         padding: 10,
//         alignItems: 'center',
//         justifyContent: 'center',
//         borderWidth: 2,
//         borderColor: 'transparent',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         elevation: 3,
//     },
//     avatarCard: {
//         width: '45%',
//         height: 160,
//     },
//     subjectCard: {
//         width: '45%',
//         height: 120,
//     },
//     horizontalCard: {
//         width: '100%',
//         flexDirection: 'row',
//         justifyContent: 'flex-start',
//         padding: 15,
//         alignItems: 'center',
//     },
//     largeCard: {
//         width: '45%',
//         height: 220,
//     },
//     selectedCard: {
//         borderColor: '#007AFF',
//         backgroundColor: '#E9F5FF',
//     },
//     cardImage: {
//         width: 80,
//         height: 80,
//         resizeMode: 'contain',
//         marginBottom: 8,
//     },
//     avatarImage: {
//         width: 100,
//         height: 100,
//         resizeMode: 'contain',
//     },
//     subjectImage: {
//         width: 60,
//         height: 60,
//         resizeMode: 'contain',
//         marginBottom: 4,
//     },
//     horizontalImage: {
//         width: 50,
//         height: 50,
//         resizeMode: 'contain',
//     },
//     largeCardImage: {
//         width: '90%',
//         height: 160,
//         resizeMode: 'contain',
//     },
//     cardLabel: {
//         fontWeight: '600',
//         textAlign: 'center',
//         color: '#334155',
//         fontSize: 14,
//         marginTop: 4,
//     },
//     horizontalLabel: {
//         textAlign: 'left',
//         marginLeft: 15,
//         flex: 1,
//         fontSize: 16,
//     },
//     cardSublabel: {
//         fontSize: 12,
//         color: '#64748b',
//     },
//     footer: {
//         position: 'absolute',
//         bottom: 30,
//         left: 20,
//         right: 20,
//         alignItems: 'center',
//     },
//     nextButton: {
//         backgroundColor: '#007AFF',
//         paddingVertical: 16,
//         width: '100%',
//         borderRadius: 12,
//         alignItems: 'center',
//         elevation: 2,
//     },
//     nextButtonText: {
//         color: 'white',
//         fontSize: 18,
//         fontWeight: 'bold',
//     },
//     disabledButton: {
//         backgroundColor: '#94a3b8',
//     },
//     skipButtonText: {
//         color: '#64748b',
//         fontSize: 16,
//         fontWeight: '500',
//     },
//     animationGif: {
//         width: 250,
//         height: 250,
//         resizeMode: 'contain',
//     },
//     badgeImage: {
//         width: 180,
//         height: 180,
//         resizeMode: 'contain',
//         marginVertical: 20,
//     },
//     avatarReadyBox: {
//         width: 300,
//         height: 300,
//         backgroundColor: 'rgba(255, 255, 255, 0.7)', 
//         borderRadius: 20,
//         justifyContent: 'center',
//         alignItems: 'center', 
//         borderWidth: 2,
//         borderColor: '#007AFF',
//         marginTop: 20,
//     },
//     finalAvatarImage: {
//         width: 250,
//         height: 250,
//         resizeMode: 'contain',
//     },
//     orangeCircle: {
//         width: Dimensions.get('window').width * 1.5,
//         height: Dimensions.get('window').width * 1.5,
//         borderRadius: (Dimensions.get('window').width * 1.5) / 2,
//         backgroundColor: '#F97316',
//         justifyContent: 'center',
//         alignItems: 'center',
//         transform: [{ translateY: Dimensions.get('window').height * 0.25 }],
//     },
//     circleMainText: {
//         fontSize: 28,
//         fontWeight: 'bold',
//         color: 'white',
//         textAlign: 'center',
//         marginBottom: 10,
//     },
//     circleSubText: {
//         fontSize: 18,
//         color: 'white',
//         textAlign: 'center',
//     },
//     animationContainer: {
//         width: 300,
//         height: 300,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     mainAnimationGif: {
//         width: 250,
//         height: 250,
//         resizeMode: 'contain',
//     },
//     overlayAnimationGif: {
//         ...StyleSheet.absoluteFillObject,
//         width: 300,
//         height: 300,
//         resizeMode: 'contain',
//     }
// });

// export default GamifiedOnboarding;
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  Image, ActivityIndicator, ScrollView, Alert, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/Superbase';
import { useAuth } from '../../Context/auth';
import Colors from '../../constant/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import GamifiedIntro from './GamifiedIntro';

// --- Data Sources with your actual image paths ---
const avatars = [
    { key: 'Edu Hero', label: 'Edu Hero', image: require('../../assets/images/onboarding/yourAvatar1.png') },
    { key: 'Prof. Wisdom', label: 'Prof. Wisdom', image: require('../../assets/images/onboarding/yourAvatar2.png') },
    { key: 'TeachMaster', label: 'TeachMaster', image: require('../../assets/images/onboarding/yourAvatar3.png') },
    { key: 'Coach Spark', label: 'Coach Spark', image: require('../../assets/images/onboarding/yourAvatar4.png') },
    { key: 'ScholarStar', label: 'ScholarStar', image: require('../../assets/images/onboarding/yourAvatar5.png') },
    { key: 'InspireGuru', label: 'InspireGuru', image: require('../../assets/images/onboarding/yourAvatar6.png') },
    { key: 'Bookwarm', label: 'Bookwarm', image: require('../../assets/images/onboarding/yourAvatar7.png') },
    { key: 'Knowledge Ninja', label: 'Knowledge Ninja', image: require('../../assets/images/onboarding/yourAvatar8.png') },
    { key: 'Chalk Master', label: 'Chalk Master', image: require('../../assets/images/onboarding/yourAvatar9.png') },
    { key: 'Guiding star', label: 'Guiding star', image: require('../../assets/images/onboarding/yourAvatar10.png') },
    { key: 'Brainstormer', label: 'Brainstormer', image: require('../../assets/images/onboarding/yourAvatar11.png') },
    { key: 'Mind Crafte', label: 'Mind Crafte', image: require('../../assets/images/onboarding/yourAvatar12.png') },
    { key: 'Brain Architect', label: 'Brain Architect', image: require('../../assets/images/onboarding/yourAvatar13.png') },
    { key: 'YouthTech', label: 'YouthTech', image: require('../../assets/images/onboarding/yourAvatar14.png') },
];
const genders = [
    { key: 'male', image: require('../../assets/images/onboarding/male.png') },
    { key: 'female', image: require('../../assets/images/onboarding/female.png') },
];
const generationBadges = [
    { key: '25-35', label: '25-35', sublabel: 'Novice', image: require('../../assets/images/onboarding/generationbadge1.png') },
    { key: '36-45', label: '36-45', sublabel: 'Emerging', image: require('../../assets/images/onboarding/generationbadge2.png') },
    { key: '46-55', label: '46-55', sublabel: 'Experienced', image: require('../../assets/images/onboarding/generationbadge3.png') },
    { key: '56-65', label: '56-65', sublabel: 'Master', image: require('../../assets/images/onboarding/generationbadge4.png') },
];
const experienceLevels = [
    { key: '0-1', sublabel: 'Novice', image: require('../../assets/images/onboarding/novice.png') },
    { key: '2-5', sublabel: 'Emerging', image: require('../../assets/images/onboarding/Emerging.png') },
    { key: '6-10', sublabel: 'Experienced', image: require('../../assets/images/onboarding/experienced.png') },
    { key: '10+', sublabel: 'Master', image: require('../../assets/images/onboarding/master.png') },
];
const subjects = [
    { key: 'math', label: 'Math', image: require('../../assets/images/onboarding/math.png') },
    { key: 'science', label: 'Science', image: require('../../assets/images/onboarding/science.png') },
    { key: 'geography', label: 'Geography', image: require('../../assets/images/onboarding/geography.png') },
    { key: 'history', label: 'History', image: require('../../assets/images/onboarding/history.png') },
    { key: 'biology', label: 'Biology', image: require('../../assets/images/onboarding/biology.png') },
    { key: 'chemistry', label: 'Chemistry', image: require('../../assets/images/onboarding/chemistry.png') },
    { key: 'physics', label: 'Physics', image: require('../../assets/images/onboarding/physics.png') },
    { key: 'evs', label: 'EVS', image: require('../../assets/images/onboarding/evs.png') },
    { key: 'art_craft', label: 'Art/Craft', image: require('../../assets/images/onboarding/art&craft.png') },
    { key: 'languages', label: 'Languages', image: require('../../assets/images/onboarding/language.png') },
    { key: 'computer', label: 'Computer', image: require('../../assets/images/onboarding/computer.png') },
    { key: 'technology', label: 'Technology', image: require('../../assets/images/onboarding/technology.png') },
    { key: 'engineering', label: 'Engineering', image: require('../../assets/images/onboarding/engineering.png') },
    { key: 'it', label: 'IT', image: require('../../assets/images/onboarding/IT.png') },
];
const teachingLevels = [
    { key: 'primary', label: 'Primary', sublabel: '1st - 5th', image: require('../../assets/images/onboarding/primary.png') },
    { key: 'middle', label: 'Middle School', sublabel: '6th-10th', image: require('../../assets/images/onboarding/middle.png') },
    { key: 'high', label: 'High School', sublabel: '11th - 12th', image: require('../../assets/images/onboarding/highschool.png') },
    { key: 'graduation', label: '12th+', sublabel: 'Graduation', image: require('../../assets/images/onboarding/12thgraduation.png') },
    { key: 'post_graduation', label: 'Post', sublabel: 'Graduation', image: require('../../assets/images/onboarding/PG.png') },
];
const teachingSkillsToImprove = [
    { key: 'public_speaking', label: 'Public speaking & communication', image: require('../../assets/images/onboarding/teachingSkills1.png') },
    { key: 'subject_knowledge', label: 'Subject Knowledge/understanding', image: require('../../assets/images/onboarding/teachingSkills2.png') },
    { key: 'assessment_feedback', label: 'Assessment & feedback techniques', image: require('../../assets/images/onboarding/teachingSkills3.png') },
    { key: 'student_engagement', label: 'Student engagement methods', image: require('../../assets/images/onboarding/teachingSkills4.png') },
    { key: 'classroom_management', label: 'Classroom management strategies', image: require('../../assets/images/onboarding/teachingSkills3.png') },
    { key: 'technology_tools', label: 'Technology & digital tools in education', image: require('../../assets/images/onboarding/teachingSkills4.png') },
];
const superSkills = [
    { key: 'motivator', label: 'Motivator', image: require('../../assets/images/onboarding/motivator.png') },
    { key: 'creativity', label: 'Creativity', image: require('../../assets/images/onboarding/creativity.png') },
    { key: 'communication', label: 'Communication', image: require('../../assets/images/onboarding/communication.png') },
    { key: 'management', label: 'Management', image: require('../../assets/images/onboarding/managment.png') },
    { key: 'technology', label: 'Technology', image: require('../../assets/images/onboarding/technology.png') },
    { key: 'collaboration', label: 'Collaboration', image: require('../../assets/images/onboarding/collaboration.png') },
];
const learningStyles = [
    { key: 'reading', label: 'Reading articles and research', image: require('../../assets/images/onboarding/levelup1.png') },
    { key: 'watching', label: 'Watching video lessons', image: require('../../assets/images/onboarding/levelup2.png') },
    { key: 'interactive', label: 'Completing interactive challenges', image: require('../../assets/images/onboarding/levelup3.png') },
    { key: 'discussions', label: 'Engaging in discussions with peers', image: require('../../assets/images/onboarding/levelup4.png') },
];
const platformGoals = [
    { key: 'improve_skills', label: 'Improve my teaching skills', image: require('../../assets/images/onboarding/goal1.png') },
    { key: 'connect', label: 'Connect with other teachers', image: require('../../assets/images/onboarding/goal2.png') },
    { key: 'new_strategies', label: 'Learn new teaching strategies', image: require('../../assets/images/onboarding/goal3.png') },
    { key: 'certifications', label: 'Earn certifications for professional growth', image: require('../../assets/images/onboarding/goal4.png') },
];

// --- Main Onboarding Component ---
const GamifiedOnboarding = () => {
    const router = useRouter();
    const { session } = useAuth();
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [onboardingData, setOnboardingData] = useState({
        avatar: '',
        gender: '',
        generation_badge: '',
        experience_level: '',
        subjects_interest: [] as string[],
        teaching_role: '',
        teaching_skills_to_improve: [] as string[],
        super_skills: [] as string[],
        learning_styles: [] as string[],
        platform_goals: [] as string[],
    });

    const handleSingleSelect = (key: keyof typeof onboardingData, value: string) => {
        setOnboardingData(prev => ({ ...prev, [key]: value }));
    };

    const handleMultiSelect = (key: keyof typeof onboardingData, value: string) => {
        setOnboardingData(prev => {
            const currentValues = prev[key] as string[];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(item => item !== value)
                : [...currentValues, value];
            return { ...prev, [key]: newValues };
        });
    };

    // This function now takes the final data as an argument to avoid stale state issues.
    const handleOnboardingComplete = async (finalData: typeof onboardingData) => {
        if (isSubmitting) return; 
        setIsSubmitting(true);
        console.log('--- [Submission Started] ---');

        const userId = session?.user?.id;
        if (!userId) {
            Alert.alert("Authentication Error", "Your session is invalid. Please log in again.");
            setIsSubmitting(false);
            router.replace('/auth/SignIn');
            return;
        }

        console.log(`[DEBUG] Attempting to update profile for user: ${userId}`);

        try {
            const updatePayload = {
                avatar: finalData.avatar,
                generation_badge: finalData.generation_badge,
                teaching_skills_to_improve: finalData.teaching_skills_to_improve,
                gender: finalData.gender,
                experience_level: finalData.experience_level,
                subjects_interest: finalData.subjects_interest,
                teaching_role: finalData.teaching_role,
                super_skills: finalData.super_skills,
                learning_styles: finalData.learning_styles,
                platform_goals: finalData.platform_goals,
                gamified_completed: true, 
            };

            console.log('[DEBUG] Final payload being sent to Supabase:', JSON.stringify(updatePayload, null, 2));

            const { data, error } = await supabase
                .from('profiles')
                .update(updatePayload)
                .eq('id', userId)
                .select();

            if (error) throw error;
            if (!data || data.length === 0) throw new Error("Update blocked by RLS policies or profile not found.");
            
            if (data[0].gamified_completed === true) {
                console.log('[SUCCESS] Profile updated successfully in DB.');
                setStep(15); // Advance to the final "Avatar Ready" screen
            } else {
                throw new Error("Database update succeeded but the flag was not set to true.");
            }

        } catch (err: any) {
            console.error("[SUBMISSION FAILED] Error:", err);
            Alert.alert("Error Saving Preferences", `We couldn't save your details. Please try again.\n\nError: ${err.message}`);
            setIsSubmitting(false); // Allow user to retry
        }
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s > 0 ? s - 1 : 0);
    const exitOnboarding = () => router.replace('/(screens)/Home');

    const renderStepContent = () => {
        const commonProps = { onNext: nextStep, onSkip: nextStep, onBack: prevStep };

        switch (step) {
            case 0: return <GamifiedIntro onFinish={() => setStep(1)} />;
            case 1: return <SelectSubjectsScreen {...commonProps} selected={onboardingData.subjects_interest} onSelect={(val) => handleMultiSelect('subjects_interest', val)} />;
            case 2: return <GreatChoiceScreen onNext={nextStep} />;
            case 3: return <SelectGenderScreen {...commonProps} selected={onboardingData.gender} onSelect={(val) => handleSingleSelect('gender', val)} />;
            case 4: return <SelectExperienceScreen {...commonProps} selected={onboardingData.experience_level} onSelect={(val) => handleSingleSelect('experience_level', val)} />;
            case 5: return <SelectPlatformGoalsScreen {...commonProps} selected={onboardingData.platform_goals} onSelect={(val) => handleMultiSelect('platform_goals', val)} />;
            case 6: return <SelectLearningStyleScreen {...commonProps} selected={onboardingData.learning_styles} onSelect={(val) => handleMultiSelect('learning_styles', val)} />;
            case 7: return <SelectSuperPowerScreen {...commonProps} selected={onboardingData.super_skills} onSelect={(val) => handleMultiSelect('super_skills', val)} />;
            case 8: return <SelectCurrentRoleGradesScreen {...commonProps} selected={onboardingData.teaching_role} onSelect={(val) => handleSingleSelect('teaching_role', val)} />;
            case 9: return <SelectCurrentRoleSkillsScreen {...commonProps} selected={onboardingData.teaching_skills_to_improve} onSelect={(val) => handleMultiSelect('teaching_skills_to_improve', val)} />;
            case 10: return <SelectAgeGroupScreen {...commonProps} selected={onboardingData.generation_badge} onSelect={(val) => handleSingleSelect('generation_badge', val)} />;
            case 11: return <SelectAvatarScreen {...commonProps} selected={onboardingData.avatar} onSelect={(val) => handleSingleSelect('avatar', val)} />;
            case 12: return <CongratulationScreen onFinish={() => setStep(13)} />;
            
            // --- CORRECTED STEP FLOW ---
            case 13: return <CreatingScreen onNext={() => setStep(14)} />;
            case 14: return <LoadingAvatarScreen onSubmissionTrigger={() => handleOnboardingComplete(onboardingData)} isSubmitting={isSubmitting} />;
            case 15: return <AvatarReadyScreen onFinish={exitOnboarding} selectedAvatarKey={onboardingData.avatar} />;

            default: return null;
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient colors={['#F0F8FF', '#FFFFFF']} style={styles.gradientBg}>
                {renderStepContent()}
            </LinearGradient>
        </SafeAreaView>
    );
};

// --- Child Components ---

const Header = ({ onSkip, onBack }) => (
    <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
            <Image source={require('../../assets/images/onboarding/back-arrow.png')} style={{width: 24, height: 24}}/>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
    </View>
);

const Footer = ({ onNext, isNextDisabled }) => (
    <View style={styles.footer}>
        <TouchableOpacity style={[styles.nextButton, isNextDisabled && styles.disabledButton]} onPress={onNext} disabled={isNextDisabled}>
            <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
    </View>
);

const SelectSubjectsScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => {
    const isNextDisabled = selected.length === 0;
    return (
        <View style={styles.stepContainer}>
            <Header onSkip={onSkip} onBack={onBack} />
            <Text style={styles.mainTitle}>For ENHANCING your experience</Text>
            <Text style={styles.subTitle}>Teach me about your interests?</Text>
            <ScrollView contentContainerStyle={styles.gridList}>
                {subjects.map(option => (
                    <TouchableOpacity key={option.key} style={[styles.card, styles.subjectCard, selected.includes(option.key) && styles.selectedCard]} onPress={() => onSelect(option.key)}>
                        <Image source={option.image} style={styles.subjectImage} />
                        <Text style={styles.cardLabel}>{option.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <Footer onNext={onNext} isNextDisabled={isNextDisabled} />
        </View>
    );
};

// ... (Paste all other Select...Screen components here, they are unchanged)
const SelectGenderScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => { const isNextDisabled = !selected; return <View style={styles.stepContainer}><Header onSkip={onSkip} onBack={onBack} /><Text style={styles.mainTitle}>"Let’s Get to Know You Better!"</Text><Text style={styles.subTitle}>Select your Gender</Text><View style={[styles.gridList, {justifyContent: 'center'}]}>{genders.map(option => (<TouchableOpacity key={option.key} style={[styles.card, styles.largeCard, selected === option.key && styles.selectedCard]} onPress={() => onSelect(option.key)}><Image source={option.image} style={styles.largeCardImage} /></TouchableOpacity>))}</View><Footer onNext={onNext} isNextDisabled={isNextDisabled} /></View>; };
const SelectExperienceScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => { const isNextDisabled = !selected; return <View style={styles.stepContainer}><Header onSkip={onSkip} onBack={onBack} /><Text style={styles.mainTitle}>"Step Into the Spotlight: Tell Us About Your Teaching Adventure"</Text><Text style={styles.subTitle}>Select your experience level?</Text><View style={styles.gridList}>{experienceLevels.map(option => (<TouchableOpacity key={option.key} style={[styles.card, {width: '45%'}, selected === option.key && styles.selectedCard]} onPress={() => onSelect(option.key)}><Image source={option.image} style={styles.cardImage} /><Text style={styles.cardSublabel}>{option.sublabel}</Text></TouchableOpacity>))}</View><Footer onNext={onNext} isNextDisabled={isNextDisabled} /></View>; };
const SelectPlatformGoalsScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => { const isNextDisabled = selected.length === 0; return <View style={styles.stepContainer}><Header onSkip={onSkip} onBack={onBack} /><Text style={styles.mainTitle}>What is your main goal for using this Platform?</Text><Text style={styles.subTitle}>Select your goals to want to achieve</Text><ScrollView contentContainerStyle={styles.horizontalList}>{platformGoals.map(option => (<TouchableOpacity key={option.key} style={[styles.card, styles.horizontalCard, selected.includes(option.key) && styles.selectedCard]} onPress={() => onSelect(option.key)}><Image source={option.image} style={styles.horizontalImage} /><Text style={[styles.cardLabel, styles.horizontalLabel]}>{option.label}</Text></TouchableOpacity>))}</ScrollView><Footer onNext={onNext} isNextDisabled={isNextDisabled} /></View>; };
const SelectLearningStyleScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => { const isNextDisabled = selected.length === 0; return <View style={styles.stepContainer}><Header onSkip={onSkip} onBack={onBack} /><Text style={styles.mainTitle}>How Do You Like to Level Up?</Text><Text style={styles.subTitle}>Customize Your Learning Adventure!</Text><ScrollView contentContainerStyle={styles.horizontalList}>{learningStyles.map(option => (<TouchableOpacity key={option.key} style={[styles.card, styles.horizontalCard, selected.includes(option.key) && styles.selectedCard]} onPress={() => onSelect(option.key)}><Image source={option.image} style={styles.horizontalImage} /><Text style={[styles.cardLabel, styles.horizontalLabel]}>{option.label}</Text></TouchableOpacity>))}</ScrollView><Footer onNext={onNext} isNextDisabled={isNextDisabled} /></View>; };
const SelectSuperPowerScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => { const isNextDisabled = selected.length === 0; return <View style={styles.stepContainer}><Header onSkip={onSkip} onBack={onBack} /><Text style={styles.mainTitle}>"Missing a Power? Choose the One You'd Love to Gain!"</Text><Text style={styles.subTitle}>Power Up! Pick Your Super Skill</Text><View style={styles.gridList}>{superSkills.map(option => (<TouchableOpacity key={option.key} style={[styles.card, {width: '30%'}, selected.includes(option.key) && styles.selectedCard]} onPress={() => onSelect(option.key)}><Image source={option.image} style={styles.cardImage} /><Text style={styles.cardLabel}>{option.label}</Text></TouchableOpacity>))}</View><Footer onNext={onNext} isNextDisabled={isNextDisabled} /></View>; };
const SelectCurrentRoleGradesScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => { const isNextDisabled = !selected; return <View style={styles.stepContainer}><Header onSkip={onSkip} onBack={onBack} /><Text style={styles.mainTitle}>What teaching level best describes your current role?</Text><Text style={styles.subTitle}>Select the grades you currently teach</Text><View style={styles.gridList}>{teachingLevels.map(option => (<TouchableOpacity key={option.key} style={[styles.card, {width: '30%'}, selected === option.key && styles.selectedCard]} onPress={() => onSelect(option.key)}><Image source={option.image} style={styles.cardImage} /><Text style={styles.cardLabel}>{option.label}</Text><Text style={styles.cardSublabel}>{option.sublabel}</Text></TouchableOpacity>))}</View><Footer onNext={onNext} isNextDisabled={isNextDisabled} /></View>; };
const SelectCurrentRoleSkillsScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => { const isNextDisabled = selected.length === 0; return <View style={styles.stepContainer}><Header onSkip={onSkip} onBack={onBack} /><Text style={styles.mainTitle}>What teaching level best describes your current role?</Text><Text style={styles.subTitle}>Select the teaching skills you'd like to improve</Text><ScrollView contentContainerStyle={styles.horizontalList}>{teachingSkillsToImprove.map(option => (<TouchableOpacity key={option.key} style={[styles.card, styles.horizontalCard, selected.includes(option.key) && styles.selectedCard]} onPress={() => onSelect(option.key)}><Image source={option.image} style={styles.horizontalImage} /><Text style={[styles.cardLabel, styles.horizontalLabel]}>{option.label}</Text></TouchableOpacity>))}</ScrollView><Footer onNext={onNext} isNextDisabled={isNextDisabled} /></View>; };
const SelectAgeGroupScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => { const isNextDisabled = !selected; return <View style={styles.stepContainer}><Header onSkip={onSkip} onBack={onBack} /><Text style={styles.mainTitle}>Pick Your Generation Badge</Text><Text style={styles.subTitle}>Select your Age group</Text><View style={styles.gridList}>{generationBadges.map(option => (<TouchableOpacity key={option.key} style={[styles.card, {width: '45%'}, selected === option.key && styles.selectedCard]} onPress={() => onSelect(option.key)}><Image source={option.image} style={styles.cardImage} /><Text style={styles.cardLabel}>{option.label}</Text><Text style={styles.cardSublabel}>{option.sublabel}</Text></TouchableOpacity>))}</View><Footer onNext={onNext} isNextDisabled={isNextDisabled} /></View>; };
const SelectAvatarScreen = ({ onNext, onSkip, onBack, selected, onSelect }) => { const isNextDisabled = !selected; return <View style={styles.stepContainer}><Header onSkip={onSkip} onBack={onBack} /><Text style={styles.mainTitle}>Let’s Create your Profile</Text><Text style={styles.subTitle}>Select your Avatar</Text><ScrollView contentContainerStyle={[styles.gridList, {paddingBottom: 80}]}>{avatars.map(option => (<TouchableOpacity key={option.key} style={[styles.card, styles.avatarCard, selected === option.key && styles.selectedCard]} onPress={() => onSelect(option.key)}><Image source={option.image} style={styles.avatarImage} /><Text style={styles.cardLabel}>{option.label}</Text></TouchableOpacity>))}</ScrollView><Footer onNext={onNext} isNextDisabled={isNextDisabled} /></View>; };

const GreatChoiceScreen = ({ onNext }) => {
    useEffect(() => {
        const timer = setTimeout(onNext, 2500);
        return () => clearTimeout(timer);
    }, [onNext]);
    return ( <View style={styles.centeredContainer}><View style={styles.animationContainer}><Image source={require('../../assets/images/onboarding/yourChoiceOfIntrest2.gif')} style={styles.overlayAnimationGif} /><Image source={require('../../assets/images/onboarding/yourChoiceOfIntrest1.gif')} style={styles.mainAnimationGif} /></View><Text style={[styles.mainTitle, { color: '#4A55A2', marginTop: 20 }]}>Your choice of interest are great!</Text></View> );
};

const CongratulationScreen = ({ onFinish }) => ( <View style={styles.centeredContainer}><Text style={[styles.mainTitle, { fontSize: 32, marginBottom: 8 }]}>Congratulation!</Text><Text style={styles.subTitle}>on your first badges</Text><Image source={require('../../assets/images/onboarding/congrats.gif')} style={styles.badgeImage} /><Text style={[styles.subTitle, { marginTop: 20, fontWeight: 'bold' }]}>Onboarding Completed!</Text><View style={styles.footer}><TouchableOpacity style={styles.nextButton} onPress={onFinish}><Text style={styles.nextButtonText}>Continue</Text></TouchableOpacity></View></View> );

const CreatingScreen = ({ onNext }) => {
    useEffect(() => {
        const timer = setTimeout(onNext, 2000);
        return () => clearTimeout(timer);
    }, [onNext]);
    return (
        <View style={styles.centeredContainer}>
            <Image source={require('../../assets/images/onboarding/creating.gif')} style={styles.animationGif} />
            <Text style={[styles.mainTitle, { marginTop: 20 }]}>Creating...</Text>
        </View>
    );
};

const LoadingAvatarScreen = ({ onSubmissionTrigger, isSubmitting }) => {
    useEffect(() => {
        onSubmissionTrigger(); 
    }, [onSubmissionTrigger]);
    return (
        <View style={styles.centeredContainer}>
             <Image source={require('../../assets/images/onboarding/loadingAvatar.gif')} style={styles.animationGif} />
             <Text style={[styles.mainTitle, { marginTop: 20 }]}>
                {isSubmitting ? "Saving your preferences..." : "Finalizing..."}
             </Text>
             {isSubmitting && <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ marginTop: 10 }} />}
        </View>
    );
};

const AvatarReadyScreen = ({ onFinish, selectedAvatarKey }) => {
    const selectedAvatar = avatars.find(a => a.key === selectedAvatarKey);
    return (
        <View style={styles.centeredContainer}>
            <TouchableOpacity onPress={onFinish} style={{ position: 'absolute', top: 60, right: 20 }}>
                 <Image source={require('../../assets/images/onboarding/back-arrow.png')} style={{width: 24, height: 24, transform: [{rotate: '180deg'}] }}/>
            </TouchableOpacity>
            <Text style={styles.mainTitle}>Your Avatar is ready</Text>
            <View style={styles.avatarReadyBox}>
                <Image source={selectedAvatar ? selectedAvatar.image : require('../../assets/images/onboarding/yourAvatar1.png')} style={styles.finalAvatarImage} />
            </View>
            <Text style={[styles.cardLabel, { marginTop: 15, fontSize: 18 }]}>{selectedAvatar?.label || "Your Avatar"}</Text>
             <View style={styles.footer}>
                <TouchableOpacity onPress={onFinish} >
                    <Text style={styles.skipButtonText}>Done</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F0F8FF',
    },
    gradientBg: {
        flex: 1,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    stepContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 5,
    },
    mainTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#1e293b',
    },
    subTitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#475569',
    },
    gridList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        gap: 15,
    },
    horizontalList: {
        flexDirection: 'column',
        gap: 15,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatarCard: {
        width: '45%',
        height: 160,
    },
    subjectCard: {
        width: '45%',
        height: 120,
    },
    horizontalCard: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        padding: 15,
        alignItems: 'center',
    },
    largeCard: {
        width: '45%',
        height: 220,
    },
    selectedCard: {
        borderColor: '#007AFF',
        backgroundColor: '#E9F5FF',
    },
    cardImage: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
        marginBottom: 8,
    },
    avatarImage: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
    },
    subjectImage: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
        marginBottom: 4,
    },
    horizontalImage: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
    },
    largeCardImage: {
        width: '90%',
        height: 160,
        resizeMode: 'contain',
    },
    cardLabel: {
        fontWeight: '600',
        textAlign: 'center',
        color: '#334155',
        fontSize: 14,
        marginTop: 4,
    },
    horizontalLabel: {
        textAlign: 'left',
        marginLeft: 15,
        flex: 1,
        fontSize: 16,
    },
    cardSublabel: {
        fontSize: 12,
        color: '#64748b',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    nextButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        width: '100%',
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
    },
    nextButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#94a3b8',
    },
    skipButtonText: {
        color: '#64748b',
        fontSize: 16,
        fontWeight: '500',
    },
    animationGif: {
        width: 250,
        height: 250,
        resizeMode: 'contain',
    },
    badgeImage: {
        width: 180,
        height: 180,
        resizeMode: 'contain',
        marginVertical: 20,
    },
    avatarReadyBox: {
        width: 300,
        height: 300,
        backgroundColor: 'rgba(255, 255, 255, 0.7)', 
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center', 
        borderWidth: 2,
        borderColor: '#007AFF',
        marginTop: 20,
    },
    finalAvatarImage: {
        width: 250,
        height: 250,
        resizeMode: 'contain',
    },
    orangeCircle: {
        width: Dimensions.get('window').width * 1.5,
        height: Dimensions.get('window').width * 1.5,
        borderRadius: (Dimensions.get('window').width * 1.5) / 2,
        backgroundColor: '#F97316',
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ translateY: Dimensions.get('window').height * 0.25 }],
    },
    circleMainText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 10,
    },
    circleSubText: {
        fontSize: 18,
        color: 'white',
        textAlign: 'center',
    },
    animationContainer: {
        width: 300,
        height: 300,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainAnimationGif: {
        width: 250,
        height: 250,
        resizeMode: 'contain',
    },
    overlayAnimationGif: {
        ...StyleSheet.absoluteFillObject,
        width: 300,
        height: 300,
        resizeMode: 'contain',
    }
});

export default GamifiedOnboarding;