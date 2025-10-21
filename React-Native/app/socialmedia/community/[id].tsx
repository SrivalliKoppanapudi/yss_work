import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import { useAuth } from '../../../Context/auth';
import Colors from '../../../constant/Colors';
import { ArrowLeft } from 'lucide-react-native';
import PostCard from '../../../component/socialmedia/PostCard';
import MemberList from '../../../component/socialmedia/MemberList';

export default function CommunityDetailPage() {
    const router = useRouter();
    const { session } = useAuth();
    const { id: communityId } = useLocalSearchParams<{ id: string }>();

    const [community, setCommunity] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [isMember, setIsMember] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'Feed' | 'Members'>('Feed');

    const fetchData = useCallback(async () => {
        if (!communityId) return;
        setLoading(true);

        try {
            // Fetch community details
            const { data: communityData, error: communityError } = await supabase
                .from('communities').select('*').eq('id', communityId).single();
            if (communityError) throw communityError;
            setCommunity(communityData);

            // Fetch posts shared with this community
            const { data: postsData, error: postsError } = await supabase
                .from('posts').select('*, user:user_id(name, profilePicture, occupation)').contains('shared_community', [communityId]).order('created_at', { ascending: false });
            if (postsError) throw postsError;
            setPosts(postsData || []);

            // Fetch members
            const { data: membersData, error: membersError } = await supabase
                .from('community_members').select('user:profiles(*)').eq('community_id', communityId);
            if (membersError) throw membersError;
            setMembers(membersData.map(m => m.user));

            // Check membership status
            if (session?.user) {
                const { data: membershipData } = await supabase
                    .from('community_members').select('community_id').eq('user_id', session.user.id).eq('community_id', communityId).maybeSingle();
                setIsMember(!!membershipData);
            }

        } catch (error) {
            console.error("Error fetching community details:", error);
            Alert.alert("Error", "Could not load community details.");
        } finally {
            setLoading(false);
        }
    }, [communityId, session]);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const handleToggleMembership = async () => {
        // ... (Your existing membership logic)
    };
    
    // --- NEW: Helper function to format time ---
    const timeSince = (date: string) => {
        if (!date) return 'just now';
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 3600;
        if (interval > 1) return `${Math.floor(interval)}h ago`;
        interval = seconds / 60;
        if (interval > 1) return `${Math.floor(interval)}m ago`;
        return `${Math.floor(seconds)}s ago`;
    };
    
    if (loading) {
        return <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ flex: 1 }} />;
    }

    if (!community) {
        return <View style={styles.centered}><Text>Community not found.</Text></View>;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.BLACK} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{community.name}</Text>
                 <View style={{ width: 24 }} /> {/* Spacer */}
            </View>

            <ScrollView style={styles.container}>
                <View style={styles.communityInfo}>
                    <Image source={{ uri: community.icon_url || 'https://via.placeholder.com/80' }} style={styles.icon} />
                    <Text style={styles.communityName}>{community.name}</Text>
                    <Text style={styles.memberCount}>{members.length} members</Text>
                    <TouchableOpacity
                        style={[styles.joinButton, isMember && styles.joinedButton]}
                        onPress={handleToggleMembership}
                    >
                        <Text style={[styles.joinButtonText, isMember && styles.joinedButtonText]}>
                            {isMember ? 'Joined' : 'Join'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'Feed' && styles.activeTab]}
                        onPress={() => setActiveTab('Feed')}
                    >
                        <Text style={[styles.tabText, activeTab === 'Feed' && styles.activeTabText]}>Feed</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'Members' && styles.activeTab]}
                        onPress={() => setActiveTab('Members')}
                    >
                        <Text style={[styles.tabText, activeTab === 'Members' && styles.activeTabText]}>Members</Text>
                    </TouchableOpacity>
                </View>

                {/* Content based on active tab */}
                {activeTab === 'Feed' && (
                    <View style={styles.feedContent}>
                        {posts.length > 0 ? (
                            // --- FIX: Map the data correctly for PostCard ---
                            posts.map(post => (
                                <PostCard
                                    key={post.id}
                                    postId={post.id}
                                    userId={post.user_id}
                                    currentUserId={session?.user.id}
                                    content={post.content}
                                    images={post.media_urls || []} // Map media_urls to images
                                    user={{
                                        name: post.user?.name || 'User',
                                        role: post.user?.occupation || 'Member',
                                        avatar: post.user?.profilePicture,
                                        time: timeSince(post.created_at),
                                    }}
                                    stats={{ // Create the stats object
                                        likes: post.likes || 0,
                                        comments: post.comments || 0,
                                        shares: post.shares || 0,
                                        saves: post.saves || 0,
                                    }}
                                    onDelete={() => fetchData()} // Simple refresh on delete
                                />
                            ))
                            // ----------------------------------------------------
                        ) : (
                            <Text style={styles.emptyText}>No posts in this community yet.</Text>
                        )}
                    </View>
                )}
                {activeTab === 'Members' && <MemberList members={members} />}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F0F2F5' },
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: Colors.WHITE },
    backButton: { marginRight: 16 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
    communityInfo: {
        backgroundColor: Colors.WHITE,
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    icon: { width: 80, height: 80, borderRadius: 40, marginBottom: 12, backgroundColor: '#f0f0f0' },
    communityName: { fontSize: 22, fontWeight: 'bold' },
    memberCount: { color: Colors.GRAY, fontSize: 14, marginVertical: 4 },
    joinButton: { backgroundColor: Colors.PRIMARY, paddingVertical: 10, paddingHorizontal: 40, borderRadius: 20, marginTop: 12 },
    joinedButton: { backgroundColor: Colors.WHITE, borderWidth: 1.5, borderColor: Colors.PRIMARY },
    joinButtonText: { color: Colors.WHITE, fontWeight: 'bold' },
    joinedButtonText: { color: Colors.PRIMARY },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.WHITE,
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: Colors.PRIMARY,
    },
    tabText: {
        color: Colors.GRAY,
        fontWeight: '600',
    },
    activeTabText: {
        color: Colors.PRIMARY,
    },
    feedContent: {
        padding: 16,
    },
    emptyText: { textAlign: 'center', marginTop: 40, color: Colors.GRAY, fontSize: 16 },
});