import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Colors from '../../../constant/Colors';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WebinarCard({ webinar, type, onRegister }: { webinar: any, type: string, onRegister?: (webinarId: string) => void }) {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/(screens)/Webinar/WebinarDetailScreen', params: { webinarId: webinar.id } })} activeOpacity={0.85}>
      <View style={styles.imageContainer}>
        <Image source={webinar.image_url ? { uri: webinar.image_url } : require('../../../assets/images/default.png')} style={styles.image} />
        {webinar.reminder_enabled && (
          <View style={styles.reminderBadge}>
            <Ionicons name="notifications" size={16} color={Colors.WHITE} />
          </View>
        )}
        {type === 'recent' && (
          <TouchableOpacity style={styles.heart}>
            <Ionicons name="heart-outline" size={16} color={Colors.PRIMARY || '#007AFF'} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>{webinar.title}</Text>
      <View style={styles.row}><Ionicons name="person" size={14} color={Colors.GRAY} /><Text style={styles.facilitator}>  {webinar.facilitator}</Text></View>
      <View style={styles.row}><Ionicons name="calendar" size={14} color={Colors.GRAY} /><Text style={styles.info}>  {webinar.date}</Text></View>
      {(webinar.start_time || webinar.end_time) && (
        <Text style={styles.info}>
          {webinar.start_time ? `Start: ${webinar.start_time}` : ''}
          {webinar.end_time ? `  End: ${webinar.end_time}` : ''}
        </Text>
      )}
      {webinar.duration && <Text style={styles.info}>Duration: {webinar.duration}</Text>}
      <Text style={styles.info}>{webinar.price === 'Free' ? 'Free' : `₹${webinar.price}`}</Text>
      {webinar.registered ? (
        <Text style={styles.registered}>Registered</Text>
      ) : (
        <TouchableOpacity style={styles.registerButton} onPress={e => { e.stopPropagation(); onRegister ? onRegister(webinar.id) : router.push({ pathname: '/(screens)/Webinar/WebinarRegistrationScreen', params: { webinarId: webinar.id } }); }}>
          <Text style={styles.registerButtonText}>Register Now</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    marginRight: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  reminderBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.PRIMARY || '#007AFF',
    borderRadius: 12,
    padding: 4,
  },
  reminderText: {
    color: Colors.WHITE,
    fontSize: 12,
  },
  heart: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  facilitator: {
    fontSize: 13,
    color: Colors.GRAY,
    marginBottom: 2,
  },
  info: {
    fontSize: 12,
    color: Colors.GRAY,
  },
  registered: {
    color: 'green',
    fontWeight: 'bold',
    marginTop: 4,
  },
  registerButton: {
    backgroundColor: Colors.PRIMARY || '#007AFF',
    borderRadius: 8,
    marginTop: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  registerButtonText: {
    color: Colors.WHITE,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
}); 