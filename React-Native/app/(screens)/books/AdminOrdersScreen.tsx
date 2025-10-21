// app/(screens)/books/AdminOrdersScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert, TextInput } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import { useAuth } from '../../../Context/auth';
import Colors from '../../../constant/Colors';
import { ArrowLeft, ChevronDown, ChevronUp, Edit2, Save, Truck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Order, OrderItem } from '../../../types/orders';
import { ShowForBookManagement } from '../../../component/RoleBasedUI';

const AdminOrderCard = ({ order, onUpdate }: { order: Order; onUpdate: (orderId: string, updates: Partial<Order>) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newStatus, setNewStatus] = useState<Order['status']>(order.status);
  const [newTrackingNumber, setNewTrackingNumber] = useState(order.tracking_number || '');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
        const updates: { status: string; tracking_number?: string } = { status: newStatus };
        if (newTrackingNumber) {
            updates.tracking_number = newTrackingNumber;
        }
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', order.id);

      if (error) throw error;
      Alert.alert("Success", "Order updated successfully.");
      onUpdate(order.id, { status: newStatus, tracking_number: newTrackingNumber });
    } catch (err: any) {
      Alert.alert("Error", `Failed to update order: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'shipped': return Colors.SUCCESS;
      case 'processing': return '#f59e0b';
      case 'out_for_delivery': return '#8b5cf6';
      case 'delivered': return Colors.PRIMARY;
      case 'cancelled': return Colors.ERROR;
      default: return Colors.GRAY;
    }
  };

  return (
    <View style={styles.orderCard}>
      <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={styles.cardHeader}>
        <View style={styles.orderInfoContainer}>
          <Text style={styles.orderId}>Order #{order.order_number}</Text>
          <Text style={styles.customerName}>{order.user_name || 'N/A'}</Text>
          <Text style={styles.orderDate}>Placed: {new Date(order.created_at).toLocaleDateString()}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
          {isExpanded ? <ChevronUp size={20} color={Colors.GRAY} /> : <ChevronDown size={20} color={Colors.GRAY} />}
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
          
          <View style={styles.updateSection}>
            <Text style={styles.updateLabel}>Update Status:</Text>
            <View style={styles.statusOptions}>
              {(['processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'] as const).map(status => (
                <TouchableOpacity 
                  key={status} 
                  style={[styles.statusOption, newStatus === status && { backgroundColor: getStatusColor(status), borderColor: getStatusColor(status) }]}
                  onPress={() => setNewStatus(status)}
                >
                  <Text style={[styles.statusOptionText, newStatus === status && { color: Colors.WHITE }]}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.updateLabel}>Tracking Number:</Text>
            <View style={styles.trackingInputContainer}>
                <TextInput 
                    style={styles.trackingInput}
                    value={newTrackingNumber}
                    onChangeText={setNewTrackingNumber}
                    placeholder="Enter Tracking ID"
                />
            </View>
            
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdate} disabled={isUpdating}>
              {isUpdating ? <ActivityIndicator color={Colors.WHITE} /> : <Save size={16} color={Colors.WHITE} />}
              <Text style={styles.updateButtonText}>Confirm & Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const AdminOrdersContent = () => {
    const router = useRouter();
    const { session } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

// Corrected function for AdminOrdersScreen.tsx
const fetchAllOrders = useCallback(async () => {
    if (!session?.user) { setLoading(false); return; }
    
    setLoading(true);
    try {
        const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select(`
                id, order_number, status, total_amount, created_at, shipping_address, tracking_number, user_id,
                order_items (
                    quantity,
                    price_at_purchase,
                    book_formats!inner (
                        format,
                        books ( title )
                    )
                )
            `)
            // --- THIS IS THE FIX ---
            // Add the filter here to only fetch orders containing physical books.
            .in('order_items.book_formats.format', ['hardcover', 'paperback'])
            .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        if (!ordersData) {
            setOrders([]);
            return;
        }

        const userIds = [...new Set(ordersData.map(o => o.user_id).filter(id => id))];
        let profilesMap = new Map<string, { name: string; email: string }>();

        if (userIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, name')
                .in('id', userIds);
            if (profilesError) throw profilesError;
            profilesData.forEach(p => profilesMap.set(p.id, { name: p.name, email: '' }));
        }

        const transformedOrders = ordersData.map(order => {
            const userProfile = profilesMap.get(order.user_id);
            return {
                id: order.id,
                order_number: order.order_number,
                status: order.status,
                total_amount: order.total_amount,
                created_at: order.created_at,
                shipping_address: order.shipping_address,
                tracking_number: order.tracking_number || undefined,
                user_name: userProfile?.name || 'Unknown User',
                user_email: '',
                items: (order.order_items || []).map(item => {
                    const formatData = Array.isArray(item.book_formats) ? item.book_formats[0] : item.book_formats;
                    const bookData = formatData ? (Array.isArray(formatData.books) ? formatData.books[0] : formatData.books) : null;
                    return {
                        quantity: item.quantity,
                        book_title: bookData?.title || "Unknown Book",
                        price_at_purchase: item.price_at_purchase || 0,
                    };
                }),
            };
        });
        
        setOrders(transformedOrders);
    } catch (err: any) {
        console.error("Error loading orders:", err);
        Alert.alert("Error", "Could not load orders.");
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
}, [session]);
    
    useFocusEffect(useCallback(() => { fetchAllOrders(); }, [fetchAllOrders]));

    const handleUpdateOrderInList = (orderId: string, updates: Partial<Order>) => {
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === orderId ? { ...order, ...updates } : order
            )
        );
    };
    
    if (loading && !refreshing) {
        return <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.centered} />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.BLACK} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Orders</Text>
                 <View style={{ width: 28 }} />
            </View>
            
            {orders.length === 0 ? (
                <View style={styles.centered}>
                     <Truck size={48} color={Colors.GRAY} />
                    <Text style={styles.emptyText}>No physical book orders to manage.</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={({ item }) => <AdminOrderCard order={item} onUpdate={handleUpdateOrderInList} />}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAllOrders} />}
                />
            )}
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
  listContainer: { padding: 16 },
  orderCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderInfoContainer: { flex: 1 },
  orderId: { fontSize: 16, fontWeight: 'bold' },
  customerName: { fontSize: 14, color: Colors.GRAY, marginTop: 2 },
  orderDate: { fontSize: 12, color: Colors.GRAY, marginTop: 2 },
  statusContainer: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  statusText: { color: Colors.WHITE, fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
  cardDetails: { paddingTop: 16, marginTop: 16, borderTopWidth: 1, borderColor: '#eee' },
  detailsTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginTop: 8 },
  detailText: { fontSize: 14, color: Colors.GRAY, marginBottom: 4 },
  updateSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderColor: '#f0f0f0' },
  updateLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  statusOption: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: Colors.GRAY },
  statusOptionText: { fontSize: 12, fontWeight: '500' },
  trackingInputContainer: { flexDirection: 'row', alignItems: 'center' },
  trackingInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, fontSize: 14 },
  updateButton: {
    marginTop: 16,
    backgroundColor: Colors.PRIMARY,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  updateButtonText: { color: Colors.WHITE, fontWeight: 'bold' },
  emptyText: { fontSize: 16, color: Colors.GRAY, textAlign: 'center' },
});

export default function AdminOrdersScreen() {
    return (
        <ShowForBookManagement
            fallback={
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <ArrowLeft size={24} color={Colors.BLACK} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Access Denied</Text>
                        <View style={{ width: 28 }} />
                    </View>
                    <View style={styles.centered}>
                        <Text style={[styles.headerTitle, { color: Colors.ERROR }]}>⛔ Access Denied</Text>
                        <Text style={styles.emptyText}>Only administrators can manage orders.</Text>
                        <TouchableOpacity 
                            style={styles.updateButton}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.updateButtonText}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            }
        >
            <AdminOrdersContent />
        </ShowForBookManagement>
    );
}