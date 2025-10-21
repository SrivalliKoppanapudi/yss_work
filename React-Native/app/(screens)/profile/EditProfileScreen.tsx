import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import { useAuth } from '../../../Context/auth';
import Colors from '../../../constant/Colors';
import { ArrowLeft, Save, Camera } from 'lucide-react-native';
import { profileUploadService } from '../../../lib/profileUploadService';

const EditProfileScreen = () => {
    const router = useRouter();
    const { session } = useAuth();
    const params = useLocalSearchParams();
    
    const profile = params.profile ? JSON.parse(params.profile as string) : null;

    const [bio, setBio] = useState(profile?.bio || '');
    const [bannerUrl, setBannerUrl] = useState(profile?.banner_image_url || null);
    const [pfpUrl, setPfpUrl] = useState(profile?.profilePicture || null);
    
    const [loading, setLoading] = useState(false);

    const handleImageUpload = async (type: 'banner' | 'avatar') => {
        if (!session?.user) return;
        setLoading(true);
        try {
            const result = await profileUploadService(session.user.id, type);
            if (result.success && result.url) {
                if (type === 'banner') {
                    setBannerUrl(result.url);
                } else {
                    setPfpUrl(result.url);
                }
                Alert.alert("Success", "Image selected. Press 'Save Changes' to apply.");
            } else if (result.error && result.error !== "Image selection cancelled.") {
                Alert.alert("Upload Failed", result.error);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    bio: bio,
                    banner_image_url: bannerUrl,
                    profilePicture: pfpUrl,
                })
                .eq('id', session.user.id);
            
            if (error) throw error;
            Alert.alert("Success", "Profile updated successfully!");
            router.back();
        } catch (error: any) {
            Alert.alert("Error", `Failed to update profile: ${error.message}`);
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
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Banner Image</Text>
                <TouchableOpacity onPress={() => handleImageUpload('banner')} style={styles.imageContainer}>
                    <Image source={{ uri: bannerUrl || 'https://via.placeholder.com/600x200' }} style={styles.bannerImage} />
                    <View style={styles.editOverlay}><Camera size={24} color={Colors.WHITE} /></View>
                </TouchableOpacity>

                <Text style={styles.label}>Profile Picture</Text>
                {/* --- FIX: The pfp is now a self-contained, centered component --- */}
                <View style={styles.pfpWrapper}>
                    <TouchableOpacity onPress={() => handleImageUpload('avatar')} style={styles.pfpTouchable}>
                        <Image source={{ uri: pfpUrl || 'https://via.placeholder.com/150' }} style={styles.pfpImage} />
                        <View style={styles.editOverlayPfp}><Camera size={24} color={Colors.WHITE} /></View>
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.label}>Bio</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell everyone a little about yourself..."
                    multiline
                />

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges} disabled={loading}>
                    {loading ? <ActivityIndicator color={Colors.WHITE} /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F7F7' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: Colors.WHITE },
    backButton: { padding: 4 },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
    form: { padding: 20 },
    label: { fontSize: 16, fontWeight: '600', color: Colors.GRAY, marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: Colors.WHITE, padding: 15, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
    textArea: { minHeight: 120, textAlignVertical: 'top' },
    imageContainer: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerImage: { width: '100%', height: 150, borderRadius: 8 },
    editOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
    
    // --- NEW AND IMPROVED STYLES FOR PROFILE PICTURE ---
    pfpWrapper: {
        alignItems: 'center', // Center the touchable area
        marginVertical: 10,
    },
    pfpTouchable: {
        width: 140, // Define size
        height: 140,
        borderRadius: 70, // Make it a circle
        justifyContent: 'center',
        alignItems: 'center',
    },
    pfpImage: {
        width: '100%',
        height: '100%',
        borderRadius: 70, // Make the image itself a circle
        backgroundColor: '#e0e0e0',
    },
    editOverlayPfp: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 70, // Match the circle shape
    },
    // --- END OF NEW STYLES ---

    saveButton: { backgroundColor: Colors.PRIMARY, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
    saveButtonText: { color: Colors.WHITE, fontSize: 16, fontWeight: 'bold' },
});

export default EditProfileScreen;