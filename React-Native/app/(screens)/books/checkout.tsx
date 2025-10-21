// app/(screens)/books/checkout.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import { useAuth } from '../../../Context/auth';
import Colors from '../../../constant/Colors';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { useFocusEffect } from '@react-navigation/native';

// MODIFIED: Added 'format' to our clean data structure
interface CleanCartItem {
    cart_item_id: number;
    quantity: number;
    format_id: string;
    title: string;
    author: string | null;
    price: number;
    format: 'ebook' | 'hardcover' | 'paperback';
}

const CheckoutStepper = () => (
    <View style={styles.stepperWrapper}>
        <View style={styles.stepperContainer}>
            <View style={[styles.step, styles.completedStep]}>
                <Check size={16} color={Colors.WHITE} />
            </View>
            <View style={[styles.connector, styles.connectorActive]} />
            <View style={[styles.step, styles.activeStep]}>
                <Text style={[styles.stepText, styles.stepTextActive]}>2</Text>
            </View>
            <View style={styles.connector} />
            <View style={styles.step}>
                <Text style={styles.stepText}>3</Text>
            </View>
        </View>
        <View style={styles.stepLabels}>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>Cart</Text>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>Checkout</Text>
            <Text style={styles.stepLabel}>Finish</Text>
        </View>
    </View>
);

export default function BookCheckoutScreen() {
    const router = useRouter();
    const { session } = useAuth();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const [cartItems, setCartItems] = useState<CleanCartItem[]>([]);
    const [subtotal, setSubtotal] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    // NEW: State to track if a shipping address is required
    const [isPhysicalOrder, setIsPhysicalOrder] = useState(false);

    const [billingDetails, setBillingDetails] = useState({
        fullName: session?.user?.user_metadata?.full_name || '',
        email: session?.user?.email || '',
        country: '',
        state: '',
        city: '',
        postalCode: '',
        addressLine1: '',
    });

    // MODIFIED: Validation logic is now conditional
    const isBillingFormValid =
        billingDetails.fullName.trim() !== '' &&
        billingDetails.email.trim() !== '' &&
        (!isPhysicalOrder || ( // Only validate address fields if it's a physical order
            billingDetails.addressLine1.trim() !== '' &&
            billingDetails.city.trim() !== '' &&
            billingDetails.state.trim() !== '' &&
            billingDetails.postalCode.trim() !== '' &&
            billingDetails.country.trim() !== ''
        ));

    const fetchCartData = useCallback(async () => {
        if (!session?.user) {
            Alert.alert("Please sign in", "You need to be logged in for checkout.");
            router.replace('/auth/SignIn');
            return;
        }
        
        setIsLoading(true);
        // MODIFIED: Added `format` to the select statement
        const { data, error } = await supabase
            .from('cart_items')
            .select(`
                id, 
                quantity,
                book_formats (
                    id, 
                    format, 
                    price,
                    books ( title, author )
                )
            `)
            .eq('user_id', session.user.id);

        if (error) {
            Alert.alert("Error", "Could not load cart data. Please try again.");
            console.error("Cart fetch error:", error);
            setIsLoading(false);
            return;
        }

        const cleanedItems: CleanCartItem[] = (data || [])
            .map(item => {
                const formatData = Array.isArray(item.book_formats) ? item.book_formats[0] : item.book_formats;
                if (!formatData || !formatData.books) return null;
                const bookData = Array.isArray(formatData.books) ? formatData.books[0] : formatData.books;
                if (!bookData) return null;
                
                return {
                    cart_item_id: item.id,
                    quantity: item.quantity,
                    format_id: formatData.id,
                    title: bookData.title,
                    author: bookData.author,
                    price: formatData.price,
                    format: formatData.format, // Store the format
                };
            })
            .filter((item): item is CleanCartItem => item !== null);

        setCartItems(cleanedItems);
        
        // NEW: Check if there are any physical items in the cart
        const hasPhysicalItem = cleanedItems.some(item => item.format === 'hardcover' || item.format === 'paperback');
        setIsPhysicalOrder(hasPhysicalItem);

        const calculatedSubtotal = cleanedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        setSubtotal(calculatedSubtotal);

        setIsLoading(false);
    }, [session]);

    useFocusEffect(useCallback(() => { fetchCartData(); }, [fetchCartData]));

    const handleProceedToPayment = async () => {
        if (!isBillingFormValid) {
            Alert.alert("Incomplete Details", "Please fill out all required billing details.");
            return;
        }
        if (subtotal <= 0) {
            Alert.alert("Invalid Amount", "Cannot process a payment for a zero or negative subtotal.");
            return;
        }
        setIsProcessing(true);

        try {
            const { data: paymentIntentData, error } = await supabase.functions.invoke('create-payment-intent', {
                body: {
                    amount: Math.round(subtotal * 100),
                    currency: 'inr',
                    userId: session!.user!.id,
                    userEmail: session!.user!.email,
                    itemId: `cart_${session!.user!.id}`,
                    itemTitle: `Book Order (${cartItems.length} items)`,
                },
            });

            if (error) throw error;
            if (!paymentIntentData.clientSecret) throw new Error("Missing client secret.");

            const { error: initError } = await initPaymentSheet({
                merchantDisplayName: "Lynkt Books",
                customerId: paymentIntentData.customer,
                customerEphemeralKeySecret: paymentIntentData.ephemeralKey,
                paymentIntentClientSecret: paymentIntentData.clientSecret,
                allowsDelayedPaymentMethods: true,
                defaultBillingDetails: { name: billingDetails.fullName, email: billingDetails.email }
            });

            if (initError) {
                Alert.alert("Payment Error", `Could not initialize payment: ${initError.message}`);
                setIsProcessing(false);
                return;
            }

            const { error: paymentError } = await presentPaymentSheet();

            if (paymentError) {
                if (paymentError.code !== 'Canceled') Alert.alert("Payment Failed", paymentError.message);
            } else {
                await onPaymentSuccess();
            }
        } catch (error: any) {
            Alert.alert("Error", `An unexpected error occurred: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const onPaymentSuccess = async () => {
        if (!session?.user) return;
        
        // MODIFIED: Conditionally create address objects
        const billingAddress = { name: billingDetails.fullName, email: billingDetails.email };
        const shippingAddress = isPhysicalOrder
            ? { name: billingDetails.fullName, line1: billingDetails.addressLine1, city: billingDetails.city, state: billingDetails.state, postal_code: billingDetails.postalCode, country: billingDetails.country }
            : null;

        const orderPayload = {
            user_id: session.user.id,
            order_number: `LYNKT-${Date.now()}`,
            total_amount: subtotal,
            subtotal: subtotal,
            shipping_address: shippingAddress,
            billing_address: billingAddress,
            payment_type: 'Stripe',
            status: isPhysicalOrder ? 'processing' : 'delivered', // Ebooks are 'delivered' instantly
        };

        const { data: newOrder, error: orderError } = await supabase
            .from('orders').insert(orderPayload).select().single();
        
        if (orderError || !newOrder) {
            Alert.alert("Order Creation Error", "Payment successful, but we failed to create your order. Please contact support.");
            return;
        }
        
        const orderItemsPayload = cartItems.map(item => ({
            order_id: newOrder.id,
            book_format_id: item.format_id,
            quantity: item.quantity,
            price_at_purchase: item.price,
        }));
        
        await supabase.from('order_items').insert(orderItemsPayload);
        await supabase.from('cart_items').delete().eq('user_id', session.user.id);
        
        router.replace({ pathname: '/(screens)/books/order-confirmation', params: { orderId: newOrder.id } });
    };

    const handleInputChange = (field: keyof typeof billingDetails, value: string) => {
        setBillingDetails(prev => ({ ...prev, [field]: value }));
    };

    if (isLoading) {
         return (
             <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={Colors.BLACK} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Checkout</Text>
                </View>
                <ActivityIndicator size="large" color={Colors.PRIMARY} style={{flex: 1}}/>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.BLACK} />
                </Pressable>
                <Text style={styles.headerTitle}>Checkout</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <CheckoutStepper />

                {/* MODIFIED: Conditionally render the billing/shipping address form */}
                {isPhysicalOrder ? (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Shipping & Billing Details</Text>
                        <TextInput style={styles.input} placeholder="Full name" value={billingDetails.fullName} onChangeText={(val) => handleInputChange('fullName', val)} placeholderTextColor={Colors.GRAY} />
                        <TextInput style={styles.input} placeholder="Email" value={billingDetails.email} onChangeText={(val) => handleInputChange('email', val)} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={Colors.GRAY} />
                        <TextInput style={styles.input} placeholder="Address Line 1" value={billingDetails.addressLine1} onChangeText={(val) => handleInputChange('addressLine1', val)} placeholderTextColor={Colors.GRAY} />
                        <View style={styles.inputRow}>
                            <TextInput style={styles.inputHalf} placeholder="Country" value={billingDetails.country} onChangeText={(val) => handleInputChange('country', val)} placeholderTextColor={Colors.GRAY} />
                            <TextInput style={styles.inputHalf} placeholder="State" value={billingDetails.state} onChangeText={(val) => handleInputChange('state', val)} placeholderTextColor={Colors.GRAY} />
                        </View>
                        <View style={styles.inputRow}>
                            <TextInput style={styles.inputHalf} placeholder="City" value={billingDetails.city} onChangeText={(val) => handleInputChange('city', val)} placeholderTextColor={Colors.GRAY} />
                            <TextInput style={styles.inputHalf} placeholder="Zip/Postal code" value={billingDetails.postalCode} onChangeText={(val) => handleInputChange('postalCode', val)} keyboardType="numeric" placeholderTextColor={Colors.GRAY} />
                        </View>
                    </View>
                ) : (
                    <View style={styles.card}>
                         <Text style={styles.sectionTitle}>Billing Details</Text>
                        <TextInput style={styles.input} placeholder="Full name" value={billingDetails.fullName} onChangeText={(val) => handleInputChange('fullName', val)} placeholderTextColor={Colors.GRAY} />
                        <TextInput style={styles.input} placeholder="Email" value={billingDetails.email} onChangeText={(val) => handleInputChange('email', val)} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={Colors.GRAY} />
                    </View>
                )}


                <View style={[styles.card, styles.summaryCard]}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    {cartItems.map((item) => (
                       <View key={item.cart_item_id} style={styles.summaryItem}>
                           <Text style={styles.summaryItemText} numberOfLines={1}>{item.quantity} x {item.title}</Text>
                           <Text style={styles.summaryItemPrice}>₹ {(item.price * item.quantity).toFixed(2)}</Text>
                       </View>
                    ))}
                    <View style={styles.summarySubtotal}>
                        <Text style={styles.subtotalText}>Sub total</Text>
                        <Text style={styles.subtotalValue}>₹ {subtotal.toFixed(2)}</Text>
                    </View>
                </View>
                
                <TouchableOpacity 
                    style={[styles.placeOrderButton, (!isBillingFormValid || isProcessing) && styles.disabledButton]} 
                    onPress={handleProceedToPayment}
                    disabled={!isBillingFormValid || isProcessing}
                >
                    {isProcessing ? (
                        <ActivityIndicator color={Colors.WHITE} />
                    ) : (
                        <Text style={styles.placeOrderText}>Proceed to Payment</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

// Styles remain the same
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.WHITE,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  scrollContainer: {
    padding: 16,
  },
  stepperWrapper: {
    marginBottom: 24,
    alignItems: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginHorizontal: '10%',
  },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
    zIndex: 1,
  },
  activeStep: {
    borderColor: Colors.PRIMARY,
    backgroundColor: Colors.WHITE,
  },
  completedStep: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  stepText: {
    color: '#6b7280',
    fontWeight: 'bold',
  },
  stepTextActive: {
    color: Colors.PRIMARY,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: -2,
  },
  connectorActive: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.PRIMARY,
    marginHorizontal: -2,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 8,
  },
  stepLabel: {
    flex: 1,
    textAlign: 'center',
    color: Colors.GRAY,
  },
  stepLabelActive: {
    color: Colors.BLACK,
    fontWeight: '500',
  },
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  summaryCard: {
    paddingBottom: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryItemText: {
    fontSize: 15,
    color: Colors.GRAY,
    maxWidth: '70%',
  },
  summaryItemPrice: {
    fontSize: 15,
    color: Colors.GRAY,
  },
  summarySubtotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
  },
  subtotalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeOrderButton: {
    backgroundColor: Colors.PRIMARY,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  placeOrderText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
  },
});