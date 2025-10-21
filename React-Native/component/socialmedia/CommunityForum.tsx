import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Platform,
  ToastAndroid,
  Alert,
  FlatList,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CommunityForm from './CommunityForm';
import { supabase } from '../../lib/Superbase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '../../constant/Colors';

export default function CommunityForum() {
  const [search, setSearch] = useState('');
  const [showCommunityForm, setShowCommunityForm] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [filteredCommunities, setFilteredCommunities] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
const router=useRouter()
  const fetchCommunities = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('communities').select('*').order('id', { ascending: false });
    if (!error) {
      setCommunities(data || []);
      setFilteredCommunities(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  // Search functionality
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredCommunities(communities);
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchTerm = search.toLowerCase().trim();
    
    // Filter communities based on search term
    const filtered = communities.filter(community => 
      community.name?.toLowerCase().includes(searchTerm) ||
      community.desc?.toLowerCase().includes(searchTerm) ||
      (Array.isArray(community.topics) && community.topics.some(topic => 
        topic?.toLowerCase().includes(searchTerm)
      ))
    );
    
    setFilteredCommunities(filtered);

    // Generate search suggestions
    const suggestions = communities
      .filter(community => 
        community.name?.toLowerCase().includes(searchTerm) ||
        community.desc?.toLowerCase().includes(searchTerm)
      )
      .slice(0, 5) // Limit to 5 suggestions
      .map(community => ({
        id: community.id,
        name: community.name,
        desc: community.desc,
        type: community.name?.toLowerCase().includes(searchTerm) ? 'title' : 'description'
      }));

    setSearchSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  }, [search, communities]);

  const handleSuggestionPress = (suggestion) => {
    setSearch(suggestion.name);
    setShowSuggestions(false);
  };

  const handleSearchFocus = () => {
    if (searchSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleSearchBlur = () => {
    // Delay hiding suggestions to allow for touch events
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleCommunityCreated = () => {
    setShowCommunityForm(false);
    fetchCommunities();
    setShowSuccess(true); // Show overlay
    setTimeout(() => setShowSuccess(false), 2000); // Hide after 2 seconds
  };

  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Ionicons 
        name={item.type === 'title' ? 'people-outline' : 'document-text-outline'} 
        size={16} 
        color="#666" 
      />
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionTitle}>{item.name}</Text>
        <Text style={styles.suggestionDesc} numberOfLines={1}>
          {item.desc}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
   <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} >
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
                             <View><Text style={styles.headerText}>Communities
                                </Text></View>
                               </View>
           
                            
           
                            </View> 
     <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Community Forums</Text>
        <Text style={styles.headerDesc}>Connect with educators, share ideas, and participate in discussions</Text>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#888" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Forums and discussion"
              value={search}
              onChangeText={setSearch}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              placeholderTextColor="#aaa"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#888" />
              </TouchableOpacity>
            )}
          </View>
          {showSuggestions && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={searchSuggestions}
                renderItem={renderSuggestionItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.suggestionsList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>
        <View style={styles.createBox}>
          <Text style={styles.createTitle}>Create your own community</Text>
          <Text style={styles.createDesc}>Have a specific topic you'd like to discuss with other educators? Start your own community!</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowCommunityForm(true)}>
            <Text style={styles.createBtnText}>Start a Community</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"


  data={filteredCommunities}
  numColumns={2}
  keyExtractor={(item, index) => item.id.toString() + index}
  contentContainerStyle={styles.groupsGrid}
  columnWrapperStyle={styles.rowWrapper}
  ListHeaderComponent={
    <>
      <Text style={styles.sectionTitle}>
        {search.trim() ? `${filteredCommunities.length}` : 'Popular Groups/Forums'}
      </Text>
    </>
  }
  ListFooterComponent={
    !search.trim() && (
      <>
        <Text style={styles.sectionTitle}>Active Communities</Text>
        <View style={styles.activeCommunities}>
          {/* Render active community cards if needed */}
        </View>
      </>
    )
  }
  ListEmptyComponent={
    search.trim() ? (
      <View style={styles.noResults}>
        <Ionicons name="search-outline" size={48} color="#ccc" />
        <Text style={styles.noResultsText}>No communities found for "{search}"</Text>
        <Text style={styles.noResultsSubtext}>Try searching with different keywords</Text>
      </View>
    ) : null
  }
  renderItem={({ item, index }) => (
    <View style={[styles.groupCard, styles.groupCardMedium]}>
      <Text style={styles.groupName}>{item.name || ''}</Text>
      <View style={styles.groupRow}>
        <Text style={styles.groupLevel}>{item.level || ''}</Text>
        <Text style={styles.groupMembers}>
          {item.members != null ? String(item.members) : '0'} members
        </Text>
      </View>
      <Text style={styles.groupDesc}>{item.desc || ''}</Text>
      <View style={styles.groupTags}>
        <Text>
          {Array.isArray(item.topics)
            ? item.topics.filter(Boolean).map(String).join(' ')
            : ''}
        </Text>
      </View>
      <TouchableOpacity style={styles.joinBtn}>
        <Text style={styles.joinBtnText}>Join Community</Text>
      </TouchableOpacity>
    </View>
  )}
/>

      <Modal
        visible={showCommunityForm}
        animationType="slide"
        onRequestClose={() => setShowCommunityForm(false)}
      >
        <CommunityForm 
          isVisible={showCommunityForm}
          onClose={() => setShowCommunityForm(false)} 
          onCommunityCreated={handleCommunityCreated} 
        />
      </Modal>
      {showSuccess && (
        <View style={styles.successOverlay}>
          <View style={styles.successContent}>
            <Text style={styles.successCheck}>✓</Text>
            <Text style={styles.successText}>Community Created Successfully !</Text>
          </View>
        </View>
      )}
    </View>
   </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    minHeight: 600,
  },
  headerRow: {
    marginBottom: 18,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 22,
    marginBottom: 2,
    color: '#222',
  },
  headerDesc: {
    fontSize: 15,
    color: '#666',
    marginBottom: 10,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 14,
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
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    paddingVertical: 2,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
    maxHeight: 200,
  },
  suggestionsList: {
    maxHeight: 200, // Limit height for suggestions
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionContent: {
    marginLeft: 10,
    flex: 1,
  },
  suggestionTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#222',
    marginBottom: 2,
  },
  suggestionDesc: {
    fontSize: 12,
    color: '#666',
  },
  createBox: {
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  createTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
    color: '#222',
  },
  createDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  createBtn: {
    backgroundColor: '#1CB5E0',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
  },
  createBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  groupsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    marginVertical: 10,
    color: '#222',
  },
  /* groupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 18,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    width: 220,
    marginRight: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  }, */
  groupCardMedium: {
    borderColor: '#1CB5E0',
    borderWidth: 2,
  },
  groupName: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
    color: '#222',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  groupLevel: {
    fontSize: 13,
    color: '#1CB5E0',
    fontWeight: 'bold',
    marginRight: 8,
  },
  groupMembers: {
    fontSize: 13,
    color: '#888',
  },
  groupDesc: {
    fontSize: 13,
    color: '#444',
    marginBottom: 4,
  },
  groupTags: {
    fontSize: 12,
    color: '#1CB5E0',
    marginBottom: 8,
  },
  joinBtn: {
    backgroundColor: '#1CB5E0',
    borderRadius: 6,
    paddingVertical: 7,
    alignItems: 'center',
    marginTop: 4,
  },
  joinBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeCommunities: {
    marginTop: 8,
    gap: 8,
  },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  activeInfo: {
    flex: 1,
  },
  activeName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
  },
  activeMeta: {
    fontSize: 13,
    color: '#666',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 10,
  },
  noResultsText: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 5,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  successContent: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  successCheck: {
    fontSize: 64,
    color: '#4BB543',
    marginBottom: 12,
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
  },
groupsGrid: {
  paddingBottom: 18,
},
rowWrapper: {
  justifyContent: 'space-between',
  marginBottom: 12,
},
groupCard: {
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 16,
  width: '48%',
  borderWidth: 2,
  borderColor: '#e0e0e0',
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
    paddingVertical: 15,
    backgroundColor: Colors.WHITE,
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 15,
  },
});