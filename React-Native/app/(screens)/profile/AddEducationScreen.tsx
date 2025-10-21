import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import { useAuth } from '../../../Context/auth';
import Colors from '../../../constant/Colors';
import { ArrowLeft, Save, Trash2, PlusCircle, CalendarDays } from 'lucide-react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";

type EducationEntry = {
    id: string | number;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
    gpa?: string | null;
    isCurrent: boolean;
};

const initialEducationEntry: EducationEntry = {
    id: Date.now().toString(),
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    gpa: '',
    isCurrent: false,
};

const AddEducationScreen = () => {
    const router = useRouter();
    const { session } = useAuth();
    const params = useLocalSearchParams();
    
    // FIX: Memoize the parsed profile object
    const profile = useMemo(() => {
        return params.profile ? JSON.parse(params.profile as string) : null;
    }, [params.profile]);
    
    const [educations, setEducations] = useState<EducationEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [datePickerTarget, setDatePickerTarget] = useState<{ index: number; field: 'startDate' | 'endDate' } | null>(null);

    useEffect(() => {
        const initialData = profile?.education_json || [];
        if (initialData.length > 0) {
            setEducations(initialData.map((edu: any) => ({
                id: edu.id || Date.now().toString() + Math.random(),
                institution: edu.institution || '',
                degree: edu.degree || '',
                fieldOfStudy: edu.fieldOfStudy || '',
                startDate: edu.startDate || '',
                endDate: edu.endDate === 'Present' ? '' : edu.endDate || '',
                gpa: edu.gpa || '',
                isCurrent: edu.isCurrent || false,
            })));
        } else {
            setEducations([{...initialEducationEntry}]);
        }
    }, [profile]); // This effect is now safe
    
    const handleInputChange = (index: number, field: keyof EducationEntry, value: string | boolean) => {
        const updatedEducations = [...educations];
        const entry = { ...updatedEducations[index] };

        if (field === 'isCurrent' && typeof value === 'boolean') {
            entry.isCurrent = value;
            if (value) entry.endDate = '';
        } else if (typeof value === 'string') {
            (entry as any)[field] = value;
        }
        
        updatedEducations[index] = entry;
        setEducations(updatedEducations);
    };

    const handleAddEducation = () => {
        setEducations([...educations, { ...initialEducationEntry, id: Date.now().toString() }]);
    };

    const handleRemoveEducation = (index: number) => {
        if (educations.length === 1) {
            Alert.alert("Cannot Remove", "At least one education entry is required.");
            return;
        }
        const updatedEducations = educations.filter((_, i) => i !== index);
        setEducations(updatedEducations);
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
        } catch(e) {
            return dateString; // Return original string if not a valid date part
        }
    };

    const handleSave = async () => {
        if (educations.some(edu => !edu.institution.trim() || !edu.degree.trim() || !edu.startDate.trim() || (!edu.isCurrent && !edu.endDate.trim()))) {
            Alert.alert("Missing Fields", "Please fill in all required fields (*) for each education entry.");
            return;
        }

        setLoading(true);
        try {
            const dataToSave = educations.map(edu => ({
                ...edu,
                endDate: edu.isCurrent ? 'Present' : edu.endDate,
            }));

            const { error } = await supabase.from('profiles').update({ education_json: dataToSave }).eq('id', session.user.id);
            if (error) throw error;
            Alert.alert("Success", "Education details updated successfully!");
            router.back();
        } catch (error: any) {
            Alert.alert("Error", `Failed to save education: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Education</Text>
                <TouchableOpacity style={styles.headerAction} onPress={handleSave} disabled={loading}>
                     {loading ? <ActivityIndicator size="small" color={Colors.PRIMARY}/> : <Save size={22} color={Colors.PRIMARY} />}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContainer}>
                {educations.map((edu, index) => (
                    <View key={edu.id} style={styles.entryContainer}>
                        <View style={styles.entryHeader}>
                            <Text style={styles.entryTitle}>Education #{index + 1}</Text>
                            {educations.length > 1 && (
                                <TouchableOpacity onPress={() => handleRemoveEducation(index)}>
                                    <Trash2 size={20} color={Colors.ERROR} />
                                </TouchableOpacity>
                            )}
                        </View>
                        
                        <TextInput style={styles.input} placeholder="Degree *" value={edu.degree} onChangeText={(text) => handleInputChange(index, 'degree', text)} placeholderTextColor={Colors.GRAY} />
                        <TextInput style={styles.input} placeholder="Institution / School *" value={edu.institution} onChangeText={(text) => handleInputChange(index, 'institution', text)} placeholderTextColor={Colors.GRAY} />
                        <TextInput style={styles.input} placeholder="Field of Study" value={edu.fieldOfStudy} onChangeText={(text) => handleInputChange(index, 'fieldOfStudy', text)} placeholderTextColor={Colors.GRAY} />

                        <TouchableOpacity onPress={() => showDatePicker(index, 'startDate')} style={styles.datePickerButton}>
                            <Text style={edu.startDate ? styles.datePickerText : styles.datePickerPlaceholderText}>{displayDate(edu.startDate) || "Select Start Date *"}</Text>
                            <CalendarDays size={20} color={Colors.GRAY} />
                        </TouchableOpacity>
                        
                        {!edu.isCurrent && (
                            <TouchableOpacity onPress={() => showDatePicker(index, 'endDate')} style={styles.datePickerButton}>
                                <Text style={edu.endDate ? styles.datePickerText : styles.datePickerPlaceholderText}>{displayDate(edu.endDate) || "Select End Date *"}</Text>
                                <CalendarDays size={20} color={Colors.GRAY} />
                            </TouchableOpacity>
                        )}

                        <View style={styles.switchContainer}>
                            <Text style={styles.switchLabel}>I currently study here</Text>
                            <Switch value={edu.isCurrent} onValueChange={(value) => handleInputChange(index, 'isCurrent', value)} trackColor={{ false: '#d1d5db', true: Colors.PRIMARY_LIGHT }} thumbColor={edu.isCurrent ? Colors.PRIMARY : '#f4f3f4'}/>
                        </View>

                        <TextInput style={styles.input} placeholder="GPA / Percentage (optional)" value={edu.gpa || ''} onChangeText={(text) => handleInputChange(index, 'gpa', text)} placeholderTextColor={Colors.GRAY} />
                    </View>
                ))}

                <TouchableOpacity style={styles.addButton} onPress={handleAddEducation}>
                    <PlusCircle size={20} color={Colors.PRIMARY} />
                    <Text style={styles.addButtonText}>Add Another Education</Text>
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
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingVertical: 10 },
    switchLabel: { fontSize: 16, color: Colors.GRAY },
    datePickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.WHITE, borderRadius: 8, padding: 15, borderWidth: 1, borderColor: '#ddd', marginBottom: 15 },
    datePickerText: { fontSize: 16, color: Colors.BLACK },
    datePickerPlaceholderText: { fontSize: 16, color: Colors.GRAY },
    addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, backgroundColor: '#e7f3ff', marginTop: 10 },
    addButtonText: { fontSize: 15, fontWeight: '600', color: Colors.PRIMARY, marginLeft: 8 },
});

export default AddEducationScreen;