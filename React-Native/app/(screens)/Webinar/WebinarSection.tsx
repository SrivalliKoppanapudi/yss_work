import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import WebinarCard from './WebinarCard';

export default function WebinarSection({ title, data, type, showViewAll, onRegister }: { title: string, data: any[], type: string, showViewAll?: boolean, onRegister?: (webinarId: string) => void }) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {showViewAll && <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>}
      </View>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <WebinarCard webinar={item} type={type} onRegister={onRegister} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAll: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
}); 