import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Colors from '../../constant/Colors';
import { Calendar, Clock, MapPin, IndianRupee } from 'lucide-react-native';
import { useRouter } from 'expo-router';

type Webinar = {
  id: string;
  title: string;
  facilitator: string;
  mode: 'Online' | 'Offline';
  price: string;
  image_url?: string;
  session_type?: string;
  date?: string;
  duration?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
};

interface WebinarCardProps {
  webinar: Webinar;
  isRegistered?: boolean;
}

const WebinarCard: React.FC<WebinarCardProps> = ({ webinar, isRegistered = false }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: '/(screens)/Webinar/WebinarDetailScreen',
      params: { webinarId: webinar.id },
    });
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date TBD";
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatTime = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return webinar.duration || "Duration TBD";
    return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <Image
        source={{ uri: webinar.image_url || 'https://via.placeholder.com/300x180' }}
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{webinar.title}</Text>
        <Text style={styles.sessionType}>{webinar.session_type || 'Group Session'}</Text>
        
        <View style={styles.infoRow}>
          <Calendar size={14} color={Colors.GRAY} />
          <Text style={styles.infoText}>{formatDate(webinar.date)}</Text> 
        </View>
        <View style={styles.infoRow}>
          <Clock size={14} color={Colors.GRAY} />
          <Text style={styles.infoText}>{formatTime(webinar.start_time, webinar.end_time)}</Text>
        </View>
        <View style={styles.infoRow}>
          <MapPin size={14} color={Colors.GRAY} />
          <Text style={styles.infoText}>{webinar.mode || 'Online'}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <IndianRupee size={14} color={Colors.BLACK} />
            <Text style={styles.priceText}>{webinar.price}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isRegistered ? Colors.SUCCESS : Colors.PRIMARY }]}>
            <Text style={styles.statusText}>{isRegistered ? 'Registered' : 'Register Now'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        width: 250,
        marginRight: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    image: {
        width: '100%',
        height: 120,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    content: {
        padding: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 4,
    },
    sessionType: {
        fontSize: 12,
        color: Colors.PRIMARY,
        fontWeight: '600',
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 12,
        color: Colors.GRAY,
        marginLeft: 6,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderColor: '#f0f0f0',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 2,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: Colors.WHITE,
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default WebinarCard; 