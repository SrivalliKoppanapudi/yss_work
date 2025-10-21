import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Colors from '../../constant/Colors';

const topics = [
  { header: "Make Labs session interesting", subHeader: "Lab safety Polls", buttonText: "Join Community" },
  { header: "Math Educator", subHeader: "New Geometry Lesson Plan", buttonText: "Join Group" },
  { header: "Event Alert", subHeader: "Regional education Conference", buttonText: "Register Now" },
];

const TrendingTopics = () => (
    <View style={styles.container}>
        <Text style={styles.title}>Trending Topics</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
            {topics.map((topic, index) => (
                <View key={index} style={styles.card}>
                    <Text style={styles.header}>{topic.header}</Text>
                    <Text style={styles.subHeader}>{topic.subHeader}</Text>
                    <TouchableOpacity style={styles.button}>
                        <Text style={styles.buttonText}>{topic.buttonText}</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </ScrollView>
    </View>
);

const styles = StyleSheet.create({
    container: { marginTop: 24, },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, paddingHorizontal: 16, },
    scrollContainer: { paddingHorizontal: 16, paddingBottom: 10 },
    card: {
        width: 260,
        backgroundColor: '#EAF6FB',
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        justifyContent: 'space-between',
    },
    header: { fontSize: 14, color: Colors.GRAY, fontWeight: '500' },
    subHeader: { fontSize: 16, fontWeight: 'bold', marginVertical: 8 },
    button: {
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: { color: Colors.WHITE, fontWeight: 'bold' },
});

export default TrendingTopics;