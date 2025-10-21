import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '../../lib/Superbase';
import { useAuth } from '../../Context/auth';
import Colors from '../../constant/Colors';
import { ShoppingCart, BookOpen, Presentation } from 'lucide-react-native';

// A unified type for displaying any transaction
interface HistoryItem {
  id: string; // This will be the actual ID from the respective table
  type: 'Course' | 'Book Order' | 'Workshop';
  title: string;
  date: string;
  amount: number;
}

const PaymentHistory = () => {
    const { session } = useAuth();
    const router = useRouter(); // Initialize router
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = useCallback(async () => {
        if (!session?.user?.id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            // --- THIS IS THE FIX ---
            // 1. Fetch paid course enrollments using the correct column name 'enrolled_at'
            const { data: courseData, error: courseError } = await supabase
                .from('course_enrollments')
                .select('enrolled_at, courses!inner(id, title, price)') // Changed 'created_at' to 'enrolled_at'
                .eq('user_id', session.user.id)
                .eq('courses.is_paid', true);
            
            if (courseError) throw courseError;

            const courseHistory: HistoryItem[] = (courseData || []).map((item: any) => ({
                id: item.courses.id,
                type: 'Course',
                title: item.courses.title,
                amount: item.courses.price,
                date: item.enrolled_at, // Also changed here from 'created_at'
            }));
            // --- END OF FIX ---

            // 2. Fetch book orders (this part is already correct)
            const { data: bookData, error: bookError } = await supabase
                .from('orders')
                .select('id, created_at, order_number, total_amount')
                .eq('user_id', session.user.id);
            
            if (bookError) throw bookError;

            const bookHistory: HistoryItem[] = (bookData || []).map((item: any) => ({
                id: item.id,
                type: 'Book Order',
                title: `Order #${item.order_number}`,
                amount: item.total_amount,
                date: item.created_at,
            }));

            // 3. Fetch confirmed workshop registrations (this part is also correct)
            const { data: workshopData, error: workshopError } = await supabase
                .from('workshop_registrations')
                .select('id, registered_at, workshops!inner(id, title, price)')
                .eq('user_id', session.user.id)
                .eq('status', 'confirmed');

            if (workshopError) throw workshopError;

            const workshopHistory: HistoryItem[] = (workshopData || []).map((item: any) => ({
                id: item.workshops.id,
                type: 'Workshop',
                title: item.workshops.title,
                amount: item.workshops.price,
                date: item.registered_at,
            }));

            // 4. Combine and sort all transactions by date
            const combinedHistory = [...courseHistory, ...bookHistory, ...workshopHistory];
            combinedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setHistory(combinedHistory);

        } catch (error: any) {
            console.error("Error fetching payment history:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [session]);

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [fetchHistory])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    }

    const handleItemPress = (item: HistoryItem) => {
        router.push({
            pathname: '/(screens)/profile/PaymentDetailsScreen',
            params: { id: item.id, type: item.type }
        });
    };

    const renderIcon = (type: HistoryItem['type']) => {
        if (type === 'Course') return <BookOpen size={24} color={Colors.PRIMARY} />;
        if (type === 'Book Order') return <ShoppingCart size={24} color={'#22c55e'} />;
        if (type === 'Workshop') return <Presentation size={24} color={'#8b5cf6'} />;
        return null;
    };
    
    const renderItem = ({ item }: { item: HistoryItem }) => (
        <TouchableOpacity style={styles.itemContainer} onPress={() => handleItemPress(item)}>
            <View style={styles.iconContainer}>{renderIcon(item.type)}</View>
            <View style={styles.itemDetails}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.itemType}>{item.type}</Text>
                <Text style={styles.itemDate}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.itemAmount}>₹{item.amount.toFixed(2)}</Text>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return <ActivityIndicator style={styles.centered} size="large" color={Colors.PRIMARY} />;
    }

    return (
        <FlatList
            data={history}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.container}
            ListEmptyComponent={
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>No payment history found.</Text>
                </View>
            }
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F7F7F7',
        paddingVertical: 16,
        minHeight: '100%',
    },
    centered: {
        flex: 1,
        minHeight: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: Colors.GRAY,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f0f2f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemDetails: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.BLACK,
    },
    itemType: {
        fontSize: 13,
        color: Colors.GRAY,
        marginTop: 2,
    },
    itemDate: {
        fontSize: 12,
        color: Colors.GRAY,
        marginTop: 4,
    },
    itemAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
});

export default PaymentHistory;