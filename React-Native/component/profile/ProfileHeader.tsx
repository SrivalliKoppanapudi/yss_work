// component/profile/ProfileHeader.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Alert, FlatList } from 'react-native';
import { supabase } from '../../lib/Superbase';
import { useAuth } from '../../Context/auth';
import Colors from '../../constant/Colors';
import { Edit, Briefcase } from 'lucide-react-native';
import { profileUploadService } from '../../lib/profileUploadService';
import { useRouter } from 'expo-router';

const InfoChip = ({ text }) => {
    if (!text) return null;
    return (
        <View style={styles.infoChip}>
            <Text style={styles.infoChipText}>{text}</Text>
        </View>
    );
};

const ProfileHeader = ({ profile, onUpdateProfile }) => {
    const router = useRouter();
    
    if (!profile) return null;

    const handleUpload = async (type: 'banner' | 'avatar') => {
        // ... (This function remains unchanged)
    };

    // --- LOGIC UPDATED ---
    // Get the most recent work experience from the JSON array
    const latestWork = Array.isArray(profile.experience_json) && profile.experience_json.length > 0
        ? profile.experience_json[0]
        : null;

    // Get the most recent education from the JSON array
    const latestEducation = Array.isArray(profile.education_json) && profile.education_json.length > 0
        ? profile.education_json[0]
        : null;

    // Create the info chips from the new JSON data
    const details = [
        latestWork?.role,
        latestEducation?.degree,
        latestWork?.location
    ].filter(Boolean); // Filter out any null or empty values

    return (
        <View style={styles.container}>
            {/* Banner Image and Edit Button */}
            <View>
                <Image source={{ uri: profile.banner_image_url || 'https://via.placeholder.com/600x200' }} style={styles.bannerImage} />
                {/* This single edit button now navigates to the new edit screen */}
                <TouchableOpacity 
                    style={styles.bannerEditButton} 
                    onPress={() => router.push({ pathname: '/(screens)/profile/EditProfileScreen', params: { profile: JSON.stringify(profile) } })}
                >
                    <Edit size={16} color={Colors.BLACK} />
                </TouchableOpacity>
            </View>

            {/* Profile Picture */}
            <View style={styles.pfpContainer}>
                <Image source={profile.profilePicture ? { uri: profile.profilePicture } : require('../../assets/images/default.png')} style={styles.profilePicture} />
            </View>

            {/* Main Info Section */}
            <View style={styles.mainInfoSection}>
                <Text style={styles.profileName}>{profile.name || 'Your Name'}</Text>
                
                {/* Working At Section - Now uses JSON data */}
                {latestWork && (
                     <View style={styles.workingAtContainer}>
                        <Briefcase size={14} color={Colors.GRAY} />
                        <Text style={styles.workingAtText}>
                            {latestWork.role} at <Text style={styles.schoolText}>{latestWork.institution}</Text>
                        </Text>
                    </View>
                )}

                {/* Horizontal Info Chips - Now uses JSON data */}
                <FlatList
                    horizontal
                    data={details}
                    renderItem={({ item }) => <InfoChip text={item} />}
                    keyExtractor={(item, index) => `${item}-${index}`}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.infoChipsContainer}
                />

                {/* Bio Section - Now uses the 'bio' column */}
                <View style={styles.bioContainer}>
                    <Text style={styles.bioTitle}>Bio</Text>
                    <Text style={styles.bioText} numberOfLines={3}>{profile.bio || "Add your bio in the edit profile section."}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { backgroundColor: 'white', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    bannerImage: { width: '100%', height: 150, backgroundColor: '#f0f2f5' },
    bannerEditButton: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255, 255, 255, 0.7)', padding: 8, borderRadius: 20 },
    pfpContainer: { alignItems: 'center', marginTop: -70 },
    profilePicture: { width: 140, height: 140, borderRadius: 70, borderWidth: 5, borderColor: 'white', backgroundColor: '#e0e0e0' },
    mainInfoSection: { alignItems: 'center', paddingHorizontal: 16, width: '100%', marginTop: 12 },
    profileName: { fontSize: 26, fontWeight: 'bold', color: Colors.BLACK },
    workingAtContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    workingAtText: { fontSize: 14, color: Colors.GRAY, marginLeft: 6 },
    schoolText: { fontWeight: '600', color: Colors.BLACK },
    infoChipsContainer: { paddingTop: 12, paddingBottom: 4 },
    infoChip: { borderWidth: 1, borderColor: Colors.PRIMARY, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, backgroundColor: '#e7f3ff' },
    infoChipText: { fontSize: 13, color: Colors.PRIMARY, fontWeight: '500' },
    bioContainer: { marginTop: 16, width: '100%' },
    bioTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.BLACK, marginBottom: 4 },
    bioText: { fontSize: 14, lineHeight: 20, color: Colors.GRAY },
});

export default ProfileHeader;