
// app/screens/knowledgebites/Saved.tsx
import React, { useEffect, useState ,useRef} from 'react';
import { View, Text, FlatList, StyleSheet,TouchableOpacity,Image,Pressable ,Animated,Modal,TouchableWithoutFeedback} from 'react-native';
import { supabase } from '../../lib/Superbase';
import VideoCard from '../../component/knowledgebites/VideoCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constant/Colors';
import { useRouter } from 'expo-router';
import LoadingScreen from '../../component/knowledgebites/LoadingScreen';


export default function SavedVideos() {
    const router = useRouter();
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [videos, setVideos] = useState([]);
  const [user, setUser] = useState<{ profilePicture: string | null } | null>(null);
  const [loading,setLoading] = useState(true);
  const dropdownAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    const init = async () => {
      setLoading(true);
  
      await fetchUser();
  
      await fetchSavedVideos();  
  
      setLoading(false);    
    };
  
    init();
  }, []);
   useEffect(() => {
    if (profileMenuVisible) {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      dropdownAnim.setValue(-100); // Reset when closed
    }
  }, [profileMenuVisible]);

/*    const fetchSavedVideos = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('knowledgebites_saves')
    .select(`
      video_id,
      knowledgebites_videos (
        id,
        title,
        description,
        thumbnail_url,
        video_url,
        likes,
        comments,
        shares,
        profile:user_id (
          name,
          profilePicture
        )
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error('saved fetch error:', error);
  } else {
    const formatted = data.map((item: any) => ({
      ...item.knowledgebites_videos,
    }));
    setVideos(formatted);
  }
}; */
const fetchSavedVideos = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Fetch all collections
  const { data: collections, error: colErr } = await supabase
    .from("knowledgebites_collections")
    .select("id, name, is_default")
    .eq("user_id", user.id);

  if (colErr) {
    console.error("Collection fetch error:", colErr);
    return;
  }

  // Fetch all saved videos in those collections
  const { data: savedData, error: vidErr } = await supabase
    .from("knowledgebites_collection_videos")
    .select(`
      collection_id,
      knowledgebites_videos (
        id,
        title,
        description,
        thumbnail_url,
        video_url,
        likes,
        comments,
        shares,
        profile:user_id (
          name,
          profilePicture
        )
      )
    `)
    .eq("user_id", user.id);

  if (vidErr) {
    console.error("Saved videos fetch error:", vidErr);
    return;
  }

  // Group videos under their respective collections
  const grouped = collections.map((collection) => ({
    ...collection,
    videos: savedData
      .filter((v) => v.collection_id === collection.id)
      .map((v) => v.knowledgebites_videos),
  }));

  setVideos(grouped); // update type of videos to: [{ id, name, videos: Video[] }]
};


        const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("profilePicture")
            .eq("id", user.id)
            .single();
    
          setUser({ profilePicture: profile?.profilePicture || null });
        }
      };


      if (loading) return <LoadingScreen />;
  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
                       
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent:"center", gap:  20}}>
                              <View>
                                <Pressable
                            onPress={() => router.replace("/knowledgebites/HomeScreen")}
                            style={styles.backButton}
                          >
                            <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
                          </Pressable>
                              </View>
                          <View><Text style={styles.headerText} >Knowledge Bites</Text></View>
                            </View>
        
                          <TouchableOpacity onPress={() => setProfileMenuVisible(true)}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.profileImage} />
            ) : (
              <Ionicons name="person-circle-outline" size={36} color="gray" />
            )}
          </TouchableOpacity>
        
                         </View> 
                             <Modal
                           transparent
                           visible={profileMenuVisible}
                           animationType="fade"
                           onRequestClose={() => setProfileMenuVisible(false)}
                         >
                           <TouchableWithoutFeedback onPress={() => setProfileMenuVisible(false)}>
                             <View style={styles.modalOverlay}>
                               <Animated.View style={[styles.profileDropdown, { transform: [{ translateY: dropdownAnim }] }]}>
                           <View style={styles.arrow} />
                           <Pressable
                             style={styles.menuItem}
                             onPress={() => {
                               setProfileMenuVisible(false);
                               router.replace('/knowledgebites/Liked');
                             }}
                           >
                             <Text style={styles.menuText}>Liked</Text>
                           </Pressable>
                           <Pressable
                             style={styles.menuItem}
                             onPress={() => {
                               setProfileMenuVisible(false);
                               router.replace('/knowledgebites/Saved');
                             }}
                           >
                             <Text style={styles.menuText}>Saved</Text>
                           </Pressable>
                         </Animated.View>
                         
                             </View>
                           </TouchableWithoutFeedback>
                         </Modal>
      <Text style={styles.title}>Saved Videos</Text>
      <FlatList
  data={videos}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.collectionTitle}>{item.name}</Text>
      <FlatList
        data={item.videos}
        keyExtractor={(video) => video.id}
        renderItem={({ item: video }) => (
          <VideoCard video={video} onLikeToggle={() => {}} />
        )}
        ListEmptyComponent={() => (
          <Text style={{ color: 'gray', marginLeft: 10 }}>No videos in this collection</Text>
        )}
      />
    </View>
  )}
  ListEmptyComponent={() => (
    <View style={{ marginTop: 40, alignItems: 'center' }}>
      <Text style={{ fontSize: 16, color: 'gray' }}>No Saved Collections</Text>
    </View>
  )}
/>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
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
    marginBottom: 15,
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
    profileImage: {
  width: 36,
  height: 36,
  borderRadius: 18,
},

profileMenu: {
  backgroundColor: "#fff",
  borderRadius: 10,
  padding: 10,
  elevation: 5,
},

menuItem: {
  paddingVertical: 12,
  paddingHorizontal: 16,
},

menuText: {
  fontSize: 16,
  color: Colors.PRIMARY,
}
,
modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  profileDropdown: {
    position: 'absolute',
    top: 42, // Below header
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    width: 160,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 999,
  },
  arrow: {
    position: 'absolute',
    top: -8,
    right: 16,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
  },
  collectionTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginVertical: 8,
  color: Colors.PRIMARY,
}

});
