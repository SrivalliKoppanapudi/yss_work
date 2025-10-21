import React, { useState } from 'react';
import { View, Text,ScrollView, TextInput, Switch, TouchableOpacity, StyleSheet, Image, Alert, Modal, SafeAreaView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/Superbase';
import { decode as base64ToUint8Array } from '../../utils/resourceUtils';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { X, Lock, Users, MessageSquare, AlertCircle } from 'lucide-react-native';
import Colors from '../../constant/Colors';
import { useAuth } from '../../Context/auth'; // Import useAuth to get the user session

const CommunityForm = ({ isVisible, onClose, onCommunityCreated }) => {
    const { session } = useAuth(); // Get the current user session
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [privacy, setPrivacy] = useState('public');
    const [memberApproval, setMemberApproval] = useState(true);
    const [postModeration, setPostModeration] = useState(true);
    const [topics, setTopics] = useState('');
    const [icon, setIcon] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ name?: string }>({});

    const handleImagePick = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // Square aspect ratio for icons
            quality: 0.7,
        });
        if (!result.canceled) {
            setIcon(result.assets[0]);
        }
    };

    const validate = () => {
        const newErrors: { name?: string } = {};
        if (!name.trim()) newErrors.name = "Please fill in this field";
        if (!icon) Alert.alert("Icon Required", "Please upload a community icon.");
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0 && !!icon;
    };

    const handleCreateCommunity = async () => {
        if (!validate()) return;
        if (!session?.user) {
            Alert.alert("Authentication Error", "You must be signed in to create a community.");
            return;
        }

        setLoading(true);
        let iconUrl = null;

        try {
            // Image processing and upload
            const manipulatedImage = await ImageManipulator.manipulateAsync(
                icon.uri,
                [{ resize: { width: 400 } }], // Resize for efficiency
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );

            const fileExt = manipulatedImage.uri.split('.').pop();
            // --- THIS IS THE CRUCIAL FIX ---
            // The file path MUST start with the user's ID to satisfy the RLS policy.
            const fileName = `${session.user.id}/icon_${Date.now()}.${fileExt}`;
            // --------------------------------

            const fileBase64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, { encoding: FileSystem.EncodingType.Base64 });
            const fileBinary = base64ToUint8Array(fileBase64);

            const { error: uploadError } = await supabase.storage
                .from('community-icons')
                .upload(fileName, fileBinary, {
                    contentType: icon.mimeType || 'image/jpeg',
                    upsert: false, // Use false to prevent overwriting
                });

            if (uploadError) throw uploadError;

            iconUrl = supabase.storage.from('community-icons').getPublicUrl(fileName).data.publicUrl;

            // Database insert
            const topicsValue = topics ? topics.split(',').map(t => t.trim()).filter(Boolean) : [];
            const { error: insertError } = await supabase.from('communities').insert([
                { name, description, icon_url: iconUrl, privacy, member_approval: memberApproval, post_moderation: postModeration, topics: topicsValue },
            ]);
            
            if (insertError) throw insertError;

            if (onCommunityCreated) onCommunityCreated();
            
        } catch (err: any) {
            console.error('Error creating community:', err);
            Alert.alert('Error', err.message || 'Failed to create community.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Create New community</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color={Colors.BLACK} />
                    </TouchableOpacity>
                </View>
                <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.sectionHeader}>Community Icon</Text>
                    <TouchableOpacity style={styles.iconUpload} onPress={handleImagePick}>
                        {icon ? <Image source={{ uri: icon.uri }} style={styles.iconImage} /> : <Text>Upload</Text>}
                    </TouchableOpacity>

                    <Text style={styles.label}>Community Name*</Text>
                    <TextInput
                        placeholder="Enter community name (max 50 words)"
                        style={[styles.input, errors.name && styles.inputError]}
                        value={name}
                        onChangeText={setName}
                    />
                    {errors.name && <Text style={styles.errorText}><AlertCircle size={14} color={Colors.ERROR}/> {errors.name}</Text>}

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        placeholder="Enter description (max 200 words)"
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />

                    <Text style={styles.sectionHeader}>Community Settings</Text>
                    <View style={styles.settingRow}>
                        <Lock size={20} color={Colors.GRAY}/>
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingTitle}>Privacy</Text>
                            <Text style={styles.settingDesc}>Choose who can see and join your community</Text>
                        </View>
                        <TouchableOpacity><Text style={{color: Colors.GRAY}}>Select ▼</Text></TouchableOpacity>
                    </View>
                    <View style={styles.settingRow}>
                        <Users size={20} color={Colors.GRAY}/>
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingTitle}>Member approval</Text>
                            <Text style={styles.settingDesc}>Require approval for new members</Text>
                        </View>
                        <Switch value={memberApproval} onValueChange={setMemberApproval} trackColor={{false: '#ccc', true: Colors.PRIMARY}} thumbColor={Colors.WHITE} />
                    </View>
                    <View style={styles.settingRow}>
                        <MessageSquare size={20} color={Colors.GRAY}/>
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingTitle}>Post moderation</Text>
                            <Text style={styles.settingDesc}>Review post before they appear</Text>
                        </View>
                        <Switch value={postModeration} onValueChange={setPostModeration} trackColor={{false: '#ccc', true: Colors.PRIMARY}} thumbColor={Colors.WHITE} />
                    </View>

                    <Text style={styles.label}>Add Topics & Categories</Text>
                    <TextInput placeholder="Select hashtags" style={styles.input} value={topics} onChangeText={setTopics} />

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.createButton} onPress={handleCreateCommunity} disabled={loading}>
                            {loading ? <ActivityIndicator color={Colors.WHITE} /> : <Text style={styles.createButtonText}>Create Community</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

// ... (Your styles from the previous step are fine and can remain here)
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.WHITE },
    header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    closeButton: { position: 'absolute', right: 16 },
    container: { flex: 1 },
    scrollContent: { padding: 16 },
    sectionHeader: { fontSize: 16, fontWeight: '600', marginBottom: 16, marginTop: 8 },
    label: { fontSize: 14, fontWeight: '500', color: Colors.GRAY, marginBottom: 8 },
    input: { borderWidth: 1.5, borderColor: '#005f9e4d', borderRadius: 8, padding: 12, fontSize: 16 },
    inputError: { borderColor: Colors.ERROR },
    errorText: { color: Colors.ERROR, fontSize: 12, marginTop: 4, flexDirection: 'row', alignItems: 'center'},
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    iconUpload: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f2f5', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 20 },
    iconImage: { width: '100%', height: '100%', borderRadius: 50 },
    settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12 },
    settingTextContainer: { flex: 1 },
    settingTitle: { fontSize: 15, fontWeight: '500' },
    settingDesc: { fontSize: 12, color: Colors.GRAY, marginTop: 2 },
    buttonContainer: { flexDirection: 'row', marginTop: 30, gap: 12 },
    createButton: { flex: 1, backgroundColor: '#005f9e', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    createButtonText: { color: Colors.WHITE, fontWeight: 'bold', fontSize: 16 },
    cancelButton: { flex: 1, borderWidth: 1.5, borderColor: '#005f9e', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    cancelButtonText: { color: '#005f9e', fontWeight: 'bold', fontSize: 16 },
});


export default CommunityForm;