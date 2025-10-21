import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, SafeAreaView, Pressable, Linking
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'; 
import { supabase } from '../../../lib/Superbase';
import { Book, BookFormat } from '../../../types/books';
import Colors from '../../../constant/Colors';
import { useAuth } from '../../../Context/auth';
import { ArrowLeft, ShoppingCart, Download, BookOpen } from 'lucide-react-native';

const DetailRow: React.FC<{ label: string; value: string | number | null | undefined }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
};

export default function BookDetailsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  
  const [book, setBook] = useState<Book | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<BookFormat | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isDownloadingSample, setIsDownloadingSample] = useState(false);
  
  const [cartItemCount, setCartItemCount] = useState(0);

  const fetchCartCount = useCallback(async () => {
    if (!session?.user) {
      setCartItemCount(0);
      return;
    }
    
    const { count, error } = await supabase
      .from('cart_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.user.id);

    if (error) {
      console.error("Error fetching cart count:", error);
    } else {
      setCartItemCount(count || 0);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      fetchCartCount();
    }, [fetchCartCount])
  );

  const fetchBookDetails = useCallback(async () => {
    if (!bookId) {
      Alert.alert("Error", "No book ID provided.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase
      .from('books')
      .select('*, formats:book_formats(*)')
      .eq('id', bookId)
      .single();

    if (error) {
      console.error("Error fetching book details:", error);
      Alert.alert("Error", "Could not load book details.");
    } else if (data) {
      const typedData = data as any;
      const bookWithFormats: Book = {
        ...typedData,
        formats: typedData.formats || []
      };
      setBook(bookWithFormats);
      if (bookWithFormats.formats && bookWithFormats.formats.length > 0) {
        setSelectedFormat(bookWithFormats.formats[0]);
      }
    }
    setLoading(false);
  }, [bookId]);

  useEffect(() => {
    fetchBookDetails();
  }, [fetchBookDetails]);

  const handleAddToCart = async () => {
    if (!session?.user) {
        router.push('/auth/SignIn');
        return;
    }
    if (!selectedFormat) {
        Alert.alert("Select Format", "Please choose a book format.");
        return;
    }
    
    setIsAddingToCart(true);
    try {
        const { data: existingItem, error: checkError } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', session.user.id)
            .eq('book_format_id', selectedFormat.id)
            .single();

        if (checkError && checkError.code !== 'PGRST116') throw checkError;

        if (existingItem) {
            await supabase.from('cart_items').update({ quantity: existingItem.quantity + 1 }).eq('id', existingItem.id);
        } else {
            await supabase.from('cart_items').insert({ user_id: session.user.id, book_format_id: selectedFormat.id, quantity: 1 });
        }
        Alert.alert("Success", "Added to cart!");
        
        await fetchCartCount();

    } catch (error: any) {
        Alert.alert("Error", `Could not add to cart: ${error.message}`);
    } finally {
        setIsAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
     if (!session?.user) {
        router.push('/auth/SignIn');
        return;
    }
    if (!selectedFormat) {
        Alert.alert("Select Format", "Please choose a book format to buy.");
        return;
    }
    router.push('/(screens)/books/checkout');
  }

  const handleDownloadSample = async () => {
    if (!selectedFormat?.sample_file_url) {
        Alert.alert("No Sample", "A sample is not available for this book format.");
        return;
    }

    setIsDownloadingSample(true);
    try {
        const { data, error } = await supabase
            .storage
            .from('ebook-files')
            .createSignedUrl(selectedFormat.sample_file_url, 60);

        if (error) throw error;
        
        const supported = await Linking.canOpenURL(data.signedUrl);
        if (supported) {
            await Linking.openURL(data.signedUrl);
        } else {
            Alert.alert("Error", "Cannot open file. Your device may not support this action.");
        }
    } catch (error: any) {
        console.error("Error downloading sample:", error);
        Alert.alert("Download Failed", "Could not retrieve the sample file.");
    } finally {
        setIsDownloadingSample(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.centered} />;
  }

  if (!book) {
    return (
        <SafeAreaView style={styles.centered}>
            <Text>Book not found.</Text>
            <TouchableOpacity onPress={() => router.back()} style={{marginTop: 20}}>
                <Text style={{color: Colors.PRIMARY}}>Go Back</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={24} color={Colors.BLACK} />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>{book.title}</Text>
            
            {/* --- MODIFIED: Cart Icon with Badge --- */}
            <Pressable onPress={() => router.push('/(screens)/books/cart')} style={styles.cartIconContainer}>
                 <ShoppingCart size={24} color={Colors.BLACK} />
                 {cartItemCount > 0 && (
                    <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                    </View>
                 )}
            </Pressable>
        </View>
        <ScrollView>
            <View style={styles.imageContainer}>
                <Image source={{ uri: book.cover_image_url || undefined }} style={styles.coverImage} />
            </View>

            <View style={styles.detailsContainer}>
                <Text style={styles.title}>{book.title}</Text>
                <Text style={styles.author}>by {book.author || "Unknown Author"}</Text>

                <View style={styles.formatSelector}>
                    {book.formats?.map(format => (
                        <TouchableOpacity 
                            key={format.id} 
                            style={[styles.formatChip, selectedFormat?.id === format.id && styles.formatChipSelected]}
                            onPress={() => setSelectedFormat(format)}
                        >
                            <Text style={[styles.formatChipText, selectedFormat?.id === format.id && styles.formatChipTextSelected]}>
                                {format.format.charAt(0).toUpperCase() + format.format.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                
                {selectedFormat && (
                    <Text style={styles.price}>₹ {selectedFormat.price.toFixed(2)}</Text>
                )}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.cartButton} onPress={handleAddToCart} disabled={isAddingToCart}>
                        {isAddingToCart ? <ActivityIndicator color={Colors.PRIMARY}/> : <Text style={styles.cartButtonText}>Add To Cart</Text>}
                    </TouchableOpacity>
                </View>
                
                {selectedFormat?.format === 'ebook' && selectedFormat.sample_file_url && (
                    <TouchableOpacity 
                        style={styles.sampleButton} 
                        onPress={handleDownloadSample} 
                        disabled={isDownloadingSample}
                    >
                        {isDownloadingSample ? (
                            <ActivityIndicator color={Colors.PRIMARY} />
                        ) : (
                            <>
                                <Download size={20} color={Colors.PRIMARY} />
                                <Text style={styles.sampleButtonText}>Download Sample</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>{book.description}</Text>
                </View>
                
                {selectedFormat && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Characteristics</Text>
                        <DetailRow label="Language" value={book.language} />
                        <DetailRow label="Pages" value={selectedFormat.pages} />
                        <DetailRow label="Format" value={selectedFormat.format} />
                    </View>
                )}
                
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Publisher</Text>
                    <DetailRow label="Publisher" value={book.publisher} />
                    <DetailRow label="Year of Publication" value={book.year_of_publication} />
                </View>
            </View>
        </ScrollView>
    </SafeAreaView>
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
        padding: 20,
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
        fontSize: 18,
        fontWeight: '600',
    },
    cartIconContainer: {
        position: 'relative',
        padding: 4,
    },
    cartBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: Colors.ERROR,
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.WHITE,
    },
    cartBadgeText: {
        color: Colors.WHITE,
        fontSize: 12,
        fontWeight: 'bold',
    },
    imageContainer: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    coverImage: {
        width: 220,
        height: 330,
        resizeMode: 'contain',
        borderRadius: 8,
    },
    detailsContainer: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    author: {
        fontSize: 16,
        color: Colors.GRAY,
        marginBottom: 12,
    },
    price: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        marginBottom: 16,
    },
    formatSelector: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 10,
    },
    formatChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.GRAY,
    },
    formatChipSelected: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    formatChipText: {
        color: Colors.GRAY,
    },
    formatChipTextSelected: {
        color: Colors.WHITE,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    cartButton: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
    },
    cartButtonText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 16,
    },
    buyButton: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        backgroundColor: Colors.PRIMARY,
        alignItems: 'center',
    },
    buyButtonText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 16,
    },
    section: {
        marginBottom: 20,
        marginTop: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 8,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
    },
    specRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    specLabel: {
        fontSize: 15,
        color: Colors.GRAY,
    },
    specValue: {
        fontSize: 15,
        fontWeight: '500',
    },
    sampleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
        marginTop: 10,
    },
    sampleButtonText: {
        marginLeft: 8,
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 16,
    },
});