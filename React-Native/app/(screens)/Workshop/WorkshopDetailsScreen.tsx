import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import Colors from '../../../constant/Colors';
import { ArrowLeft, Calendar, Clock, User, MapPin, IndianRupee, Heart, Share2, Check, Users } from 'lucide-react-native';
import FacilitatorInfo from '../../../component/Workshop/FacilitatorInfo';
import FAQItem from '../../../component/Workshop/FAQItem';
import SlotSelectionModal from '../../../component/Workshop/SlotSelectionModal';
import RegistrationModal from '../../../component/Workshop/RegistrationModal';
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

const WorkshopDetailsScreen = () => {
    const router = useRouter();
    const { session } = useAuth();
    const { workshopId } = useLocalSearchParams<{ workshopId: string }>();
    const [workshop, setWorkshop] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);
    const [registrationDetails, setRegistrationDetails] = useState<any>(null);
    
    const [remainingSlots, setRemainingSlots] = useState<number | null>(null);

    const [isSlotModalVisible, setIsSlotModalVisible] = useState(false);
    const [isRegistrationModalVisible, setIsRegistrationModalVisible] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<any>(null);

    const fetchWorkshopAndRegistrationStatus = useCallback(async () => {
        if (!workshopId) {
            Alert.alert("Error", "Workshop ID not found.");
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data: workshopData, error: workshopError } = await supabase
                .from('workshops')
                .select('*, slots:workshop_slots(*)')
                .eq('id', workshopId)
                .single();

            if (workshopError) throw workshopError;
            setWorkshop(workshopData);

            if (workshopData && workshopData.slots) {
                const totalSeats = workshopData.slots.reduce((sum: number, slot: any) => sum + (slot.total_seats || 0), 0);
                const bookedSeats = workshopData.slots.reduce((sum: number, slot: any) => sum + (slot.booked_seats || 0), 0);
                const available = totalSeats - bookedSeats;
                setRemainingSlots(available > 0 ? available : 0);
            }

            if (session?.user) {
                const { data: registrationData, error: registrationError } = await supabase
                    .from('workshop_registrations')
                    .select('*, slot:workshop_slots(*)')
                    .eq('user_id', session.user.id)
                    .eq('workshop_id', workshopId)
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
            Alert.alert("Error", "Could not fetch workshop details.");
            console.error("Fetch workshop error:", error);
        } finally {
            setLoading(false);
        }
    }, [workshopId, session]);
    

    useEffect(() => {
        fetchWorkshopAndRegistrationStatus();
    }, [fetchWorkshopAndRegistrationStatus]);

    const handleMainAction = () => {
        if (isRegistered) {
            if (!registrationDetails || !workshop) return;
            const total = workshop.price + (workshop.price * 0.18);
            
            router.push({
                pathname: '/Workshop/RegistrationSuccessScreen',
                params: {
                    workshopTitle: workshop.title,
                    isOnline: workshop.mode === 'Online' ? 'true' : 'false',
                    registrationId: registrationDetails.id,
                    startTime: registrationDetails.slot.start_time,
                    endTime: registrationDetails.slot.end_time,
                    venue: workshop.location,
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
        setTimeout(() => {
            setIsRegistrationModalVisible(true);
        }, 300);
    };

    const handleRegistrationProceed = (registrationData: any) => {
        setIsRegistrationModalVisible(false);
        router.push({
            pathname: '/Workshop/PaymentProcessScreen',
            params: {
                workshopId: workshop.id,
                slotId: selectedSlot.id,
            }
        });
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Date not set";
        return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const formatDuration = (minutes?: number) => {
        if (!minutes || minutes <= 0) return "Not specified";
        if (minutes < 60) return `${minutes} Minutes`;
        const hours = parseFloat((minutes / 60).toFixed(1));
        return `${hours} Hour${hours > 1 ? 's' : ''}`;
    };

    if (loading) {
        return <ActivityIndicator style={styles.centered} size="large" color={Colors.PRIMARY} />;
    }

    if (!workshop) {
        return (
            <View style={styles.centered}>
                <Text>Workshop not found.</Text>
                <TouchableOpacity onPress={() => router.back()}><Text style={{ color: Colors.PRIMARY, marginTop: 10 }}>Go Back</Text></TouchableOpacity>
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
                <Image source={{ uri: workshop.image_url || 'https://via.placeholder.com/600x400' }} style={styles.bannerImage} />
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.WHITE} />
                </TouchableOpacity>

                <View style={styles.content}>
                    <Text style={styles.title}>{workshop.title}</Text>
                    <Text style={styles.sessionType}>{workshop.session_type}</Text>

                    <View style={styles.actionBar}>
                        <Text style={styles.facilitatorName}>{workshop.facilitator_name}</Text>
                        <View style={styles.actionIcons}>
                            <TouchableOpacity><Heart size={24} color={Colors.GRAY} /></TouchableOpacity>
                            <TouchableOpacity style={{ marginLeft: 16 }}><Share2 size={24} color={Colors.GRAY} /></TouchableOpacity>
                        </View>
                    </View>
                    
                    {/* --- NEW: Slots Available Badge --- */}
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
                        <DetailPill icon={<Calendar size={18} color={Colors.GRAY} />} text={formatDate(workshop.workshop_date)} />
                        <DetailPill icon={<Clock size={18} color={Colors.GRAY} />} text={formatDuration(workshop.duration_in_minutes)} />
                        <DetailPill icon={<User size={18} color={Colors.GRAY} />} text={workshop.facilitator_name} />
                        {workshop.mode === 'Offline' ? (
                            <DetailPill icon={<MapPin size={18} color={Colors.GRAY} />} text={workshop.location} />
                        ) : (
                            <DetailPill icon={<MapPin size={18} color={Colors.GRAY} />} text="Online" />
                        )}
                        <DetailPill icon={<IndianRupee size={18} color={Colors.GRAY} />} text={workshop.price} />
                        
                        <TouchableOpacity 
                            style={[styles.bookNowButton, remainingSlots === 0 && styles.disabledButton]} 
                            onPress={handleMainAction}
                            disabled={remainingSlots === 0}
                        >
                            <Text style={styles.bookNowButtonText}>
                                {isRegistered ? 'View Ticket' : remainingSlots === 0 ? 'Fully Booked' : 'Book Now'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ... Rest of the component ... */}
                    {workshop.overview && (
                      <View style={styles.section}>
                          <Text style={styles.sectionTitle}>Overview</Text>
                          <Text style={styles.sectionText}>{workshop.overview}</Text>
                      </View>
                    )}

                    {workshop.what_you_will_learn && (
                      <View style={styles.section}>
                          <Text style={styles.sectionTitle}>What You'll Learn</Text>
                          {workshop.what_you_will_learn.map(renderListItem)}
                      </View>
                    )}
                    
                    {workshop.who_should_attend && (
                      <View style={styles.section}>
                          <Text style={styles.sectionTitle}>Who Should Attend</Text>
                          <Text style={styles.sectionText}>{workshop.who_should_attend}</Text>
                      </View>
                    )}

                    {workshop.highlights && (
                      <View style={styles.section}>
                          <Text style={styles.sectionTitle}>Workshop Highlights</Text>
                          {workshop.highlights.map(renderListItem)}
                      </View>
                    )}

                    {workshop.outcomes && (
                      <View style={styles.section}>
                          <Text style={styles.sectionTitle}>Outcomes</Text>
                          {workshop.outcomes.map(renderListItem)}
                      </View>
                    )}
                    
                    {workshop.facilitator_bio && (
                      <FacilitatorInfo 
                        name={workshop.facilitator_name}
                        bio={workshop.facilitator_bio}
                        imageUrl={workshop.facilitator_image_url}
                      />
                    )}
                </View>
            </ScrollView>

            <SlotSelectionModal 
                isVisible={isSlotModalVisible}
                onClose={() => setIsSlotModalVisible(false)}
                workshopId={workshop.id}
                workshopTitle={workshop.title}
                facilitatorName={workshop.facilitator_name}
                onSlotSelect={handleSlotSelected}
            />

            <RegistrationModal
                isVisible={isRegistrationModalVisible}
                onClose={() => setIsRegistrationModalVisible(false)}
                onProceed={handleRegistrationProceed}
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
        backgroundColor: '#dcfce7', // light green
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginTop: 12,
    },
    slotsAvailableText: {
        color: '#166534', // dark green
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
    }
});

export default WorkshopDetailsScreen;