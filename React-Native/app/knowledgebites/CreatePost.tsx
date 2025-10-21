
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, Image, ActivityIndicator, Modal, ScrollView,SafeAreaView ,KeyboardAvoidingView,Platform} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/Superbase';
import { decode as base64ToUint8Array } from '../../utils/resourceUtils';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import PostMenu from '../../component/knowledgebites/PostMenu';
import Checkbox from 'expo-checkbox';
import ReportModal from '../../component/knowledgebites/ReportModal';
import { useMuteAccount } from '../../component/knowledgebites/MuteAccountHandler';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const CreatePost = () => {
  const [video, setVideo] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [videoUrls, setVideoUrls] = useState([]);
  const [videoData, setVideoData] = useState([]);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [collections, setCollections] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  // Toast stack for collection actions
  const [toasts, setToasts] = useState([]); // [{ id, message }]
  const [menuVisibleIdx, setMenuVisibleIdx] = useState(null);
  const [showWhyModalIdx, setShowWhyModalIdx] = useState(null);
  const [whyReasons, setWhyReasons] = useState({}); // { [videoIdx]: { watched: false, dislike: false } }
  const [showReportModalIdx, setShowReportModalIdx] = useState(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [reportingVideoId, setReportingVideoId] = useState(null);
  const { muteAccount, MuteToast } = useMuteAccount();
  const [mutedAccounts, setMutedAccounts] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState<any>(null);


  const navigation = useNavigation();

  const router = useRouter()

  useEffect(() => {
    // Fetch current user id on mount
    const fetchUserId = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchVideosWithMetadata();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    supabase
      .from('profiles')
      .select('muted_accounts')
      .eq('id', currentUserId)
      .single()
      .then(({ data }) => {
        setMutedAccounts(Array.isArray(data?.muted_accounts) ? data.muted_accounts : []);
      });
  }, [currentUserId]);

  const fetchVideosWithMetadata = async () => {
    if (!currentUserId) return;
    const { data, error } = await supabase
      .storage
      .from('post-videos')
      .list('', { limit: 100, offset: 0 });
    if (error) {
      console.error('Error listing videos:', error.message);
      return;
    }
    const files = (data || []).filter(file => file.name.endsWith('.mp4'));
    // Fetch metadata for all files from post_videos table
    const { data: posts } = await supabase
      .from('post_videos')
      .select('*');
    // Map file to metadata, filter out hidden for this user and muted accounts
    const videoData = files.map(file => {
      const post = (posts || []).find(p => p.video_url && p.video_url.includes(file.name));
      return {
        url: supabase.storage.from('post-videos').getPublicUrl(file.name).data.publicUrl,
        title: post?.title || file.name,
        description: post?.description || '',
        id: post?.id,
        hidden_by: post?.hidden_by || [],
        author_id: post?.author_id, // <-- Make sure this is correct
      };
    }).filter(v =>
      !(v.hidden_by && v.hidden_by.includes(currentUserId)) &&
      (!v.author_id || !mutedAccounts.includes(v.author_id))
    );
    setVideoData(videoData);
    console.log('Video data:', videoData);
  };

  const pickVideo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setVideo(result.assets[0]);
    }
  };

  /* const handleUpload = async () => {
    if (!video || !title) return;
    setUploading(true);
    setProgress(0.1);
    setShowError(false);
    setErrorMsg('');
    try {
      const fileExt = video.uri.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(video.uri, { encoding: FileSystem.EncodingType.Base64 });
      // Convert base64 to Uint8Array
      const binaryData = base64ToUint8Array(base64);

      setProgress(0.3);
      // Upload to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('post-videos')
        .upload(fileName, binaryData, { contentType: video.mimeType || 'video/mp4', upsert: true });
      console.log('Upload result:', { storageData, storageError });
      if (storageError && storageError.message) {
        throw new Error(storageError.message);
      }

      setProgress(0.7);
      // Get public URL
      const { publicUrl } = supabase.storage
        .from('post-videos')
        .getPublicUrl(fileName).data;
      const video_url = publicUrl;


      

      // Insert post metadata
      const { error: insertError } = await supabase.from('knowledgebites_videos').insert({
  user_id: currentUserId,
  title,
  description,
  video_url,
  hashtags,
  type: isPublic ? 'public' : 'private',
  thumbnail_url: null, // you can generate a thumbnail later if needed
  status: 'published', // or 'draft' if you want to save as draft
});

      if (insertError && insertError.message) throw new Error(insertError.message);

      setProgress(1);
      setUploading(false);
      setShowSuccess(true);
      fetchVideosWithMetadata();
      setTimeout(() => {
        setShowSuccess(false);
        
        router.replace("/knowledgebites/HomeScreen")
      }, 1500);
    } catch (e) {
      setUploading(false);
      setShowError(true);
      setErrorMsg(e?.message || JSON.stringify(e) || 'Upload failed');
      console.log('Upload error:', e);
    }
  };
 */
const handleUpload = async () => {
  if (!video || !title) return;

  setUploading(true);
  setProgress(0.1);
  setShowError(false);
  setErrorMsg('');

  try {
    // === VIDEO UPLOAD ===
    const fileExt = video.uri.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const base64 = await FileSystem.readAsStringAsync(video.uri, { encoding: FileSystem.EncodingType.Base64 });
    const binaryData = base64ToUint8Array(base64);

    setProgress(0.3);
    const { data: videoData, error: videoError } = await supabase.storage
      .from('post-videos')
      .upload(fileName, binaryData, {
        contentType: video.mimeType || 'video/mp4',
        upsert: true,
      });

    console.log('Video upload:', { videoData, videoError });
    if (videoError) throw new Error(videoError.message);

    const video_url = supabase.storage
      .from('post-videos')
      .getPublicUrl(fileName).data.publicUrl;

    // === THUMBNAIL UPLOAD ===
    let thumbnail_url = null;
    if (thumbnail?.uri) {
      const thumbExt = thumbnail.uri.split('.').pop();
      const thumbName = `thumb_${Date.now()}.${thumbExt}`;
      const thumbBase64 = await FileSystem.readAsStringAsync(thumbnail.uri, { encoding: FileSystem.EncodingType.Base64 });
      const thumbBinary = base64ToUint8Array(thumbBase64);

      const { data: thumbData, error: thumbError } = await supabase.storage
        .from('post-thumbnails')
        .upload(thumbName, thumbBinary, {
          contentType: thumbnail.mimeType || 'image/jpeg',
          upsert: true,
        });

      console.log('Thumbnail upload:', { thumbData, thumbError });
      if (thumbError) throw new Error(thumbError.message);

      thumbnail_url = supabase.storage
        .from('post-thumbnails')
        .getPublicUrl(thumbName).data.publicUrl;
    }

    setProgress(0.7);

    // === INSERT METADATA ===
    const { error: insertError } = await supabase
      .from('knowledgebites_videos')
      .insert({
        user_id: currentUserId,
        title,
        description,
        video_url,
        hashtags,
        type: isPublic ? 'public' : 'private',
        thumbnail_url,
        status: 'published',
      });

    if (insertError) throw new Error(insertError.message);

    setProgress(1);
    setUploading(false);
    setShowSuccess(true);
    fetchVideosWithMetadata();

    setTimeout(() => {
      setShowSuccess(false);
      router.replace("/knowledgebites/HomeScreen");
    }, 1500);
  } catch (e) {
    setUploading(false);
    setShowError(true);
    setErrorMsg(e?.message || JSON.stringify(e) || 'Upload failed');
    console.log('Upload error:', e);
  }
};

  const fetchCollections = async () => {
    const { data, error } = await supabase.from('post_collections').select('*');
    if (!error) setCollections(data || []);
  };

  const showToastMsg = (message) => {
    const id = Date.now() + Math.random();
    console.log('Adding toast:', message); // Debug log
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  };

  const handleAddToCollection = async (collection) => {
    if (!selectedPost) return;
    await supabase.from('collection_posts').insert({
      collection_id: collection.id,
      post_id: selectedPost.id || selectedPost.url || selectedPost.title, // fallback for id
    });
    setShowCollectionModal(false);
    showToastMsg('Added to the Collection!');
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    const { data, error } = await supabase.from('post_collections').insert({ name: newCollectionName });
    console.log('Create collection result:', data, error);
    if (!error) {
      setShowNewCollectionModal(false);
      setNewCollectionName('');
      fetchCollections();
      setShowCollectionModal(true);
      showToastMsg('Created a new Collection');
    } else {
      alert('Failed to create collection: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  >
            <KeyboardAwareScrollView
              style={styles.container}
              enableOnAndroid={true}
              keyboardShouldPersistTaps="handled"
              extraScrollHeight={20}
              contentContainerStyle={{ flexGrow: 1 }}
            >
   
      {/* Removed Create Post Button UI from the top as per user request */}
      <Text style={styles.header}>Create a post</Text>
      <View style={styles.formCard}>
  <Text style={styles.label}>Add video</Text>
  <TouchableOpacity style={styles.videoPicker} onPress={pickVideo}>
    {video ? (
      <Image source={{ uri: video.uri }} style={styles.videoThumb} />
    ) : (
      <View style={styles.videoPlaceholder}>
        <Ionicons name="add" size={32} color="#888" />
        <Text style={styles.videoPickerText}>Select video from device</Text>
      </View>
    )}
  </TouchableOpacity>

  <Text style={styles.label}>Add Thumbnail</Text>
  <TouchableOpacity style={styles.videoPicker} onPress={async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];

      setThumbnail({
        uri: asset.uri,
        mimeType: asset.type === 'image' ? asset.mimeType || 'image/jpeg' : 'image/jpeg',
      });}
  }}>
    {thumbnail ? (
      <Image source={{ uri: thumbnail.uri }} style={styles.videoThumb} />
    ) : (
      <View style={styles.videoPlaceholder}>
        <Ionicons name="image" size={32} color="#888" />
        <Text style={styles.videoPickerText}>Select thumbnail</Text>
      </View>
    )}
  </TouchableOpacity>

  <Text style={styles.label}>Add title of the video</Text>
  <TextInput
    style={styles.input}
    value={title}
    onChangeText={setTitle}
    placeholder="UX Research basics"
  />

  <Text style={styles.label}>Add Description</Text>
  <TextInput
    style={[styles.input, { height: 60 }]}
    value={description}
    onChangeText={setDescription}
    placeholder="Description"
    multiline
  />

  <Text style={styles.label}>Add Hashtags</Text>
  <TextInput
    style={styles.input}
    value={hashtags}
    onChangeText={setHashtags}
    placeholder="#hashtag1 #hashtag2"
  />

  <View style={styles.typeRow}>
    <Text style={styles.label}>Type</Text>
    <Switch value={isPublic} onValueChange={setIsPublic} />
    <Text style={styles.publicText}>{isPublic ? 'Public' : 'Private'}</Text>
  </View>

  <View style={styles.buttonRow}>
    <TouchableOpacity style={styles.uploadBtn} disabled={uploading} onPress={handleUpload}>
      <Text style={styles.uploadBtnText}>Upload</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.draftBtn}
      onPress={async () => {
        if (!video || !title.trim() || !description.trim()) {
          let missing = [];
          if (!video) missing.push('video');
          if (!title.trim()) missing.push('title');
          if (!description.trim()) missing.push('description');
          alert('Please fill in the following fields: ' + missing.join(', '));
          return;
        }

        try {
          setUploading(true);
          // Upload video
          const videoExt = video.uri.split('.').pop();
          const videoName = `${Date.now()}.${videoExt}`;
          const videoBase64 = await FileSystem.readAsStringAsync(video.uri, { encoding: FileSystem.EncodingType.Base64 });
          const videoBinary = base64ToUint8Array(videoBase64);

          const { error: videoUploadErr } = await supabase.storage
            .from('post-videos')
            .upload(videoName, videoBinary, {
              contentType: video.mimeType || 'video/mp4',
              upsert: true,
            });
          if (videoUploadErr) throw new Error(videoUploadErr.message);

          const videoUrl = supabase.storage.from('post-videos').getPublicUrl(videoName).data.publicUrl;

          // Upload thumbnail (optional)
          console.log('Thumbnail object:', thumbnail);

          let thumbnailUrl = null;
          if (thumbnail) {
            const thumbExt = thumbnail.uri.split('.').pop();
            const thumbName = `thumb_${Date.now()}.${thumbExt}`;
            const thumbBase64 = await FileSystem.readAsStringAsync(thumbnail.uri, { encoding: FileSystem.EncodingType.Base64 });
            const thumbBinary = base64ToUint8Array(thumbBase64);

            const { error: thumbErr } = await supabase.storage
              .from('post-thumbnails')
              .upload(thumbName, thumbBinary, {
                contentType: thumbnail.mimeType || 'image/jpeg',
                upsert: true,
              });
            if (thumbErr) {
  console.error('Thumbnail upload error:', thumbErr);
  throw new Error(thumbErr.message);
}
console.log('Thumbnail binary length:', thumbBinary.length);


            thumbnailUrl = supabase.storage.from('post-thumbnails').getPublicUrl(thumbName).data.publicUrl;
          }

          // Insert into knowledgebites_videos
          const { error: insertError } = await supabase.from('knowledgebites_videos').insert({
            user_id: currentUserId,
            title,
            description,
            hashtags,
            type: isPublic ? 'public' : 'private',
            status: 'draft',
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl,
          });
          if (insertError) throw new Error(insertError.message);

          setToastMsg('Added to the Draft');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 2000);
          fetchVideosWithMetadata();
        } catch (e) {
          alert('Failed to save draft: ' + (e.message || e));
        } finally {
          setUploading(false);
        }
      }}
    >
      <Text style={styles.draftBtnText}>Save to draft</Text>
    </TouchableOpacity>
  </View>
  <TouchableOpacity onPress={()=>{router.back()}} style={styles.closeButton}>
            <Text style={styles.createButtonText}>Close</Text>
          </TouchableOpacity>
</View>

      {/* Uploading Overlay */}
      <Modal visible={uploading} transparent animationType="fade">
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>Uploading......</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      </Modal>
      {/* Success Toast */}
      {showSuccess && (
        <View style={styles.successOverlay}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={64} color="#fff" />
          </View>
          <Text style={styles.successText}>Uploaded Successfully !</Text>
        </View>
      )}
      {/* Error Toast */}
      {showError && (
        <View style={styles.errorToast}>
          <Text style={styles.errorToastText}>{errorMsg}</Text>
        </View>
      )}
      {/* Success Toast for Draft */}
      {showToast && (
        <View style={styles.toastContainer}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" style={styles.toastIcon} />
          <Text style={styles.toastText}>{toastMsg}</Text>
          <TouchableOpacity onPress={() => setShowToast(false)} style={styles.toastClose}>
            <Ionicons name="close" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      )}
      {/* Display all videos from the bucket below the create post form */}
     
      {/* Create New Collection Modal */}
      
      {/* Toast stack for collection actions */}
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
      {/* Report Modal */}
      </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 30 : 0, // or use insets
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 20,
  },
  label: {
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 4,
    color: '#222',
  },
  videoPicker: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    height: 120,
    marginBottom: 12,
    backgroundColor: '#f7fafd',
  },
  videoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPickerText: {
    color: '#888',
    marginTop: 8,
  },
  videoThumb: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f7fafd',
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  publicText: {
    marginLeft: 8,
    color: '#1e88e5',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  uploadBtn: {
    backgroundColor: '#1e88e5',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  uploadBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  draftBtn: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  draftBtnText: {
    color: '#333',
    fontWeight: 'bold',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  overlayText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  progressBarBg: {
    width: 220,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#4caf50',
    borderRadius: 4,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  successCircle: {
    backgroundColor: '#4caf50',
    borderRadius: 60,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successText: {
    color: '#4caf50',
    fontWeight: 'bold',
    fontSize: 22,
    marginTop: 8,
  },
  errorToast: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  errorToastText: {
    backgroundColor: '#fff',
    color: '#d32f2f',
    fontWeight: 'bold',
    fontSize: 18,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 320,
    alignItems: 'stretch',
    position: 'relative',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 18,
    textAlign: 'center',
  },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  collectionImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  collectionName: {
    fontSize: 16,
    color: '#222',
  },
  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  newCollectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  newCollectionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f7fafd',
    fontSize: 16,
    marginRight: 10,
  },
  createBtnGradient: {
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
   closeButton: {
    backgroundColor: 'red',
    padding: 12,
    marginTop: 20,
    borderRadius: 8,
  },
  createButtonText: {
    textAlign: 'center',
    color: 'white',
  },
});

export default CreatePost; 