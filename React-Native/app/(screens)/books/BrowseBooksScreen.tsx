import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { supabase } from '../../../lib/Superbase';
import { Book } from '../../../types/books';
import BookGridItem from '../../../component/books/BookGridItem';
import Colors from '../../../constant/Colors';
import { Search } from 'lucide-react-native';

export default function BrowseBooksScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State to manage the active filter: 'all', 'physical', or 'ebook'
  const [activeFilter, setActiveFilter] = useState<'all' | 'physical' | 'ebook'>('all');

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    
    // Use !inner join to ensure we only get books that have at least one format
    let query = supabase
      .from('books')
      .select(`
        *,
        formats:book_formats!inner (
          id,
          format,
          price
        )
      `);
    
    // Apply search filter if query exists
    if (searchQuery.trim()) {
        query = query.ilike('title', `%${searchQuery.trim()}%`);
    }

    // Apply the format filter based on the active state
    if (activeFilter === 'physical') {
      query = query.in('formats.format', ['hardcover', 'paperback']);
    } else if (activeFilter === 'ebook') {
      query = query.eq('formats.format', 'ebook');
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(30);

    if (error) {
      console.error("Error fetching books:", error);
    } else {
      // Filter out duplicates that might come from the join
      const uniqueBooks = Array.from(new Map(data.map(book => [book.id, book])).values());
      setBooks(uniqueBooks as Book[] || []);
    }
    setLoading(false);
    setRefreshing(false);
  }, [searchQuery, activeFilter]); // Re-run fetchBooks when searchQuery or activeFilter changes

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]); // useEffect now depends on the memoized fetchBooks

  const onRefresh = () => {
      setRefreshing(true);
      fetchBooks();
  };

  const handleSearchSubmit = () => {
    fetchBooks();
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.GRAY} style={styles.searchIcon} />
        <TextInput
          placeholder="Search by title..."
          style={styles.searchInput}
          placeholderTextColor={Colors.GRAY}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
      </View>

      {/* NEW: Filter Tabs UI */}
      <View style={styles.filterTabsContainer}>
          <TouchableOpacity
              style={[styles.filterTab, activeFilter === 'all' && styles.activeFilterTab]}
              onPress={() => setActiveFilter('all')}
          >
              <Text style={[styles.filterTabText, activeFilter === 'all' && styles.activeFilterTabText]}>All Books</Text>
          </TouchableOpacity>
          <TouchableOpacity
              style={[styles.filterTab, activeFilter === 'physical' && styles.activeFilterTab]}
              onPress={() => setActiveFilter('physical')}
          >
              <Text style={[styles.filterTabText, activeFilter === 'physical' && styles.activeFilterTabText]}>Physical Books</Text>
          </TouchableOpacity>
          <TouchableOpacity
              style={[styles.filterTab, activeFilter === 'ebook' && styles.activeFilterTab]}
              onPress={() => setActiveFilter('ebook')}
          >
              <Text style={[styles.filterTabText, activeFilter === 'ebook' && styles.activeFilterTabText]}>E-Books</Text>
          </TouchableOpacity>
      </View>
      
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.centered} />
      ) : (
        <FlatList
          data={books}
          renderItem={({ item }) => <BookGridItem book={item} />}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>No books found for this filter.</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: Colors.BLACK
  },
  // --- NEW STYLES for filter tabs ---
  filterTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20
  },
  activeFilterTab: {
    backgroundColor: Colors.PRIMARY_LIGHT
  },
  filterTabText: {
    fontSize: 14,
    color: Colors.GRAY,
    fontWeight: '500'
  },
  activeFilterTabText: {
    color: Colors.PRIMARY,
    fontWeight: 'bold'
  },
  // --- END NEW STYLES ---
  listContainer: {
    paddingHorizontal: 8
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    margin: 16,
    marginBottom: 8,
    color: Colors.BLACK
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: Colors.GRAY
  }
});