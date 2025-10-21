import React, { useState, useEffect,useMemo}from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  useWindowDimensions,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../lib/Superbase';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constant/Colors';
import { useRouter,} from 'expo-router';
import RNPickerSelect from 'react-native-picker-select';



const filterChips = ['All Events', 'Networking', 'Conference', 'Seminar', 'Webinar'];

export default function Events() {
  const [search, setSearch] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false); // ❌ INVALID

  const [selectedFilter, setSelectedFilter] = useState('All Events');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState(null);
  const [showEventDatePicker, setShowEventDatePicker] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [endTime, setEndTime] = useState(new Date());
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [registrationFee, setRegistrationFee] = useState('199');
  const [eventMode, setEventMode] = useState('Online');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [featured, setFeatured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaName, setMediaName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const { width } = useWindowDimensions();
  const isMobile = width < 900;
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
const router = useRouter()
const [showRegisterModal, setShowRegisterModal] = useState(false);
const [selectedEvent, setSelectedEvent] = useState(null);
const [fullName, setFullName] = useState('');
const [email, setEmail] = useState('');
const [mobile, setMobile] = useState('');
const [designation, setDesignation] = useState('');
const [city, setCity] = useState('');


const [registeredEventIds, setRegisteredEventIds] = useState([]);

const fetchUserRegistrations = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(); // Get logged-in user

  if (userError || !user) {
    console.error('Failed to get user', userError);
    return;
  }

  const { data, error } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('user_id', user.id)
    .eq('status', 'registered'); // Optional: only fetch confirmed registrations

  if (error) {
    console.error('Failed to fetch event registrations', error);
  } else {
    const ids = data.map((reg) => String(reg.event_id));
    setRegisteredEventIds(ids);
  }
};

useEffect(() => {
  fetchUserRegistrations();
}, []);




const validateForm = () => {
  if (!fullName.trim() || !email.trim() || !mobile.trim() || !designation.trim()) {
    Alert.alert('Missing Fields', 'Please fill all the required fields (*)');
    return false;
  }
  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    Alert.alert('Invalid Email', 'Please enter a valid email address.');
    return false;
  }
  // Basic mobile number check (assuming 10 digits)
  if (mobile.length < 10) {
    Alert.alert('Invalid Mobile', 'Please enter a valid mobile number.');
    return false;
  }

  return true;
};


const resetform = () => {
  setFullName('');
  setEmail('');
  setMobile('');
  setDesignation('');
  setCity('');
};


//features venets 
const featuredEventsList = useMemo(() => {
    return events.filter(e => e.featured === true);
  }, [events]);
  
  // Fetch events from Supabase
  const fetchEvents = async () => {
    setLoadingEvents(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });
    if (error) {
      console.log('Error fetching events:', error);
      setEvents([]);
    } else {
      setEvents(data || []);
    }
    setLoadingEvents(false);
  };
  useEffect(() => {
    fetchEvents();
  }, []);

  // Helper: filter for future events
  const now = new Date();
  // Helper to compare only the date part (ignoring time)
  function isSameOrFutureDate(eventDateStr) {
    if (!eventDateStr) return false;
    const eventDate = new Date(eventDateStr);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    return eventDay >= today;
  }


  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (!e.event_date) return false;
      const eventDate = new Date(e.event_date);
      if (selectedDate) {
        return (
          eventDate.getFullYear() === selectedDate.getFullYear() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getDate() === selectedDate.getDate()
        );
      }
      return isSameOrFutureDate(e.event_date);
    });
  }, [events, selectedDate]);
  


  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  // Handle media upload
  async function handleUploadMedia() {
    if (Platform.OS === 'web') {
      Alert.alert('Not supported', 'Media upload is not supported on web.');
      return;
    }
    Alert.alert('Uploading', 'Uploading media, please wait...');
    setMediaUploading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, allowsEditing: false, quality: 1 });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `media_${Date.now()}`;
        // Log asset and URI for debugging
        console.log('ImagePicker asset:', asset);
        console.log('ImagePicker asset.uri:', asset.uri);
        // Read file as base64 and convert to binary
        let binary;
        try {
          const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
          binary = decode(base64);
        } catch (fsErr) {
          Alert.alert('File Error', 'Failed to read the image file.');
          return;
        }
        const { data, error } = await supabase.storage.from('event-media').upload(fileName, binary, { contentType: asset.mimeType || 'application/octet-stream', upsert: true });
        if (error) throw error;
        const { data: publicUrlData } = supabase.storage.from('event-media').getPublicUrl(fileName);
        setMediaUrl(publicUrlData.publicUrl);
        setMediaName(fileName);
        Alert.alert('Success', 'Media uploaded successfully!');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to upload media');
    } finally {
      setMediaUploading(false);
    }
  }

  // Handle attachment upload
  async function handleUploadAttachment() {
    if (Platform.OS === 'web') {
      Alert.alert('Not supported', 'Attachment upload is not supported on web.');
      return;
    }
    Alert.alert('Uploading', 'Uploading attachment, please wait...');
    setAttachmentUploading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.name || `attachment_${Date.now()}`;
        // Log asset and URI for debugging
        console.log('DocumentPicker asset:', asset);
        console.log('DocumentPicker asset.uri:', asset.uri);
        // Read file as base64 and convert to binary
        let binary;
        try {
          const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
          binary = decode(base64);
        } catch (fsErr) {
          Alert.alert('File Error', 'Failed to read the attachment file.');
          return;
        }
        const { data, error } = await supabase.storage.from('event-attachments').upload(fileName, binary, { contentType: asset.mimeType || 'application/octet-stream', upsert: true });
        if (error) throw error;
        const { data: publicUrlData } = supabase.storage.from('event-attachments').getPublicUrl(fileName);
        setAttachmentUrl(publicUrlData.publicUrl);
        setAttachmentName(fileName);
        Alert.alert('Success', 'Attachment uploaded successfully!');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to upload attachment');
    } finally {
      setAttachmentUploading(false);
    }
  }

  async function handleCreateEvent() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('events').insert([
        {
          name: eventName,
          description: eventDesc,
          event_date: eventDate ? eventDate.toISOString() : null,
          start_time: startTime ? startTime.toISOString() : null,
          end_time: endTime ? endTime.toISOString() : null,
          registration_fee: registrationFee,
          event_mode: eventMode,
          location:location?location:'Online',
          category,
          featured,
          media_url: mediaUrl,
          attachment_url: attachmentUrl,
        },
      ]);
      if (error) {
        // Log error and data for debugging
        console.log('Event insert error:', error);
        console.log('Event data:', {
          name: eventName,
          description: eventDesc,
          event_date: eventDate ? eventDate.toISOString() : null,
          start_time: startTime ? startTime.toISOString() : null,
          end_time: endTime ? endTime.toISOString() : null,
          registration_fee: registrationFee,
          event_mode: eventMode,
          location,
          category,
          featured,
          media_url: mediaUrl,
          attachment_url: attachmentUrl,
        });
        // Reminder: Check Supabase RLS policies for the events table and storage buckets
        Alert.alert('Error', error.message || 'Failed to create event');
      } else {
        Alert.alert('Success', 'Event created successfully!');
        setEventName('');
        setEventDesc('');
        setEventDate(null);
        setStartTime(new Date());
        setEndTime(new Date());
        setRegistrationFee('199');
        setEventMode('Online');
        setLocation('');
        setCategory('');
        setFeatured(false);
        setMediaUrl('');
        setMediaName('');
        setAttachmentUrl('');
        setAttachmentName('');
        setShowCreateModal(false);
        fetchEvents(); // Refresh events after creation
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView    style={{ flex: 1 }}>
         <View style={styles.headerContainer}>
                              
                                   <View style={{ flexDirection: "row", alignItems: "center", justifyContent:"center", gap:  20}}>
                                     <View>
                                       <Pressable
                                   onPress={() => router.replace("/Home")}
                                   style={styles.backButton}
                                 >
                                   <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
                                 </Pressable>
                                     </View>
                                 <View><Text style={styles.headerText} >Events
                                    </Text></View>
                                   </View>
               
                                 
               
                                </View> 
                                <ScrollView
  contentContainerStyle={{ flexGrow: 1 }}
  keyboardShouldPersistTaps="handled"
>

    <View style={[styles.pageBg, isMobile && { padding: 0 }] }>
      <View style={[styles.layout, isMobile && styles.layoutMobile]}>
        {/* Main Content */}
        <View style={[styles.mainCol, isMobile && styles.mainColMobile]}>
          <View style={[styles.headerRow, isMobile && styles.headerRowMobile]}>
            <View>
          
              <Text style={styles.pageDesc}>Discover upcoming professional development opportunities</Text>
            </View>
            <View style={[styles.headerActions, isMobile && styles.headerActionsMobile]}>
              <TouchableOpacity style={[styles.headerBtn, isMobile && styles.headerBtnMobile]} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.headerBtnText}>Pick a date</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerBtn, styles.headerBtnPrimary, isMobile && styles.headerBtnMobile]} onPress={() => setShowCreateModal(true)}>
                <Text style={styles.headerBtnPrimaryText}>Create Event</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Date Picker Modal */}
          {showDatePicker && (
            Platform.OS === 'android' ? (
              <DateTimePicker
                value={selectedDate || new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            ) : (
              <Modal
                transparent
                visible={showDatePicker}
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <DateTimePicker
                      value={selectedDate || new Date()}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      style={{ backgroundColor: '#fff' }}
                    />
                    <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.modalCloseBtnText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            )
          )}
          {/* Show selected date */}
          {selectedDate && (
            <View style={styles.selectedDateBox}>
              <Ionicons name="calendar-outline" size={18} color="#1CB5E0" />
              <Text style={styles.selectedDateText}>{selectedDate.toDateString()}</Text>
            </View>
          )}
          {selectedDate && (
  <TouchableOpacity onPress={() => setSelectedDate(null)} style={styles.clearDateBtn}>
    <Text style={styles.clearDateText}>Clear Date</Text>
  </TouchableOpacity>
)}

          {/* Featured Events */}
          <Text style={styles.sectionTitle}>Featured Events</Text>
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
  {featuredEventsList.map(event => (
    <View key={event.id} style={[styles.featuredCard, isMobile && styles.featuredCardMobile]}>


  <Image source={{ uri: event.mediaUrl }} style={styles.featuredImage}
 /> 


      <View style={styles.featuredBadge}>
        <Text style={styles.featuredBadgeText}>{event.category || 'Event'}</Text>
      </View>
      <Text style={styles.featuredTitle}>{event.name}</Text>
      <Text style={styles.featuredDesc} numberOfLines={2}>{event.description}</Text>

      <View style={styles.featuredMetaRow}>
      <Ionicons name={event.event_mode === 'online' ? 'globe-outline' : 'location-outline'} size={16} color="#1CB5E0" />
        <Text style={styles.featuredMeta}>{event.location || 'TBD'}</Text>
      </View>

      <View style={styles.featuredMetaRow}>
        <Ionicons name="calendar-outline" size={16} color="#1CB5E0" />
        <Text style={styles.featuredMeta}>
          {new Date(event.event_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
        </Text>
        <Ionicons name="time-outline" size={16} color="#1CB5E0" style={{ marginLeft: 8 }} />
        <Text style={styles.featuredMeta}>
          {new Date(event.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <View style={styles.featuredMetaRow}>
        <Text style={styles.featuredPrice}>
        {event.registration_fee != 0? `₹ ${event.registration_fee}` : 'Free'}
        </Text>
        <TouchableOpacity
  style={styles.featuredRegisterBtn}
   onPress={() => {
        console.log("Event ID:", event.id);
  console.log("Registered IDs:", registeredEventIds);
  console.log("Is registered:", registeredEventIds.includes(event.id));
  if (registeredEventIds.includes(event.id)) {
    Alert.alert('Already Registered', 'You have already registered for this event.');
    return;
  } else {
    setSelectedEvent(event);
    setShowRegisterModal(true);
  }
}}
>
  {/* <Text style={styles.featuredRegisterBtnText}>Register Now</Text> */}
  {registeredEventIds.includes(event.id) ? (
  <View >
    <Text style={{ color: 'green' }}>Registered</Text>
  </View>
) : (
  <TouchableOpacity
  
   onPress={() => {
      console.log("Event ID:", event.id);
  console.log("Registered IDs:", registeredEventIds);
  console.log("Is registered:", registeredEventIds.includes(event.id));
  if (registeredEventIds.includes(event.id)) {
    Alert.alert('Already Registered', 'You have already registered for this event.');
    return;
  } else {
    setSelectedEvent(event);
    setShowRegisterModal(true);
  }
}}

  >
    <Text style={{ color: '#007bff' }}>Register Now</Text>
  </TouchableOpacity>
)}

</TouchableOpacity>

      </View>
    </View>
  ))}
</ScrollView>

          {/* Upcoming Events */}
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <View style={[styles.upcomingBar, isMobile && styles.upcomingBarMobile]}>
            <View style={[styles.searchBar, isMobile && styles.searchBarMobile]}>
              <Ionicons name="search-outline" size={18} color="#888" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="search Forums and discussion"
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#aaa"
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterChipsRow, isMobile && styles.filterChipsRowMobile]}>
              {filterChips.map(chip => (
                <TouchableOpacity
                  key={chip}
                  style={[styles.filterChip, selectedFilter === chip && styles.filterChipActive, isMobile && styles.filterChipMobile]}
                  onPress={() => setSelectedFilter(chip)}
                >
                  <Text style={[styles.filterChipText, selectedFilter === chip && styles.filterChipTextActive]}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {/* Event Cards Grid */}
          {loadingEvents ? (
            <Text style={{ textAlign: 'center', color: '#1CB5E0', marginVertical: 48, fontSize: 18, fontWeight: 'bold' }}>
              Loading events...
            </Text>
          ) : (
            <View style={[styles.eventsGrid, isMobile && styles.eventsGridMobile]}>
              {filteredEvents
                .filter(e => !selectedFilter || selectedFilter === 'All Events' || e.category === selectedFilter)
                .filter(e => (e.title || e.name || '').toLowerCase().includes(search.toLowerCase()))
                .length === 0 ? (
                  <Text style={{ textAlign: 'center', color: '#b00', marginVertical: 48, fontSize: 18, fontWeight: 'bold' }}>
                    No upcoming events found.
                  </Text>
                ) : (
                  filteredEvents
                    .filter(e => !selectedFilter || selectedFilter === 'All Events' || e.category === selectedFilter)
                    .filter(e => (e.title || e.name || '').toLowerCase().includes(search.toLowerCase()))
                    .map(event => (
                      <View key={event.id} style={[styles.eventCard, isMobile && styles.eventCardMobile]}>
                        <View style={styles.eventBadge}><Text style={styles.eventBadgeText}>{event.type || event.category}</Text></View>
                        <Image source={{ uri: event.image || event.media_url }} style={styles.eventImage} />
                        <Text style={styles.eventTitle}>{event.title || event.name}</Text>
                        <Text style={styles.eventDesc}>{event.desc || event.description}</Text>
                        <View style={styles.eventMetaRow}>
                          <Ionicons name="calendar-outline" size={14} color="#1CB5E0" />
                          <Text style={styles.eventMeta}>{event.event_date ? new Date(event.event_date).toDateString() : ''}</Text>
                          <Ionicons name="time-outline" size={14} color="#1CB5E0" style={{ marginLeft: 8 }} />
                          <Text style={styles.eventMeta}>{event.start_time ? new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
                        </View>
                        <View style={styles.eventMetaRow}>
                          <Ionicons name={event.event_mode === 'Online' ? 'globe-outline' : 'location-outline'} size={14} color="#1CB5E0" />
                          <Text style={styles.eventMeta}>{event.location}</Text>
                        </View>
                        <View style={styles.eventMetaRow}>
                          <Text style={styles.eventPrice}>{event.registration_fee}</Text>
                          <TouchableOpacity
  style={styles.featuredRegisterBtn}
 onPress={() => {
        console.log("Event ID:", event.id);
  console.log("Registered IDs:", registeredEventIds);
  console.log("Is registered:", registeredEventIds.includes(event.id));
  if (registeredEventIds.includes(event.id)) {
    Alert.alert('Already Registered', 'You have already registered for this event.');
    return;
  } else {
    setSelectedEvent(event);
    setShowRegisterModal(true);
  }
}}


>
  {/* <Text style={styles.featuredRegisterBtnText}>Register Now</Text> */}

  {registeredEventIds.includes(event.id) ? (
  <View>
    <Text style={{ color: 'green' }}>Registered</Text>
  </View>
) : (
  <TouchableOpacity
    
   

  >
    <Text style={{ color: '#007bff' }}>Register Now</Text>
  </TouchableOpacity>
)}

</TouchableOpacity>

                        </View>
                      </View>
                    ))
                )}
            </View>
          )}
        </View>
        {/* Right Widgets */}
        <View style={[styles.rightCol, isMobile && styles.rightColMobile]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarScroll}>
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
              <TouchableOpacity style={styles.trendingGroupBtn}><Text style={styles.trendingGroupText}>Teaching Tools</Text></TouchableOpacity>
              <TouchableOpacity style={styles.trendingGroupBtn}><Text style={styles.trendingGroupText}>Classroom Management</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
      {/* Create Event Modal */}
      {showCreateModal && (
        <Modal
        transparent
        visible={showCreateModal}
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.createModalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%', alignItems: 'center' }}
            keyboardVerticalOffset={60}
          >
            <ScrollView
              contentContainerStyle={[
                styles.createModalContent,
                isMobile && styles.createModalContentMobile,
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableOpacity
                style={styles.createModalCloseBtn}
                onPress={() => setShowCreateModal(false)}
              >
                <Ionicons name="close" size={28} color="#888" />
              </TouchableOpacity>
  
              <Text style={styles.createModalTitle}>Create New Event</Text>
  
              {/* Event Name */}
              <Text style={styles.createLabel}>Event Name</Text>
              <TextInput
                style={styles.createInput}
                placeholder="e.g., Annual education conference"
                value={eventName}
                onChangeText={setEventName}
                placeholderTextColor="#aaa"
              />
              <Text style={styles.createSubLabel}>
                The name of your event as it will appear to attendees
              </Text>
  
              {/* Description */}
              <Text style={styles.createLabel}>Description</Text>
              <TextInput
                style={[styles.createInput, { height: 80 }]}
                placeholder="Discover your event"
                value={eventDesc}
                onChangeText={setEventDesc}
                placeholderTextColor="#aaa"
                multiline
              />
              <Text style={styles.createSubLabel}>
                A brief description of what attendees can expect
              </Text>
  
              {/* Event date, Start Time, End Time */}
              <View style={styles.createRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.createLabel}>Event date</Text>
                  <TouchableOpacity
                    style={styles.createDateBtn}
                    onPress={() => setShowEventDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={18} color="#1CB5E0" />
                    <Text style={styles.createDateBtnText}>
                      {eventDate
                        ? eventDate.toDateString()
                        : 'Pick a Date'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.createLabel}>Start Time</Text>
                  <TouchableOpacity
                    style={styles.createTimeBtn}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Ionicons name="time-outline" size={18} color="#1CB5E0" />
                    <Text style={styles.createDateBtnText}>
                      {startTime
                        ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Start Time'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.createLabel}>End Time</Text>
                  <TouchableOpacity
                    style={styles.createTimeBtn}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Ionicons name="time-outline" size={18} color="#1CB5E0" />
                    <Text style={styles.createDateBtnText}>
                      {endTime
                        ? endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'End Time'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
  
              {/* Pickers */}
              {showEventDatePicker && (
                <DateTimePicker
                  value={eventDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'android' ? 'default' : 'spinner'}
                  onChange={(e, date) => {
                    setShowEventDatePicker(false);
                    if (date) setEventDate(date);
                  }}
                />
              )}
              {showStartTimePicker && (
                <DateTimePicker
                  value={startTime || new Date()}
                  mode="time"
                  display={Platform.OS === 'android' ? 'default' : 'spinner'}
                  onChange={(e, date) => {
                    setShowStartTimePicker(false);
                    if (date) setStartTime(date);
                  }}
                />
              )}
              {showEndTimePicker && (
                <DateTimePicker
                  value={endTime || new Date()}
                  mode="time"
                  display={Platform.OS === 'android' ? 'default' : 'spinner'}
                  onChange={(e, date) => {
                    setShowEndTimePicker(false);
                    if (date) setEndTime(date);
                  }}
                />
              )}
  
              {/* Registration fee */}
              <Text style={styles.createLabel}>Registration fee</Text>
              <TextInput
                style={styles.createInput}
                placeholder="₹ Registration fee"
                value={registrationFee}
                onChangeText={setRegistrationFee}
                keyboardType="numeric"
                placeholderTextColor="#aaa"
              />
  
              {/* Event mode */}
              <Text style={styles.createLabel}>Event mode</Text>
              <View style={styles.createRow}>
                <TouchableOpacity
                  style={[styles.createRadio, eventMode === 'Online' && styles.createRadioActive]}
                  onPress={() => setEventMode('Online')}
                >
                  <Text
                    style={[styles.createRadioText, eventMode === 'Online' && styles.createRadioTextActive]}
                  >
                    Online
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.createRadio, eventMode === 'Offline' && styles.createRadioActive]}
                  onPress={() => setEventMode('Offline')}
                >
                  <Text
                    style={[styles.createRadioText, eventMode === 'Offline' && styles.createRadioTextActive]}
                  >
                    Offline
                  </Text>
                </TouchableOpacity>
              </View>
  
              {/* Location */}
              <Text style={styles.createLabel}>Location</Text>
              <TextInput
                style={styles.createInput}
                placeholder={eventMode === 'Online' ? 'Online' : 'Physical location'}
                value={location}
                onChangeText={setLocation}
                placeholderTextColor="#aaa"
              />
              <Text style={styles.createSubLabel}>
                Physical location or "Online" for virtual events
              </Text>
  
              {/* Category */}
              <Text style={styles.createLabel}>Category</Text>
              <View style={{ marginBottom: 12 }}>
  <RNPickerSelect
    onValueChange={(value) => setCategory(value)}
    value={category}
    placeholder={{ label: 'Select category', value: null }}
    items={[
      { label: 'Seminar', value: 'Seminar' },
      { label: 'Conference', value: 'Conference' },
      { label: 'Webinar', value: 'Webinar' },
      { label: 'Networking', value: 'Networking' },
    ]}
    style={{
      inputIOS: {
        height: 50,
        borderRadius: 8,
        paddingHorizontal: 14,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ccc',
        color: '#222',
        backgroundColor: '#fff',
        width:100,
      },
      inputAndroid: {
        height: 50,
        borderRadius: 8,
        paddingHorizontal: 14,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ccc',
        color: '#222',
        backgroundColor: '#fff',
        width:200,
      },
      placeholder: {
        color: '#aaa',
      },
      iconContainer: {
        top: 18,
        right: 12,
      },
    }}
    useNativeAndroidPickerStyle={false}
    Icon={() => {
      return <Ionicons name="chevron-down" size={20} color="#888" />;
    }}
  />
</View>

  
              {/* Add resources */}
              <Text style={[styles.createLabel, isMobile && styles.createLabelMobile]}>
                Add resources
              </Text>
              <View style={styles.createRow}>
                <TouchableOpacity
                  style={styles.createResourceBtn}
                  onPress={handleUploadMedia}
                  disabled={mediaUploading}
                >
                  <Ionicons name="cloud-upload-outline" size={18} color="#1CB5E0" />
                  <Text style={styles.createResourceBtnText}>
                    {mediaUploading ? 'Uploading...' : 'Upload media'}
                  </Text>
                </TouchableOpacity>
                {mediaName ? (
                  <Text style={styles.selectedFileText}>{mediaName}</Text>
                ) : null}
                <TouchableOpacity
                  style={styles.createResourceBtn}
                  onPress={handleUploadAttachment}
                  disabled={attachmentUploading}
                >
                  <Ionicons name="attach-outline" size={18} color="#1CB5E0" />
                  <Text style={styles.createResourceBtnText}>
                    {attachmentUploading ? 'Uploading...' : 'Attachments'}
                  </Text>
                </TouchableOpacity>
                {attachmentName ? (
                  <Text style={styles.selectedFileText}>{attachmentName}</Text>
                ) : null}
              </View>
  
              {/* Featured */}
              <Text style={styles.createLabel}>Featured Events</Text>
              <View style={styles.createRow}>
                <TouchableOpacity
                  style={styles.createCheckbox}
                  onPress={() => setFeatured(!featured)}
                >
                  {featured && (
                    <Ionicons name="checkmark" size={18} color="#1CB5E0" />
                  )}
                </TouchableOpacity>
                <Text style={styles.createCheckboxLabel}>
                  This event will be displayed in the featured section at the top of the Events page.
                </Text>
              </View>
  
              {/* Buttons */}
              <View style={styles.createRowBtns}>
                <TouchableOpacity
                  style={styles.createEventBtn}
                  onPress={handleCreateEvent}
                  disabled={loading}
                >
                  <Text style={styles.createEventBtnText}>
                    {loading ? 'Creating...' : 'Create Event'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.createCancelBtn}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.createCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      )}
    </View>
    </ScrollView>
    {/* register event modal 1
     */}
    <Modal
  visible={showRegisterModal}
  transparent
  animationType="slide"
  onRequestClose={() => setShowRegisterModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => {setShowRegisterModal(false); resetform();}}>
          <Ionicons name="close-outline" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Registration form for the Events</Text>
      </View>

      <View style={styles.modalBody}>
        <Text>Full name</Text>
<TextInput
  placeholder="Full Name *"
  style={styles.modalInput}
  value={fullName}
  onChangeText={setFullName}
/>
<Text>Email</Text>
<TextInput
  placeholder="Email ID *"
  keyboardType="email-address"
  style={styles.modalInput}
  value={email}
  onChangeText={setEmail}
/>
<Text>Mobile</Text>
<TextInput
  placeholder="Mobile No *"
  keyboardType="phone-pad"
  style={styles.modalInput}
  value={mobile}
  onChangeText={setMobile}
/>
<Text>Designation/Role</Text>
<TextInput
  placeholder="Designation/Role *"
  style={styles.modalInput}
  value={designation}
  onChangeText={setDesignation}
/>
<Text>City</Text>
<TextInput
  placeholder="City"
  style={styles.modalInput}
  value={city}
  onChangeText={setCity}
/>

      </View>

      <TouchableOpacity
  style={styles.modalButton}
   onPress={() => {
    if (validateForm()) {
      setShowRegisterModal(false);
      router.push({
        pathname: '/(screens)/EventCheckoutScreen',
        params: {
          eventId: selectedEvent.id,
          eventTitle: selectedEvent.name,
          amount: selectedEvent.registration_fee,
          currency: 'INR',
          fullName,
          email,
          mobile,
          designation,
          city,
        },
      });
    }
    
  }
  
  }
>
  <Text style={styles.modalButtonText}>Next</Text>
</TouchableOpacity>

    </View>
  </View>
</Modal>

<Modal
  visible={showPaymentModal}
  transparent
  animationType="fade"
  onRequestClose={() => setShowPaymentModal(false)}
>
  <View style={styles.paymentOverlay}>
    <View style={styles.paymentContainer}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.paymentTitle}>Payment Process</Text>
        <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
          <Ionicons name="close-outline" size={28} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.paymentContent}>
        {/* Summary */}
        <View style={styles.paymentSummary}>
          <Text style={styles.sectionLabel}>Event Summary</Text>
          <Text style={styles.paymentItem}>
            {selectedEvent?.name} <Text style={{ fontWeight: 'bold' }}>₹{selectedEvent?.registration_fee}</Text>
          </Text>
          <Text style={styles.paymentItem}>Platform Fee <Text style={{ fontWeight: 'bold' }}>₹0</Text></Text>
          <Text style={styles.paymentItem}>GST <Text style={{ fontWeight: 'bold' }}>₹50</Text></Text>
          <Text style={[styles.paymentItem, { fontWeight: 'bold', marginTop: 10 }]}>
            Total ₹
            {selectedEvent?.registration_fee?.toLowerCase() === 'free' || selectedEvent?.registration_fee === '0'
              ? '0'
              : parseInt(selectedEvent?.registration_fee || 0) + 50}
          </Text>
        </View>

        {/* Payment Options */}
        <View style={styles.paymentOptions}>
          <Text style={styles.sectionLabel}>Payment</Text>

          {selectedEvent?.registration_fee?.toLowerCase() === 'free' || selectedEvent?.registration_fee === '0' ? (
            <>
              <Text style={styles.paymentSubLabel}>This event is free. No payment required.</Text>
              <TouchableOpacity
                style={styles.stripeButton}
                onPress={() => {
                  Alert.alert('Registered', 'You have successfully registered!');
                  setShowPaymentModal(false);
                }}
              >
                <Text style={styles.stripeButtonText}>Verify & Proceed</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.paymentSubLabel}>Pay using Stripe</Text>
              <TouchableOpacity
                style={styles.stripeButton}
                onPress={() => {
                  // You can implement actual Stripe checkout here
                  router.replace('/(screens)/CheckoutScreen')
                  Alert.alert('Stripe', 'Proceeding to Stripe checkout');
                  setShowPaymentModal(false);
                }}
              >
                <Text style={styles.stripeButtonText}>Proceed with Stripe</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  </View>
</Modal>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pageBg: {
    flex: 1,
    backgroundColor: '#f6f6e9',
    paddingTop: 5,
    paddingHorizontal: 0,
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 1600,
    alignSelf: 'center',
    paddingTop: 24,
    paddingBottom: 24,
  },
  layoutMobile: {
    flexDirection: 'column',
    paddingTop: 0,
    paddingBottom: 0,
    maxWidth: '100%',
  },
  mainCol: {
    flex: 2.5,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 36,
    marginRight: 32,
    minHeight: 700,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  mainColMobile: {
    width: '100%',
    padding: 12,
    marginRight: 0,
    borderRadius: 0,
    minHeight: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerRowMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionsMobile: {
    marginTop: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
  headerBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: '#1CB5E0',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  headerBtnMobile: {
    flex: 1,
    paddingHorizontal: 0,
    marginRight: 0,
    minWidth: 0,
  },
  headerBtnText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  headerBtnPrimary: {
    backgroundColor: '#1CB5E0',
    borderColor: '#1CB5E0',
  },
  headerBtnPrimaryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  pageTitle: {
    fontWeight: 'bold',
    fontSize: 28,
    color: '#222',
    marginBottom: 2,
  },
  pageDesc: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
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
    borderRadius: 12,
    padding: 18,
    width: 340,
    marginRight: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  featuredCardMobile: {
    width: 260,
    padding: 10,
    marginRight: 10,
  },
  featuredImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  featuredBadge: {
    position: 'absolute',
    top: 18,
    left: 18,
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
  featuredRegisterBtn: {
    borderWidth: 1,
    borderColor: '#1CB5E0',
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 18,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  featuredRegisterBtnText: {
    
    fontWeight: 'bold',
    fontSize: 14,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  searchFilterRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#eee',
    flex: 1,
    marginRight: 8,
  },
  searchBarMobile: {
    marginRight: 0,
    marginBottom: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    paddingVertical: 2,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1CB5E0',
    marginRight: 8,
  },
  filterChipMobile: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
  },
  filterChipActive: {
    backgroundColor: '#b3e6fa',
    borderColor: '#1CB5E0',
  },
  filterChipText: {
    color: '#1CB5E0',
    fontSize: 14,
  },
  filterChipTextActive: {
    color: '#222',
    fontWeight: 'bold',
  },
  eventsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    marginTop: 0,
    marginBottom: 18,
    minHeight: 120,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    width: '100%',
  },
  eventsGridMobile: {
    flexDirection: 'column',
    gap: 12,
    minHeight: 120,
    marginTop: 0,
    marginBottom: 12,
    width: '100%',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    width: 320,
    marginRight: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  eventCardMobile: {
    width: '100%',
    marginRight: 0,
    marginBottom: 10,
    padding: 10,
  },
  eventBadge: {
    position: 'absolute',
    top: 18,
    left: 18,
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
  eventImage: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
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
  eventRegisterBtn: {
    borderWidth: 1,
    borderColor: '#1CB5E0',
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 18,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  eventRegisterBtnText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rightCol: {
    width: 320,
    backgroundColor: '#f7fafc',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 700,
  },
  rightColMobile: {
    width: '100%',
    padding: 10,
    borderRadius: 0,
    minHeight: 0,
    elevation: 0,
    shadowOpacity: 0,
    marginTop: 0,
  },
  sidebarScroll: {
    paddingBottom: 24,
  },
  widget: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  trendingGroupBtn: {
    backgroundColor: '#e6f7fa',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  trendingGroupText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 13,
  },
  upcomingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
    marginTop: 8,
  },
  upcomingBarMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  filterChipsRowMobile: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: 320,
  },
  modalCloseBtn: {
    marginTop: 16,
    backgroundColor: '#1CB5E0',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  modalCloseBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  selectedDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f7fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginTop: 2,
  },
  selectedDateText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  createModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  createModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    width: 520,
    maxWidth: '95%',
    alignItems: 'flex-start',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  createModalContentMobile: {
    width: '98%',
    padding: 12,
    borderRadius: 8,
  },
  createModalCloseBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 2,
    padding: 4,
  },
  createModalTitle: {
    fontWeight: 'bold',
    fontSize: 22,
    marginBottom: 16,
    color: Colors.PRIMARY,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  createInput: {
    width: 266,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#222',
    marginBottom: 12,
    backgroundColor: '#fafbfc',
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    width: '100%',
  },
  createDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fafbfc',
    marginRight: 8,
    flex: 1,
    width: 110,
  },
  createTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fafbfc',
    marginRight: 8,
    flex: 1,
    maxWidth: 150,
  },
  createDateBtnText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  createRadio: {
    borderWidth: 1,
    borderColor: '#1CB5E0',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  createRadioActive: {
    backgroundColor: '#b3e6fa',
    borderColor: '#1CB5E0',
  },
  createRadioText: {
    color: '#1CB5E0',
    fontSize: 15,
  },
  createRadioTextActive: {
    color: '#222',
    fontWeight: 'bold',
  },
  createResourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1CB5E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  createResourceBtnText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  createCheckbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: '#1CB5E0',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  createCheckboxLabel: {
    color: '#666',
    fontSize: 13,
    flex: 1,
  },
  createRowBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    width: '100%',
    justifyContent: 'flex-end',
  },
  createEventBtn: {
    backgroundColor: '#1CB5E0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  createEventBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  createCancelBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1CB5E0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  createCancelBtnText: {
    color: '#1CB5E0',
    fontWeight: 'bold',
    fontSize: 16,
  },
  createLabel: {
    fontWeight: 'bold',
    fontSize: 20,// Increased from 16
    color: '#222',
    marginBottom: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
    minWidth: 120,
    maxWidth: '95%',
  },
  createLabelMobile: {
    fontSize: 23, // Increased from 17
    marginTop: 12,
    marginBottom: 6,
    minWidth: 120,
    maxWidth: '98%',
  },
  createSubLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    marginTop: -4,
    alignSelf: 'flex-start',
  },
  selectedFileText: {
    fontSize: 13,
    color: '#1CB5E0',
    marginLeft: 6,
    marginRight: 6,
    alignSelf: 'center',
  },
  headerText: {
        fontSize: 25,
        fontWeight: "bold",
        
        color: Colors.PRIMARY,
       
      },
      backButton: {
      flexDirection: "row",
      alignItems: "center",
    },
     headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: Colors.WHITE,
      elevation: 2,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    
    },
    
      modalContainer: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
      },
      modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
      },
      modalTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
      },
      modalBody: {
        gap: 12,
        marginBottom: 16,
      },
      modalInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        padding: 10,
      },
      modalButton: {
        backgroundColor: '#1CB5E0',
        paddingVertical: 12,
        borderRadius: 6,
      },
      modalButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
      },
      paymentOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      paymentContainer: {
        backgroundColor: '#fff',
        width: '90%',
        borderRadius: 12,
        padding: 16,
      },
      paymentTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
      },
     
      paymentContent: {
        flexDirection: 'row',
        marginTop: 16,
      },
      paymentSummary: {
        flex: 1,
        paddingRight: 12,
        borderRightWidth: 1,
        borderRightColor: '#ccc',
      },
      paymentOptions: {
        flex: 1,
        paddingLeft: 12,
      },
      sectionLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
      },
      paymentItem: {
        fontSize: 14,
        marginBottom: 4,
      },
      paymentSubLabel: {
        fontSize: 13,
        marginBottom: 12,
        color: '#666',
      },
      stripeButton: {
        backgroundColor: '#635bff',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 6,
        marginTop: 20,
      },
      stripeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
      },
      clearDateBtn: {
  alignSelf: 'flex-start',
  backgroundColor: '#e0e0e0',
  paddingVertical: 4,
  paddingHorizontal: 8,
  borderRadius: 6,
  marginTop: 6,
  marginBottom: 12,
},

clearDateText: {
  color: '#333',
  fontSize: 14,
},

      
});