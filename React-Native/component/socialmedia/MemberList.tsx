import React from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity } from 'react-native';
import Colors from '../../constant/Colors';

const MemberList = ({ members }) => {
    const renderItem = ({ item }) => (
        <View style={styles.memberRow}>
            <Image source={{ uri: item.profilePicture || require('../../assets/images/default.png') }} style={styles.avatar} />
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={styles.memberOccupation}>{item.occupation || 'Member'}</Text>
            </View>
            <TouchableOpacity style={styles.connectButton}>
                <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <FlatList
            data={members}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.container}
            scrollEnabled={false}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    memberOccupation: {
        fontSize: 13,
        color: Colors.GRAY,
        marginTop: 2,
    },
    connectButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
        borderRadius: 20,
    },
    connectButtonText: {
        color: Colors.PRIMARY,
        fontWeight: '600',
        fontSize: 13,
    },
});

export default MemberList;