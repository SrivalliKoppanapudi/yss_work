
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const featuredEvents = [
  {
    id: 1,
    title: 'Annual Education conference',
    desc: 'Join educators from around the country for our biggest event of the year',
    location: 'Bangalore Convention Center, India',
    date: 'April 12, 2025',
    time: '10:00 AM - 10:30 AM',
    price: '₹ 199',
    type: 'Conference',
    image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2',
    attendees: 199,
    isOnline: false,
  },
  {
    id: 2,
    title: 'Technology in Education Workshop',
    desc: 'Learn how to integrate the latest technologies into your classroom',
    location: 'Online',
    date: 'April 12, 2025',
    time: '10:00 AM - 10:30 AM',
    price: 'Free',
    type: 'Webinar',
    image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308',
    attendees: 120,
    isOnline: true,
  },
];

const upcomingEvents = [
  {
    id: 3,
    title: 'Annual Education conference',
    desc: 'Join educators from around the country for our biggest event of the year',
    location: 'Bangalore Convention Center, India',
    date: 'April 12, 2025',
    time: '10:00 AM - 10:30 AM',
    price: '₹ 199',
    type: 'Conference',
    image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2',
    attendees: 1078,
    isOnline: false,
  },
  {
    id: 4,
    title: 'Annual Education conference',
    desc: 'Join educators from around the country for our biggest event of the year',
    location: 'Bangalore Convention Center, India',
    date: 'April 12, 2025',
    time: '10:00 AM - 10:30 AM',
    price: 'Free',
    type: 'Seminar',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6',
    attendees: 2773,
    isOnline: false,
  },
  {
    id: 5,
    title: 'Annual Education conference',
    desc: 'Join educators from around the country for our biggest event of the year',
    location: 'Bangalore Convention Center, India',
    date: 'April 12, 2025',
    time: '10:00 AM - 10:30 AM',
    price: '₹ 199',
    type: 'Conference',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    attendees: 1733,
    isOnline: false,
  },
];

const filterChips = ['All Events', 'Networking', 'Conferences', 'Seminar', 'Webinars'];

export default function Events() {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All Events');

  const filteredEvents = selectedFilter === 'All Events'
    ? upcomingEvents
    : upcomingEvents.filter(e => e.type === selectedFilter);

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <ScrollView style={styles.mainContent}>
        {/* Header */}
        <Text style={styles.pageTitle}>Events</Text>
        <Text style={styles.pageDesc}>Discover upcoming professional development opportunities</Text>
        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>Pick a date</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.createBtn]}><Text style={styles.createBtnText}>Create Event</Text></TouchableOpacity>
        </View>
        {/* Featured Events */}
        <Text style={styles.sectionTitle}>Featured Events</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
          {featuredEvents.map(event => (
            <View key={event.id} style={styles.featuredCard}>
              <Image source={{ uri: event.image }} style={styles.featuredImage} />
              <View style={styles.featuredBadge}><Text style={styles.featuredBadgeText}>{event.type}</Text></View>
              <Text style={styles.featuredTitle}>{event.title}</Text>
              <Text style={styles.featuredDesc}>{event.desc}</Text>
              <View style={styles.featuredMetaRow}>
                <Ionicons name={event.isOnline ? 'globe-outline' : 'location-outline'} size={16} color="#1CB5E0" />
                <Text style={styles.featuredMeta}>{event.location}</Text>
              </View>
              <View style={styles.featuredMetaRow}>
                <Ionicons name="calendar-outline" size={16} color="#1CB5E0" />
                <Text style={styles.featuredMeta}>{event.date}</Text>
                <Ionicons name="time-outline" size={16} color="#1CB5E0" style={{ marginLeft: 8 }} />
                <Text style={styles.featuredMeta}>{event.time}</Text>
              </View>
              <View style={styles.featuredMetaRow}>
                <Text style={styles.featuredPrice}>{event.price}</Text>
                <TouchableOpacity style={styles.registerBtn}><Text style={styles.registerBtnText}>Register Now</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
        {/* Upcoming Events */}
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <View style={styles.searchFilterContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#888" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="search forums and discussion"
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={styles.filterChipsContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.filterChipsRow}
              contentContainerStyle={styles.filterChipsContent}
            >
              {filterChips.map(chip => (
                <TouchableOpacity
                  key={chip}
                  style={[styles.filterChip, selectedFilter === chip && styles.filterChipActive]}
                  onPress={() => setSelectedFilter(chip)}
                >
                  <Text style={[styles.filterChipText, selectedFilter === chip && styles.filterChipTextActive]}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
        {/* Event Cards Grid */}
        <View style={styles.eventsGrid}>
          {filteredEvents
            .filter(e => e.title.toLowerCase().includes(search.toLowerCase()))
            .map(event => (
              <View key={event.id} style={styles.eventCard}>
                <Image source={{ uri: event.image }} style={styles.eventImage} />
                <View style={styles.eventBadge}><Text style={styles.eventBadgeText}>{event.type}</Text></View>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDesc}>{event.desc}</Text>
                <View style={styles.eventMetaRow}>
                  <Ionicons name="calendar-outline" size={14} color="#1CB5E0" />
                  <Text style={styles.eventMeta}>{event.date}</Text>
                  <Ionicons name="time-outline" size={14} color="#1CB5E0" style={{ marginLeft: 8 }} />
                  <Text style={styles.eventMeta}>{event.time}</Text>
                </View>
                <View style={styles.eventMetaRow}>
                  <Ionicons name={event.isOnline ? 'globe-outline' : 'location-outline'} size={14} color="#1CB5E0" />
                  <Text style={styles.eventMeta}>{event.location}</Text>
                </View>
                <View style={styles.eventMetaRow}>
                  <Text style={styles.eventPrice}>{event.price}</Text>
                  <TouchableOpacity style={styles.registerBtn}><Text style={styles.registerBtnText}>Register Now</Text></TouchableOpacity>
                </View>
              </View>
            ))}
        </View>
      </ScrollView>
      {/* Sidebar Widgets (mocked) */}
      <View style={styles.sidebar}>
        <View style={styles.widget}>
          <Text style={styles.widgetTitle}>Today's News</Text>
          <Text style={styles.widgetNews}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam egestas orci ut lectus.</Text>
        </View>
        <View style={styles.widget}>
          <Text style={styles.widgetTitle}>Suggested for you</Text>
          <Text style={styles.widgetSubTitle}>People</Text>
          <Text style={styles.widgetItem}>Profile Name</Text>
          <Text style={styles.widgetItem}>Profile Name</Text>
          <Text style={styles.widgetSubTitle}>Community</Text>
          <Text style={styles.widgetItem}>Designers</Text>
          <Text style={styles.widgetItem}>Designers</Text>
        </View>
        <View style={styles.widget}>
          <Text style={styles.widgetTitle}>Trending Groups</Text>
          <Text style={styles.widgetItem}>Teaching Tools</Text>
          <Text style={styles.widgetItem}>Classroom Management</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
  },
  mainContent: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    minHeight: 600,
  },
  pageTitle: {
    fontWeight: 'bold',
    fontSize: 24,
    color: '#222',
    marginBottom: 2,
  },
  pageDesc: {
    fontSize: 15,
    color: '#666',
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  actionBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#1CB5E0',
    marginRight: 8,
  },
  actionBtnText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  createBtn: {
    backgroundColor: '#1CB5E0',
    borderColor: '#1CB5E0',
  },
  createBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginVertical: 10,
    color: '#222',
  },
  featuredScroll: {
    marginBottom: 18,
  },
  featuredCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    width: 320,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  featuredBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#1CB5E0',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 2,
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuredTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
    color: '#222',
  },
  featuredDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  featuredMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 4,
  },
  featuredMeta: {
    fontSize: 13,
    color: '#1CB5E0',
    marginLeft: 4,
  },
  featuredPrice: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
    marginRight: 12,
  },
  registerBtn: {
    backgroundColor: '#1CB5E0',
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 16,
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  registerBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  searchFilterContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    paddingVertical: 0,
  },
  filterChipsContainer: {
    height: 50,
  },
  filterChipsRow: {
    flexDirection: 'row',
  },
  filterChipsContent: {
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  filterChip: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#1CB5E0',
    borderColor: '#1CB5E0',
  },
  filterChipText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  eventsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 18,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    width: 260,
    marginRight: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
  },
  eventBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#1CB5E0',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 2,
  },
  eventBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
    color: '#222',
  },
  eventDesc: {
    fontSize: 13,
    color: '#444',
    marginBottom: 4,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 4,
  },
  eventMeta: {
    fontSize: 12,
    color: '#1CB5E0',
    marginLeft: 4,
  },
  eventPrice: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#222',
    marginRight: 12,
  },
  sidebar: {
    width: 280,
    padding: 16,
    backgroundColor: '#f7fafc',
    borderLeftWidth: 1,
    borderColor: '#eee',
  },
  widget: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  widgetTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
    color: '#222',
  },
  widgetSubTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 8,
    color: '#1CB5E0',
  },
  widgetItem: {
    fontSize: 13,
    color: '#444',
    marginBottom: 2,
  },
  widgetNews: {
    fontSize: 13,
    color: '#666',
  },
}); 