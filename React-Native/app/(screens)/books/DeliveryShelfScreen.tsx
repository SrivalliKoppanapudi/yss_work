import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import { useAuth } from '../../../Context/auth';
import Colors from '../../../constant/Colors';
import { ChevronDown, ChevronUp, Truck } from 'lucide-react-native';

type OrderItem = {
  quantity: number;
  price_at_purchase: number;
  book_title: string;
};
type PhysicalOrder = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  shipping_address: any;
  items: OrderItem[];
};

const OrderCard: React.FC<{ order: PhysicalOrder }> = ({ order }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter(); // <-- Import the router

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'shipped': return Colors.SUCCESS;
      case 'processing': return '#f59e0b';
      case 'delivered': return Colors.PRIMARY;
      case 'cancelled': return Colors.ERROR;
      default: return Colors.GRAY;
    }
  };

  return (
    <View style={styles.orderCard}>
      <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
        <View style={styles.cardHeader}>
          <View style={styles.orderInfoContainer}>
            <Text style={styles.orderId}>Order #{order.order_number}</Text>
            <Text style={styles.orderDate}>Placed on: {new Date(order.created_at).toLocaleDateString()}</Text>
          </View>

          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusText}>{order.status}</Text>
            </View>
            {isExpanded ? <ChevronUp size={20} color={Colors.GRAY} /> : <ChevronDown size={20} color={Colors.GRAY} />}
          </View>
        </View>
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.cardDetails}>
          <Text style={styles.detailsTitle}>Items:</Text>
          {order.items.map((item, index) => (
            <Text key={index} style={styles.detailText}>- {item.quantity}x {item.book_title}</Text>
          ))}
          <Text style={styles.detailsTitle}>Shipping Address:</Text>
          <Text style={styles.detailText}>{order.shipping_address?.name}</Text>
          <Text style={styles.detailText}>{order.shipping_address?.line1}, {order.shipping_address?.city}</Text>
          <Text style={styles.detailText}>{order.shipping_address?.state} - {order.shipping_address?.postal_code}</Text>
          
          {/* MODIFIED: Add onPress handler to navigate */}
          <TouchableOpacity 
            style={styles.trackButton}
            onPress={() => router.push({ pathname: '/(screens)/books/OrderTrackingScreen', params: { orderId: order.id } })}
          >
            <Text style={styles.trackButtonText}>Track Order</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default function DeliveryShelfScreen() {
  const { session } = useAuth();
  const [orders, setOrders] = useState<PhysicalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

    const fetchPhysicalOrders = useCallback(async () => {
        if (!session?.user) {
            console.log("DEBUG: No user session found. Aborting fetch.");
            setLoading(false);
            setRefreshing(false);
            return;
        }

        console.log("DEBUG: Starting to fetch physical orders for user:", session.user.id);
        setLoading(true);

        try {
            // This is a simplified query to see what we get back.
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        *,
                        book_formats (
                            format,
                            books ( title )
                        )
                    )
                `)
                .eq('user_id', session.user.id);


            if (error) throw error;

            if (data) {
                const simplifiedOrders = data.map(order => ({
                    id: order.id,
                    order_number: order.order_number,
                    status: order.status,
                    total_amount: order.total_amount,
                    created_at: order.created_at,
                    shipping_address: order.shipping_address,
                    items: (order.order_items || []).map((item: any) => ({
                        quantity: item.quantity,
                        price_at_purchase: item.price_at_purchase,
                        book_title: item.book_formats?.books?.title || "Book Title Missing"
                    }))
                }));
                setOrders(simplifiedOrders);
            } else {
                setOrders([]);
            }

        } catch (err: any) {
            console.error("DEBUG: CATCH BLOCK ERROR:", err);
            Alert.alert("Error", "Could not load your delivery shelf. Check the console.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [session]);
    useFocusEffect(useCallback(() => { fetchPhysicalOrders(); }, [fetchPhysicalOrders]));

    const onRefresh = () => {
    setRefreshing(true);
    fetchPhysicalOrders(); 
};

  if (loading && !refreshing) {
    return <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.centered} />;
  }

  return (
    <View style={styles.container}>
      {orders.length === 0 ? (
        <View style={styles.centered}>
            <Truck size={48} color={Colors.GRAY} />
            <Text style={styles.emptyText}>No Physical Orders Yet</Text>
            <Text style={styles.emptySubtext}>Orders for physical books will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={({ item }) => <OrderCard order={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchPhysicalOrders} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfoContainer: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8, 
  },
  statusText: {
    color: Colors.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  cardDetails: {
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.GRAY,
    marginBottom: 4,
  },
  trackButton: {
    marginTop: 16,
    backgroundColor: Colors.PRIMARY,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  trackButtonText: {
    color: Colors.WHITE,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.GRAY,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.GRAY,
    marginTop: 8,
    textAlign: 'center',
  },
});