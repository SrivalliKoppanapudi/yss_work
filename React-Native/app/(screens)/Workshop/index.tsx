import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import Colors from '../../../constant/Colors';
import { PlusCircle, Search } from 'lucide-react-native';
import WorkshopCard from '../../../component/Workshop/WorkshopCard';
import { useAuth } from '../../../Context/auth';
import { ShowForWorkshopCreation } from '../../../component/RoleBasedUI';

const WorkshopListScreen = () => {
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

  const fetchWorkshopsAndRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      let registeredWorkshopsData: any[] = [];
      if (session?.user) {
        const { data: registrationData, error: registrationError } = await supabase
          .from('workshop_registrations')
          .select('workshop_id')
          .eq('user_id', session.user.id)
          .eq('status', 'confirmed');

        if (registrationError) throw registrationError;

        const registeredWorkshopIds = registrationData.map(reg => reg.workshop_id);
        
        if (registeredWorkshopIds.length > 0) {
          const { data: workshops, error: workshopsError } = await supabase
            .from('workshops')
            .select('*')
            .in('id', registeredWorkshopIds);
          
          if (workshopsError) throw workshopsError;
          registeredWorkshopsData = workshops || [];
        }
      }
      setAllRegistered(registeredWorkshopsData);
      setFilteredRegistered(registeredWorkshopsData);

      const { data: allWorkshops, error: recentError } = await supabase
        .from('workshops')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (recentError) throw recentError;
      
      const publishedWorkshops = allWorkshops || [];
      setAllRecentlyAdded(publishedWorkshops);
      setFilteredRecentlyAdded(publishedWorkshops);
      
      const popularWorkshops = publishedWorkshops.slice(0, 5).reverse();
      setAllPopular(popularWorkshops);
      setFilteredPopular(popularWorkshops);

    } catch (error) {
      console.error("Error fetching workshops:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    fetchWorkshopsAndRegistrations();
  }, [fetchWorkshopsAndRegistrations]);

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
    fetchWorkshopsAndRegistrations();
  };

  const renderWorkshopSection = (title: string, data: any[]) => {
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
                <WorkshopCard 
                    workshop={item} 
                    isRegistered={title === "My Registered Workshops"}
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
                  placeholder="Search workshops..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#888"
                  returnKeyType="search"
              />
          </View>
          <ShowForWorkshopCreation>
            <TouchableOpacity 
              style={styles.createButton} 
              onPress={() => router.push('/Workshop/CreateWorkshopScreen')}
            >
              <PlusCircle size={24} color={Colors.PRIMARY} />
            </TouchableOpacity>
          </ShowForWorkshopCreation>
      </View>

      {loading && filteredRecentlyAdded.length === 0 ? (
        <ActivityIndicator style={styles.loader} size="large" color={Colors.PRIMARY} />
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.banner}>
              <Text style={styles.bannerTitle}>"Your Professional Growth, One Session at a Time"</Text>
              <Text style={styles.bannerText}>Our one-to-one workshops are designed for teachers who want personalized attention, honest feedback, and targeted guidance — without distractions or one-size-fits-all content.</Text>
              <TouchableOpacity style={styles.bannerButton}>
                  <Text style={styles.bannerButtonText}>Book Your Session</Text>
              </TouchableOpacity>
          </View>
          {renderWorkshopSection("My Registered Workshops", filteredRegistered)}
          {renderWorkshopSection("Recently Added", filteredRecentlyAdded)}
          {renderWorkshopSection("Popular Workshops", filteredPopular)}
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
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
        marginBottom: 16,
    },
    tab: {
        paddingVertical: 12,
        marginRight: 20,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: Colors.PRIMARY,
    },
    tabText: {
        fontSize: 16,
        color: Colors.GRAY,
        fontWeight: '600',
    },
    activeTabText: {
        color: Colors.PRIMARY,
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

export default WorkshopListScreen;