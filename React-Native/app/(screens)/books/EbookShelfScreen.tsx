// app/(screens)/books/EbookShelfScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import { useAuth } from '../../../Context/auth';
import Colors from '../../../constant/Colors';
import { BookOpen } from 'lucide-react-native';

interface Ebook {
  id: string;
  title: string | null;
  author: string | null;
  cover_image_url: string | null;
  ebook_file_url: string | null;
  table_of_contents?: { title: string; page: number }[] | null;
}

const EbookCard: React.FC<{ book: Ebook; onRead: (ebook: Ebook) => void; }> = ({ book, onRead }) => (
    <View style={styles.card}>
      <Image source={{ uri: book.cover_image_url || 'https://via.placeholder.com/150' }} style={styles.coverImage} />
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>by {book.author || 'N/A'}</Text>
        <TouchableOpacity style={styles.readButton} onPress={() => onRead(book)}>
          <BookOpen size={16} color={Colors.WHITE} />
          <Text style={styles.readButtonText}>Read Now</Text>
        </TouchableOpacity>
      </View>
    </View>
);

export default function EbookShelfScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEbooks = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          order_items (
            book_formats!inner (
              ebook_file_url,
              format,
              books!inner (id, title, author, cover_image_url, table_of_contents)
            )
          )
        `)
        .eq('user_id', session.user.id)
        .eq('order_items.book_formats.format', 'ebook');

      if (error) throw error;
      
      const userEbooks: Ebook[] = (data || [])
        .flatMap(order => order.order_items || [])
        .map(item => {
            const formatData = Array.isArray(item.book_formats) ? item.book_formats[0] : item.book_formats;
            if (!formatData) return null;

            const bookData = Array.isArray(formatData.books) ? formatData.books[0] : formatData.books;
            if (!bookData) return null;

            return {
                id: bookData.id,
                title: bookData.title,
                author: bookData.author,
                cover_image_url: bookData.cover_image_url,
                ebook_file_url: formatData.ebook_file_url,
                table_of_contents: bookData.table_of_contents,
            };
        })
        // FIX: Replaced the type predicate with a simple Boolean filter.
        // This achieves the same goal of removing nulls without the type error.
        .filter(Boolean);
      
      const uniqueEbooks = Array.from(new Map(userEbooks.map(book => [book.id, book])).values());
      setEbooks(uniqueEbooks);

    } catch (err: any) {
      console.error("Error fetching e-books:", err);
      Alert.alert("Error", "Could not load your e-book shelf.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useFocusEffect(useCallback(() => { fetchEbooks(); }, [fetchEbooks]));

  const handleReadBook = (book: Ebook) => {
    if (book.ebook_file_url) {
        router.push({ 
            pathname: '/(screens)/books/reader', 
            params: { 
                fileUrl: book.ebook_file_url,
                title: book.title || 'E-book',
                tableOfContents: book.table_of_contents ? JSON.stringify(book.table_of_contents) : '[]'
            } 
        });
    } else {
        Alert.alert("Error", "E-book file not available.");
    }
  };

  if (loading && !refreshing) {
    return <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.centered} />;
  }

  return (
    <View style={styles.container}>
      {ebooks.length === 0 ? (
        <View style={styles.centered}>
            <Text style={styles.emptyText}>Your e-book shelf is empty.</Text>
            <Text style={styles.emptySubtext}>Purchased e-books will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={ebooks}
          renderItem={({ item }) => <EbookCard book={item} onRead={handleReadBook} />}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchEbooks} />}
        />
      )}
    </View>
  );
}

// Styles are unchanged
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  listContainer: { padding: 8 },
  card: { flex: 1, margin: 8, backgroundColor: Colors.WHITE, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  coverImage: { width: '100%', height: 180, borderTopLeftRadius: 8, borderTopRightRadius: 8, resizeMode: 'cover', backgroundColor: '#eee' },
  infoContainer: { padding: 12 },
  title: { fontSize: 15, fontWeight: '600', color: Colors.BLACK, minHeight: 36 },
  author: { fontSize: 13, color: Colors.GRAY, marginTop: 4, marginBottom: 8 },
  readButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.PRIMARY, paddingVertical: 10, borderRadius: 6, marginTop: 4 },
  readButtonText: { color: Colors.WHITE, fontSize: 14, fontWeight: 'bold', marginLeft: 6 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: Colors.GRAY },
  emptySubtext: { fontSize: 14, color: Colors.GRAY, marginTop: 8, textAlign: 'center' },
});