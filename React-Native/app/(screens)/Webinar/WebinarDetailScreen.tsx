import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import Colors from '../../../constant/Colors';
import { ArrowLeft, Calendar, Clock, User, MapPin, IndianRupee, Heart, Share2, Check } from 'lucide-react-native';
import FacilitatorInfo from '../../../component/webinar/FacilitatorInfo';
import SlotSelectionModal from '../../../component/webinar/SlotSelectionModal';
import { useAuth } from '../../../Context/auth';

const DetailPill = ({ icon, text }: { icon: React.ReactNode, text: string | number | null }) => {
  if (text === null || text === undefined || text === '') return null;
  return (
    <View style={styles.detailPill}>
      {icon}
      <Text style={styles.detailPillText}>{text}</Text>
    </View>
  );
};

const WebinarDetailScreen = () => {
  const router = useRouter();
  const { session } = useAuth();
  const { webinarId } = useLocalSearchParams<{ webinarId: string }>();
  const [webinar, setWebinar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationDetails, setRegistrationDetails] = useState<any>(null);
  const [remainingSlots, setRemainingSlots] = useState<number | null>(null);
  const [isSlotModalVisible, setIsSlotModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const fetchWebinarAndRegistrationStatus = useCallback(async () => {
    if (!webinarId) {
      Alert.alert("Error", "Webinar ID not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: webinarData, error: webinarError } = await supabase
        .from('webinars')
        .select('*, slots:webinar_slots(*)')
        .eq('id', webinarId)
        .single();

      if (webinarError) throw webinarError;
      setWebinar(webinarData);

      if (webinarData && webinarData.slots) {
        const totalSeats = webinarData.slots.reduce((sum: number, slot: any) => sum + (slot.total_seats || 0), 0);
        const bookedSeats = webinarData.slots.reduce((sum: number, slot: any) => sum + (slot.booked_seats || 0), 0);
        const available = totalSeats - bookedSeats;
        setRemainingSlots(available > 0 ? available : 0);
      }

      if (session?.user) {
        const { data: registrationData, error: registrationError } = await supabase
          .from('webinar_registrations')
          .select('*, slot:webinar_slots(*)')
          .eq('user_id', session.user.id)
          .eq('webinar_id', webinarId)
          .eq('status', 'confirmed')
          .limit(1)
          .single();

        if (registrationError && registrationError.code !== 'PGRST116') {
          throw registrationError;
        }
        
        if (registrationData) {
          setIsRegistered(true);
          setRegistrationDetails(registrationData);
        }
      }
    } catch (error: any) {
      Alert.alert("Error", "Could not fetch webinar details.");
      console.error("Fetch webinar error:", error);
    } finally {
      setLoading(false);
    }
  }, [webinarId, session]);

  useEffect(() => {
    fetchWebinarAndRegistrationStatus();
  }, [fetchWebinarAndRegistrationStatus]);

  const handleMainAction = () => {
    if (isRegistered) {
      if (!registrationDetails || !webinar) return;
      const total = parseFloat(webinar.price) + (parseFloat(webinar.price) * 0.18);
      
      router.push({
        pathname: '/(screens)/Webinar/RegistrationSuccessScreen',
        params: {
          webinarTitle: webinar.title,
          isOnline: webinar.mode === 'Online' ? 'true' : 'false',
          registrationId: registrationDetails.id,
          startTime: registrationDetails.slot.start_time,
          endTime: registrationDetails.slot.end_time,
          venue: webinar.location,
          price: total.toFixed(2),
        }
      });
    } else {
      setIsSlotModalVisible(true);
    }
  };

  const handleSlotSelected = (slot: any) => {
    setIsSlotModalVisible(false);
    setSelectedSlot(slot);
    router.push({
      pathname: '/(screens)/Webinar/WebinarRegistrationScreen',
      params: {
        webinarId: webinar.id,
        slotId: slot.id,
      }
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date not set";
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return <ActivityIndicator style={styles.centered} size="large" color={Colors.PRIMARY} />;
  }

  if (!webinar) {
    return (
      <View style={styles.centered}>
        <Text>Webinar not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: Colors.PRIMARY, marginTop: 10 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderListItem = (item: string, index: number) => (
    <View key={index} style={styles.listItem}>
      <Check size={16} color={Colors.SUCCESS} style={{ marginRight: 8, marginTop: 3 }}/>
      <Text style={styles.listText}>{item}</Text>
    </View>
  );

  return (
    <View style={styles.outerContainer}>
      <ScrollView style={styles.container}>
        <Image 
          source={{ uri: webinar.image_url || 'https://via.placeholder.com/600x400' }} 
          style={styles.bannerImage} 
        />
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.WHITE} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>{webinar.title}</Text>
          <Text style={styles.sessionType}>{webinar.session_type}</Text>

          <View style={styles.actionBar}>
            <Text style={styles.facilitatorName}>{webinar.facilitator}</Text>
            <View style={styles.actionIcons}>
              <TouchableOpacity><Heart size={24} color={Colors.GRAY} /></TouchableOpacity>
              <TouchableOpacity style={{ marginLeft: 16 }}><Share2 size={24} color={Colors.GRAY} /></TouchableOpacity>
            </View>
          </View>

          {remainingSlots !== null && remainingSlots > 0 && (
            <View style={styles.slotsAvailableBadge}>
              <Text style={styles.slotsAvailableText}>
                {remainingSlots} slots available
              </Text>
            </View>
          )}
          {remainingSlots === 0 && (
            <View style={[styles.slotsAvailableBadge, {backgroundColor: '#fee2e2'}]}>
              <Text style={[styles.slotsAvailableText, {color: Colors.ERROR}]}>
                All slots are full
              </Text>
            </View>
          )}

          <View style={styles.detailsCard}>
            <DetailPill icon={<Calendar size={18} color={Colors.GRAY} />} text={formatDate(webinar.date)} />
            <DetailPill icon={<Clock size={18} color={Colors.GRAY} />} text={webinar.duration} />
            <DetailPill icon={<User size={18} color={Colors.GRAY} />} text={webinar.facilitator} />
            <DetailPill icon={<MapPin size={18} color={Colors.GRAY} />} text={webinar.mode === 'Offline' ? webinar.location : 'Online'} />
            <DetailPill icon={<IndianRupee size={18} color={Colors.GRAY} />} text={webinar.price} />

            <TouchableOpacity 
              style={[styles.bookNowButton, remainingSlots === 0 && styles.disabledButton]} 
              onPress={handleMainAction}
              disabled={remainingSlots === 0}
            >
              <Text style={styles.bookNowButtonText}>
                {isRegistered ? 'View Ticket' : remainingSlots === 0 ? 'Fully Booked' : 'Register Now'}
              </Text>
            </TouchableOpacity>
          </View>

          {webinar.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <Text style={styles.sectionText}>{webinar.description}</Text>
            </View>
          )}

          {webinar.what_you_will_learn && webinar.what_you_will_learn.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What You'll Learn</Text>
              {webinar.what_you_will_learn.map(renderListItem)}
            </View>
          )}

          {webinar.highlights && webinar.highlights.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Webinar Highlights</Text>
              {webinar.highlights.map(renderListItem)}
            </View>
          )}

          {webinar.outcomes && webinar.outcomes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Outcomes</Text>
              {webinar.outcomes.map(renderListItem)}
            </View>
          )}

          {webinar.facilitator_bio && (
            <FacilitatorInfo 
              name={webinar.facilitator}
              bio={webinar.facilitator_bio}
              imageUrl={webinar.facilitator_image_url}
            />
          )}
        </View>
      </ScrollView>

      <SlotSelectionModal 
        isVisible={isSlotModalVisible}
        onClose={() => setIsSlotModalVisible(false)}
        webinarId={webinar.id}
        webinarTitle={webinar.title}
        facilitatorName={webinar.facilitator}
        onSlotSelect={handleSlotSelected}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: '100%',
    height: 280,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 8,
    borderRadius: 20,
  },
  content: {
    padding: 16,
    marginTop: -30,
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.BLACK,
  },
  sessionType: {
    fontSize: 16,
    color: Colors.PRIMARY,
    fontWeight: '600',
    marginTop: 4,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  facilitatorName: {
    fontSize: 18,
    color: Colors.GRAY,
    fontWeight: '500',
  },
  actionIcons: {
    flexDirection: 'row',
  },
  slotsAvailableBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  slotsAvailableText: {
    color: '#166534',
    fontWeight: '600',
    fontSize: 14,
  },
  detailsCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailPillText: {
    fontSize: 16,
    color: Colors.BLACK,
    marginLeft: 16,
    fontWeight: '500',
  },
  bookNowButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  bookNowButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: Colors.GRAY,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.BLACK,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.GRAY,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listText: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.GRAY,
    flex: 1,
  },
});

export default WebinarDetailScreen; 