import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../Context/auth';
import Colors from '../../constant/Colors';
import { Image as ImageIcon, Edit3 } from 'lucide-react-native';
import { supabase } from '../../lib/Superbase'; // Import supabase

const CreatePostPrompt = () => {
    const router = useRouter();
    const { session } = useAuth();
    
    // --- FIX: Add state for profile picture URL and loading ---
    const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
    const [loadingPfp, setLoadingPfp] = useState(true);

    // --- FIX: Fetch the profile picture from the 'profiles' table ---
    useEffect(() => {
        const fetchProfilePicture = async () => {
            if (session?.user?.id) {
                setLoadingPfp(true);
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('profilePicture')
                        .eq('id', session.user.id)
                        .single();

                    if (error && error.code !== 'PGRST116') throw error;

                    if (data) {
                        setProfilePictureUrl(data.profilePicture);
                    }
                } catch (err) {
                    console.error("CreatePostPrompt PFP Fetch Error:", err);
                } finally {
                    setLoadingPfp(false);
                }
            } else {
                setLoadingPfp(false);
            }
        };

        fetchProfilePicture();
    }, [session?.user?.id]);


    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                {/* --- FIX: Display the actual Image or a placeholder --- */}
                <View style={styles.avatarContainer}>
                    {loadingPfp ? (
                        <ActivityIndicator size="small" color={Colors.GRAY} />
                    ) : profilePictureUrl ? (
                        <Image source={{ uri: profilePictureUrl }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder} />
                    )}
                </View>
                {/* ---------------------------------------------------- */}

                <TouchableOpacity
                    style={styles.inputTouchable}
                    onPress={() => router.push('/socialmedia/CreatePost')}
                >
                    <Text style={styles.inputText}>What's on your mind?</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.actionsRow}>
                 <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/socialmedia/CreatePost')}
                >
                    <ImageIcon size={20} color={'#34A853'} />
                    <Text style={styles.actionText}>Images/Videos</Text>
                </TouchableOpacity>
                 <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/socialmedia/CreatePost')}
                >
                    <Edit3 size={20} color={'#F59E0B'} />
                    <Text style={styles.actionText}>Write Article</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.WHITE,
        padding: 8,
        borderRadius: 12,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    // --- FIX: Added a container to center the ActivityIndicator ---
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', // Ensure image stays circular
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    // -----------------------------------------------------------
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E5E7EB',
    },
    inputTouchable: {
        flex: 1,
        marginLeft: 12,
        height: 40,
        justifyContent: 'center',
        backgroundColor: '#F0F2F5',
        borderRadius: 20,
        paddingHorizontal: 16,
    },
    inputText: {
        fontSize: 15,
        color: Colors.GRAY,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
        marginTop: 12,
        paddingTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.GRAY,
    },
});

export default CreatePostPrompt;