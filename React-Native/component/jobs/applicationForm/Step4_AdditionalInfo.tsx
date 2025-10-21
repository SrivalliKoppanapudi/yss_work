// // components/jobs/applicationForm/Step4_AdditionalInfo.tsx
// import React, { useState } from 'react';
// import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
// import Colors from '../../../constant/Colors';
// import { JobApplication, Job } from '../../../types/jobs';
// import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react-native';
// import * as DocumentPicker from 'expo-document-picker';
// import { supabase } from '../../../lib/Superbase';
// import { decode } from 'base64-arraybuffer'; 
// import * as FileSystem from 'expo-file-system'; 

// interface Step4AdditionalInfoProps {
//   data: Partial<JobApplication>;
//   onUpdate: (fieldOrData: keyof JobApplication | Partial<JobApplication>, value?: any) => void;
//   job: Job | null;
// }

// const Step4AdditionalInfo: React.FC<Step4AdditionalInfoProps> = ({ data, onUpdate, job }) => {
//   const [isUploadingResume, setIsUploadingResume] = useState(false);
//   const [resumeFile, setResumeFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
//   const [resumeError, setResumeError] = useState<string | null>(null);


//   const handleSimpleInputChange = (field: keyof JobApplication, value: string) => {
//     onUpdate(field, value);
//   };

  
//   const handleArrayInputChange = (field: 'subjects_specialization', text: string) => {
//     const newArray = text.split(',').map(s => s.trim()).filter(s => s);
//     onUpdate(field, newArray);
//   };


//   const handlePickResume = async () => {
//     setResumeError(null);
//     try {
//       const result = await DocumentPicker.getDocumentAsync({
//         type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
//         copyToCacheDirectory: true,
//       });

//       if (!result.canceled && result.assets && result.assets.length > 0) {
//         const asset = result.assets[0];
//         if (asset.size && asset.size > 5 * 1024 * 1024) { // 5MB limit
//           setResumeError("File is too large. Max 5MB allowed.");
//           setResumeFile(null);
//           onUpdate('resume_url', null);
//           return;
//         }
//         setResumeFile(asset);
//         onUpdate('resume_url', null); 
//       }
//     } catch (err) {
//       console.error("Error picking resume:", err);
//       setResumeError("Failed to pick resume. Please try again.");
//     }
//   };

//   const handleUploadResume = async () => {
//     if (!resumeFile) {
//       Alert.alert("No Resume", "Please select a resume file first.");
//       return;
//     }
    
//     if (!job || !data.user_id) {
//         Alert.alert("Error", "Cannot upload resume: Missing job or user information in the application data.");
//         return;
//     }

//     setIsUploadingResume(true);
//     setResumeError(null);

//     let fileData: ArrayBuffer; // Declare fileData here

//     try {
//       const fileExt = resumeFile.name.split('.').pop()?.toLowerCase() || 'pdf';
//       const applicantUserId = data.user_id; // Use user_id from applicationData
      
//       const fileName = `resume_job${job.id}_${applicantUserId.substring(0,8)}_${Date.now()}.${fileExt}`;
     
//       const filePath = `resumes/${applicantUserId}/${fileName}`;

//       console.log("Attempting to upload resume to path:", filePath);

//       if (Platform.OS === 'web') {
//         if (resumeFile.uri.startsWith('data:')) {
//             const base64Raw = resumeFile.uri.split(',')[1];
//             fileData = decode(base64Raw);
//         } else {
//             const response = await fetch(resumeFile.uri);
//             fileData = await response.arrayBuffer();
//         }
//       } else {
//         const base64 = await FileSystem.readAsStringAsync(resumeFile.uri, {
//             encoding: FileSystem.EncodingType.Base64,
//         });
//         fileData = decode(base64);
//       }

//       const { data: uploadData, error: uploadError } = await supabase.storage
//         .from('job-resumes')
//         .upload(filePath, fileData, {
//           contentType: resumeFile.mimeType || `application/${fileExt}`,
//           upsert: true,
//         });

//       if (uploadError) {
//         console.error("Supabase storage upload error:", uploadError);
//         throw uploadError;
//       }

//       const { data: urlData } = supabase.storage
//         .from('job-resumes')
//         .getPublicUrl(filePath);

//       if (!urlData.publicUrl) {
//           throw new Error("Could not get public URL for the uploaded resume.");
//       }

//       onUpdate('resume_url', urlData.publicUrl);
//       setResumeFile(null);

//     } catch (err: any) {
//       console.error("Error uploading resume:", err);
//       setResumeError(err.message || "Failed to upload resume. Check console for details.");
//       onUpdate('resume_url', null);
//     } finally {
//       setIsUploadingResume(false);
//     }
//   };


//   return (
//     <View style={styles.container}>
//       <Text style={styles.stepHeader}>Additional Information & Resume</Text>

//       <View style={styles.inputGroup}>
//         <Text style={styles.label}>Current Teaching Level</Text>
//         <TextInput
//           style={styles.textInput}
//           placeholder="e.g., Primary, High School, College"
//           value={data.teaching_level || ''}
//           onChangeText={(text) => handleSimpleInputChange('teaching_level', text)}
//           placeholderTextColor={Colors.GRAY}
//         />
//       </View>

//       <View style={styles.inputGroup}>
//         <Text style={styles.label}>Subjects Specialization</Text>
//         <TextInput
//           style={styles.textInput}
//           placeholder="e.g., Mathematics, Physics, English Literature"
//           value={Array.isArray(data.subjects_specialization) ? data.subjects_specialization.join(', ') : ''}
//           onChangeText={(text) => handleArrayInputChange('subjects_specialization', text)}
//           placeholderTextColor={Colors.GRAY}
//         />
//       </View>

//       <View style={styles.inputGroup}>
//         <Text style={styles.label}>Current CTC (Annual)</Text>
//         <TextInput
//           style={styles.textInput}
//           value={data.current_ctc || ''}
//           onChangeText={(text) => handleSimpleInputChange('current_ctc', text)}
//           keyboardType="numeric"
//           placeholderTextColor={Colors.GRAY}
//         />
//       </View>

//       <View style={styles.inputGroup}>
//         <Text style={styles.label}>Expected CTC (Annual)</Text>
//         <TextInput
//           style={styles.textInput}
//           value={data.expected_ctc || ''}
//           onChangeText={(text) => handleSimpleInputChange('expected_ctc', text)}
//           keyboardType="numeric"
//           placeholderTextColor={Colors.GRAY}
//         />
//       </View>

//       <View style={styles.inputGroup}>
//         <Text style={styles.label}>Board Experience</Text>
//         <TextInput
//           style={styles.textInput}
//           placeholder="e.g., CBSE, ICSE, State Board"
//           value={data.board_experience || ''}
//           onChangeText={(text) => handleSimpleInputChange('board_experience', text)}
//           placeholderTextColor={Colors.GRAY}
//         />
//       </View>

//       <View style={styles.inputGroup}>
//         <Text style={styles.label}>Teaching Methodology (Optional)</Text>
//         <TextInput
//           style={[styles.textInput, styles.textArea]}
//           placeholder="Briefly describe your teaching approach or philosophy"
//           value={data.teaching_methodology || ''}
//           onChangeText={(text) => handleSimpleInputChange('teaching_methodology', text)}
//           multiline
//           placeholderTextColor={Colors.GRAY}
//         />
//       </View>

//       <View style={styles.inputGroup}>
//         <Text style={styles.label}>Languages Known</Text>
//         <TextInput
//           style={styles.textInput}
//           placeholder="e.g., English (Fluent), Hindi (Proficient)"
//           value={data.languages_known || ''}
//           onChangeText={(text) => handleSimpleInputChange('languages_known', text)}
//           placeholderTextColor={Colors.GRAY}
//         />
//       </View>

//       <View style={styles.inputGroup}>
//         <Text style={styles.label}>Certifications</Text>
//         <TextInput
//           style={styles.textInput}
//           placeholder="e.g., B.Ed, CTET"
//           value={data.certifications || ''}
//           onChangeText={(text) => handleSimpleInputChange('certifications', text)}
//           placeholderTextColor={Colors.GRAY}
//         />
//       </View>

//       <View style={styles.inputGroup}>
//         <Text style={styles.label}>Upload Resume* (PDF, DOC, DOCX - Max 5MB)</Text>
//         <TouchableOpacity style={styles.resumePickerButton} onPress={handlePickResume} disabled={isUploadingResume}>
//           <UploadCloud size={24} color={Colors.PRIMARY} />
//           <Text style={styles.resumePickerText} numberOfLines={1} ellipsizeMode="middle">
//             {resumeFile ? resumeFile.name : (data.resume_url ? "Resume Uploaded" : "Choose File")}
//           </Text>
//         </TouchableOpacity>

//         {resumeFile && !data.resume_url && ( // Show upload button if a new file is selected and not yet finalized by URL
//             <TouchableOpacity
//                 style={[styles.uploadButton, isUploadingResume && styles.disabledButton]}
//                 onPress={handleUploadResume}
//                 disabled={isUploadingResume}
//             >
//                 {isUploadingResume ? (
//                     <ActivityIndicator color={Colors.WHITE} size="small" />
//                 ) : (
//                     <Text style={styles.uploadButtonText}>Upload Selected Resume</Text>
//                 )}
//             </TouchableOpacity>
//         )}

//         {data.resume_url && (
//           <View style={styles.fileUploadedContainer}>
//             <CheckCircle size={18} color={Colors.SUCCESS} />
//             <Text style={styles.fileUploadedText} numberOfLines={1} ellipsizeMode="middle">
//                 {decodeURIComponent(data.resume_url.split('/').pop()?.split('?')[0] || "File Uploaded")}
//             </Text>
//              <TouchableOpacity onPress={handlePickResume} disabled={isUploadingResume}>
//                 <Text style={styles.changeFileText}>Change</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//         {resumeError && (
//             <View style={styles.errorContainer}>
//                 <AlertCircle size={16} color={Colors.ERROR} />
//                 <Text style={styles.errorText}>{resumeError}</Text>
//             </View>
//         )}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     paddingVertical: 10,
//   },
//   stepHeader: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: Colors.PRIMARY,
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   inputGroup: {
//     marginBottom: 18,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: Colors.GRAY,
//     marginBottom: 6,
//   },
//   textInput: {
//     backgroundColor: '#f8f9fa',
//     borderRadius: 8,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     fontSize: 15,
//     color: Colors.BLACK,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   textArea: {
//     minHeight: 80,
//     textAlignVertical: 'top',
//     paddingTop: 12,
//   },
//   resumePickerButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#e7f3ff',
//     borderRadius: 8,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     borderWidth: 1,
//     borderColor: Colors.PRIMARY, // Assuming you have this in Colors, else use a hex
//     borderStyle: 'dashed',
//   },
//   resumePickerText: {
//     fontSize: 15,
//     color: Colors.PRIMARY,
//     marginLeft: 10,
//     flexShrink: 1,
//   },
//   uploadButton: {
//     backgroundColor: Colors.SUCCESS,
//     paddingVertical: 10,
//     paddingHorizontal: 15,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginTop: 10,
//   },
//   uploadButtonText: {
//     color: Colors.WHITE,
//     fontSize: 15,
//     fontWeight: '600',
//   },
//   fileUploadedContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 8,
//     padding: 10, // Adjusted padding
//     backgroundColor: '#e6fffa', // Light success background
//     borderRadius: 6,
//     borderWidth: 1, // Added border for definition
//     borderColor: Colors.SUCCESS, // Assuming you have this, else use a hex like '#b2f5ea'
//   },
//   fileUploadedText: {
//     marginLeft: 8,
//     fontSize: 14,
//     color: Colors.SUCCESS,
//     flex: 1, // To allow numberOfLines and ellipsizeMode to work
//   },
//   changeFileText: {
//     fontSize: 13,
//     color: Colors.PRIMARY,
//     fontWeight: '500',
//     marginLeft: 10, // Added margin for spacing from filename
//     textDecorationLine: 'underline',
//   },
//   errorContainer: { // New style for error message container for better layout
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 8,
//     padding: 8,
//     backgroundColor: '#fff2f2', // Light error background
//     borderRadius: 6,
//     borderLeftWidth: 3, // Accent border
//     borderLeftColor: Colors.ERROR,
//   },
//   errorText: {
//     color: Colors.ERROR,
//     fontSize: 13,
//     marginLeft: 6, // Space from icon
//   },
//   disabledButton: {
//     opacity: 0.7,
//   },
// });

// export default Step4AdditionalInfo;

// file: component/jobs/applicationForm/Step4_AdditionalInfo.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Colors from '../../../constant/Colors';
import { JobApplication, Job } from '../../../types/jobs';
import { CheckCircle, AlertCircle, FileText } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface Step4AdditionalInfoProps {
  data: Partial<JobApplication>;
  onUpdate: (fieldOrData: keyof JobApplication | Partial<JobApplication>, value?: any) => void;
  job: Job | null;
}

const Step4AdditionalInfo: React.FC<Step4AdditionalInfoProps> = ({ data, onUpdate, job }) => {
  const router = useRouter();

  const handleSimpleInputChange = (field: keyof JobApplication, value: string) => {
    onUpdate(field, value);
  };

  const handleArrayInputChange = (field: 'subjects_specialization', text: string) => {
    const newArray = text.split(',').map(s => s.trim()).filter(s => s);
    onUpdate(field, newArray);
  };
  
  const navigateToProfileResume = () => {
    Alert.alert(
      "Update Resume",
      "To change your resume, you will be taken to your main profile. Your application draft will be saved.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Go to Profile", onPress: () => router.push('/(screens)/profile') }
      ]
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.stepHeader}>Additional Information & Resume</Text>

      {/* Other input fields remain unchanged */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Current Teaching Level</Text>
        <TextInput style={styles.textInput} placeholder="e.g., Primary, High School, College" value={data.teaching_level || ''} onChangeText={(text) => handleSimpleInputChange('teaching_level', text)} placeholderTextColor={Colors.GRAY} />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Subjects Specialization</Text>
        <TextInput style={styles.textInput} placeholder="e.g., Mathematics, Physics, English Literature" value={Array.isArray(data.subjects_specialization) ? data.subjects_specialization.join(', ') : ''} onChangeText={(text) => handleArrayInputChange('subjects_specialization', text)} placeholderTextColor={Colors.GRAY} />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Current CTC (Annual)</Text>
        <TextInput style={styles.textInput} value={data.current_ctc || ''} onChangeText={(text) => handleSimpleInputChange('current_ctc', text)} keyboardType="numeric" placeholderTextColor={Colors.GRAY} />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Expected CTC (Annual)</Text>
        <TextInput style={styles.textInput} value={data.expected_ctc || ''} onChangeText={(text) => handleSimpleInputChange('expected_ctc', text)} keyboardType="numeric" placeholderTextColor={Colors.GRAY} />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Board Experience</Text>
        <TextInput style={styles.textInput} placeholder="e.g., CBSE, ICSE, State Board" value={data.board_experience || ''} onChangeText={(text) => handleSimpleInputChange('board_experience', text)} placeholderTextColor={Colors.GRAY} />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Teaching Methodology (Optional)</Text>
        <TextInput style={[styles.textInput, styles.textArea]} placeholder="Briefly describe your teaching approach or philosophy" value={data.teaching_methodology || ''} onChangeText={(text) => handleSimpleInputChange('teaching_methodology', text)} multiline placeholderTextColor={Colors.GRAY} />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Languages Known</Text>
        <TextInput style={styles.textInput} placeholder="e.g., English (Fluent), Hindi (Proficient)" value={data.languages_known || ''} onChangeText={(text) => handleSimpleInputChange('languages_known', text)} placeholderTextColor={Colors.GRAY} />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Certifications</Text>
        <TextInput style={styles.textInput} placeholder="e.g., B.Ed, CTET" value={data.certifications || ''} onChangeText={(text) => handleSimpleInputChange('certifications', text)} placeholderTextColor={Colors.GRAY} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Resume*</Text>
        {data.resume_url ? (
            <View style={styles.fileUploadedContainer}>
                <FileText size={18} color={Colors.SUCCESS} />
                <Text style={styles.fileUploadedText} numberOfLines={1}>
                    We'll use the resume from your profile.
                </Text>
                <TouchableOpacity onPress={navigateToProfileResume}>
                    <Text style={styles.changeFileText}>Update</Text>
                </TouchableOpacity>
            </View>
        ) : (
            <TouchableOpacity style={styles.resumeMissingContainer} onPress={navigateToProfileResume}>
                <AlertCircle size={18} color={Colors.ERROR} />
                <Text style={styles.resumeMissingText}>No resume found on your profile.</Text>
                <Text style={styles.changeFileText}>Add Resume</Text>
            </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 10, },
  stepHeader: { fontSize: 20, fontWeight: 'bold', color: Colors.PRIMARY, marginBottom: 20, textAlign: 'center', },
  inputGroup: { marginBottom: 18, },
  label: { fontSize: 14, fontWeight: '500', color: Colors.GRAY, marginBottom: 6, },
  textInput: { backgroundColor: '#f8f9fa', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.BLACK, borderWidth: 1, borderColor: '#e0e0e0', },
  textArea: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12, },
  fileUploadedContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#e6fffa', borderRadius: 8, borderWidth: 1, borderColor: Colors.SUCCESS, },
  fileUploadedText: { marginLeft: 10, fontSize: 14, color: Colors.GRAY, flex: 1, },
  changeFileText: { fontSize: 14, color: Colors.PRIMARY, fontWeight: '500', textDecorationLine: 'underline', },
  resumeMissingContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff2f2', borderRadius: 8, borderWidth: 1, borderColor: Colors.ERROR, },
  resumeMissingText: { marginLeft: 10, fontSize: 14, color: Colors.ERROR, flex: 1, },
});

export default Step4AdditionalInfo;