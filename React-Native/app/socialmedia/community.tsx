import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Colors from '../../constant/Colors';
import { supabase } from '../../lib/Superbase';
import { useAuth } from '../../Context/auth';

// Import the structural components
import CommunityHeader from '../../component/socialmedia/CommunityHeader';
import CommunitySearch from '../../component/socialmedia/CommunitySearch';
import CommunityList from '../../component/socialmedia/CommunityList';
import CommunityForm from '../../component/socialmedia/CommunityForm';
import CommunitySuccessModal from '../../component/socialmedia/CommunitySuccessModal';

export default function CommunityScreen() {
    const { session } = useAuth();
    const [popularCommunities, setPopularCommunities] = useState<any[]>([]);
    const [activeCommunities, setActiveCommunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isCreateModalVisible, setCreateModalVisible] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const timeSince = (date: string | null): string => {
        if (!date) return 'never';
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return `just now`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const fetchCommunities = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const { data: communitiesData, error: communitiesError } = await supabase
                .from('communities').select('*').order('created_at', { ascending: false });

            if (communitiesError) throw communitiesError;
            if (!communitiesData || communitiesData.length === 0) {
                setPopularCommunities([]);
                setActiveCommunities([]);
                return;
            }

            const communityIds = communitiesData.map(c => c.id);
            const { data: statsData, error: statsError } = await supabase
                .rpc('get_community_stats', { community_ids: communityIds });

            if (statsError) throw statsError;

            const statsMap = new Map(statsData.map(item => [item.community_id, {
                participants: item.member_count || 0,
                newPosts: item.post_count || 0,
                lastPostTime: timeSince(item.last_post_at),
            }]));

            const communitiesWithStats = communitiesData.map(community => ({
                ...community,
                ...Object.assign({}, statsMap.get(community.id) || { participants: 0, newPosts: 0, lastPostTime: 'never' })
            }));

            setPopularCommunities(communitiesWithStats);
            setActiveCommunities(communitiesWithStats);
        } catch (error) {
            console.error("Error fetching communities and stats:", error);
        } finally {
            setLoading(false);
            if (isRefresh) setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchCommunities();
    }, [fetchCommunities]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCommunities(true);
    };
    
    const handleCommunityCreated = () => {
        setCreateModalVisible(false);
        fetchCommunities(true);
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <CommunityHeader />
            {loading && !refreshing ? (
                <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.fullScreenLoader} />
            ) : (
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.PRIMARY]} />}
                >
                    <CommunitySearch onStartCommunity={() => setCreateModalVisible(true)} />

                    {/* --- THIS IS THE FIX --- */}
                    <CommunityList
                        title="Popular Groups/Forums"
                        communities={popularCommunities}
                        layout="grid"
                        session={session} 
                    />
                    
                    <CommunityList
                        title="Active Communities"
                        communities={activeCommunities}
                        layout="list"
                        session={session} 
                    />
                    {/* --- END OF FIX --- */}
                </ScrollView>
            )}

            <CommunityForm
                isVisible={isCreateModalVisible}
                onClose={() => setCreateModalVisible(false)}
                onCommunityCreated={handleCommunityCreated}
            />
            
            <CommunitySuccessModal isVisible={showSuccessModal} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F0F2F5',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    fullScreenLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});