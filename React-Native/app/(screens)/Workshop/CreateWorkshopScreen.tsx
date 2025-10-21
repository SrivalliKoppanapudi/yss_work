import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import { useAuth } from '../../../Context/auth';
import Colors from '../../../constant/Colors';
import { ArrowLeft, CalendarDays } from 'lucide-react-native';
import WorkshopImageUpload from '../../../component/Workshop/WorkshopImageUpload';
import SlotManager, { Slot } from '../../../component/Workshop/SlotManager';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { ShowForWorkshopCreation } from '../../../component/RoleBasedUI';

const CreateWorkshopScreen = () => {
  const router = useRouter();
  const { session } = useAuth();
  
  // Check if user has permission to create workshops
  if (!session?.user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to create workshops</Text>
      </View>
    );
  }

  return (
    <ShowForWorkshopCreation
      fallback={
        <View style={styles.container}>
          <Text style={styles.errorText}>⛔ Access Denied</Text>
          <Text style={styles.errorSubtext}>Only administrators can create workshops.</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <CreateWorkshopContent />
    </ShowForWorkshopCreation>
  );
};

const CreateWorkshopContent = () => {
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
    
    // Date and Duration State
    const [durationInMinutes, setDurationInMinutes] = useState('');
    const [workshopDate, setWorkshopDate] = useState<Date | null>(null);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    const handleConfirmDate = (date: Date) => {
        setWorkshopDate(date);
        setDatePickerVisibility(false);
    };
    
    const textToArray = (text: string) => {
        return text.split('\n').map(item => item.trim()).filter(item => item);
    };

    const handleSaveWorkshop = async (status: 'draft' | 'published') => {
        if (!title || !facilitatorName || !overview || !price || !workshopDate || !durationInMinutes) {
            Alert.alert("Missing Information", "Please fill in all required fields marked with *.");
            return;
        }

        if (status === 'published' && slots.length === 0) {
            Alert.alert("Missing Slots", "Please add at least one available slot before publishing.");
            return;
        }

        if (!session?.user?.id) {
            Alert.alert("Authentication Error", "You must be logged in to create a workshop.");
            return;
        }

        setLoading(true);
        try {
            const workshopData = {
                user_id: session.user.id,
                title, facilitator_name: facilitatorName, facilitator_bio: facilitatorBio,
                overview, price: parseFloat(price), mode, location, status,
                image_url: imageUrl, facilitator_image_url: facilitatorImageUrl,
                session_type: sessionType, what_you_will_learn: textToArray(whatYouWillLearn),
                highlights: textToArray(highlights), outcomes: textToArray(outcomes),
                duration_in_minutes: parseInt(durationInMinutes, 10),
                workshop_date: workshopDate.toISOString().split('T')[0],
            };

            const { data: newWorkshop, error } = await supabase.from('workshops').insert([workshopData]).select().single();
            if (error) throw error;

            if (newWorkshop && slots.length > 0) {
                const slotsToInsert = slots.map(slot => ({
                    workshop_id: newWorkshop.id,
                    start_time: slot.start_time.toISOString(),
                    end_time: slot.end_time.toISOString(),
                    total_seats: slot.total_seats,
                }));

                const { error: slotsError } = await supabase.from('workshop_slots').insert(slotsToInsert);
                if (slotsError) throw slotsError;
            }

            Alert.alert("Success", `Workshop successfully ${status === 'draft' ? 'saved' : 'published'}!`);
            router.back();

        } catch (error: any) {
            Alert.alert("Error", `Failed to save workshop: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create New Workshop</Text>
            </View>

            <View style={styles.form}>
                <WorkshopImageUpload 
                    label="Workshop Banner Image*"
                    bucket="workshop-media"
                    onImageSelected={(path, url) => setImageUrl(url)}
                />
                <Text style={styles.label}>Workshop Title*</Text>
                <TextInput style={styles.input} placeholder="e.g., Technology in Teaching" value={title} onChangeText={setTitle} placeholderTextColor="#888" />
                <Text style={styles.label}>Session Type</Text>
                <TextInput style={styles.input} placeholder="e.g., 1:1 session or Group" value={sessionType} onChangeText={setSessionType} placeholderTextColor="#888" />
                <Text style={styles.label}>Overview / Description*</Text>
                <TextInput style={[styles.input, styles.textArea]} placeholder="Briefly describe the workshop..." value={overview} onChangeText={setOverview} multiline placeholderTextColor="#888" />
                <Text style={styles.label}>What You'll Learn (one point per line)*</Text>
                <TextInput style={[styles.input, styles.textArea]} placeholder="e.g., Key concepts or strategies..." value={whatYouWillLearn} onChangeText={setWhatYouWillLearn} multiline placeholderTextColor="#888" />
                <Text style={styles.label}>Workshop Highlights (one point per line)</Text>
                <TextInput style={[styles.input, styles.textArea]} placeholder="e.g., Interactive activities..." value={highlights} onChangeText={setHighlights} multiline placeholderTextColor="#888" />
                <Text style={styles.label}>Outcomes (one point per line)</Text>
                <TextInput style={[styles.input, styles.textArea]} placeholder="e.g., Certificate of completion..." value={outcomes} onChangeText={setOutcomes} multiline placeholderTextColor="#888" />
                
                <Text style={styles.heading}>Facilitator Details</Text>
                <WorkshopImageUpload 
                    label="Facilitator Photo*"
                    bucket="workshop-media"
                    aspectRatio={[1, 1]}
                    onImageSelected={(path, url) => setFacilitatorImageUrl(url)}
                />
                <Text style={styles.label}>Facilitator Name*</Text>
                <TextInput style={styles.input} placeholder="e.g., Dr. Emily Carter" value={facilitatorName} onChangeText={setFacilitatorName} placeholderTextColor="#888" />
                <Text style={styles.label}>Facilitator Bio*</Text>
                <TextInput style={[styles.input, styles.textArea]} placeholder="A brief bio of the facilitator..." value={facilitatorBio} onChangeText={setFacilitatorBio} multiline placeholderTextColor="#888" />

                <Text style={styles.heading}>Logistics & Slots</Text>

                <Text style={styles.label}>Workshop Date*</Text>
                <TouchableOpacity onPress={() => setDatePickerVisibility(true)} style={styles.datePickerButton}>
                    <Text style={workshopDate ? styles.datePickerText : styles.datePickerPlaceholder}>
                        {workshopDate ? workshopDate.toLocaleDateString() : 'Select a date'}
                    </Text>
                    <CalendarDays size={20} color={Colors.GRAY} />
                </TouchableOpacity>
                <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={handleConfirmDate}
                    onCancel={() => setDatePickerVisibility(false)}
                />

                <Text style={styles.label}>Duration (in minutes)*</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="e.g., 60 for 1 hour" 
                    value={durationInMinutes} 
                    onChangeText={setDurationInMinutes} 
                    keyboardType="number-pad"
                    placeholderTextColor="#888"
                />

                <Text style={styles.label}>Price (INR)*</Text>
                <TextInput style={styles.input} placeholder="e.g., 1500" value={price} onChangeText={setPrice} keyboardType="numeric" placeholderTextColor="#888" />

                <Text style={styles.label}>Mode*</Text>
                <View style={styles.modeSelector}>
                    <TouchableOpacity style={[styles.modeButton, mode === 'Online' && styles.modeButtonSelected]} onPress={() => setMode('Online')}>
                        <Text style={[styles.modeButtonText, mode === 'Online' && styles.modeButtonTextSelected]}>Online</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modeButton, mode === 'Offline' && styles.modeButtonSelected]} onPress={() => setMode('Offline')}>
                        <Text style={[styles.modeButtonText, mode === 'Offline' && styles.modeButtonTextSelected]}>Offline</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>{mode === 'Online' ? 'Meeting Link / Platform*' : 'Venue Address*'}*</Text>
                <TextInput style={styles.input} placeholder={mode === 'Online' ? 'e.g., Zoom, Google Meet' : '123 Tech Park, Bengaluru'} value={location} onChangeText={setLocation} placeholderTextColor="#888" />
                
                <SlotManager 
                    slots={slots} 
                    onSlotsChange={setSlots} 
                    defaultDate={workshopDate} 
                />

                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.saveDraftButton} onPress={() => handleSaveWorkshop('draft')} disabled={loading}>
                        {loading ? <ActivityIndicator color={Colors.PRIMARY} /> : <Text style={styles.saveDraftButtonText}>Save as Draft</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.publishButton} onPress={() => handleSaveWorkshop('published')} disabled={loading}>
                         {loading ? <ActivityIndicator color={Colors.WHITE} /> : <Text style={styles.publishButtonText}>Publish</Text>}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
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
        marginBottom: 16,
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
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
        gap: 10,
    },
    saveDraftButton: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
    },
    saveDraftButtonText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 16,
    },
    publishButton: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: Colors.PRIMARY,
    },
    publishButtonText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 16,
    },
    errorText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 50,
        color: Colors.ERROR,
    },
    errorSubtext: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
        color: Colors.ERROR,
    },
    backButtonText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: 'bold',
    },

});

export default CreateWorkshopScreen;