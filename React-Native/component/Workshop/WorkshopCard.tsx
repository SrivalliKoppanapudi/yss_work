import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Colors from '../../constant/Colors';
import { Calendar, Clock, MapPin, IndianRupee } from 'lucide-react-native';
import { useRouter } from 'expo-router';

type Workshop = {
  id: string;
  title: string;
  facilitator_name: string;
  mode: 'Online' | 'Offline';
  price: number;
  image_url?: string;
  session_type?: string;
  workshop_date?: string;
  duration_in_minutes?: number;
};

interface WorkshopCardProps {
  workshop: Workshop;
  isRegistered?: boolean;
}

const WorkshopCard: React.FC<WorkshopCardProps> = ({ workshop, isRegistered = false }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: '/Workshop/WorkshopDetailsScreen',
      params: { workshopId: workshop.id },
    });
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date TBD";
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatDuration = (minutes?: number) => {
    if (minutes === undefined || minutes === null || minutes <= 0) return "N/A";
    if (minutes < 60) return `${minutes} Min`;
    const hours = parseFloat((minutes / 60).toFixed(1));
    return `${hours} Hour${hours > 1 ? 's' : ''}`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <Image
        source={{ uri: workshop.image_url || 'https://via.placeholder.com/300x180' }}
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{workshop.title}</Text>
        <Text style={styles.sessionType}>{workshop.session_type || 'Group Session'}</Text>
        
        <View style={styles.infoRow}>
          <Calendar size={14} color={Colors.GRAY} />
          <Text style={styles.infoText}>{formatDate(workshop.workshop_date)}</Text> 
        </View>
        <View style={styles.infoRow}>
          <Clock size={14} color={Colors.GRAY} />
          <Text style={styles.infoText}>{formatDuration(workshop.duration_in_minutes)}</Text>
        </View>
        <View style={styles.infoRow}>
          <MapPin size={14} color={Colors.GRAY} />
          <Text style={styles.infoText}>{workshop.mode}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <IndianRupee size={14} color={Colors.BLACK} />
            <Text style={styles.priceText}>{workshop.price}</Text>
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

export default WorkshopCard;