// app/(screens)/ProfilePosts.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/Superbase';
import { useAuth } from '../../Context/auth';
import Colors from '../../constant/Colors';
import { Video, Image as ImageIcon } from 'lucide-react-native';
import PostViewModal from './PostViewModal';

const { width } = Dimensions.get('window');
const numColumns = 3;
const itemSize = (width / numColumns);

const ProfilePosts = () => {
    const { session, isLoading: authIsLoading } = useAuth();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const fetchUserPosts = useCallback(async () => {
        if (!session?.user?.id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            // Step 1: Fetch only the posts for the current user.
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (postsError) throw postsError;

            // Step 2: Fetch the profile of the current user separately.
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('name, profilePicture')
                .eq('id', session.user.id)
                .single();

            if (profileError) {
                console.warn("Could not fetch user profile for posts:", profileError.message);
            }

            // Step 3: Manually combine the post data with the author's profile information.
            // This creates the `user` object that the PostViewModal expects.
            const postsWithAuthor = (postsData || []).map(post => ({
                ...post,
                user: { // Manually creating the nested user object
                    id: session.user.id,
                    name: profileData?.name || post.user_name || 'Unknown',
                    profilePicture: profileData?.profilePicture || post.user_avatar || null,
                }
            }));

            setPosts(postsWithAuthor);

        } catch (error) {
            console.error("Error fetching user posts:", error);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useFocusEffect(useCallback(() => { if (!authIsLoading) fetchUserPosts(); }, [authIsLoading, fetchUserPosts]));

    const handlePostPress = (post: any) => {
        setSelectedPost(post);
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedPost(null);
    };

    const renderGridItem = ({ item }: { item: any }) => {
        const mediaUrl = item.media_urls?.[0];
        const isVideo = item.media_type === 'video';
        return (
            <TouchableOpacity style={styles.itemContainer} onPress={() => handlePostPress(item)}>
                {mediaUrl ? (
                    <Image source={{ uri: mediaUrl }} style={styles.itemImage} />
                ) : (
                    <View style={[styles.itemImage, styles.placeholderItem]}>
                        <ImageIcon size={24} color={Colors.GRAY} />
                    </View>
                )}
                {isVideo && <View style={styles.mediaTypeIcon}><Video size={16} color={Colors.WHITE} /></View>}
            </TouchableOpacity>
        );
    };

    if (loading || authIsLoading) {
        return <ActivityIndicator style={styles.centered} size="large" color={Colors.PRIMARY} />;
    }

    if (posts.length === 0) {
        return <View style={styles.centered}><Text style={styles.emptyText}>No posts yet.</Text></View>;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={posts}
                renderItem={renderGridItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={numColumns}
                showsVerticalScrollIndicator={false}
            />
            <PostViewModal post={selectedPost} visible={isModalVisible} onClose={handleCloseModal} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.WHITE,
    },
    centered: {
        minHeight: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: Colors.GRAY,
    },
    itemContainer: {
        width: itemSize,
        height: itemSize,
        padding: 1,
        position: 'relative',
    },
    itemImage: {
        width: '100%',
        height: '100%',
    },
    placeholderItem: {
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaTypeIcon: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 4,
        borderRadius: 4,
    }
});

export default ProfilePosts;