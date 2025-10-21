import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
  ViewStyle,
  TextInput, // Added TextInput here
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/Superbase';
import { Job } from '../../types/jobs';
import Colors from '../../constant/Colors';
import { useAuth } from '../../Context/auth';
import { ArrowLeft, CalendarDays, UploadCloud, XCircle } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { ShowForJobCreation } from '../../component/RoleBasedUI';

// Interface for the data payload to be inserted into the 'jobs' table
interface JobPayload {
  user_id?: string;
  status: 'Draft' | 'Active';
  job_name: string;
  company_name: string;
  preferred_location: string;
  contact_email: string;
  details: string;
  job_title?: string | null;
  job_highlights?: string | null;
  phone?: string | null;
  qualification?: string | null;
  experience?: number | null;
  about?: string | null;
  additional_info?: string | null;
  duration?: number | null;
  job_id?: string | null;
  thumbnail_uri?: string | null;
  organization_id?: string | null;
  salary_range?: string | null;
  job_type?: string | null;
  required_skills?: string | null;
  benefits?: string | null;
  application_deadline?: string | null;
  department?: string | null;
  education_level?: string | null;
  work_mode?: string | null;
  industry?: string | null;
  employment_type?: string | null;
  organization_logo?: string | null;
  updated_at?: string;
}

const initialJobState: Partial<Job> = {
  job_name: '',
  job_title: '',
  company_name: '',
  preferred_location: '',
  salary_range: '',
  job_type: 'Full-time',
  work_mode: 'On-site',
  experience: 0,
  qualification: '',
  education_level: '',
  department: '',
  industry: '',
  employment_type: 'Permanent',
  required_skills: '',
  job_highlights: '',
  details: '',
  about: '',
  benefits: '',
  additional_info: '',
  contact_email: '',
  phone: '',
  application_deadline: undefined,
  status: 'Draft',
  thumbnail_uri: '',
  organization_logo: '',
};

export default function CreateJobScreen() {
  const router = useRouter(); 
  const { session } = useAuth(); 

  const CreateJobContent = () => {
    // Hooks can be used inside this nested component because it's part of the main render tree.
    const { session, isLoading: authIsLoading } = useAuth();
    const params = useLocalSearchParams<{ jobToEdit?: string }>();
    
    const [jobDetails, setJobDetails] = useState<Partial<Job>>(initialJobState);
    const [isLoadingForm, setIsLoadingForm] = useState(false);
    const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
    
    const [isEditMode, setIsEditMode] = useState(false);
    const [jobIdToEdit, setJobIdToEdit] = useState<number | null>(null);
  
    const [organizationLogoFile, setOrganizationLogoFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [localLogoPreviewUri, setLocalLogoPreviewUri] = useState<string | null>(null);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [logoPickerError, setLogoPickerError] = useState<string | null>(null);
  
    useEffect(() => {
      if (params.jobToEdit) {
          try {
              const job: Job = JSON.parse(params.jobToEdit);
              setJobDetails({
                  ...job,
                  experience: job.experience ?? 0,
              });
              setIsEditMode(true);
              setJobIdToEdit(job.id);
              if (job.organization_logo) {
                  setLocalLogoPreviewUri(job.organization_logo);
              }
          } catch(e) {
              console.error("Failed to parse job data for editing:", e);
              Alert.alert("Error", "Could not load job data for editing.");
          }
      } else {
          setJobDetails(initialJobState);
          setIsEditMode(false);
          setJobIdToEdit(null);
          setLocalLogoPreviewUri(null);
          setOrganizationLogoFile(null);
      }
    }, [params.jobToEdit]);
  
  
    const handleInputChange = (field: keyof Job, value: any) => {
      setJobDetails(prev => ({ ...prev, [field]: value }));
    };
  
    const onDeadlineChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
      setShowDeadlinePicker(Platform.OS === 'ios');
      if (selectedDate) {
        const offsetDate = new Date(selectedDate.valueOf() - selectedDate.getTimezoneOffset() * 60000);
        handleInputChange('application_deadline', offsetDate.toISOString().split('T')[0]);
      }
    };
  
    const pickOrganizationLogo = async () => {
      setLogoPickerError(null);
      setOrganizationLogoFile(null);
      setLocalLogoPreviewUri(null);
  
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
          return;
        }
      }
  
      try {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
  
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setOrganizationLogoFile(result.assets[0]);
          setLocalLogoPreviewUri(result.assets[0].uri);
        }
      } catch (e: any) {
        setLogoPickerError("Could not select image: " + e.message);
        Alert.alert("Image Picker Error", "Could not select image.");
      }
    };
  
    const removeSelectedLogo = () => {
      setOrganizationLogoFile(null);
      setLocalLogoPreviewUri(null);
      setLogoPickerError(null);
      handleInputChange('organization_logo', ''); 
    };
  
  
    const validateForm = (): boolean => {
      if (!jobDetails.job_name?.trim()) {
        Alert.alert("Validation Error", "Job Name/Title is required.");
        return false;
      }
      if (!jobDetails.company_name?.trim()) {
        Alert.alert("Validation Error", "Company Name is required.");
        return false;
      }
      return true;
    };
  
    const handleSave = async (publishStatus: 'Draft' | 'Active') => {
      if (!validateForm()) return;
  
      if (authIsLoading) {
        Alert.alert("Please wait", "Authenticating user...");
        return;
      }
      if (!session?.user?.id) {
        Alert.alert("Authentication Error", "You must be logged in to post a job.");
        router.push('/auth/SignIn');
        return;
      }
  
      setIsLoadingForm(true);
      let finalLogoUrl: string | null = jobDetails.organization_logo && !organizationLogoFile ? jobDetails.organization_logo : null;
  
      if (organizationLogoFile && localLogoPreviewUri) {
        setIsUploadingLogo(true);
        setLogoPickerError(null);
        try {
          const fileExt = organizationLogoFile.uri.split('.').pop()?.toLowerCase() || 'jpg';
          const fileName = `logos/${session.user.id}/${Date.now()}.${fileExt}`;
          
          const base64 = await FileSystem.readAsStringAsync(organizationLogoFile.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          const { error: uploadError } = await supabase.storage
            .from('job-media')
            .upload(fileName, decode(base64), {
              contentType: organizationLogoFile.mimeType || `image/${fileExt}`,
              upsert: true,
            });
  
          if (uploadError) throw uploadError;
  
          const { data: urlData } = supabase.storage.from('job-media').getPublicUrl(fileName);
          if (!urlData.publicUrl) throw new Error("Could not get public URL for logo.");
          finalLogoUrl = urlData.publicUrl;
  
        } catch (uploadError: any) {
          setLogoPickerError(uploadError.message || "Could not upload organization logo.");
          Alert.alert("Logo Upload Failed", uploadError.message || "Could not upload organization logo.");
          setIsUploadingLogo(false);
          setIsLoadingForm(false);
          return;
        } finally {
          setIsUploadingLogo(false);
        }
      }
  
      try {
          const jobPayload: JobPayload = {
              status: publishStatus,
              job_name: jobDetails.job_name!,
              company_name: jobDetails.company_name!,
              preferred_location: jobDetails.preferred_location!,
              contact_email: jobDetails.contact_email!,
              details: jobDetails.details!,
              job_title: jobDetails.job_title || null,
              job_highlights: jobDetails.job_highlights || null,
              phone: jobDetails.phone || null,
              qualification: jobDetails.qualification || null,
              experience: (jobDetails.experience != null && !isNaN(Number(jobDetails.experience))) ? Number(jobDetails.experience) : null,
              about: jobDetails.about || null,
              additional_info: jobDetails.additional_info || null,
              duration: (jobDetails.duration != null && !isNaN(Number(jobDetails.duration))) ? Number(jobDetails.duration) : null,
              job_id: jobDetails.job_id || null,
              thumbnail_uri: jobDetails.thumbnail_uri || null,
              organization_id: jobDetails.organization_id || null,
              salary_range: jobDetails.salary_range || null,
              job_type: jobDetails.job_type || 'Full-time',
              required_skills: jobDetails.required_skills || null,
              benefits: jobDetails.benefits || null,
              application_deadline: jobDetails.application_deadline || null,
              department: jobDetails.department || null,
              education_level: jobDetails.education_level || null,
              work_mode: jobDetails.work_mode || 'On-site',
              industry: jobDetails.industry || null,
              employment_type: jobDetails.employment_type || 'Permanent',
              organization_logo: finalLogoUrl,
          };
  
          let result;
  
          if (isEditMode && jobIdToEdit) {
              result = await supabase
                  .from('jobs')
                  .update({ ...jobPayload, updated_at: new Date().toISOString() })
                  .eq('id', jobIdToEdit)
                  .select()
                  .single();
          } else {
              const insertPayload = { ...jobPayload, user_id: session.user.id };
              result = await supabase
                  .from('jobs')
                  .insert([insertPayload])
                  .select()
                  .single();
          }
  
        if (result.error) throw result.error;
  
        const successMessage = `Job ${isEditMode ? 'updated' : (publishStatus === 'Active' ? 'posted' : 'saved as draft')} successfully!`;
        Alert.alert("Success", successMessage, [
            {
                text: 'OK',
                onPress: () => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/(screens)/Jobs');
                    }
                }
            }
        ]);
        
        if (!isEditMode) {
            setJobDetails(initialJobState);
            setOrganizationLogoFile(null);
            setLocalLogoPreviewUri(null);
        }
  
      } catch (err: any) {
        console.error("Error saving job:", err);
        Alert.alert("Error", err.message || `Failed to ${isEditMode ? 'update' : 'post'} job.`);
      } finally {
        setIsLoadingForm(false);
      }
    };
  
    if (authIsLoading && !session) {
      return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.PRIMARY} /><Text>Loading session...</Text></View>;
    }
    if (!session && !authIsLoading) {
       Alert.alert("Access Denied", "You need to be logged in to create a job.", [
          { text: "OK", onPress: () => router.replace('/auth/SignIn')}
       ]);
       return <View style={styles.centered}><Text>Redirecting to login...</Text></View>;
    }
  
    const displayLogoUri = localLogoPreviewUri || (jobDetails.organization_logo && jobDetails.organization_logo.startsWith('http') ? jobDetails.organization_logo : null);
  
    return (
      <SafeAreaView style={styles.safeArea}>
         <View style={styles.headerBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.BLACK} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEditMode ? 'Edit Job' : 'Create Job'}</Text>
            <View style={{ width: 24 }} />
          </View>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.formTitle}>Tell us about the role</Text>
  
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Job Name / Title*</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Senior Maths Teacher, School Principal"
              value={jobDetails.job_name}
              onChangeText={(text) => handleInputChange('job_name', text)}
            />
          </View>
  
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company / Organization Name*</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Springfield International School"
              value={jobDetails.company_name}
              onChangeText={(text) => handleInputChange('company_name', text)}
            />
          </View>
  
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Organization Logo (Optional)</Text>
            <TouchableOpacity 
              style={styles.imagePickerButton} 
              onPress={pickOrganizationLogo} 
              disabled={isUploadingLogo || isLoadingForm}
            >
              {displayLogoUri ? (
                <Image source={{ uri: displayLogoUri }} style={styles.logoPreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <UploadCloud size={30} color={Colors.GRAY} />
                  <Text style={styles.imagePickerText}>Tap to upload logo</Text>
                </View>
              )}
            </TouchableOpacity>
            {(localLogoPreviewUri || (jobDetails.organization_logo && !organizationLogoFile && jobDetails.organization_logo.startsWith('http'))) && !isUploadingLogo && (
               <TouchableOpacity onPress={removeSelectedLogo} style={styles.removeImageButton} disabled={isLoadingForm}>
                  <XCircle size={18} color={Colors.ERROR} />
                  <Text style={styles.removeImageButtonText}>Remove Logo</Text>
              </TouchableOpacity>
            )}
            {organizationLogoFile && ( 
               <Text style={styles.fileNameText}>Selected: {organizationLogoFile.fileName || organizationLogoFile.uri.split('/').pop()}</Text>
             )}
            {isUploadingLogo && <ActivityIndicator size="small" color={Colors.PRIMARY} style={{ marginTop: 10 }} />}
            {logoPickerError && <Text style={styles.logoErrorText}>{logoPickerError}</Text>}
          </View>
  
  
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location*</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Bangalore, Karnataka or Remote"
              value={jobDetails.preferred_location}
              onChangeText={(text) => handleInputChange('preferred_location', text)}
            />
          </View>
  
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Job Type*</Text>
            <View style={styles.pickerContainer}>
              {['Full-time', 'Part-time', 'Contract', 'Internship'].map(type => (
                  <TouchableOpacity
                      key={type}
                      style={[styles.chip, jobDetails.job_type === type && styles.chipSelected]}
                      onPress={() => handleInputChange('job_type', type)}
                  >
                      <Text style={[styles.chipText, jobDetails.job_type === type && styles.chipTextSelected]}>{type}</Text>
                  </TouchableOpacity>
              ))}
            </View>
          </View>
  
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Work Mode*</Text>
            <View style={styles.pickerContainer}>
              {['On-site', 'Remote', 'Hybrid'].map(mode => (
                  <TouchableOpacity
                      key={mode}
                      style={[styles.chip, jobDetails.work_mode === mode && styles.chipSelected]}
                      onPress={() => handleInputChange('work_mode', mode)}
                  >
                      <Text style={[styles.chipText, jobDetails.work_mode === mode && styles.chipTextSelected]}>{mode}</Text>
                  </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Salary Range (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 500000-700000 LPA or Competitive"
              value={jobDetails.salary_range}
              onChangeText={(text) => handleInputChange('salary_range', text)}
            />
          </View>
  
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Experience Required (Years, Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 0 for Fresher, 2, 5"
              value={jobDetails.experience?.toString() === '0' ? '0' : jobDetails.experience?.toString() || ''}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                handleInputChange('experience', text === '' ? null : (isNaN(num) ? jobDetails.experience : num));
              }}
              keyboardType="numeric"
            />
          </View>
  
           <View style={styles.inputGroup}>
            <Text style={styles.label}>Minimum Qualification</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Bachelor's Degree in Education"
              value={jobDetails.qualification}
              onChangeText={(text) => handleInputChange('qualification', text)}
            />
          </View>
  
           <View style={styles.inputGroup}>
            <Text style={styles.label}>Education Level</Text>
            <View style={styles.pickerContainer}>
              {["High School", "Associate's Degree", "Bachelor's Degree", "Master's Degree", "PhD", "Other"].map(level => (
                  <TouchableOpacity
                      key={level}
                      style={[styles.chip, jobDetails.education_level === level && styles.chipSelected]}
                      onPress={() => handleInputChange('education_level', level)}
                  >
                      <Text style={[styles.chipText, jobDetails.education_level === level && styles.chipTextSelected]}>{level}</Text>
                  </TouchableOpacity>
              ))}
            </View>
          </View>
  
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Department (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Mathematics, Administration"
              value={jobDetails.department}
              onChangeText={(text) => handleInputChange('department', text)}
            />
          </View>
  
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Industry (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Education, EdTech"
              value={jobDetails.industry}
              onChangeText={(text) => handleInputChange('industry', text)}
            />
          </View>
  
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Employment Type</Text>
             <View style={styles.pickerContainer}>
              {['Permanent', 'Contract', 'Temporary', 'Internship'].map(type => (
                  <TouchableOpacity
                      key={type}
                      style={[styles.chip, jobDetails.employment_type === type && styles.chipSelected]}
                      onPress={() => handleInputChange('employment_type', type)}
                  >
                      <Text style={[styles.chipText, jobDetails.employment_type === type && styles.chipTextSelected]}>{type}</Text>
                  </TouchableOpacity>
              ))}
            </View>
          </View>
  
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Job Highlights (newline for each point)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Briefly list key selling points of the job..."
              value={jobDetails.job_highlights}
              onChangeText={(text) => handleInputChange('job_highlights', text)}
              multiline
            />
          </View>
  
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Job Details / Key Responsibilities* (newline for each point)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, { minHeight: 150 }]}
              placeholder="Detailed responsibilities, day-to-day tasks..."
              value={jobDetails.details}
              onChangeText={(text) => handleInputChange('details', text)}
              multiline
            />
          </View>
  
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Required Skills (comma-separated or newline)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="e.g., Classroom Management, Python, Curriculum Development"
              value={jobDetails.required_skills}
              onChangeText={(text) => handleInputChange('required_skills', text)}
              multiline
            />
          </View>
  
          <View style={styles.inputGroup}>
            <Text style={styles.label}>About the Company/Institute (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Brief description of your organization..."
              value={jobDetails.about}
              onChangeText={(text) => handleInputChange('about', text)}
              multiline
            />
          </View>
  
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Benefits (Optional, newline for each point)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="e.g., Health Insurance, Paid Time Off..."
              value={jobDetails.benefits}
              onChangeText={(text) => handleInputChange('benefits', text)}
              multiline
            />
          </View>
  
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Application Deadline (Optional)</Text>
            <TouchableOpacity onPress={() => setShowDeadlinePicker(true)} style={styles.datePickerButton}>
              <Text style={styles.datePickerText}>
                {jobDetails.application_deadline ? new Date(jobDetails.application_deadline+'T00:00:00').toLocaleDateString() : "Select Deadline"}
              </Text>
              <CalendarDays size={20} color={Colors.GRAY} />
            </TouchableOpacity>
            {showDeadlinePicker && (
              <DateTimePicker
                value={jobDetails.application_deadline ? new Date(jobDetails.application_deadline+'T00:00:00') : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDeadlineChange}
                minimumDate={new Date()}
              />
            )}
          </View>
  
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Email for Applications*</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., careers@example.com"
              value={jobDetails.contact_email}
              onChangeText={(text) => handleInputChange('contact_email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
  
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Phone (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., +91-XXXXXXXXXX"
              value={jobDetails.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              keyboardType="phone-pad"
            />
          </View>
  
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Information (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Any other details applicants should know..."
              value={jobDetails.additional_info}
              onChangeText={(text) => handleInputChange('additional_info', text)}
              multiline
            />
          </View>
  
          <View style={styles.actionButtonsContainer}>
               <TouchableOpacity
                  style={[styles.actionButton, styles.saveDraftButton, (isLoadingForm || isUploadingLogo) && styles.disabledButton]}
                  onPress={() => handleSave('Draft')}
                  disabled={isLoadingForm || isUploadingLogo}
              >
                  {(isLoadingForm && !isUploadingLogo) ? <ActivityIndicator color={Colors.PRIMARY} /> : <Text style={styles.saveDraftButtonText}>{isEditMode ? 'Save Changes' : 'Save as Draft'}</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                  style={[styles.actionButton, styles.postJobButton, (isLoadingForm || isUploadingLogo) && styles.disabledButton]}
                  onPress={() => handleSave('Active')}
                  disabled={isLoadingForm || isUploadingLogo}
              >
                  {(isLoadingForm && !isUploadingLogo) ? <ActivityIndicator color={Colors.WHITE} /> : <Text style={styles.postJobButtonText}>{isEditMode ? 'Update Job' : 'Post Job'}</Text>}
              </TouchableOpacity>
          </View>
  
        </ScrollView>
      </SafeAreaView>
    );
  }

  // This is the main component body. It decides whether to show the fallback UI or the main content.
  return (
    <ShowForJobCreation
      fallback={
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.BLACK} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Access Denied</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.centered}>
            <Text style={[styles.formTitle, { color: Colors.ERROR }]}>⛔ Access Denied</Text>
            <Text style={styles.label}>Only administrators can create jobs.</Text>
            <TouchableOpacity 
              style={styles.postJobButton}
              onPress={() => router.back()}
            >
              <Text style={styles.postJobButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      }
    >
      <CreateJobContent />
    </ShowForJobCreation>
  );
}
// --- END OF CORRECTED STRUCTURE ---


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.BLACK,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.GRAY,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.BLACK,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#eef0f2',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  chipText: {
    fontSize: 14,
    color: Colors.GRAY,
  },
  chipTextSelected: {
    color: Colors.WHITE,
    fontWeight: '500',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  datePickerText: {
    fontSize: 15,
    color: Colors.BLACK,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDraftButton: {
    backgroundColor: '#eef0f2',
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
  },
  saveDraftButtonText: {
    color: Colors.PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
  postJobButton: {
    backgroundColor: Colors.PRIMARY,
    marginLeft: 8,
  },
  postJobButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  imagePickerButton: {
    height: 120,
    width: '100%',
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    marginBottom: 8, 
  },
  logoPreview: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    borderRadius: 8,
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePickerText: {
    marginTop: 8,
    color: Colors.GRAY,
    fontSize: 14,
  },
  fileNameText: {
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 0, 
    textAlign: 'center',
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center', 
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#ffebee', 
    marginTop: 8,
  },
  removeImageButtonText: {
    color: Colors.ERROR,
    fontSize: 13,
    marginLeft: 5,
    fontWeight: '500',
  },
  logoErrorText: { 
    color: Colors.ERROR,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  disabledButton: { 
    opacity: 0.7,
  } as ViewStyle,
});