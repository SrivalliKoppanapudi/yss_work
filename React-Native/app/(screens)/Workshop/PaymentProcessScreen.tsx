import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import { useAuth } from '../../../Context/auth'; 
import Colors from '../../../constant/Colors'; 
import { useStripe, PaymentSheetError } from '@stripe/stripe-react-native';
import { ArrowLeft, X, IndianRupee, ShieldCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PaymentProcessScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams<{
        workshopId: string;
        slotId: string;
    }>();
    
    const { session } = useAuth();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const [workshop, setWorkshop] = useState<any>(null);
    const [slotDetails, setSlotDetails] = useState<any>(null);
    const [initializing, setInitializing] = useState(true);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const hasInitializedPaymentSheet = useRef(false);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!params.workshopId || !params.slotId) {
                Alert.alert("Error", "Workshop or Slot details are missing.");
                router.back();
                return;
            }

            const { data: workshopData, error: workshopError } = await supabase
                .from('workshops')
                .select('title, price, mode, location')
                .eq('id', params.workshopId)
                .single();
            
            const { data: slotData, error: slotError } = await supabase
                .from('workshop_slots')
                .select('start_time, end_time')
                .eq('id', params.slotId)
                .single();

            if (workshopError || slotError || !workshopData || !slotData) {
                Alert.alert("Error", "Could not load workshop or slot details.");
                router.back();
            } else {
                setWorkshop(workshopData);
                setSlotDetails(slotData);
            }
        };
        fetchDetails();
    }, [params.workshopId, params.slotId]);

    useEffect(() => {
        if (workshop && session && !hasInitializedPaymentSheet.current) {
            initializePaymentSheetWrapper();
        }
    }, [workshop, session]);

    const initializePaymentSheetWrapper = async () => {
        if (!workshop || !session) return;
        
        hasInitializedPaymentSheet.current = true;
        setInitializing(true);
        try {
            const total = workshop.price + (workshop.price * 0.18);
            const amountInSmallestUnit = Math.round(total * 100);
            
            if (isNaN(amountInSmallestUnit) || amountInSmallestUnit < 50) {
                throw new Error("Invalid workshop price for payment.");
            }

            const { data, error } = await supabase.functions.invoke('create-payment-intent', {
                body: {
                    amount: amountInSmallestUnit,
                    currency: 'inr',
                    userId: session.user.id,
                    userEmail: session.user.email,
                    itemId: params.workshopId,
                    itemTitle: `Workshop: ${workshop.title}`,
                },
            });

            if (error) throw new Error(error.message);
            if (!data.clientSecret) throw new Error("Missing client secret from server.");

            const { error: initError } = await initPaymentSheet({
                merchantDisplayName: "Lynkt Workshops",
                customerId: data.customer,
                customerEphemeralKeySecret: data.ephemeralKey,
                paymentIntentClientSecret: data.clientSecret,
                allowsDelayedPaymentMethods: true,
                returnURL: 'lynkt://stripe-redirect',
                defaultBillingDetails: {
                    name: session.user.user_metadata?.full_name || 'Customer',
                    email: session.user.email,
                }
            });

     if (initError) throw new Error(`Payment Sheet Init Error: ${initError.message}`);
        } catch (e: any) {
            Alert.alert("Payment Setup Error", e.message);
            hasInitializedPaymentSheet.current = false;
        } finally {
            setInitializing(false);
        }
    };
    
    const handlePayment = async () => {
        if (initializing) return;

        setPaymentProcessing(true);
        const { error: paymentError } = await presentPaymentSheet();

        if (paymentError) {
            if (paymentError.code !== PaymentSheetError.Canceled) {
                Alert.alert(`Payment Error: ${paymentError.code}`, paymentError.message);
            }
        } else {
            await createWorkshopRegistration();
        }
        setPaymentProcessing(false);
    };

    const createWorkshopRegistration = async () => {
        try {
            const { data: registrationData, error } = await supabase
                .from('workshop_registrations')
                .insert({
                    user_id: session!.user.id,
                    workshop_id: params.workshopId,
                    slot_id: params.slotId,
                    status: 'confirmed',
                })
                .select('id')
                .single();

            if (error) throw error;
            
            // Increment the booked_seats count for the selected slot
            const { error: incrementError } = await supabase.rpc('increment_booked_seats', {
                slot_id_to_update: params.slotId
            });

            if (incrementError) {
                console.error("Failed to increment booked seats:", incrementError);
            }

            const total = workshop.price + (workshop.price * 0.18);
            router.replace({
                pathname: '/Workshop/RegistrationSuccessScreen',
                params: {
                    workshopTitle: workshop.title,
                    isOnline: workshop.mode === 'Online' ? 'true' : 'false',
                    registrationId: registrationData.id,
                    startTime: slotDetails.start_time,
                    endTime: slotDetails.end_time,
                    venue: workshop.location,
                    price: total.toFixed(2),
                }
            });

        } catch (err: any) {
            Alert.alert("Registration Failed", "Your payment was successful, but we failed to save your registration. Please contact support.");
        }
    };

    if (!workshop) {
        return <ActivityIndicator style={styles.centered} size="large" color={Colors.PRIMARY} />;
    }

    const platformFee = 0;
    const gst = workshop.price * 0.18;
    const total = workshop.price + platformFee + gst;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                            <ArrowLeft size={24} color={Colors.BLACK} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Confirm Booking</Text>
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                            <X size={24} color={Colors.BLACK} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.contentContainer}>
                        <Text style={styles.summaryTitle}>Booking Summary</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel} numberOfLines={2}>{workshop.title}</Text>
                            <View style={styles.priceContainer}>
                                <IndianRupee size={14} color={Colors.BLACK}/>
                                <Text style={styles.summaryValue}>{workshop.price.toFixed(2)}</Text>
                            </View>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Platform Fee</Text>
                            <View style={styles.priceContainer}>
                                <IndianRupee size={14} color={Colors.BLACK}/>
                                <Text style={styles.summaryValue}>{platformFee.toFixed(2)}</Text>
                            </View>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>GST (18%)</Text>
                             <View style={styles.priceContainer}>
                                <IndianRupee size={14} color={Colors.BLACK}/>
                                <Text style={styles.summaryValue}>{gst.toFixed(2)}</Text>
                            </View>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <View style={styles.priceContainer}>
                                <IndianRupee size={16} color={Colors.BLACK}/>
                                <Text style={styles.totalValue}>{total.toFixed(2)}</Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={[styles.payButton, (initializing || paymentProcessing) && styles.disabledButton]} 
                            onPress={handlePayment} 
                            disabled={initializing || paymentProcessing}
                        >
                            {initializing ? (
                                <ActivityIndicator color={Colors.WHITE} />
                            ) : paymentProcessing ? (
                                <ActivityIndicator color={Colors.WHITE} />
                            ) : (
                                <Text style={styles.payButtonText}>Proceed to Pay ₹{total.toFixed(2)}</Text>
                            )}
                        </TouchableOpacity>
                        <View style={styles.secureContainer}>
                            <ShieldCheck size={14} color={Colors.GRAY} />
                            <Text style={styles.secureText}>Secure payment powered by Stripe</Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 500,
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    headerButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
    },
    contentContainer: {
        padding: 24,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    summaryLabel: {
        fontSize: 16,
        color: Colors.GRAY,
        maxWidth: '70%',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 2,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderColor: '#ddd',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 2,
    },
    payButton: {
        backgroundColor: Colors.PRIMARY,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 30,
    },
    payButtonText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: Colors.GRAY,
    },
    secureContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        gap: 6,
    },
    secureText: {
        textAlign: 'center',
        color: Colors.GRAY,
        fontSize: 12,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default PaymentProcessScreen;