import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Colors from '../../constant/Colors';
import { Search } from 'lucide-react-native';

const CommunitySearch = ({ onStartCommunity }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Connect with educators, share ideas, and participate in discussions</Text>
            <View style={styles.searchBar}>
                <Search size={20} color={Colors.GRAY} />
                <TextInput
                    placeholder="Search Forums and discussion"
                    style={styles.searchInput}
                    placeholderTextColor={Colors.GRAY}
                />
            </View>
            <View style={styles.createBox}>
                <Text style={styles.createTitle}>Create your own community</Text>
                <Text style={styles.createDesc}>Have a specific topic you'd like to discuss with other educators? Start your own community!</Text>
                <TouchableOpacity style={styles.createBtn} onPress={onStartCommunity}>
                    <Text style={styles.createBtnText}>Start a Community</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    title: {
        fontSize: 15,
        color: Colors.GRAY,
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    createBox: {
        backgroundColor: '#EAF6FB',
        borderRadius: 12,
        padding: 16,
    },
    createTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    createDesc: {
        fontSize: 14,
        color: Colors.GRAY,
        marginBottom: 12,
        lineHeight: 20,
    },
    createBtn: {
        backgroundColor: Colors.PRIMARY,
        borderRadius: 8,
        paddingVertical: 12,
        alignSelf: 'flex-start',
        paddingHorizontal: 20,
    },
    createBtnText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 15,
    },
});

export default CommunitySearch;