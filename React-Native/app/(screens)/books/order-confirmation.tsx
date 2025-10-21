import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, SafeAreaView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import Colors from '../../../constant/Colors';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';

type OrderDetails = {
    id: string;
    order_number: string;
    total_amount: number;
    shipping_address: {
        name: string;
        line1: string;
        city: string;
    };
    payment_type: string | null;
    shipping_type: string | null;
    estimated_delivery: string | null;
    created_at: string;
};

export default function OrderConfirmationScreen() {
    const router = useRouter();
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchOrderDetails = useCallback(async () => {
        if (!orderId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
        
        if (error) {
            console.error("Error fetching order details:", error);
            Alert.alert("Error", "Could not load your order confirmation.");
        } else {
            setOrder(data as OrderDetails);
        }
        setLoading(false);
    }, [orderId]);

    useEffect(() => {
        fetchOrderDetails();
    }, [fetchOrderDetails]);

    if (loading) {
        return <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.centered} />;
    }

    if (!order) {
        return (
            <View style={styles.centered}>
                <Text>Could not find order details.</Text>
                <TouchableOpacity onPress={() => router.replace('/(screens)/books')} style={styles.homeButton}>
                    <Text style={styles.homeButtonText}>Back to Books</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.replace('/(screens)/books')} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.BLACK} />
                </Pressable>
                <Text style={styles.headerTitle}>Order Confirmation</Text>
                <View style={{ width: 28 }} />
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.successContainer}>
                    <CheckCircle2 size={60} color={Colors.SUCCESS} />
                    <Text style={styles.successTitle}>Thank you for your order!</Text>
                    <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
                </View>

                <View style={styles.summaryBox}>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Order Placed:</Text>
                        <Text style={styles.value}>{new Date(order.created_at).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Shipping Address:</Text>
                        <Text style={styles.value} numberOfLines={3}>
                            {order.shipping_address?.name}, {order.shipping_address?.line1}, {order.shipping_address?.city}
                        </Text>
                    </View>
                     <View style={styles.infoRow}>
                        <Text style={styles.label}>Total Amount:</Text>
                        <Text style={[styles.value, styles.totalValue]}>₹{order.total_amount.toFixed(2)}</Text>
                    </View>
                </View>

                <View style={styles.trackingBox}>
                     <Text style={styles.trackingText}>We will send you an email with tracking details once your order has been shipped. Stay tuned!</Text>
                </View>

                <TouchableOpacity onPress={() => router.replace('/(screens)/Learning')} style={styles.homeButton}>
                    <Text style={styles.homeButtonText}>Continue Shopping</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  scrollContent: {
    padding: 20,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.BLACK,
    marginTop: 16,
  },
  orderNumber: {
    fontSize: 16,
    color: Colors.GRAY,
    marginTop: 4,
  },
  summaryBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: Colors.GRAY,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  totalValue: {
    color: Colors.PRIMARY,
    fontWeight: 'bold',
  },
  trackingBox: {
    backgroundColor: '#e7f3ff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  trackingText: {
    fontSize: 15,
    color: Colors.PRIMARY,
    textAlign: 'center',
    lineHeight: 22,
  },
  homeButton: {
    backgroundColor: Colors.PRIMARY,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  homeButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});