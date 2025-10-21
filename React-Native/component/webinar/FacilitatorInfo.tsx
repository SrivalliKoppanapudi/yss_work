import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Colors from '../../constant/Colors';

interface Props {
  name: string;
  bio: string;
  imageUrl?: string;
}

const FacilitatorInfo: React.FC<Props> = ({ name, bio, imageUrl }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>About the Facilitator</Text>
      <View style={styles.facilitatorCard}>
        <Image
          source={{ uri: imageUrl || 'https://via.placeholder.com/100x100' }}
          style={styles.facilitatorImage}
        />
        <View style={styles.facilitatorInfo}>
          <Text style={styles.facilitatorName}>{name}</Text>
          <Text style={styles.facilitatorBio}>{bio}</Text>
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
    marginBottom: 16,
  },
  facilitatorCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  facilitatorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  facilitatorInfo: {
    flex: 1,
  },
  facilitatorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.BLACK,
    marginBottom: 8,
  },
  facilitatorBio: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.GRAY,
  },
});

export default FacilitatorInfo; 