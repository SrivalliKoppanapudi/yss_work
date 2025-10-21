// app/(screens)/books/cart.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, Pressable, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import { useAuth } from '../../../Context/auth';
import Colors from '../../../constant/Colors';
import { ArrowLeft, Trash2, Plus, Minus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CartScreen() {
    const router = useRouter();
    const { session } = useAuth();
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCartItems = useCallback(async () => {
        if (!session?.user) {
            setCartItems([]);
            setLoading(false);
            return;
        }
        
        setLoading(true);
        const { data, error } = await supabase
            .from('cart_items')
            .select(`
                id, 
                quantity,
                book_formats (
                    id, 
                    format, 
                    price,
                    books ( id, title, author, cover_image_url )
                )
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching cart items:", error);
            Alert.alert("Error", "Could not load your cart.");
            setCartItems([]);
        } else {
            const validItems = (data || []).filter(item => {
                const formatData = Array.isArray(item.book_formats) ? item.book_formats[0] : item.book_formats;
                const bookData = formatData ? (Array.isArray(formatData.books) ? formatData.books[0] : formatData.books) : null;
                return formatData && bookData;
            });
            setCartItems(validItems);
        }
        setLoading(false);
    }, [session]);

    useFocusEffect(
        useCallback(() => {
            fetchCartItems();
        }, [fetchCartItems])
    );
    
    const handleUpdateQuantity = async (cartItemId: number, currentQuantity: number, delta: number) => {
        const newQuantity = currentQuantity + delta;

        if (newQuantity <= 0) {
            handleRemoveItem(cartItemId, true); // Pass true to skip confirmation
            return;
        }

        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id === cartItemId ? { ...item, quantity: newQuantity } : item
            )
        );

        const { error } = await supabase
            .from('cart_items')
            .update({ quantity: newQuantity })
            .eq('id', cartItemId);

        if (error) {
            Alert.alert("Error", "Could not update quantity. " + error.message);
            setCartItems(prevItems =>
                prevItems.map(item =>
                    item.id === cartItemId ? { ...item, quantity: currentQuantity } : item
                )
            );
        }
    };

    const handleRemoveItem = async (cartItemId: number, skipConfirm = false) => {
        const removeItem = async () => {
            const { error } = await supabase
                .from('cart_items')
                .delete()
                .eq('id', cartItemId);

            if (error) {
                Alert.alert("Error", "Could not remove item. " + error.message);
            } else {
                setCartItems(prevItems => prevItems.filter(item => item.id !== cartItemId));
            }
        };

        if (skipConfirm) {
            removeItem();
        } else {
            Alert.alert(
                "Remove Item",
                "Are you sure you want to remove this item from your cart?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Remove", style: "destructive", onPress: removeItem }
                ]
            );
        }
    };

    const subtotal = cartItems.reduce((sum, item) => {
        const formatData = Array.isArray(item.book_formats) ? item.book_formats[0] : item.book_formats;
        return sum + (formatData?.price || 0) * item.quantity;
    }, 0);

    const renderCartItem = ({ item }: { item: any }) => {
        const formatDetails = Array.isArray(item.book_formats) ? item.book_formats[0] : item.book_formats;
        const bookDetails = formatDetails ? (Array.isArray(formatDetails.books) ? formatDetails.books[0] : formatDetails.books) : null;

        if (!formatDetails || !bookDetails) return null;

        const isPhysicalBook = formatDetails.format === 'hardcover' || formatDetails.format === 'paperback';

        return (
            <View style={styles.itemContainer}>
                <Image source={{ uri: bookDetails.cover_image_url || 'https://via.placeholder.com/100' }} style={styles.itemImage} />
                <View style={styles.itemDetails}>
                    <Text style={styles.itemTitle} numberOfLines={2}>{bookDetails.title}</Text>
                    <Text style={styles.itemAuthor}>by {bookDetails.author || 'N/A'}</Text>
                    <Text style={styles.itemFormat}>{formatDetails.format.charAt(0).toUpperCase() + formatDetails.format.slice(1)}</Text>
                    <Text style={styles.itemPrice}>₹{formatDetails.price.toFixed(2)}</Text>
                </View>
                <View style={styles.itemActions}>
                    {isPhysicalBook ? (
                        <View style={styles.quantitySelector}>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                            >
                                <Minus size={16} color={Colors.PRIMARY} />
                            </TouchableOpacity>
                            <Text style={styles.itemQuantityText}>{item.quantity}</Text>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                            >
                                <Plus size={16} color={Colors.PRIMARY} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Text style={styles.ebookQuantityText}>Qty: 1</Text>
                    )}
                    <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.deleteButton}>
                        <Trash2 size={20} color={Colors.ERROR} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading) {
        return <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.centered} />;
    }

    if (!session?.user) {
        return (
            <View style={styles.centered}>
                <Text style={styles.infoText}>Please log in to view your cart.</Text>
                <TouchableOpacity onPress={() => router.push('/auth/SignIn')} style={styles.loginButton}>
                    <Text style={styles.loginButtonText}>Log In</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.BLACK} />
                </Pressable>
                <Text style={styles.headerTitle}>Shopping Cart</Text>
                <View style={{ width: 28 }} />
            </View>

            <FlatList
                data={cartItems}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={styles.infoText}>Your cart is empty.</Text>
                    </View>
                }
            />

            {cartItems.length > 0 && (
                <View style={styles.footer}>
                    <View style={styles.subtotalRow}>
                        <Text style={styles.subtotalLabel}>Subtotal</Text>
                        <Text style={styles.subtotalValue}>₹{subtotal.toFixed(2)}</Text>
                    </View>
                <TouchableOpacity 
                    style={styles.checkoutButton} 
                    onPress={() => router.push({
                        pathname: '/(screens)/books/checkout',
                    })}
                >
                    <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    backButton: {
        padding: 4
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '600'
    },
    listContainer: {
        padding: 16
    },
    itemContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    itemImage: {
        width: 80,
        height: 110,
        borderRadius: 4,
        marginRight: 12,
        backgroundColor: '#eee'
    },
    itemDetails: {
        flex: 1,
        justifyContent: 'space-between'
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    itemAuthor: {
        fontSize: 14,
        color: Colors.GRAY
    },
    itemFormat: {
        fontSize: 13,
        color: Colors.GRAY,
        fontStyle: 'italic'
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.PRIMARY
    },
    itemActions: {
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 8
    },
    quantitySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 6
    },
    quantityButton: {
        paddingHorizontal: 10,
        paddingVertical: 8
    },
    itemQuantityText: {
        fontSize: 16,
        fontWeight: '500',
        minWidth: 30,
        textAlign: 'center'
    },
    ebookQuantityText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.GRAY,
        height: 36, // Match height of quantitySelector for alignment
        textAlignVertical: 'center'
    },
    deleteButton: {
        padding: 8
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: Colors.WHITE
    },
    subtotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16
    },
    subtotalLabel: {
        fontSize: 18,
        color: Colors.GRAY
    },
    subtotalValue: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    checkoutButton: {
        backgroundColor: Colors.PRIMARY,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center'
    },
    checkoutButtonText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: 'bold'
    },
    infoText: {
        fontSize: 16,
        color: Colors.GRAY
    },
    loginButton: {
        marginTop: 20,
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8
    },
    loginButtonText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: '600'
    }
});