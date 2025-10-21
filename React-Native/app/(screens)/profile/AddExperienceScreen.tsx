import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import { useAuth } from '../../../Context/auth';
import Colors from '../../../constant/Colors';
import { ArrowLeft, Trash2, PlusCircle, CalendarDays,Save } from 'lucide-react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";

type ExperienceEntry = {
    id: string | number;
    institution: string;
    position: string;
    location?: string | null;
    startDate: string;
    endDate: string;
    isCurrentPosition: boolean;
    responsibilities?: string | null;
};

const initialExperienceEntry: ExperienceEntry = {
  id: Date.now().toString(),
  institution: '',
  position: '',
  location: '',
  startDate: '',
  endDate: '',
  isCurrentPosition: false,
  responsibilities: '',
};

const AddExperienceScreen = () => {
    const router = useRouter();
    const { session } = useAuth();
    const params = useLocalSearchParams();
    
    // FIX: Memoize the parsed profile object to prevent re-renders
    const profile = useMemo(() => {
        return params.profile ? JSON.parse(params.profile as string) : null;
    }, [params.profile]);
    
    const [experiences, setExperiences] = useState<ExperienceEntry[]>([]);
    const [loading, setLoading] = useState(false);
    
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [datePickerTarget, setDatePickerTarget] = useState<{ index: number; field: 'startDate' | 'endDate' } | null>(null);

    useEffect(() => {
        const initialData = profile?.experience_json || [];
        if (initialData.length > 0) {
            // Map profile data to our form structure
            setExperiences(initialData.map((exp: any) => ({
                id: exp.id || Date.now().toString() + Math.random(),
                institution: exp.institution || '',
                position: exp.role || exp.position || '', // Accept both 'role' and 'position'
                location: exp.location || '',
                startDate: exp.startDate || '',
                endDate: exp.endDate === 'Present' ? '' : exp.endDate || '',
                isCurrentPosition: exp.isCurrent || exp.isCurrentPosition || false,
                responsibilities: exp.description || exp.responsibilities || '',
            })));
        } else {
            setExperiences([{ ...initialExperienceEntry }]);
        }
    }, [profile]); // This effect is now safe because `profile` is memoized

    const handleInputChange = (index: number, field: keyof ExperienceEntry, value: string | boolean) => {
        const updatedExperiences = [...experiences];
        const entry = { ...updatedExperiences[index] };

        if (field === 'isCurrentPosition' && typeof value === 'boolean') {
            entry.isCurrentPosition = value;
            if (value) entry.endDate = ''; // Clear end date if it's the current position
        } else if (typeof value === 'string') {
            (entry as any)[field] = value;
        }
        
        updatedExperiences[index] = entry;
        setExperiences(updatedExperiences);
    };

    const handleAddExperience = () => {
        setExperiences([...experiences, { ...initialExperienceEntry, id: Date.now().toString() }]);
    };

    const handleRemoveExperience = (index: number) => {
        if (experiences.length === 1) {
            Alert.alert("Cannot Remove", "At least one experience entry is required if you have experience. You can switch off the 'Have Experience' toggle instead.");
            return;
        }
        const updatedExperiences = experiences.filter((_, i) => i !== index);
        setExperiences(updatedExperiences);
    };

    const showDatePicker = (index: number, field: 'startDate' | 'endDate') => {
        setDatePickerTarget({ index, field });
        setDatePickerVisibility(true);
    };

    const handleConfirmDate = (selectedDate: Date) => {
        if (datePickerTarget) {
            const { index, field } = datePickerTarget;
            const formattedDate = selectedDate.toISOString().split('T')[0];
            handleInputChange(index, field, formattedDate);
        }
        setDatePickerVisibility(false);
    };
    
    const displayDate = (dateString: string | undefined) => {
        if (!dateString) return null;
        try {
            return new Date(dateString + 'T00:00:00').toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric',
            });
        } catch (e) {
            return dateString; // Return original string if it's not a valid date part
        }
    };

    const handleSave = async () => {
        if (experiences.some(exp => !exp.institution.trim() || !exp.position.trim() || !exp.startDate.trim() || (!exp.isCurrentPosition && !exp.endDate.trim()))) {
            Alert.alert("Missing Fields", "Please fill in all required fields (*) for each experience entry.");
            return;
        }

        setLoading(true);
        try {
            // Map form data back to profile-compatible structure
            const dataToSave = experiences.map(exp => ({
                id: exp.id,
                institution: exp.institution,
                role: exp.position,
                location: exp.location,
                startDate: exp.startDate,
                endDate: exp.isCurrentPosition ? 'Present' : exp.endDate,
                isCurrent: exp.isCurrentPosition,
                description: exp.responsibilities,
            }));

            const { error } = await supabase.from('profiles').update({ experience_json: dataToSave }).eq('id', session.user.id);
            if (error) throw error;
            Alert.alert("Success", "Experience details updated successfully!");
            router.back();
        } catch (error: any) {
            Alert.alert("Error", `Failed to save experience: ${error.message}`);
        } finally { setLoading(false); }
    };

    return (
        <View style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Experience</Text>
                <TouchableOpacity style={styles.headerAction} onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator size="small" color={Colors.PRIMARY}/> : <Save size={22} color={Colors.PRIMARY} />}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContainer}>
                {experiences.map((exp, index) => (
                    <View key={exp.id} style={styles.entryContainer}>
                        <View style={styles.entryHeader}>
                            <Text style={styles.entryTitle}>Experience #{index + 1}</Text>
                            {experiences.length > 1 && (
                                <TouchableOpacity onPress={() => handleRemoveExperience(index)}>
                                    <Trash2 size={20} color={Colors.ERROR} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <TextInput style={styles.input} placeholder="Role / Position *" value={exp.position} onChangeText={(text) => handleInputChange(index, 'position', text)} placeholderTextColor={Colors.GRAY} />
                        <TextInput style={styles.input} placeholder="Institution / Company *" value={exp.institution} onChangeText={(text) => handleInputChange(index, 'institution', text)} placeholderTextColor={Colors.GRAY} />
                        <TextInput style={styles.input} placeholder="Location (e.g., Delhi, India)" value={exp.location || ''} onChangeText={(text) => handleInputChange(index, 'location', text)} placeholderTextColor={Colors.GRAY} />
                        
                        <TouchableOpacity onPress={() => showDatePicker(index, 'startDate')} style={styles.datePickerButton}>
                            <Text style={exp.startDate ? styles.datePickerText : styles.datePickerPlaceholderText}>{displayDate(exp.startDate) || "Select Start Date *"}</Text>
                            <CalendarDays size={20} color={Colors.GRAY} />
                        </TouchableOpacity>
                        
                        {!exp.isCurrentPosition && (
                            <TouchableOpacity onPress={() => showDatePicker(index, 'endDate')} style={styles.datePickerButton}>
                                <Text style={exp.endDate ? styles.datePickerText : styles.datePickerPlaceholderText}>{displayDate(exp.endDate) || "Select End Date *"}</Text>
                                <CalendarDays size={20} color={Colors.GRAY} />
                            </TouchableOpacity>
                        )}

                        <View style={styles.switchContainer}>
                            <Text style={styles.switchLabel}>I currently work here</Text>
                            <Switch value={exp.isCurrentPosition} onValueChange={(value) => handleInputChange(index, 'isCurrentPosition', value)} trackColor={{ false: '#d1d5db', true: Colors.PRIMARY_LIGHT }} thumbColor={exp.isCurrentPosition ? Colors.PRIMARY : '#f4f3f4'}/>
                        </View>

                        <TextInput style={[styles.input, styles.textArea]} placeholder="Description (optional)" value={exp.responsibilities || ''} onChangeText={(text) => handleInputChange(index, 'responsibilities', text)} multiline placeholderTextColor={Colors.GRAY} />
                    </View>
                ))}

                <TouchableOpacity style={styles.addButton} onPress={handleAddExperience}>
                    <PlusCircle size={20} color={Colors.PRIMARY} />
                    <Text style={styles.addButtonText}>Add Another Experience</Text>
                </TouchableOpacity>

                <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={handleConfirmDate}
                    onCancel={() => setDatePickerVisibility(false)}
                    maximumDate={new Date()}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7F7F7' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: Colors.WHITE, borderBottomWidth: 1, borderBottomColor: '#eee' },
    backButton: { padding: 4 },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
    headerAction: { padding: 4 },
    formContainer: { padding: 20 },
    entryContainer: { backgroundColor: Colors.WHITE, borderRadius: 8, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#e8e8e8' },
    entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    entryTitle: { fontSize: 16, fontWeight: '600', color: Colors.BLACK },
    input: { backgroundColor: Colors.WHITE, padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingVertical: 10 },
    switchLabel: { fontSize: 16, color: Colors.GRAY },
    datePickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.WHITE, borderRadius: 8, padding: 15, borderWidth: 1, borderColor: '#ddd', marginBottom: 15 },
    datePickerText: { fontSize: 16, color: Colors.BLACK },
    datePickerPlaceholderText: { fontSize: 16, color: Colors.GRAY },
    addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, backgroundColor: '#e7f3ff', marginTop: 10 },
    addButtonText: { fontSize: 15, fontWeight: '600', color: Colors.PRIMARY, marginLeft: 8 },
});

export default AddExperienceScreen;