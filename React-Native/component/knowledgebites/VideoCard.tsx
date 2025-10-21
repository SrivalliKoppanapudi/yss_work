
import React, { useState, useRef,useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet,Modal,Alert ,Linking,ScrollView,TextInput,ToastAndroid} from 'react-native';
import { supabase } from '../../lib/Superbase';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import Colors from '../../constant/Colors';
import FollowButton from './FollowButton'; // Ensure this path is correct

type Profile = {
  id:String;
  name: string;
  profilePicture: string;
};

type VideoType = {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string; // ✅ Ensure you have this in your Supabase table
  likes: number;
  comments: number;
  shares: number;
  profile: Profile;


};

type Props = {
  video: VideoType;
  onLikeToggle: (videoId: string, delta: number) => void;
  onMenuPress:()=>void;
    isFollowing: boolean;
  onToggleFollow: (profileUserId: string, currentlyFollowing: boolean) => void;
  currentUserId: string;

};

export default function VideoCard({ video, onLikeToggle , onMenuPress,isFollowing,onToggleFollow,currentUserId}: Props) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [playVideo, setPlayVideo] = useState(false);
  const videoRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
const [comments, setComments] = useState([]);
const [newComment, setNewComment] = useState("");
 const [userCollections, setUserCollections] = useState<string[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
const [visible, setVisible] = useState(false);
const [postMenuVisible, setPostMenuVisible] = useState(false);
const [isOwner, setIsOwner] = useState(false);

const defaultPic = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
const defaultCollections = ['Posts / Videos', 'Courses', 'Resources', 'Jobs'];



  useEffect(() => {
  const fetchStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;


    // Check if liked
    const { data: likeData } = await supabase
      .from("knowledgebitesvideo_likes")
      .select("*")
      .eq("user_id", user.id)
      .eq("video_id", video.id)
      .single();

    setLiked(!!likeData);

    // Check if saved
    /* const { data: saveData } = await supabase
      .from("knowledgebites_saves")
      .select("*")
      .eq("user_id", user.id)
      .eq("video_id", video.id)
      .single();

    setSaved(!!saveData); */
    // Check if saved (via any collection)
const { data: savedEntry } = await supabase
  .from("knowledgebites_collection_videos")
  .select("*")
  .eq("user_id", user.id)
  .eq("video_id", video.id)
  .maybeSingle();

setSaved(!!savedEntry);

  };

  fetchStatus();
}, [video.id]);


useEffect(() => {
  const checkOwnership = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !video.profile) {
      setIsOwner(false);
      return;
    }
    setIsOwner(user.id === video.profile.id);
  };
  checkOwnership();
}, [video]);


  const handlePlay = async () => {
  setPlayVideo(true);

  const user = await supabase.auth.getUser();
  if (!user.data.user) return;

  // Insert into watchlist (if not already present)
  const { data, error } = await supabase
    .from('knowledgebites_watchlist')
    .select('*')
    .eq('user_id', user.data.user.id)
    .eq('video_id', video.id);

  if (data?.length === 0) {
    await supabase.from('knowledgebites_watchlist').insert({
      user_id: user.data.user.id,
      video_id: video.id,
      watched_at: new Date().toISOString()
    });
  }

  console.log("fetched")
};


const handleSubmitComment = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !newComment.trim()) return;

  const { error } = await supabase.from("knowledgebites_comments").insert({
    user_id: user.id,
    video_id: video.id,
    comment: newComment.trim(),
  });

  await supabase
  .from("knowledgebites_videos")
  .update({ comments: video.comments + 1 })
  .eq("id", video.id);


  if (!error) {
    setNewComment("");
    fetchComments();
  }
};


const fetchComments = async () => {
  const { data, error } = await supabase
    .from("knowledgebites_comments")
    .select(`
      id,
      comment,
      created_at,
      user_id,
      profiles (
        name,
        profilePicture
      )
    `)
    .eq("video_id", video.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    return;
  }

  setComments(data);
};



 const handleLike = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existingLike, error } = await supabase
    .from("knowledgebitesvideo_likes")
    .select("*")
    .eq("user_id", user.id)
    .eq("video_id", video.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Like check failed:", error);
    return;
  }

  if (!existingLike) {
    // Like the video
    await supabase.from("knowledgebitesvideo_likes").insert({
      user_id: user.id,
      video_id: video.id,
    });

    await supabase
      .from("knowledgebites_videos")
      .update({ likes: video.likes + 1 })
      .eq("id", video.id);

    setLiked(true);
    onLikeToggle(video.id, 1);
  } else {
    // Unlike the video
    await supabase
      .from("knowledgebitesvideo_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("video_id", video.id);

    await supabase
      .from("knowledgebites_videos")
      .update({ likes: video.likes - 1 })
      .eq("id", video.id);

    setLiked(false);
    onLikeToggle(video.id, -1);
  }
};
/*
const handleSave = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  if (saved) {
    // Unsave
    await supabase
      .from("knowledgebites_saves")
      .delete()
      .eq("user_id", user.id)
      .eq("video_id", video.id);

    setSaved(false);
  } else {
    // Save
    await supabase
      .from("knowledgebites_saves")
      .insert({
        user_id: user.id,
        video_id: video.id,
      });

    setSaved(true);
  }
}; */


const handleSave = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  if (saved) {
    // Unsave = delete from all user's collections
    const { error } = await supabase
      .from("knowledgebites_collection_videos")
      .delete()
      .eq("user_id", user.id)
      .eq("video_id", video.id);

    if (!error) {
      setSaved(false);
      ToastAndroid.show('Removed from collection.', ToastAndroid.SHORT);
    } else {
      ToastAndroid.show('Failed to unsave.', ToastAndroid.SHORT);
      console.error("Unsave error:", error);
    }
  } else {
    // Save = show collection modal
    setVisible(true);
  }
};



  useEffect(() => {
    if (visible) fetchUserCollections();
  }, [visible]);


    const fetchUserCollections = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('knowledgebites_collections')
      .select('name')
      .eq('user_id', user.id)
      .eq('is_default', false);

    if (!error && data) {
      setUserCollections(data.map(c => c.name));
    }
  };


    const addToCollection = async (collectionName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Ensure collection exists or create it
    const { data: collection } = await supabase
      .from('knowledgebites_collections')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', collectionName)
      .maybeSingle();

    let collectionId = collection?.id;

    if (!collectionId) {
      const { data: newCol, error: createErr } = await supabase
        .from('knowledgebites_collections')
        .insert({
          name: collectionName,
          user_id: user.id,
          is_default: defaultCollections.includes(collectionName),
        })
        .select('id')
        .single();

      if (createErr || !newCol) {
        ToastAndroid.show('Failed to add to collection.', ToastAndroid.SHORT);
        return;
      }

      collectionId = newCol.id;
    }

    // Link video to collection
    const { error: linkErr } = await supabase
      .from('knowledgebites_collection_videos') // assuming this exists
      .insert({
        collection_id: collectionId,
        video_id: video.id,
        user_id: user.id,
      });

    if (!linkErr) {
      ToastAndroid.show('Added to collection!', ToastAndroid.SHORT);
      setVisible(false);
      
    } else {
      ToastAndroid.show('Already in collection!', ToastAndroid.SHORT);
    }
    handleSave(); // Update saved state after adding to collection
  };

  const handleCreateCollection = async () => {
    if (newCollectionName.trim()) {
      await addToCollection(newCollectionName.trim());
      setNewCollectionName('');
      setCreateModalVisible(false);
    }
  };





  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContainer}>
          <Image
          source={{ uri: video.profile?.profilePicture || 'https://via.placeholder.com/150' }}
          style={styles.avatar}
        />
        <View>
          <Text>{video.profile?.name || 'anonymous'}</Text>
          <Text style={styles.time}>5 min ago</Text>
        </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <FollowButton currentUserId={currentUserId} profileUserId={video.profile.id}   
  isFollowing={isFollowing}
  onToggleFollow={onToggleFollow} />

         <TouchableOpacity onPress={onMenuPress}>

  <Ionicons name="ellipsis-vertical" size={20} />
</TouchableOpacity> 
        </View>


      </View>
      



      <TouchableOpacity onPress={handlePlay}>
  {video.video_url ? (
    playVideo ? (
      <Video
        ref={videoRef}
        source={{ uri: video.video_url }}
        useNativeControls
          resizeMode={ResizeMode.CONTAIN}
        style={styles.thumbnail}
        shouldPlay
        isLooping
      />
    ) : (
      <View style={styles.thumbnailContainer}>
        <Image
          source={{
            uri: video.thumbnail_url || 'https://via.placeholder.com/300x500?text=No+Thumbnail',
          }}
          style={styles.thumbnail}
        />
        <Ionicons name="play-circle" size={64} color="white" style={styles.playIcon} />
      </View>
    )
  ) : (
    <View style={[styles.thumbnail, styles.fallback]}>
      <Text style={styles.fallbackText}>Video unavailable</Text>
    </View>
  )}
</TouchableOpacity>


      {/* Description */}
      <Text style={styles.title}>{video.title}</Text>
      <Text>{video.description}</Text>


      {/* Actions */}
<View style={styles.footer}>
  <View style={styles.iconStack}>
    <TouchableOpacity onPress={handleLike}>
      <Ionicons name={liked ? 'heart' : 'heart-outline'} size={28} color={liked ? 'red' : 'black'} />
    </TouchableOpacity>
    <Text style={styles.iconText}>{video.likes}</Text>
  </View>

  

  <TouchableOpacity onPress={() => {
  fetchComments();
  setCommentModalVisible(true);
}}>
  <View style={styles.iconStack}>
    <Ionicons name="chatbubble-outline" size={28} color="black" />
    <Text style={styles.iconText}>{video.comments}</Text>
  </View>
</TouchableOpacity>


  <View style={styles.iconStack}>
    <TouchableOpacity onPress={() => setModalVisible(true)}>
      <Ionicons name="share-social-outline" size={28} color="black" />
    </TouchableOpacity>
    <Text style={styles.iconText}>{video.shares}</Text>
  </View>

  <View style={styles.iconStack}>
  <TouchableOpacity onPress={()=>{setVisible(true);}}>
  <Ionicons
    name={saved ? "bookmark" : "bookmark-outline"}
    size={28}
    color={saved ? Colors.PRIMARY : "black"}
  />
</TouchableOpacity>

    <Text style={styles.iconText}>Save</Text>
  </View>
</View>

       {/* Modal for Share Options */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share via</Text>

            <TouchableOpacity
  onPress={() => {
    const message = `Check this out: ${video.video_url}`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'WhatsApp is not installed on your device');
        }
      })
      .catch((err) => console.error('An error occurred', err));
  }}
  style={styles.shareButton}
>
  <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
  <Text style={styles.shareText}>WhatsApp</Text>
</TouchableOpacity>


            <TouchableOpacity onPress={()=>Alert.alert("will be implemented")} style={styles.shareButton}>
         
              
<Ionicons name="logo-facebook" size={24} color="#1877F2" />

              <Text style={styles.shareText}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={()=>Alert.alert("will be implemented")} style={styles.shareButton}>
              
              <Text style={styles.shareText}>More...</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* modal for comments */}

      <Modal visible={commentModalVisible} animationType="slide" transparent>
  <View style={styles.commentmodalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.commentmodalTitle}>Comments</Text>
      <View style={styles.commentInputRow}>
        <TextInput
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Add a comment..."
          style={styles.commentInput}
        />
        <TouchableOpacity onPress={handleSubmitComment}>
          <Ionicons name="send" size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
      </View>
      <ScrollView>
        {comments.map((item, index) => (
          <View style={styles.commentItem} key={item.id}>
  <Image
    source={
      item.profiles?.profilePicture
        ? { uri: item.profiles.profilePicture }
        : { uri: defaultPic }
    }
    style={styles.commentavatar}
  />
  <View style={styles.commentTextContainer}>
    <Text style={styles.commentUser}>{item.profiles?.name || "User"}</Text>
    <Text>{item.comment}</Text>
  </View>
</View>

        ))}
      </ScrollView>
      
      <TouchableOpacity onPress={() => setCommentModalVisible(false)} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>



{/* Main collection Modal */}
      <Modal transparent visible={visible} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.container}>
            <Text style={styles.title}>Add to Collection</Text>

            {[...defaultCollections, ...userCollections].map((name, index) => (
              <TouchableOpacity
                key={index}
                style={styles.collectionButton}
                onPress={() => addToCollection(name)}
              >
                <Text style={styles.collectionText}>{name}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setCreateModalVisible(true)}
              style={styles.newCollectionButton}
            >
              <Text style={styles.newCollectionText}>New Collection</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Collection Modal */}
      <Modal transparent visible={createModalVisible} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.createContainer}>
            <Text style={styles.title}>Create New Collection</Text>
            <TextInput
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              placeholder="Enter collection name"
              style={styles.input}
            />
            <TouchableOpacity style={styles.createButton} onPress={handleCreateCollection}>
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 10, backgroundColor: '#fff', marginBottom: 10, borderRadius: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  time: { fontSize: 12, color: 'gray' },
  followBtn: { padding: 5, backgroundColor: Colors.PRIMARY_LIGHT, borderRadius: 5 },
  thumbnail: { width: '100%', height: 180, borderRadius: 8, marginVertical: 10 },
 /*  title: { fontWeight: 'bold', fontSize: 16 }, */
  footer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 10,
  gap: 16,
},

iconStack: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

iconText: {
  fontSize: 14,
  marginTop: 4,
  color: '#333',
},

  fallback: {
  backgroundColor: '#333',
  justifyContent: 'center',
  alignItems: 'center',
},
fallbackText: {
  color: '#fff',
  fontSize: 16,
},


  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  shareText: {
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: 'red',
  },

  thumbnailContainer: {
  position: 'relative',
  justifyContent: 'center',
  alignItems: 'center',
},

playIcon: {
  position: 'absolute',
  zIndex: 1,
  opacity: 0.9,
},
headerContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 15,
},
 commentmodalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    maxHeight: "80%",
  },
  commentmodalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.PRIMARY,
    marginBottom: 10,
  },
  commentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
  },
  commentavatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#ccc",
  },
  commentTextContainer: {
    flex: 1,
  },
  commentUser: {
    fontWeight: "600",
    marginBottom: 2,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingTop: 8,
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    padding: 8,
    backgroundColor: "#f1f1f1",
    borderRadius: 20,
    marginRight: 8,
  },
  closeButton: {
    marginTop: 10,
    alignSelf: "center",
  },
  closeButtonText: {
    color: Colors.ERROR,
    fontWeight: "bold",
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  createContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
 
  },
  collectionButton: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    borderRadius: 6,
    marginVertical: 6,
  },
  collectionText: {
    textAlign: 'center',
    color: Colors.PRIMARY,
  },
  newCollectionButton: {
    marginTop: 16,
  },
  newCollectionText: {
    textAlign: 'center',
    color: 'gray',
    fontSize: 16,
  },
  input: {
    width: '100%',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginVertical: 12,
  },
  createButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 10,
    borderRadius: 6,
    width: '100%',
  },
  createButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },


});


