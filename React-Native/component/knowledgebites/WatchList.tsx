import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constant/Colors';

type Profile = {
  name: string;
  profilePicture: string;
};

type WatchlistItem = {
  id: string;
  profile: Profile;
  watched_at: string;
};

type Props = {
  watchlist: WatchlistItem[];
};



export default function WatchList({ watchlist }: Props) {
  return (
    <View style={styles.container}>
      <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 18, fontFamily: 'System', color: '#222' }}>Your Watchlist</Text>
      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator
        nestedScrollEnabled // necessary since parent is also scrollable
      >
        {watchlist.map((item) => (
          <View key={item.id} style={styles.item}>
            <Image
              source={{
                uri: item.profile.profilePicture || 'https://via.placeholder.com/150',
              }}
              style={styles.avatar}
            />
            <View style={styles.textContainer}>
              <Text style={styles.name}>{item.profile.name || 'Anonymous'}</Text>
              <Text style={styles.time}>{item.watched_at}</Text>
            </View>
            <TouchableOpacity style={styles.playIcon}>
              <Ionicons name="play-circle-outline" size={28} color="black" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {

    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    maxHeight: 155,
  },
  header: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    backgroundColor:'#f0f0f0',
    padding: 10,

  },
  scrollArea: {
    maxHeight: 200,
    borderColor: Colors.PRIMARY,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  time: {
    fontSize: 13,
    color: 'gray',
  },
  playIcon: {
    paddingLeft: 8,
  },
});
