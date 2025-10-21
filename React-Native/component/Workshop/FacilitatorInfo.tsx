import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Colors from '../../constant/Colors';

interface FacilitatorInfoProps {
  name: string;
  bio: string;
  imageUrl?: string | null;
}

const FacilitatorInfo: React.FC<FacilitatorInfoProps> = ({ name, bio, imageUrl }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>About Facilitator</Text>
      <View style={styles.card}>
        <Image
          source={{ uri: imageUrl || 'https://via.placeholder.com/100' }}
          style={styles.avatar}
        />
        <View style={styles.textContainer}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.bio}>{bio}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.BLACK,
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: Colors.GRAY,
    lineHeight: 20,
  },
});

export default FacilitatorInfo;