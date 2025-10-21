import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import { useAuth } from '../../../Context/auth';
import Colors from '../../../constant/Colors';
import { ArrowLeft, CalendarDays } from 'lucide-react-native';
import WebinarImageUpload from '../../../component/webinar/WebinarImageUpload';
import SlotManager, { Slot } from '../../../component/webinar/SlotManager';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { ShowForWebinarCreation } from '../../../component/RoleBasedUI';

const CreateWebinarScreen = () => {
  const router = useRouter();
  const { session } = useAuth();
  
  // Check if user has permission to create webinars
  if (!session?.user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to create webinars</Text>
      </View>
    );
  }

  return (
    <ShowForWebinarCreation
      fallback={
        <View style={styles.container}>
          <Text style={styles.errorText}>⛔ Access Denied</Text>
          <Text style={styles.errorSubtext}>Only administrators can create webinars.</Text>
          <TouchableOpacity 
            style={styles.errorBackButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <CreateWebinarContent />
    </ShowForWebinarCreation>
  );
};

const CreateWebinarContent = () => {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [facilitatorName, setFacilitatorName] = useState('');
  const [facilitatorBio, setFacilitatorBio] = useState('');
  const [overview, setOverview] = useState('');
  const [price, setPrice] = useState('');
  const [mode, setMode] = useState<'Online' | 'Offline'>('Online');
  const [location, setLocation] = useState('');
  const [whatYouWillLearn, setWhatYouWillLearn] = useState('');
  const [highlights, setHighlights] = useState('');
  const [outcomes, setOutcomes] = useState('');
  const [sessionType, setSessionType] = useState('1:1 session');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [facilitatorImageUrl, setFacilitatorImageUrl] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [focus, setFocus] = useState('');
  const [subject, setSubject] = useState('');
  
  // Date and Duration State
  const [duration, setDuration] = useState('');
  const [webinarDate, setWebinarDate] = useState<Date | null>(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const handleConfirmDate = (date: Date) => {
    setWebinarDate(date);
    setDatePickerVisibility(false);
  };

  const textToArray = (text: string): string[] => {
    return text.split('\n').filter(line => line.trim() !== '');
  };

  const handleSaveWebinar = async (status: 'draft' | 'published' = 'published') => {
    if (!session?.user?.id) {
      Alert.alert("Error", "You must be logged in to create a webinar");
      return;
    }

    if (!title || !facilitatorName || !webinarDate || !price) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const webinarData = {
        user_id: session.user.id,
        title,
        facilitator: facilitatorName,
        facilitator_bio: facilitatorBio,
        description: overview,
        price,
        mode,
        location,
        status,
        image_url: imageUrl,
        facilitator_image_url: facilitatorImageUrl,
        session_type: sessionType,
        what_you_will_learn: textToArray(whatYouWillLearn),
        highlights: textToArray(highlights),
        outcomes: textToArray(outcomes),
        duration,
        date: webinarDate.toISOString().split('T')[0],
        focus,
        subject,
      };

      const { data: newWebinar, error } = await supabase
        .from('webinars')
        .insert([webinarData])
        .select()
        .single();

      if (error) throw error;

      if (newWebinar && slots.length > 0) {
        const slotsToInsert = slots.map(slot => ({
          webinar_id: newWebinar.id,
          start_time: slot.start_time.toISOString(),
          end_time: slot.end_time.toISOString(),
          total_seats: slot.total_seats,
        }));

        const { error: slotsError } = await supabase
          .from('webinar_slots')
          .insert(slotsToInsert);

        if (slotsError) throw slotsError;
      }

      Alert.alert(
        "Success", 
        `Webinar successfully ${status === 'draft' ? 'saved as draft' : 'published'}!`,
        [{ text: "OK", onPress: () => router.back() }]
      );

    } catch (error: any) {
      Alert.alert("Error", `Failed to save webinar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Webinar</Text>
      </View>

      <View style={styles.form}>
        <WebinarImageUpload 
          label="Webinar Banner Image*"
          onImageSelected={(path, url) => setImageUrl(url)}
        />

        <Text style={styles.label}>Webinar Title*</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g., Advanced React Native Development" 
          value={title} 
          onChangeText={setTitle} 
          placeholderTextColor="#888" 
        />

        <Text style={styles.label}>Session Type</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g., 1:1 session or Group" 
          value={sessionType} 
          onChangeText={setSessionType} 
          placeholderTextColor="#888" 
        />

        <Text style={styles.label}>Overview / Description*</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Briefly describe the webinar..." 
          value={overview} 
          onChangeText={setOverview} 
          multiline 
          placeholderTextColor="#888" 
        />

        <Text style={styles.label}>What You'll Learn (one point per line)*</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="e.g., Key concepts or strategies..." 
          value={whatYouWillLearn} 
          onChangeText={setWhatYouWillLearn} 
          multiline 
          placeholderTextColor="#888" 
        />

        <Text style={styles.label}>Webinar Highlights (one point per line)</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="e.g., Interactive activities..." 
          value={highlights} 
          onChangeText={setHighlights} 
          multiline 
          placeholderTextColor="#888" 
        />

        <Text style={styles.label}>Outcomes (one point per line)</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="e.g., Certificate of completion..." 
          value={outcomes} 
          onChangeText={setOutcomes} 
          multiline 
          placeholderTextColor="#888" 
        />

        <Text style={styles.heading}>Facilitator Details</Text>
        <WebinarImageUpload 
          label="Facilitator Photo*"
          aspectRatio={[1, 1]}
          onImageSelected={(path, url) => setFacilitatorImageUrl(url)}
        />

        <Text style={styles.label}>Facilitator Name*</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g., Dr. Emily Carter" 
          value={facilitatorName} 
          onChangeText={setFacilitatorName} 
          placeholderTextColor="#888" 
        />

        <Text style={styles.label}>Facilitator Bio*</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="A brief bio of the facilitator..." 
          value={facilitatorBio} 
          onChangeText={setFacilitatorBio} 
          multiline 
          placeholderTextColor="#888" 
        />

        <Text style={styles.heading}>Logistics & Slots</Text>

        <Text style={styles.label}>Webinar Date*</Text>
        <TouchableOpacity 
          onPress={() => setDatePickerVisibility(true)} 
          style={styles.datePickerButton}
        >
          <Text style={webinarDate ? styles.datePickerText : styles.datePickerPlaceholder}>
            {webinarDate ? webinarDate.toLocaleDateString() : 'Select a date'}
          </Text>
          <CalendarDays size={20} color={Colors.GRAY} />
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={() => setDatePickerVisibility(false)}
        />

        <Text style={styles.label}>Duration*</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g., 1 hour" 
          value={duration} 
          onChangeText={setDuration} 
          placeholderTextColor="#888" 
        />

        <Text style={styles.label}>Price (INR)*</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g., 1500 or Free" 
          value={price} 
          onChangeText={setPrice} 
          placeholderTextColor="#888" 
        />

        <Text style={styles.label}>Focus Area</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g., Technology, Business, Education" 
          value={focus} 
          onChangeText={setFocus} 
          placeholderTextColor="#888" 
        />

        <Text style={styles.label}>Subject</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g., React Native, Marketing, Teaching" 
          value={subject} 
          onChangeText={setSubject} 
          placeholderTextColor="#888" 
        />

        <Text style={styles.label}>Mode*</Text>
        <View style={styles.modeSelector}>
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'Online' && styles.modeButtonSelected]} 
            onPress={() => setMode('Online')}
          >
            <Text style={[styles.modeButtonText, mode === 'Online' && styles.modeButtonTextSelected]}>
              Online
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'Offline' && styles.modeButtonSelected]} 
            onPress={() => setMode('Offline')}
          >
            <Text style={[styles.modeButtonText, mode === 'Offline' && styles.modeButtonTextSelected]}>
              Offline
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>{mode === 'Online' ? 'Meeting Link / Platform*' : 'Venue Address*'}</Text>
        <TextInput 
          style={styles.input} 
          placeholder={mode === 'Online' ? 'e.g., Zoom, Google Meet' : '123 Tech Park, Bengaluru'} 
          value={location} 
          onChangeText={setLocation} 
          placeholderTextColor="#888" 
        />

        <SlotManager 
          slots={slots} 
          onSlotsChange={setSlots} 
          defaultDate={webinarDate} 
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.draftButton]} 
            onPress={() => handleSaveWebinar('draft')}
            disabled={loading}
          >
            <Text style={styles.draftButtonText}>Save as Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.publishButton]} 
            onPress={() => handleSaveWebinar('published')}
            disabled={loading}
          >
            <Text style={styles.publishButtonText}>
              {loading ? 'Publishing...' : 'Publish Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.ERROR,
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.GRAY,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorBackButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 28,
  },
  form: {
    padding: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingTop: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.GRAY,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  datePickerText: {
    fontSize: 16,
    color: Colors.BLACK,
  },
  datePickerPlaceholder: {
    fontSize: 16,
    color: '#888',
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    alignItems: 'center',
  },
  modeButtonSelected: {
    backgroundColor: Colors.PRIMARY,
  },
  modeButtonText: {
    color: Colors.PRIMARY,
    fontWeight: 'bold',
  },
  modeButtonTextSelected: {
    color: Colors.WHITE,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  draftButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
  },
  publishButton: {
    backgroundColor: Colors.PRIMARY,
  },
  draftButtonText: {
    color: Colors.PRIMARY,
    fontWeight: 'bold',
  },
  publishButtonText: {
    color: Colors.WHITE,
    fontWeight: 'bold',
  },
});

export default CreateWebinarScreen; 