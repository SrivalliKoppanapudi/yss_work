// screens/HomeScreen.tsx
import React, { useEffect, useState , useRef } from 'react';
import { ScrollView, View,Alert,StyleSheet,Pressable ,Text,Image,TouchableOpacity,Modal,TouchableWithoutFeedback,Animated} from 'react-native';
import { supabase } from '../../lib/Superbase';
import VideoCard from '../../component/knowledgebites/VideoCard';
import WatchList from '../../component/knowledgebites/WatchList';
import LikedPages from '../../component/knowledgebites/LikedPages';
import Colors from "../../constant/Colors";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMuteAccount } from '../../component/knowledgebites/MuteAccountHandler';
import LoadingScreen from '../../component/knowledgebites/LoadingScreen';



import PostMenu from '../../component/knowledgebites/PostMenu';
import ReportModal from '../../component/knowledgebites/ReportModal';
import Checkbox from 'expo-checkbox';

const defaultPic = "https://cdn-icons-png.flaticon.com/512/847/847969.png";


type Profile = {
  id: string; // Added id to Profile type
  name: string;
  profilePicture: string;
};

type Video = {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  likes: number;
  comments: number;
  shares: number;
  profile: Profile;
  video_url: string;
};

type Page = {
  id: string;
  page_name: string;
  icon_url: string;
};

type WatchlistItem = {
  id: string;
  profile: Profile;
  watched_at: string;
};


export default function HomeScreen() {
    const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
const [user, setUser] = useState<{ profilePicture: string | null } | null>(null);
const dropdownAnim = useRef(new Animated.Value(-100)).current;
const [loading, setLoading] = useState(true);


const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
const toastSet = useRef(new Set<string>());




    const [menuVisibleIdx, setMenuVisibleIdx] = useState(null);
    const [showWhyModalIdx, setShowWhyModalIdx] = useState(null);
    const [whyReasons, setWhyReasons] = useState({}); // { [videoIdx]: { watched: false, dislike: false } }
    const [showReportModalIdx, setShowReportModalIdx] = useState(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [reportingVideoId, setReportingVideoId] = useState(null);
    const { muteAccount, MuteToast } = useMuteAccount();
    const [mutedAccounts, setMutedAccounts] = useState<string[]>([]);
   const [followedUserIds, setFollowedUserIds] = useState<string[]>([]);


   const fetchFollowedUsers = async () => {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUserId);

  if (!error && data) {
    setFollowedUserIds(data.map(f => f.following_id));
  }
};

useEffect(() => {
  if (currentUserId) fetchFollowedUsers();
}, [currentUserId]);


const handleToggleFollow = async (userId: string, currentlyFollowing: boolean) => {
  if (!currentUserId) return;

  if (currentlyFollowing) {
    // UNFOLLOW
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', userId);

    if (!error) {
      setFollowedUserIds(prev => prev.filter(id => id !== userId));
    }
  } else {
    // FOLLOW
    const { error } = await supabase.from('follows').insert({
      follower_id: currentUserId,
      following_id: userId,
    });

    if (!error) {
      setFollowedUserIds(prev => [...prev, userId]);
    }
  }
};

   

    
  

  const fetchWatchlist = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('knowledgebites_watchlist')
  .select(`
    id,
    watched_at,
    video_id,
    knowledgebites_videos (
      profile:user_id (
      id,
        name,
        profilePicture
      )
    )
  `)
        .eq('user_id', userId);

      if (error) {
        console.error('Watchlist fetch error:', error);
      } else {
        // Map and flatten video + profile info for WatchList component
        const formatted = data.map((item: any) => ({
          id: item.id,
          profile: item.knowledgebites_videos.profile || {
            name: 'anonymous',
            profilePicture: null,
          },
          watched_at:getTimeAgo(item.watched_at)
        }));

        setWatchlist(formatted);
      }
    };

    const getTimeAgo = (dateStr: string) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin === 1) return '1 min ago';
  return `${diffMin} min ago`;
};

const showToastMsg = (message: string) => {
  if (toastSet.current.has(message)) return; // avoid showing duplicate active toasts

  const id = Date.now() + Math.random();
  toastSet.current.add(message);

  setToasts((prev) => [...prev, { id, message }]);

  setTimeout(() => {
    setToasts((latest) => latest.filter((t) => t.id !== id));
    toastSet.current.delete(message); // allow future re-use
  }, 2000);
};




useEffect(() => {
  const init = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      setLoading(false);
      return;
    }

    setCurrentUserId(userId);

    const { data: profile } = await supabase
      .from("profiles")
      .select("profilePicture, muted_accounts")
      .eq("id", userId)
      .single();

    setUser({ profilePicture: profile?.profilePicture || null });

    const muted = Array.isArray(profile?.muted_accounts) ? profile.muted_accounts : [];
    setMutedAccounts(muted); // still setting for other components

    await fetchData(userId, muted); // pass directly
    await fetchWatchlist();
    await fetchLikedPages();

    setLoading(false);
  };

  init();
}, []);

const fetchData = async (userId: string, muted: string[]) => {
  const { data: videosData, error } = await supabase
    .from('knowledgebites_videos')
    .select('*, profile:profiles!fk_videos_user_profile(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching videos:', error.message);
    return;
  }

  console.log('Videos fetched successfully');

  const visibleVideos = (videosData || []).filter((video) => {
    const isHidden = video.hidden_by?.includes(userId);
    const isMuted = muted.includes(video.profile?.id);
    return !isHidden && !isMuted;
  });

  setVideos(visibleVideos as Video[]);
};

 





  const fetchLikedPages = async ()=>{

const { data: pagesData } = await supabase.from('liked_pages')
      .select('*');
      setPages((pagesData || []) as Page[]);

  }

  const handleLikeToggle = (videoId: string, delta: number) => {
    setVideos((prev) => prev.map((v) =>
      v.id === videoId ? { ...v, likes: v.likes + delta } : v
    ));
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
    <SafeAreaView style={styles.container}><View style={styles.headerContainer}>
               
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent:"center", gap:  20}}>
                      <View>
                        <Pressable
                    onPress={() => router.replace("/Home")}
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


 {/* What's on your mind card with Create Post button */}
      
      
     

                
                 <ScrollView>
                   {/* What's on your mind card with Create Post button */}


                  <View style={{
        backgroundColor: '#fff',
      padding: 16,
      marginTop: 10,
        
        alignItems: 'flex-start',
      }}>
        <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 18, fontFamily: 'System', color: '#222' }}>
          What's on your mind?
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: Colors.PRIMARY,
            borderRadius: 6,
            paddingVertical: 10,
            paddingHorizontal: 16,
            alignItems: 'center',
            flexDirection: 'row',
            marginTop: 2,
            
            minWidth: 140,
          }}
         
          onPress={() => router.push('/knowledgebites/CreatePost')}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5, fontFamily: 'System' }}>
            Create Post
          </Text>
        </TouchableOpacity>
      </View>
      <WatchList watchlist={watchlist} />
        <LikedPages pages={pages} />
      {/* <View style={{ padding: 10 }}>
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} onLikeToggle={handleLikeToggle} />
        ))}
        
      </View> */}
      <View style={{ padding: 10 }}>
          {videos.map((video, idx) => (
            <View key={video.id}>
              <VideoCard video={video} onLikeToggle={handleLikeToggle} onMenuPress={() => setMenuVisibleIdx(idx)}   isFollowing={followedUserIds.includes(video.profile.id)}
  onToggleFollow={handleToggleFollow}
  currentUserId={currentUserId}  />
              {menuVisibleIdx === idx && (
  <>
    {/* Transparent overlay that catches outside taps */}
    <Pressable
      style={StyleSheet.absoluteFill}
      onPress={() => setMenuVisibleIdx(null)}
    />
    
    <PostMenu
      visible={true}
      onClose={() => setMenuVisibleIdx(null)}
      onNotInterested={() => {
        setShowWhyModalIdx(idx);
      }}
      onReport={() => {
        setReportingVideoId(video.id);
        setShowReportModalIdx(idx);
      }}
      onMute={() => {
        const accountId = video.profile.id;
        if (accountId && currentUserId) {
          muteAccount(accountId, currentUserId);
          setMutedAccounts(prev => [...prev, accountId]);
          fetchData(currentUserId, [...mutedAccounts, accountId]);
        }
      }}
      style={{ position: 'absolute', top: 30, right: 10 }}
    />
  </>
)}

           {/* Tell us why modal */}
                     <Modal visible={showWhyModalIdx === idx} transparent animationType="fade">
                       <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
                         <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 320, alignItems: 'stretch', position: 'relative' }}>
                           <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 18, textAlign: 'center' }}>Tell us why</Text>
                           <TouchableOpacity style={{ position: 'absolute', top: 12, right: 12, padding: 4 }} onPress={() => setShowWhyModalIdx(null)}>
                             <Ionicons name="close" size={24} color="#333" />
                           </TouchableOpacity>
                           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                             <Checkbox
                               value={whyReasons[idx]?.watched || false}
                               onValueChange={v => setWhyReasons(prev => ({ ...prev, [idx]: { ...prev[idx], watched: v } }))}
                               color={whyReasons[idx]?.watched ? '#0072ff' : undefined}
                               style={{ marginRight: 8 }}
                             />
                             <Text style={{ marginLeft: 8 }}>I've already watched this video</Text>
                           </View>
                           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                             <Checkbox
                               value={whyReasons[idx]?.dislike || false}
                               onValueChange={v => setWhyReasons(prev => ({ ...prev, [idx]: { ...prev[idx], dislike: v } }))}
                               color={whyReasons[idx]?.dislike ? '#0072ff' : undefined}
                               style={{ marginRight: 8 }}
                             />
                             <Text style={{ marginLeft: 8 }}>I don't like this video</Text>
                           </View>
                           <TouchableOpacity
                             style={{ backgroundColor: '#0072ff', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 10 }}
                             onPress={async () => {
                               setShowWhyModalIdx(null);
                               if (!currentUserId) return;
                               
                               if (!video || !video.id) return;
                               // Fetch current hidden_by array
                               const { data: postData, error: fetchError } = await supabase
                                 .from('knowledgebites_videos')
                                 .select('hidden_by')
                                 .eq('id', video.id)
                                 .single();
                               if (fetchError) {
                                 console.error('Failed to fetch video for hiding:', fetchError.message);
                                 return;
                               }
                               const prevHiddenBy = Array.isArray(postData?.hidden_by) ? postData.hidden_by : [];
                               if (prevHiddenBy.includes(currentUserId)) {
                                 fetchData(currentUserId, [...mutedAccounts, video.profile.id]); // Refresh videos if already hidden
                                 return;
                               }
                               const newHiddenBy = [...prevHiddenBy, currentUserId];
                               const { error: updateError } = await supabase
                                 .from('knowledgebites_videos')
                                 .update({ hidden_by: newHiddenBy })
                                 .eq('id', video.id);
                               if (updateError) {
                                 console.error('Failed to hide video:', updateError.message);
                                 return;
                               }
                               showToastMsg('Video Removed');
                               fetchData(currentUserId, [...mutedAccounts,video.profile.id]); // Refresh videos after hiding
                               
                             }}
                           >
                             <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Submit</Text>
                           </TouchableOpacity>
                         </View>
                       </View>
                     </Modal>
            
               {/* Report Modal */}
                    <ReportModal
                      visible={showReportModalIdx !== null}
                      onClose={() => {
                        setShowReportModalIdx(null);
                        setReportingVideoId(null);
                      }}
                      onSubmit={async () => {
                        // Hide the reported video for the current user
                        if (!currentUserId || !reportingVideoId) return;
                        // Fetch current hidden_by array
                        const { data: postData, error: fetchError } = await supabase
                          .from('knowledgebites_videos')
                          .select('hidden_by')
                          .eq('id', reportingVideoId)
                          .single();
                        if (fetchError) {
                          console.error('Failed to fetch video for hiding:', fetchError.message);
                          return;
                        }
                        const prevHiddenBy = Array.isArray(postData?.hidden_by) ? postData.hidden_by : [];
                        if (prevHiddenBy.includes(currentUserId)) {
                          fetchData(currentUserId, [...mutedAccounts, video.profile.id]); // Refresh videos if already hidden
                          
                          return;
                        }
                        const newHiddenBy = [...prevHiddenBy, currentUserId];
                        const { error: updateError } = await supabase
                          .from('knowledgebites_videos')
                          .update({ hidden_by: newHiddenBy })
                          .eq('id', reportingVideoId);
                        if (updateError) {
                          console.error('Failed to hide video:', updateError.message);
                          return;
                        }
                        showToastMsg('Video Removed');
                       
                        
                      }}
                      videoId={reportingVideoId}
                      onRemoveVideo={() => {}}
                    />
            </View>
          ))}
            
        </View>
    </ScrollView>
    <View style={styles.toastStack} pointerEvents="box-none">
                      {toasts.map((toast) => (
                        <View key={toast.id} style={styles.toastContainer}>
                          <Ionicons name="checkmark-circle" size={22} color="#4caf50" style={styles.toastIcon} />
                          <Text style={styles.toastText}>{toast.message}</Text>
                          <TouchableOpacity onPress={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))} style={styles.toastClose}>
                            <Ionicons name="close" size={18} color="#333" />
                          </TouchableOpacity>
                        </View>
                      ))}
                      <MuteToast />
                    </View>
    </SafeAreaView>
   
  );
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: Colors.WHITE,
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



profileImage: {
  width: 36,
  height: 36,
  borderRadius: 18,
},

/* modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "flex-end",
  padding: 20,
}, */

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
 

  toastStack: {
    position: 'absolute',
    bottom: 40,
    left: 10,
    right: 10,
    zIndex: 200,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4f8d4',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  toastIcon: {
    marginRight: 8,
  },
  toastText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
    flex: 1,
  },
  toastClose: {
    marginLeft: 8,
    padding: 2,
  },
})