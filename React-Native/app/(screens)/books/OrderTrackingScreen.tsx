import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import Colors from '../../../constant/Colors';
import { ArrowLeft, Package, Truck, Home, XCircle, CheckCircle } from 'lucide-react-native';

interface OrderItem {
  quantity: number;
  book_title: string;
}

interface Order {
  id: string;
  order_number: string;
  status: 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  total_amount: number;
  created_at: string;
  shipping_address: {
    name: string;
    line1: string;
    city: string;
    state: string;
    postal_code: string;
  };
  items: OrderItem[];
  tracking_number?: string;
}

const StatusTimeline = ({ currentStatus }: { currentStatus: Order['status'] }) => {
  const statuses: Order['status'][] = ['processing', 'shipped', 'out_for_delivery', 'delivered'];
  const currentStatusIndex = statuses.indexOf(currentStatus);

  const getStatusInfo = (status: Order['status']) => {
    switch (status) {
      case 'processing': return { icon: <Package size={24} color={Colors.WHITE} />, label: "Order Confirmed" };
      case 'shipped': return { icon: <Truck size={24} color={Colors.WHITE} />, label: "Shipped" };
      case 'out_for_delivery': return { icon: <Truck size={24} color={Colors.WHITE} />, label: "Out for Delivery" };
      case 'delivered': return { icon: <Home size={24} color={Colors.WHITE} />, label: "Delivered" };
      default: return { icon: <Package size={24} color={Colors.WHITE} />, label: "Unknown" };
    }
  };

  if (currentStatus === 'cancelled') {
    return (
      <View style={styles.cancelledContainer}>
        <XCircle size={40} color={Colors.ERROR} />
        <Text style={styles.cancelledText}>This order has been cancelled.</Text>
      </View>
    );
  }

  return (
    <View style={styles.timelineContainer}>
      {statuses.map((status, index) => {
        const isActive = index === currentStatusIndex;
        const isCompleted = index < currentStatusIndex;
        const isLast = index === statuses.length - 1;

        return (
          <View key={status} style={styles.timelineNode}>
            <View style={styles.timelineIconContainer}>
              <View style={[styles.timelineIcon, (isActive || isCompleted) && styles.timelineIconActive]}>
                {getStatusInfo(status).icon}
              </View>
              {!isLast && <View style={[styles.timelineConnector, isCompleted && styles.timelineConnectorActive]} />}
            </View>
            <View style={styles.timelineLabelContainer}>
              <Text style={[styles.timelineLabel, (isActive || isCompleted) && styles.timelineLabelActive]}>
                {getStatusInfo(status).label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};


export default function OrderTrackingScreen() {
    const router = useRouter();
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchOrderDetails = useCallback(async () => {
        if (!orderId) {
            Alert.alert("Error", "No order specified.");
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id, order_number, status, total_amount, created_at, shipping_address, tracking_number,
                    order_items (
                        quantity,
                        book_formats (
                            books ( title )
                        )
                    )
                `)
                .eq('id', orderId)
                .single();

            if (error) throw error;

            const transformedOrder: Order = {
                ...data,
                items: (data.order_items || []).map((item: any) => ({
                    quantity: item.quantity,
                    book_title: item.book_formats?.books?.title || 'Unknown Book',
                })),
            };

            setOrder(transformedOrder);
        } catch (err: any) {
            Alert.alert("Error", "Could not load order details.");
        } finally {
            setLoading(false);
        }
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
                <Text>Order not found.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.button}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.BLACK} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Track Order</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.summaryCard}>
                    <Text style={styles.orderIdText}>Order #{order.order_number}</Text>
                    {order.tracking_number && <Text style={styles.trackingIdText}>Tracking ID: {order.tracking_number}</Text>}
                </View>

                <StatusTimeline currentStatus={order.status} />

                <View style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    {order.items.map((item, index) => (
                        <Text key={index} style={styles.detailText}>• {item.quantity}x {item.book_title}</Text>
                    ))}
                    <Text style={[styles.detailText, styles.totalAmount]}>Total: ₹{order.total_amount.toFixed(2)}</Text>
                </View>

                <View style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>Shipping To</Text>
                    <Text style={styles.detailText}>{order.shipping_address.name}</Text>
                    <Text style={styles.detailText}>{order.shipping_address.line1}</Text>
                    <Text style={styles.detailText}>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.postal_code}</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  scrollContent: { padding: 16 },
  summaryCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  orderIdText: { fontSize: 18, fontWeight: 'bold' },
  trackingIdText: { fontSize: 14, color: Colors.GRAY, marginTop: 4 },
  timelineContainer: { paddingVertical: 20 },
  timelineNode: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineIconContainer: { alignItems: 'center' },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.GRAY,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.WHITE,
  },
  timelineIconActive: { backgroundColor: Colors.PRIMARY },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#d1d5db',
    minHeight: 50,
  },
  timelineConnectorActive: { backgroundColor: Colors.PRIMARY },
  timelineLabelContainer: { flex: 1, marginLeft: 16, justifyContent: 'center', minHeight: 40 },
  timelineLabel: { fontSize: 16, color: Colors.GRAY },
  timelineLabelActive: { color: Colors.BLACK, fontWeight: 'bold' },
  cancelledContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fffbe6',
    borderRadius: 8,
  },
  cancelledText: { fontSize: 18, fontWeight: 'bold', color: Colors.ERROR, marginTop: 8 },
  detailsCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  detailText: { fontSize: 14, color: Colors.GRAY, marginBottom: 4 },
  totalAmount: { marginTop: 12, fontWeight: 'bold', color: Colors.BLACK },
  button: { backgroundColor: Colors.PRIMARY, padding: 12, borderRadius: 8, marginTop: 20 },
  buttonText: { color: Colors.WHITE, fontWeight: 'bold', textAlign: 'center' },
});