// component/profile/MutualConnections.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/Superbase';
import { useAuth } from '../../Context/auth';
import Colors from '../../constant/Colors';

interface MutualConnectionsProps {
    profileId: string; // The ID of the profile being viewed
}

const MutualConnections: React.FC<MutualConnectionsProps> = ({ profileId }) => {
    const { session } = useAuth();
    const [mutuals, setMutuals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMutuals = useCallback(async () => {
        if (!session?.user?.id || !profileId || session.user.id === profileId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Step 1: Get who the current user follows
            const { data: myFollowingData, error: myFollowingError } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', session.user.id);

            if (myFollowingError) throw myFollowingError;
            const myFollowingIds = myFollowingData.map(f => f.following_id);

            // Step 2: Get who the viewed profile follows
            const { data: theirFollowingData, error: theirFollowingError } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', profileId);
            
            if (theirFollowingError) throw theirFollowingError;
            const theirFollowingIds = theirFollowingData.map(f => f.following_id);

            // Step 3: Find the intersection (mutuals)
            // Also ensure neither the current user nor the viewed profile are in the mutuals list
            const mutualIds = myFollowingIds.filter(id => 
                theirFollowingIds.includes(id) && 
                id !== session.user.id &&
                id !== profileId
            );

            if (mutualIds.length === 0) {
                setMutuals([]);
                setLoading(false);
                return;
            }

            // Step 4: Fetch profiles of the mutuals to display their info
            const { data: mutualsProfiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, name, profilePicture')
                .in('id', mutualIds)
                .limit(3); // Limit to 3 to show just a few profile pictures

            if (profilesError) throw profilesError;

            setMutuals(mutualsProfiles || []);

        } catch (error: any) {
            console.error("Error fetching mutual connections:", error.message);
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id, profileId]);

    useEffect(() => {
        fetchMutuals();
    }, [fetchMutuals]);

    if (loading) {
        return <ActivityIndicator color={Colors.PRIMARY} style={{ marginVertical: 10 }} />;
    }

    if (mutuals.length === 0) {
        return <Text style={styles.noMutualsText}>No mutual connections yet.</Text>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.avatarsContainer}>
                {mutuals.map(mutual => (
                    <Image 
                        key={mutual.id} 
                        source={{ uri: mutual.profilePicture || 'https://via.placeholder.com/30' }} 
                        style={styles.avatar} 
                    />
                ))}
            </View>
            <Text style={styles.mutualsText}>
                Followed by {mutuals.map(m => m.name).join(', ')} and {Math.max(0, mutuals.length - 3)}+ others you follow
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    avatarsContainer: {
        flexDirection: 'row',
        marginRight: 8,
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: Colors.WHITE,
        marginLeft: -10, // Create the overlapping effect
    },
    mutualsText: {
        flex: 1,
        fontSize: 13,
        color: Colors.GRAY,
        lineHeight: 18,
    },
    noMutualsText: {
        fontSize: 13,
        color: Colors.GRAY,
        marginTop: 12,
    }
});

export default MutualConnections;