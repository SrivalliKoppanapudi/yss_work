// app/screens/knowledgebites/Liked.tsx
import React, { useEffect, useState,useRef } from 'react';
import { View, Text, FlatList, StyleSheet,Pressable,TouchableOpacity,Image,Animated,Modal,TouchableWithoutFeedback } from 'react-native';
import { supabase } from '../../lib/Superbase';
import VideoCard from '../../component/knowledgebites/VideoCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constant/Colors';
import { useRouter } from 'expo-router';
import { set } from 'date-fns';
import LoadingScreen from '../../component/knowledgebites/LoadingScreen';

export default function LikedVideos() {
  const [videos, setVideos] = useState([]);
  const router = useRouter();
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
const [user, setUser] = useState<{ profilePicture: string | null } | null>(null);
const [loading,setLoading] = useState(true);
const dropdownAnim = useRef(new Animated.Value(-100)).current;
useEffect(() => {
  const init = async () => {
    setLoading(true);

    await fetchUser();

    await fetchLikedVideos();  

    setLoading(false);    
  };

  init();
}, []);
 const fetchLikedVideos = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('knowledgebitesvideo_likes')
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
    console.error('liked fetch error:', error);
  } else {
    const formatted = data.map((item: any) => ({
      ...item.knowledgebites_videos,
    }));
    setVideos(formatted);
  }
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
      <Text style={styles.title}>Liked Videos</Text>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VideoCard
            video={item}
            onLikeToggle={() => {}}
            onMenuPress={() => {}}
            isFollowing={false}
            onToggleFollow={() => {}}
            currentUserId={''}
          />
        )}
        ListEmptyComponent={() => (
    <View style={{ marginTop: 40, alignItems: 'center' }}>
      <Text style={{ fontSize: 16, color: 'gray' }}>No liked videos</Text>
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
    marginBottom: 15,
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
});