

// components/LikedPages.tsx
import React,{useState,useRef} from 'react';
import { View, Text, Image, StyleSheet, ScrollView,Animated,Dimensions } from 'react-native';
import Colors from '../../constant/Colors';

type Page = {
  id: string;
  page_name: string;
  icon_url: string;
};

type Props = {
  pages: Page[];
};

const screenWidth = Dimensions.get('window').width;

const testPages = Array.from({ length: 20 }, (_, i) => ({
  id: i.toString(),
  page_name: `Page ${i + 1}`,
  icon_url: 'https://via.placeholder.com/60',
}));

export default function LikedPages({ pages }: Props) {
  /* return (
    <View style={styles.container}>
      <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 20, fontFamily: 'System', color: '#222' }}>Pages You Like</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        {pages.map((page) => (
          <View key={page.id} style={styles.item}>
            <Image source={{ uri: page.icon_url }} style={styles.icon} />
            <Text>{page.page_name}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  ); */
  const scrollX = useRef(new Animated.Value(0)).current;
  const [contentWidth, setContentWidth] = useState(screenWidth);

  const indicatorWidth = screenWidth * (screenWidth / contentWidth);
  const translateX = scrollX.interpolate({
    inputRange: [0, contentWidth - screenWidth],
    outputRange: [0, screenWidth - indicatorWidth],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pages You Like</Text>

      <Animated.ScrollView
        horizontal
         contentContainerStyle={{
    minWidth: Dimensions.get('window').width + 100, // force scroll
    paddingRight: 10,
  }}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onContentSizeChange={(w) => setContentWidth(w)}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
      >
        {pages.map((page) => (
          <View key={page.id} style={styles.item}>
            <Image source={{ uri: page.icon_url }} style={styles.icon} />
            <Text>{page.page_name}</Text>
          </View>
        ))}
      </Animated.ScrollView>

      {contentWidth > screenWidth && (
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.indicator,
              { width: indicatorWidth, transform: [{ translateX }] },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 10,
  },
  header: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 20,
    color: '#222',
  },
  item: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 10,
    
    
    justifyContent: 'center',
    
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginBottom: 4,
  },
  pageText: {
    fontSize: 12,
  },
  track: {
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  indicator: {
    height: 4,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 2,
  },
});