// component/books/BookGridItem.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Book } from '../../types/books';
import Colors from '../../constant/Colors';
import { Star } from 'lucide-react-native';

interface BookGridItemProps {
  book: Book;
}

const BookGridItem: React.FC<BookGridItemProps> = ({ book }) => {
  const router = useRouter();

  // Find the lowest price among available formats
  const lowestPrice = book.formats?.length > 0
    ? Math.min(...book.formats.map(f => f.price))
    : 0;

  const handlePress = () => {
    // Navigate to the details screen, passing the book ID
    router.push({
      pathname: '/(screens)/books/details',
      params: { bookId: book.id },
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <Image source={{ uri: book.cover_image_url || 'https://via.placeholder.com/150' }} style={styles.coverImage} />
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>by {book.author || 'N/A'}</Text>
        <View style={styles.ratingContainer}>
            <Star size={14} color="#f59e0b" fill="#f59e0b" />
            <Text style={styles.ratingText}>4.5</Text>
        </View>
        <Text style={styles.price}>₹{lowestPrice.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '47%', 
    margin: '1.5%',
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  coverImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.BLACK,
    minHeight: 36, // Ensure space for two lines
  },
  author: {
    fontSize: 13,
    color: Colors.GRAY,
    marginTop: 4,
  },
  ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
  },
  ratingText: {
      marginLeft: 4,
      fontSize: 13,
      color: Colors.GRAY,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginTop: 8,
  },
});

export default BookGridItem;