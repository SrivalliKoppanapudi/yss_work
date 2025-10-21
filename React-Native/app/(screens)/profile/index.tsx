import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import { useAuth } from '../../../Context/auth';
import Colors from '../../../constant/Colors';

import ProfileHeader from '../../../component/profile/ProfileHeader';
import ProfileOverview from '../../../component/profile/ProfileOverview';
import ProfilePosts from '../../../component/profile/ProfilePosts';
import ProfileConnections from '../../../component/profile/ProfileConnections';
import PaymentHistory from '../../../component/profile/PaymentHistory'; // Import the new component

const ProfileScreen = () => {
    const router = useRouter();
    const { session, isLoading: authIsLoading } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'Overview' | 'Posts' | 'Connections' | 'Payment History'>('Overview');

    const fetchProfileData = useCallback(async () => {
        if (!session?.user) {
            if (!authIsLoading) router.replace('/auth/SignIn');
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (error) throw error;
            setProfile(data);
        } catch (err: any) {
            Alert.alert("Error", "Failed to fetch profile data.");
        } finally {
            setLoading(false);
        }
    }, [session, authIsLoading, router]);

    useFocusEffect(useCallback(() => { if (!authIsLoading) fetchProfileData(); }, [authIsLoading, fetchProfileData]));

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Overview': return <ProfileOverview />;
            case 'Posts': return <ProfilePosts />;
            case 'Connections': return <ProfileConnections />;
            case 'Payment History': return <PaymentHistory />; // Render the new component
            default: return null;
        }
    };

    const HeaderComponent = () => (
        <>
            <ProfileHeader profile={profile} onUpdateProfile={fetchProfileData} />
            <View style={styles.tabBarContainer}>
                <TouchableOpacity style={[styles.tabItem, activeTab === 'Overview' && styles.tabItemActive]} onPress={() => setActiveTab('Overview')}>
                    <Text style={[styles.tabText, activeTab === 'Overview' && styles.tabTextActive]}>Overview</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabItem, activeTab === 'Posts' && styles.tabItemActive]} onPress={() => setActiveTab('Posts')}>
                    <Text style={[styles.tabText, activeTab === 'Posts' && styles.tabTextActive]}>Posts</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabItem, activeTab === 'Connections' && styles.tabItemActive]} onPress={() => setActiveTab('Connections')}>
                    <Text style={[styles.tabText, activeTab === 'Connections' && styles.tabTextActive]}>Connections</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabItem, activeTab === 'Payment History' && styles.tabItemActive]} onPress={() => setActiveTab('Payment History')}>
                    <Text style={[styles.tabText, activeTab === 'Payment History' && styles.tabTextActive]}>Payments</Text>
                </TouchableOpacity>
            </View>
        </>
    );

    if (loading || authIsLoading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.PRIMARY} /></View>;
    }

    if (!profile) {
        return (
            <View style={styles.centered}>
                <Text>Could not load profile. Please try again.</Text>
                <TouchableOpacity onPress={fetchProfileData} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={[{ key: 'content' }]}
                renderItem={renderTabContent}
                keyExtractor={item => item.key}
                ListHeaderComponent={HeaderComponent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: Colors.WHITE,
        fontSize: 16,
    },
    tabBarContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        zIndex: 1,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabItemActive: {
        borderBottomColor: Colors.PRIMARY,
    },
    tabText: {
        fontSize: 15,
        color: Colors.GRAY,
        fontWeight: '600',
    },
    tabTextActive: {
        color: Colors.PRIMARY,
    },
});

export default ProfileScreen;