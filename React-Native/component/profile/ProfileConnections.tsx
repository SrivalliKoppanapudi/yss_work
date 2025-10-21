// app/(screens)/ProfileConnections.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/Superbase';
import { useAuth } from '../../Context/auth';
import Colors from '../../constant/Colors';

const ProfileConnections = () => {
    const { session, isLoading: authIsLoading } = useAuth();
    const [connections, setConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchConnections = useCallback(async () => {
        if (!session?.user?.id) return;
        setLoading(true);
        try {
            // Step 1: Find who the current user is following.
            const { data: followingData, error: followingError } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', session.user.id);
            if (followingError) throw followingError;
            
            // Step 2: Find who is following the current user.
            const { data: followersData, error: followersError } = await supabase
                .from('follows')
                .select('follower_id')
                .eq('following_id', session.user.id);
            if (followersError) throw followersError;

            // Step 3: Find mutual connections (users who are in both lists).
            const followingIds = followingData.map(f => f.following_id);
            const followerIds = followersData.map(f => f.follower_id);
            const connectionIds = followingIds.filter(id => followerIds.includes(id));

            if (connectionIds.length === 0) {
                setConnections([]);
                setLoading(false);
                return;
            }

            // Step 4: Fetch the profiles for the mutual connection IDs.
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, name, occupation, workExperience, profilePicture')
                .in('id', connectionIds);
            if (profilesError) throw profilesError;
            
            setConnections(profilesData || []);
        } catch (error: any) {
            Alert.alert("Error", "Could not fetch your connections.");
        } finally {
            setLoading(false);
        }
    }, [session]);

    useFocusEffect(useCallback(() => { if (!authIsLoading) fetchConnections(); }, [authIsLoading, fetchConnections]));
    
    const renderConnectionItem = (item: any) => (
        <View style={styles.connectionCard}>
            <Image 
                source={item.profilePicture ? { uri: item.profilePicture } : require('../../assets/images/default.png')} 
                style={styles.avatar} 
            />
            <View style={styles.infoContainer}>
                <Text style={styles.name}>{item.name || 'User'}</Text>
                <Text style={styles.title} numberOfLines={1}>{item.occupation || 'Occupation not specified'}</Text>
                <Text style={styles.title} numberOfLines={1}>{item.workExperience || 'Experience not specified'}</Text>
            </View>
            <TouchableOpacity style={styles.connectedButton} disabled>
                <Text style={styles.connectedButtonText}>Connected</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading || authIsLoading) {
        return <ActivityIndicator style={styles.centered} size="large" color={Colors.PRIMARY} />;
    }
    
    return (
        <ScrollView style={styles.container}>
            {connections.length === 0 ? (
                 <View style={styles.centered}>
                    <Text style={styles.emptyText}>You haven't made any connections yet.</Text>
                </View>
            ) : (
                connections.map((item, index) => (
                    <View key={item.id}>
                        {renderConnectionItem(item)}
                        {index < connections.length - 1 && <View style={styles.separator} />}
                    </View>
                ))
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
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
    connectionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.WHITE,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 16,
        backgroundColor: '#e0e0e0',
    },
    infoContainer: {
        flex: 1,
        marginRight: 12,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.BLACK,
    },
    title: {
        fontSize: 14,
        color: Colors.GRAY,
        marginTop: 2,
    },
    connectedButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1.5,
        borderColor: Colors.PRIMARY,
        borderRadius: 20,
    },
    connectedButtonText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 13,
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginLeft: 88,
    }
});

export default ProfileConnections;