import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import Colors from '../../../constant/Colors';
import { ArrowLeft, BookOpen, ShoppingCart, Presentation, FileText, Calendar, Clock, MapPin, IndianRupee, User, Download } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DetailRow = ({ label, value }: { label: string, value: string | number | undefined }) => {
    if (!value) return null;
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    );
};

const PaymentDetailsScreen = () => {
    const router = useRouter();
    const { id, type } = useLocalSearchParams<{ id: string, type: 'Course' | 'Book Order' | 'Workshop' }>();
    
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchDetails = useCallback(async () => {
        if (!id || !type) {
            Alert.alert("Error", "Missing payment details.");
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            let data, error;
            if (type === 'Course') {
                ({ data, error } = await supabase.from('courses').select('*').eq('id', id).single());
            } else if (type === 'Book Order') {
                ({ data, error } = await supabase.from('orders').select('*, order_items(*, book_formats(*, books(*)))').eq('id', id).single());
            } else if (type === 'Workshop') {
                ({ data, error } = await supabase.from('workshops').select('*').eq('id', id).single());
            }

            if (error) throw error;
            setDetails(data);
        } catch (err: any) {
            Alert.alert("Error", `Could not load details: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [id, type]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const renderDetails = () => {
        if (!details) return <Text>No details found.</Text>;

        switch (type) {
            case 'Course':
                return (
                    <>
                        <Text style={styles.sectionTitle}>Course Enrollment</Text>
                        <DetailRow label="Course" value={details.title} />
                        <DetailRow label="Price" value={`₹${details.price?.toFixed(2)}`} />
                        <DetailRow label="Instructor" value={details.instructor} />
                    </>
                );
            case 'Book Order':
                return (
                    <>
                        <Text style={styles.sectionTitle}>Book Order Details</Text>
                        <DetailRow label="Order Number" value={details.order_number} />
                        <DetailRow label="Total Amount" value={`₹${details.total_amount?.toFixed(2)}`} />
                        <Text style={styles.subTitle}>Items:</Text>
                        {details.order_items?.map((item: any, index: number) => (
                           <Text key={index} style={styles.listItem}>- {item.quantity}x {item.book_formats?.books?.title || 'Book'}</Text>
                        ))}
                    </>
                );
            case 'Workshop':
                return (
                    <>
                        <Text style={styles.sectionTitle}>Workshop Registration</Text>
                        <DetailRow label="Workshop" value={details.title} />
                        <DetailRow label="Facilitator" value={details.facilitator_name} />
                        <DetailRow label="Mode" value={details.mode} />
                        <DetailRow label="Price" value={`₹${details.price?.toFixed(2)}`} />
                    </>
                );
            default:
                return <Text>Unknown transaction type.</Text>;
        }
    };
    
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.BLACK} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment Details</Text>
                <View style={{width: 24}}/>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.centered} />
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.card}>
                        {renderDetails()}
                    </View>
                    <TouchableOpacity style={styles.invoiceButton}>
                        <Download size={18} color={Colors.PRIMARY} />
                        <Text style={styles.invoiceButtonText}>Download Invoice</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
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
        backgroundColor: Colors.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: Colors.PRIMARY,
    },
    subTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 8,
    },
    listItem: {
        fontSize: 15,
        color: Colors.GRAY,
        marginBottom: 4,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    detailLabel: {
        fontSize: 15,
        color: Colors.GRAY,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '500',
        maxWidth: '60%',
        textAlign: 'right',
    },
    invoiceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: Colors.PRIMARY,
    },
    invoiceButtonText: {
        color: Colors.PRIMARY,
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default PaymentDetailsScreen;