import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import PostCard from './PostCard'; 
import Colors from '../../constant/Colors';

const Feed = ({ posts }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Feed</Text>
            {posts.length > 0 ? (
                <FlatList
                    data={posts}
                    renderItem={({ item }) => <PostCard {...item} />}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false} 
                />
            ) : (
                <Text style={styles.emptyText}>Your feed is empty. Follow people to see their posts!</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginTop: 16 },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    emptyText: { textAlign: 'center', color: Colors.GRAY, marginTop: 20, padding: 10 },
});

export default Feed;