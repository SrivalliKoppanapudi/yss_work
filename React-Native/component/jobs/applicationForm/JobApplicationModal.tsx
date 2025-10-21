// import React, { useState, useEffect } from 'react';
// import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { X, ArrowLeft, ArrowRight } from 'lucide-react-native';
// import Colors from '../../../constant/Colors'; // Adjust path
// import { Job, JobApplication, EducationEntry, ExperienceEntry } from '../../../types/jobs'; // Adjust path
// import { useAuth } from '../../../Context/auth'; // Adjust path
// import { supabase } from '../../../lib/Superbase'; // Adjust path

// import ApplicationStepper from './ApplicationStepper';
// import Step1PersonalInfo from './Step1_PersonalInfo';
// import Step2Education from './Step2_Education';
// import Step3Experience from './Step3_Experience';
// import Step4AdditionalInfo from './Step4_AdditionalInfo';

// interface JobApplicationModalProps {
//   isVisible: boolean;
//   onClose: () => void;
//   job: Job | null;
//   onApplicationSubmitSuccess: (applicationId: string) => void;
// }

// const initialApplicationState: Partial<JobApplication> = {
//   first_name: '',
//   last_name: '',
//   dob: '',
//   street_address: '',
//   city: '',
//   state: '',
//   pin_code: '',
//   education: [],
//   teaching_level: '',
//   subjects_specialization: [],
//   is_experienced: false,
//   experiences: [],
//   experience: 'Fresher',
//   current_ctc: '',
//   expected_ctc: '',
//   board_experience: '',
//   teaching_methodology: '',
//   languages_known: '',
//   certifications: '',
//   resume_url: null,
//   status: 'Applied',
// };

// const steps = ['Personal Info', 'Education', 'Experience', 'Additional Info & Resume'];

// const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
//   isVisible,
//   onClose,
//   job,
//   onApplicationSubmitSuccess,
// }) => {
//   const { session } = useAuth();
//   const [currentStep, setCurrentStep] = useState(0);
//   const [applicationData, setApplicationData] = useState<Partial<JobApplication>>(initialApplicationState);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isPrefilling, setIsPrefilling] = useState(false);

//   useEffect(() => {
//     const prefillData = async () => {
//         if (isVisible && session?.user) {
//             setIsPrefilling(true);
            
//             let initialData = { ...initialApplicationState, user_id: session.user.id };

//             // Set personal info from session
//             if (session.user.user_metadata) {
//                 const fullName = session.user.user_metadata.full_name || '';
//                 const nameParts = fullName.split(' ');
//                 initialData.first_name = nameParts[0] || '';
//                 initialData.last_name = nameParts.slice(1).join(' ') || '';
//             }

//             // Fetch and map profile data for education and experience
//             try {
//                 const { data: profileData, error: profileError } = await supabase
//                     .from('profiles')
//                     .select('education_json, experience_json')
//                     .eq('id', session.user.id)
//                     .single();

//                 if (profileError) throw profileError;

//                 if (profileData) {
//                     if (Array.isArray(profileData.education_json)) {
//                         initialData.education = profileData.education_json.map((edu: any) => ({
//                             id: edu.id || Date.now().toString(),
//                             institutionName: edu.institution || '',
//                             degree: edu.degree || '',
//                             fieldOfStudy: edu.fieldOfStudy || '',
//                             startDate: edu.startDate || '',
//                             endDate: edu.endDate || '',
//                             gpa: edu.gpa || '',
//                             isCurrent: edu.isCurrent || false,
//                         }));
//                     }
                    
//                     if (Array.isArray(profileData.experience_json) && profileData.experience_json.length > 0) {
//                         initialData.is_experienced = true; // Set to true if there's experience
//                         initialData.experiences = profileData.experience_json.map((exp: any) => ({
//                             id: exp.id || Date.now().toString(),
//                             institution: exp.institution || '',
//                             position: exp.role || '',
//                             location: exp.location || '',
//                             startDate: exp.startDate || '',
//                             endDate: exp.endDate || '',
//                             isCurrentPosition: exp.isCurrent || false,
//                             responsibilities: exp.description || '',
//                             achievements: exp.achievements || '',
//                         }));
//                     }
//                 }
//             } catch (err: any) {
//                 console.warn("Could not prefill profile data:", err.message);
//                 // Continue without prefilled data, not a fatal error
//             }

//             setApplicationData(initialData);
//             setIsPrefilling(false);
//         } else if (!isVisible) {
//             // Reset form when modal is closed
//             setCurrentStep(0);
//         }
//     };
    
//     prefillData();

//   }, [isVisible, session, job]);

//   const validateStep = (stepIndex: number): boolean => {
//     switch (stepIndex) {
//       case 0:
//         if (!applicationData.first_name?.trim() || !applicationData.last_name?.trim()) {
//           Alert.alert("Missing Information", "First name and last name are required.");
//           return false;
//         }
//         return true;
//       case 1:
//         if (applicationData.education?.some(edu => !edu.institutionName || !edu.degree || !edu.fieldOfStudy || !edu.startDate || (!edu.isCurrent && !edu.endDate))) {
//           // Allow skipping if no education entries are added, but if one is added, it must be complete
//           if (applicationData.education && applicationData.education.length > 0 && applicationData.education.some(edu => edu.institutionName || edu.degree || edu.fieldOfStudy)) {
//             Alert.alert("Incomplete Education", "Please complete all required fields for each education entry or remove incomplete entries.");
//             return false;
//           }
//         }
//         return true;
//       case 2:
//         if (applicationData.is_experienced && applicationData.experiences?.some(exp => !exp.institution || !exp.position || !exp.startDate || (!exp.isCurrentPosition && !exp.endDate) )) {
//            if (applicationData.experiences && applicationData.experiences.length > 0 && applicationData.experiences.some(exp => exp.institution || exp.position )) {
//             Alert.alert("Incomplete Experience", "If experienced, please complete all required fields for each experience entry or remove incomplete entries.");
//             return false;
//            }
//         }
//         return true;
//       case 3:
//         if (!applicationData.resume_url) {
//             Alert.alert("Resume Required", "Please upload your resume to proceed.");
//             return false;
//         }
//         return true;
//       default:
//         return true;
//     }
//   };

//   const handleNextStep = () => {
//     if (!validateStep(currentStep)) {
//       return;
//     }
//     if (currentStep < steps.length - 1) {
//       setCurrentStep(currentStep + 1);
//     } else {
//       handleSubmitApplication();
//     }
//   };

//   const handlePrevStep = () => {
//     if (currentStep > 0) {
//       setCurrentStep(currentStep - 1);
//     }
//   };

//   const updateApplicationData = (fieldOrData: keyof JobApplication | Partial<JobApplication>, value?: any) => {
//     if (typeof fieldOrData === 'string') {
//       setApplicationData(prev => ({ ...prev, [fieldOrData]: value }));
//     } else {
//       setApplicationData(prev => ({ ...prev, ...fieldOrData }));
//     }
//   };

//   const handleSubmitApplication = async () => {
//     if (!job || !session?.user?.id) {
//       Alert.alert("Error", "Job details or user session is missing. Cannot submit application.");
//       return;
//     }
//     if (!validateStep(3)) { // Final validation of the last step
//         return;
//     }

//     setIsSubmitting(true);
//     try {
//       const finalDataToSubmit: Omit<JobApplication, 'id' | 'created_at' | 'updated_at' | 'application_date'> & {user_id: string} = {
//         job_id: job.id,
//         user_id: session.user.id,
//         first_name: applicationData.first_name?.trim() || null,
//         last_name: applicationData.last_name?.trim() || null,
//         dob: applicationData.dob?.trim() || null,
//         street_address: applicationData.street_address?.trim() || null,
//         city: applicationData.city?.trim() || null,
//         state: applicationData.state?.trim() || null,
//         pin_code: applicationData.pin_code?.trim() || null,
//         education: applicationData.education && applicationData.education.length > 0 ? applicationData.education.filter(e => e.institutionName && e.degree) : [],
//         teaching_level: applicationData.teaching_level?.trim() || null,
//         subjects_specialization: applicationData.subjects_specialization && applicationData.subjects_specialization.length > 0 ? applicationData.subjects_specialization : [],
//         is_experienced: applicationData.is_experienced || false,
//         experiences: applicationData.is_experienced && applicationData.experiences && applicationData.experiences.length > 0 ? applicationData.experiences.filter(e => e.institution && e.position) : [],
//         experience: applicationData.experience?.trim() || (applicationData.is_experienced ? 'Experienced' : 'Fresher'),
//         current_ctc: applicationData.current_ctc?.trim() || null,
//         expected_ctc: applicationData.expected_ctc?.trim() || null,
//         board_experience: applicationData.board_experience?.trim() || null,
//         teaching_methodology: applicationData.teaching_methodology?.trim() || null,
//         languages_known: applicationData.languages_known?.trim() || null,
//         certifications: applicationData.certifications?.trim() || null,
//         resume_url: applicationData.resume_url || null,
//         status: 'Applied',
//         notes: null,
//       };

//       const { data, error } = await supabase
//         .from('job_applications')
//         .insert(finalDataToSubmit)
//         .select()
//         .single();

//       if (error) {
//         if (error.code === '23505') {
//             Alert.alert("Already Applied", "You have already submitted an application for this job.");
//             onApplicationSubmitSuccess(applicationData.id || "unknown_id_after_duplicate_error"); // Inform parent about attempt
//         } else {
//             console.error("Supabase insert error:", error);
//             throw error;
//         }
//       } else if (data) {
//         Alert.alert("Application Submitted!", "Your application has been sent successfully.");
//         onApplicationSubmitSuccess(data.id);
//         onClose();
//       }
//     } catch (err: any) {
//       console.error("Error submitting application:", err);
//       Alert.alert("Submission Failed", err.message || "Could not submit your application.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const renderStepContent = () => {
//     if (isPrefilling) {
//         return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={Colors.PRIMARY}/></View>;
//     }
//     const props = { data: applicationData, onUpdate: updateApplicationData, job: job };
//     switch (currentStep) {
//       case 0: return <Step1PersonalInfo {...props} />;
//       case 1: return <Step2Education {...props} />;
//       case 2: return <Step3Experience {...props} />;
//       case 3: return <Step4AdditionalInfo {...props} />;
//       default: return null;
//     }
//   };

//   return (
//     <Modal
//       visible={isVisible}
//       animationType="slide"
//       onRequestClose={() => {
//         if (!isSubmitting) onClose(); // Prevent closing while submitting
//       }}
//       presentationStyle={Platform.OS === 'ios' ? "formSheet" : undefined} // formSheet is iOS specific
//     >
//       <SafeAreaView style={styles.safeArea}>
//         <View style={styles.modalHeader}>
//           <Text style={styles.modalTitleText}>Apply for {job?.job_name || 'Job'}</Text>
//           <TouchableOpacity onPress={isSubmitting ? undefined : onClose} style={styles.closeButton} disabled={isSubmitting}>
//             <X size={24} color={Colors.GRAY} />
//           </TouchableOpacity>
//         </View>

//         <ApplicationStepper steps={steps} currentStep={currentStep} />

//         <ScrollView
//             style={styles.stepContentScrollView}
//             contentContainerStyle={styles.stepContentContainer}
//             keyboardShouldPersistTaps="handled" // Important for inputs within scrollview
//         >
//           {renderStepContent()}
//         </ScrollView>

//         <View style={styles.navigationButtons}>
//           <TouchableOpacity
//             style={[styles.navButton, styles.prevButton, (currentStep === 0 || isSubmitting) && styles.disabledButton]}
//             onPress={handlePrevStep}
//             disabled={currentStep === 0 || isSubmitting}
//           >
//             <ArrowLeft size={18} color={(currentStep === 0 || isSubmitting) ? Colors.GRAY : Colors.PRIMARY} />
//             <Text style={[styles.navButtonText, styles.prevButtonText, (currentStep === 0 || isSubmitting) && {color: Colors.GRAY}]}>Previous</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[styles.navButton, styles.nextButton, isSubmitting && styles.disabledButton]}
//             onPress={handleNextStep}
//             disabled={isSubmitting}
//           >
//             {isSubmitting && currentStep === steps.length - 1 ? (
//               <ActivityIndicator color={Colors.WHITE} size="small" />
//             ) : (
//               <>
//                 <Text style={[styles.navButtonText, styles.nextButtonText]}>
//                   {currentStep === steps.length - 1 ? 'Submit Application' : 'Next'}
//                 </Text>
//                 {currentStep < steps.length - 1 && <ArrowRight size={18} color={Colors.WHITE} />}
//               </>
//             )}
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     </Modal>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: Colors.WHITE,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0', // Softer border color
//   },
//   modalTitleText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: Colors.BLACK, // Use black for better readability
//     flex:1, // Allow title to take space
//     textAlign: 'left', // Align title to left by default
//   },
//   closeButton: {
//     padding: 8, // Make tap area larger
//   },
//   // ApplicationStepper styles would be in ApplicationStepper.tsx
//   stepContentScrollView: {
//     flex: 1, // Ensure ScrollView takes available space
//   },
//   stepContentContainer: {
//     paddingHorizontal: 20,
//     paddingTop: 10, // Add some top padding for content
//     paddingBottom: 20,
//   },
//   navigationButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     paddingVertical: Platform.OS === 'ios' ? 15 : 12, // Adjust padding for platform
//     borderTopWidth: 1,
//     borderTopColor: '#e0e0e0',
//     backgroundColor: Colors.WHITE,
//   },
//   navButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     minWidth: 120, // Ensure buttons have decent width
//     justifyContent: 'center',
//   },
//   prevButton: {
//     backgroundColor: Colors.WHITE,
//     borderWidth: 1.5, // Make border slightly thicker
//     borderColor: Colors.PRIMARY,
//   },
//   nextButton: {
//     backgroundColor: Colors.PRIMARY,
//   },
//   navButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   prevButtonText: {
//     color: Colors.PRIMARY,
//     marginRight: 5, // Space between text and icon
//   },
//   nextButtonText: {
//     color: Colors.WHITE,
//     marginLeft: 5, // Space between text and icon
//   },
//   disabledButton: {
//     opacity: 0.5, // Visual cue for disabled state
//   },
// });

// export default JobApplicationModal;


// file: component/jobs/applicationForm/JobApplicationModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Colors from '../../../constant/Colors';
import { Job, JobApplication } from '../../../types/jobs';
import { useAuth } from '../../../Context/auth';
import { supabase } from '../../../lib/Superbase';

import ApplicationStepper from './ApplicationStepper';
import Step1PersonalInfo from './Step1_PersonalInfo';
import Step2Education from './Step2_Education';
import Step3Experience from './Step3_Experience';
import Step4AdditionalInfo from './Step4_AdditionalInfo';

interface JobApplicationModalProps {
  isVisible: boolean;
  onClose: () => void;
  job: Job | null;
  onApplicationSubmitSuccess: (applicationId: string) => void;
}

const initialApplicationState: Partial<JobApplication> = {
  first_name: '', last_name: '', dob: '', street_address: '', city: '', state: '', pin_code: '',
  education: [], teaching_level: '', subjects_specialization: [], is_experienced: false,
  experiences: [], experience: 'Fresher', current_ctc: '', expected_ctc: '',
  board_experience: '', teaching_methodology: '', languages_known: '', certifications: '',
  resume_url: null, status: 'Applied',
};

const steps = ['Personal Info', 'Education', 'Experience', 'Additional Info & Resume'];

const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  isVisible, onClose, job, onApplicationSubmitSuccess,
}) => {
  const { session } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [applicationData, setApplicationData] = useState<Partial<JobApplication>>(initialApplicationState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(true);

  const prefillData = useCallback(async () => {
    if (!isVisible || !session?.user) return;
    setIsPrefilling(true);
    let initialData = { ...initialApplicationState, user_id: session.user.id };
    if (session.user.user_metadata) {
      const fullName = session.user.user_metadata.full_name || '';
      const nameParts = fullName.split(' ');
      initialData.first_name = nameParts[0] || '';
      initialData.last_name = nameParts.slice(1).join(' ') || '';
    }
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('education_json, experience_json, resume_url')
        .eq('id', session.user.id)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      if (profileData) {
        initialData.resume_url = profileData.resume_url || null;

        // **FIX STARTS HERE**: Correctly map the education and experience data
        if (Array.isArray(profileData.education_json) && profileData.education_json.length > 0) {
          initialData.education = profileData.education_json.map((edu: any) => ({
            id: edu.id || `${Date.now()}-${Math.random()}`,
            institutionName: edu.institution || '',
            degree: edu.degree || '',
            fieldOfStudy: edu.fieldOfStudy || '',
            startDate: edu.startDate || '',
            endDate: edu.endDate === 'Present' ? '' : edu.endDate || '',
            gpa: edu.gpa || '',
            isCurrent: edu.endDate === 'Present' || edu.isCurrent || false,
          }));
        }

        if (Array.isArray(profileData.experience_json) && profileData.experience_json.length > 0) {
          initialData.is_experienced = true;
          initialData.experiences = profileData.experience_json.map((exp: any) => ({
            id: exp.id || `${Date.now()}-${Math.random()}`,
            institution: exp.institution || '',
            position: exp.role || '',
            location: exp.location || '',
            startDate: exp.startDate || '',
            endDate: exp.endDate === 'Present' ? '' : exp.endDate || '',
            isCurrentPosition: exp.isCurrent || exp.endDate === 'Present' || false,
            responsibilities: exp.description || '',
            achievements: '',
          }));
        }
        // **FIX ENDS HERE**
      }
    } catch (err: any) { console.warn("Could not prefill profile data:", err.message); }
    setApplicationData(initialData);
    setIsPrefilling(false);
  }, [isVisible, session]);

  useEffect(() => {
    if (isVisible) {
      prefillData();
    } else {
      setCurrentStep(0);
      setApplicationData(initialApplicationState);
    }
  }, [isVisible, prefillData]);
  
  useFocusEffect(
    useCallback(() => {
      const refetchResume = async () => {
        if (!session?.user?.id) return;
        try {
          const { data, error } = await supabase.from('profiles').select('resume_url').eq('id', session.user.id).single();
          if (error) throw error;
          if (data && data.resume_url !== applicationData.resume_url) {
            setApplicationData(prev => ({ ...prev, resume_url: data.resume_url }));
          }
        } catch (err: any) {
          console.warn("Could not re-fetch resume URL on focus:", err.message);
        }
      };

      if (!isPrefilling) {
        refetchResume();
      }
    }, [session?.user?.id, isPrefilling, applicationData.resume_url])
  );

  const validateStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0:
        if (!applicationData.first_name?.trim() || !applicationData.last_name?.trim()) {
          Alert.alert("Missing Information", "First name and last name are required.");
          return false;
        }
        return true;
      case 1:
        if (applicationData.education?.some(edu => !edu.institutionName || !edu.degree || !edu.fieldOfStudy || !edu.startDate || (!edu.isCurrent && !edu.endDate))) {
          if (applicationData.education && applicationData.education.length > 0 && applicationData.education.some(edu => edu.institutionName || edu.degree || edu.fieldOfStudy)) {
            Alert.alert("Incomplete Education", "Please complete all required fields for each education entry or remove incomplete entries.");
            return false;
          }
        }
        return true;
      case 2:
        if (applicationData.is_experienced && applicationData.experiences?.some(exp => !exp.institution || !exp.position || !exp.startDate || (!exp.isCurrentPosition && !exp.endDate) )) {
           if (applicationData.experiences && applicationData.experiences.length > 0 && applicationData.experiences.some(exp => exp.institution || exp.position )) {
            Alert.alert("Incomplete Experience", "If experienced, please complete all required fields for each experience entry or remove incomplete entries.");
            return false;
           }
        }
        return true;
      case 3:
        if (!applicationData.resume_url) {
            Alert.alert("Resume Required", "Please upload a resume to your main profile to apply for jobs.");
            return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else handleSubmitApplication();
  };

  const handlePrevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const updateApplicationData = (fieldOrData: keyof JobApplication | Partial<JobApplication>, value?: any) => {
    if (typeof fieldOrData === 'string') {
      setApplicationData(prev => ({ ...prev, [fieldOrData]: value }));
    } else {
      setApplicationData(prev => ({ ...prev, ...fieldOrData }));
    }
  };

  const handleSubmitApplication = async () => {
    if (!job || !session?.user?.id) return;
    if (!validateStep(3)) return;
    setIsSubmitting(true);
    try {
      const finalDataToSubmit: Omit<JobApplication, 'id' | 'created_at' | 'updated_at' | 'application_date'> & {user_id: string} = {
        job_id: job.id,
        user_id: session.user.id,
        first_name: applicationData.first_name?.trim() || null,
        last_name: applicationData.last_name?.trim() || null,
        dob: applicationData.dob?.trim() || null,
        street_address: applicationData.street_address?.trim() || null,
        city: applicationData.city?.trim() || null,
        state: applicationData.state?.trim() || null,
        pin_code: applicationData.pin_code?.trim() || null,
        education: applicationData.education && applicationData.education.length > 0 ? applicationData.education.filter(e => e.institutionName && e.degree) : [],
        teaching_level: applicationData.teaching_level?.trim() || null,
        subjects_specialization: applicationData.subjects_specialization && applicationData.subjects_specialization.length > 0 ? applicationData.subjects_specialization : [],
        is_experienced: applicationData.is_experienced || false,
        experiences: applicationData.is_experienced && applicationData.experiences && applicationData.experiences.length > 0 ? applicationData.experiences.filter(e => e.institution && e.position) : [],
        experience: applicationData.experience?.trim() || (applicationData.is_experienced ? 'Experienced' : 'Fresher'),
        current_ctc: applicationData.current_ctc?.trim() || null,
        expected_ctc: applicationData.expected_ctc?.trim() || null,
        board_experience: applicationData.board_experience?.trim() || null,
        teaching_methodology: applicationData.teaching_methodology?.trim() || null,
        languages_known: applicationData.languages_known?.trim() || null,
        certifications: applicationData.certifications?.trim() || null,
        resume_url: applicationData.resume_url,
        status: 'Applied',
        notes: null,
      };

      const { data, error } = await supabase.from('job_applications').insert(finalDataToSubmit).select().single();
      if (error) {
        if (error.code === '23505') {
            Alert.alert("Already Applied", "You have already submitted an application for this job.");
            onApplicationSubmitSuccess("duplicate_entry");
        } else throw error;
      } else if (data) {
        Alert.alert("Application Submitted!", "Your application has been sent successfully.");
        onApplicationSubmitSuccess(data.id);
        onClose();
      }
    } catch (err: any) {
      Alert.alert("Submission Failed", err.message || "Could not submit your application.");
    } finally { setIsSubmitting(false); }
  };

  const renderStepContent = () => {
    if (isPrefilling) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.PRIMARY}/></View>;
    const props = { data: applicationData, onUpdate: updateApplicationData, job: job };
    switch (currentStep) {
      case 0: return <Step1PersonalInfo {...props} />;
      case 1: return <Step2Education {...props} />;
      case 2: return <Step3Experience {...props} />;
      case 3: return <Step4AdditionalInfo {...props} />;
      default: return null;
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={() => { if (!isSubmitting) onClose(); }} presentationStyle={Platform.OS === 'ios' ? "formSheet" : undefined} >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitleText}>Apply for {job?.job_name || 'Job'}</Text>
          <TouchableOpacity onPress={isSubmitting ? undefined : onClose} style={styles.closeButton} disabled={isSubmitting}>
            <X size={24} color={Colors.GRAY} />
          </TouchableOpacity>
        </View>

        <ApplicationStepper steps={steps} currentStep={currentStep} />

        <ScrollView style={styles.stepContentScrollView} contentContainerStyle={styles.stepContentContainer} keyboardShouldPersistTaps="handled">
          {renderStepContent()}
        </ScrollView>

        <View style={styles.navigationButtons}>
          <TouchableOpacity style={[styles.navButton, styles.prevButton, (currentStep === 0 || isSubmitting) && styles.disabledButton]} onPress={handlePrevStep} disabled={currentStep === 0 || isSubmitting}>
            <ArrowLeft size={18} color={(currentStep === 0 || isSubmitting) ? Colors.GRAY : Colors.PRIMARY} />
            <Text style={[styles.navButtonText, styles.prevButtonText, (currentStep === 0 || isSubmitting) && {color: Colors.GRAY}]}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navButton, styles.nextButton, isSubmitting && styles.disabledButton]} onPress={handleNextStep} disabled={isSubmitting || isPrefilling}>
            {isSubmitting && currentStep === steps.length - 1 ? (
              <ActivityIndicator color={Colors.WHITE} size="small" />
            ) : (
              <>
                <Text style={[styles.navButtonText, styles.nextButtonText]}>{currentStep === steps.length - 1 ? 'Submit Application' : 'Next'}</Text>
                {currentStep < steps.length - 1 && <ArrowRight size={18} color={Colors.WHITE} />}
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.WHITE },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  modalTitleText: { fontSize: 18, fontWeight: '600', color: Colors.BLACK, flex:1, textAlign: 'left' },
  closeButton: { padding: 8 },
  stepContentScrollView: { flex: 1 },
  stepContentContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  navigationButtons: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: Platform.OS === 'ios' ? 15 : 12, borderTopWidth: 1, borderTopColor: '#e0e0e0', backgroundColor: Colors.WHITE },
  navButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, minWidth: 120, justifyContent: 'center' },
  prevButton: { backgroundColor: Colors.WHITE, borderWidth: 1.5, borderColor: Colors.PRIMARY },
  nextButton: { backgroundColor: Colors.PRIMARY },
  navButtonText: { fontSize: 16, fontWeight: '600' },
  prevButtonText: { color: Colors.PRIMARY, marginRight: 5 },
  nextButtonText: { color: Colors.WHITE, marginLeft: 5 },
  disabledButton: { opacity: 0.5 },
});

export default JobApplicationModal;