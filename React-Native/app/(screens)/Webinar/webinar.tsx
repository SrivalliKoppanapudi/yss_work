import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import Colors from '../../../constant/Colors';
import { PlusCircle, Search } from 'lucide-react-native';
import WebinarCard from '../../../component/webinar/WebinarCard';
import { useAuth } from '../../../Context/auth';
import { ShowForWebinarCreation } from '../../../component/RoleBasedUI';


const WebinarScreen = () => {
  const router = useRouter();
  const { session, permissionCheck } = useAuth();
  

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allRegistered, setAllRegistered] = useState<any[]>([]);
  const [allRecentlyAdded, setAllRecentlyAdded] = useState<any[]>([]);
  const [allPopular, setAllPopular] = useState<any[]>([]);
  const [filteredRegistered, setFilteredRegistered] = useState<any[]>([]);
  const [filteredRecentlyAdded, setFilteredRecentlyAdded] = useState<any[]>([]);
  const [filteredPopular, setFilteredPopular] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchWebinarsAndRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      let registeredWebinarsData: any[] = [];
      if (session?.user) {
        const { data: registrationData, error: registrationError } = await supabase
          .from('webinar_registrations')
          .select('webinar_id')
          .eq('user_id', session.user.id);

        if (registrationError) throw registrationError;

        const registeredWebinarIds = registrationData.map(reg => reg.webinar_id);
        
        if (registeredWebinarIds.length > 0) {
          const { data: webinars, error: webinarsError } = await supabase
            .from('webinars')
            .select('*')
            .in('id', registeredWebinarIds);
          
          if (webinarsError) throw webinarsError;
          registeredWebinarsData = webinars || [];
        }
      }
      setAllRegistered(registeredWebinarsData);
      setFilteredRegistered(registeredWebinarsData);

      const { data: allWebinars, error: recentError } = await supabase
        .from('webinars')
        .select('*')
        .order('created_at', { ascending: false });

      if (recentError) throw recentError;
      
      const publishedWebinars = allWebinars || [];
      setAllRecentlyAdded(publishedWebinars);
      setFilteredRecentlyAdded(publishedWebinars);
      
      const popularWebinars = publishedWebinars.slice(0, 5).reverse();
      setAllPopular(popularWebinars);
      setFilteredPopular(popularWebinars);

    } catch (error) {
      console.error("Error fetching webinars:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    fetchWebinarsAndRegistrations();
  }, [fetchWebinarsAndRegistrations]);

  useEffect(() => {
    const applySearch = () => {
      if (searchQuery.trim() === '') {
        setFilteredRegistered(allRegistered);
        setFilteredRecentlyAdded(allRecentlyAdded);
        setFilteredPopular(allPopular);
      } else {
        const query = searchQuery.trim().toLowerCase();
        setFilteredRegistered(allRegistered.filter(w => w.title.toLowerCase().includes(query)));
        setFilteredRecentlyAdded(allRecentlyAdded.filter(w => w.title.toLowerCase().includes(query)));
        setFilteredPopular(allPopular.filter(w => w.title.toLowerCase().includes(query)));
      }
    };
    const searchDebounce = setTimeout(applySearch, 300);
    return () => clearTimeout(searchDebounce);
  }, [searchQuery, allRegistered, allRecentlyAdded, allPopular]);

  const onRefresh = () => {
    setRefreshing(true);
    setSearchQuery(''); 
    fetchWebinarsAndRegistrations();
  };

  const renderWebinarSection = (title: string, data: any[]) => {
    if (loading || data.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={data}
          renderItem={({ item }) => (
            <WebinarCard 
              webinar={item} 
              isRegistered={title === "My Registered Webinars"}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.searchAndCreateContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.GRAY} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search webinars..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#888"
            returnKeyType="search"
          />
        </View>
        <ShowForWebinarCreation>
          <TouchableOpacity 
            style={styles.createButton} 
            onPress={() => router.push('/(screens)/Webinar/CreateWebinarScreen')}
          >
            <PlusCircle size={24} color={Colors.PRIMARY} />
          </TouchableOpacity>
        </ShowForWebinarCreation>
      </View>

      {loading && filteredRecentlyAdded.length === 0 ? (
        <ActivityIndicator style={styles.loader} size="large" color={Colors.PRIMARY} />
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>"Expand Your Knowledge, One Webinar at a Time"</Text>
            <Text style={styles.bannerText}>Join our interactive webinars led by industry experts. Learn, engage, and grow with live sessions designed to enhance your professional development.</Text>
            <TouchableOpacity style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>Browse Webinars</Text>
            </TouchableOpacity>
          </View>
          {renderWebinarSection("My Registered Webinars", filteredRegistered)}
          {renderWebinarSection("Recently Added", filteredRecentlyAdded)}
          {renderWebinarSection("Popular Webinars", filteredPopular)}
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
  searchAndCreateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  createButton: {
    padding: 8,
    marginLeft: 12,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  banner: {
    backgroundColor: '#e7f3ff',
    padding: 20,
    margin: 16,
    borderRadius: 12,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginBottom: 8,
  },
  bannerText: {
    fontSize: 14,
    color: Colors.GRAY,
    marginBottom: 16,
    lineHeight: 20,
  },
  bannerButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: Colors.WHITE,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.PRIMARY,
    fontWeight: '600',
  },
  horizontalList: {
    paddingLeft: 16,
  },
});

export default WebinarScreen;