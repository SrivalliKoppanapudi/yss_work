import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Colors from '../../constant/Colors';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// --- THIS IS THE FIX ---
// Update the component to accept the new props: `isMember` and `onToggleMembership`
const ActiveCommunityCard = ({ item, isMember, onToggleMembership }) => {
    const router = useRouter(); 

    return (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push({ 
                pathname: '/socialmedia/community/[id]', 
                params: { id: item.id } 
            })}
        >
            <Image
                source={{ uri: item.icon_url || 'https://via.placeholder.com/50' }}
                style={styles.icon}
            />
            <View style={styles.infoContainer}>
                <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.stats} numberOfLines={1}>
                    {item.newPosts || 0} new posts • {item.participants || 0} participants • Last post {item.lastPostTime || 'N/A'}
                </Text>
            </View>
            
            {/* The Join button is no longer here, so this component doesn't need to show it.
                If you intended for it to have a join button, it should be added here.
                Based on the previous fix, it was replaced by a Chevron. */}
            <ChevronRight size={24} color={Colors.GRAY} />
        </TouchableOpacity>
    );
};
// --- END OF FIX ---

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 12,
    },
    icon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
        backgroundColor: '#f0f0f0',
    },
    infoContainer: {
        flex: 1,
        marginRight: 8,
    },
    title: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.BLACK,
    },
    stats: {
        fontSize: 12,
        color: Colors.GRAY,
        marginTop: 4,
    },
});

export default ActiveCommunityCard;