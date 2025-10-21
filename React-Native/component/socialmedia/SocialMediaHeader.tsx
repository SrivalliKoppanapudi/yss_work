import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../constant/Colors';
import { Search, Bell } from 'lucide-react-native';
import { useAuth } from '../../Context/auth';
import { supabase } from '../../lib/Superbase';

const SocialMediaHeader = () => {
    const router = useRouter();
    const { session } = useAuth();
    
    // State to hold the profile picture URL from the 'profiles' table
    const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    // Fetch the profile data when the component loads or the user changes
    useEffect(() => {
        const fetchProfilePicture = async () => {
            if (session?.user?.id) {
                setLoadingProfile(true);
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('profilePicture')
                        .eq('id', session.user.id)
                        .single();

                    if (error && error.code !== 'PGRST116') { // Ignore "not found"
                        throw error;
                    }

                    if (data) {
                        setProfilePictureUrl(data.profilePicture);
                    }
                } catch (err) {
                    console.error("Header PFP Fetch Error:", err);
                } finally {
                    setLoadingProfile(false);
                }
            } else {
                setLoadingProfile(false);
            }
        };

        fetchProfilePicture();
    }, [session?.user?.id]);

    return (
        <View style={styles.header}>
            {/* Left: Profile Picture */}
            <TouchableOpacity onPress={() => router.push('/(screens)/profile')}>
                <View style={styles.avatarContainer}>
                    {loadingProfile ? (
                        <ActivityIndicator size="small" color={Colors.GRAY} />
                    ) : profilePictureUrl ? (
                        <Image source={{ uri: profilePictureUrl }} style={styles.avatar} />
                    ) : (
                        // Default placeholder if no PFP is set
                        <View style={styles.avatarPlaceholder} />
                    )}
                </View>
            </TouchableOpacity>
            
            {/* Middle: Search Bar */}
            <View style={styles.searchContainer}>
                <Search size={20} color={Colors.GRAY} />
                <TextInput
                    placeholder="Search"
                    placeholderTextColor={Colors.GRAY}
                    style={styles.searchInput}
                />
            </View>

            {/* Right: Notification Icon */}
            <TouchableOpacity style={styles.notificationButton}>
                <Bell size={24} color={Colors.GRAY} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: Colors.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 12, // Adds consistent spacing between items
    },
    avatarContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0f0f0',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E5E7EB',
    },
    searchContainer: {
        flex: 1, // This makes the search bar take up the available middle space
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F2F5',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 38,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
        color: Colors.BLACK,
    },
    notificationButton: {
        padding: 4,
    },
});

export default SocialMediaHeader;