import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, Alert, Image, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../lib/Superbase';
import { useAuth } from '../../Context/auth';
import Colors from '../../constant/Colors';
import { X, ChevronDown } from 'lucide-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { decode as base64ToUint8Array } from '../../utils/resourceUtils';
import { Picker } from '@react-native-picker/picker'; 
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreatePost() {
    const router = useRouter();
    const { session } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [mediaFiles, setMediaFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    const [joinedCommunities, setJoinedCommunities] = useState<{ id: string, name: string }[]>([]);
    const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
    const [loadingCommunities, setLoadingCommunities] = useState(true);

    useEffect(() => {
        const fetchJoinedCommunities = async () => {
            if (!session?.user?.id) {
                setLoadingCommunities(false);
                return;
            }

            try {
                const { data: memberData, error: memberError } = await supabase
                    .from('community_members')
                    .select('community_id')
                    .eq('user_id', session.user.id);
                
                if (memberError) throw memberError;

                const communityIds = memberData.map(m => m.community_id);

                if (communityIds.length > 0) {
                    // Then, fetch the details of those communities
                    const { data: communitiesData, error: communitiesError } = await supabase
                        .from('communities')
                        .select('id, name')
                        .in('id', communityIds);
                    
                    if (communitiesError) throw communitiesError;
                    setJoinedCommunities(communitiesData || []);
                }
            } catch (error) {
                console.error("Error fetching joined communities:", error);
            } finally {
                setLoadingCommunities(false);
            }
        };

        fetchJoinedCommunities();
    }, [session]);

    const handleMediaPick = async (type: 'image' | 'file') => {
        let result;
        if (type === 'image') {
            result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });
        } else {
            result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
        }

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const file = {
                uri: asset.uri,
                name: asset.fileName || asset.name,
                type: asset.mimeType,
            };
            setMediaFiles(prev => [...prev, file]);
        }
    };

    const removeMediaFile = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handlePublishPost = async () => {
        if (!title.trim() && !content.trim()) {
            Alert.alert("Empty Post", "Please add a title or some content to your post.");
            return;
        }
        if (!session?.user) {
            Alert.alert("Not Authenticated", "Please sign in to create a post.");
            return;
        }

        setLoading(true);
        try {
            const mediaUrls = [];
            for (const file of mediaFiles) {
                const originalName = file.name || `mediafile-${Date.now()}`;
                const fileExt = originalName.split('.').pop()?.toLowerCase() || 'tmp';
                const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
                
                const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
                const { error: uploadError } = await supabase.storage
                    .from('post-images')
                    .upload(fileName, base64ToUint8Array(base64), { contentType: file.type, upsert: true });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(fileName);
                mediaUrls.push(urlData.publicUrl);
            }

            const postData = {
                title: title.trim(),
                content: content.trim(),
                hashtags: (hashtags || '').split(' ').filter(tag => tag.startsWith('#')),
                media_urls: mediaUrls,
                visibility: isPublic ? 'public' : 'private',
                user_id: session.user.id,
                user_name: session.user.user_metadata?.full_name || 'User',
                user_role: session.user.user_metadata?.role || 'Teacher',
                user_avatar: session.user.user_metadata?.avatar_url,
                shared_community: selectedCommunity ? [selectedCommunity] : [],
            };

            const { error } = await supabase.from('posts').insert(postData);
            if (error) throw error;

            Alert.alert("Success", "Your post has been published!");
            router.back();
        } catch (error: any) {
            Alert.alert("Error", `Failed to publish post: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Create New Post</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <X size={24} color={Colors.BLACK} />
                </TouchableOpacity>
            </View>

            <KeyboardAwareScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                enableOnAndroid={true}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Post title</Text>
                    <TextInput style={styles.input} placeholder="Add description title" value={title} onChangeText={setTitle} placeholderTextColor="#999"/>
                </View>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Content</Text>
                    <TextInput style={[styles.input, styles.textArea]} placeholder="Share your teaching resources...." multiline value={content} onChangeText={setContent} placeholderTextColor="#999"/>
                </View>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Hashtag</Text>
                    <TextInput style={styles.input} placeholder="Add hashtags" value={hashtags} onChangeText={setHashtags} placeholderTextColor="#999"/>
                </View>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Add Media</Text>
                    <View style={styles.mediaButtonContainer}>
                        <TouchableOpacity style={[styles.mediaButton, styles.mediaButtonOutlined]} onPress={() => handleMediaPick('image')}>
                            <Text style={styles.mediaButtonTextOutlined}>Upload Image</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.mediaButton, styles.mediaButtonFilled]} onPress={() => handleMediaPick('file')}>
                            <Text style={styles.mediaButtonTextFilled}>Upload File</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                 {mediaFiles.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewContainer}>
                        {mediaFiles.map((file, index) => (
                            <View key={index} style={styles.previewItem}>
                                <Image source={{ uri: file.uri }} style={styles.previewImage} />
                                <TouchableOpacity style={styles.removeMediaButton} onPress={() => removeMediaFile(index)}>
                                    <X size={14} color={Colors.WHITE} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}


                <View style={styles.formGroup}>
                    <Text style={styles.label}>Share to Community (Optional)</Text>
                    <Text style={styles.toggleSubtitle}>Post will only be visible in the selected community feed.</Text>
                    <View style={styles.pickerContainer}>
                        {loadingCommunities ? (
                            <ActivityIndicator color={Colors.PRIMARY} />
                        ) : joinedCommunities.length > 0 ? (
                            <Picker
                                selectedValue={selectedCommunity}
                                onValueChange={(itemValue) => setSelectedCommunity(itemValue)}
                            >
                                <Picker.Item label="Share to Public Feed" value={null} />
                                {joinedCommunities.map((community) => (
                                    <Picker.Item key={community.id} label={community.name} value={community.id} />
                                ))}
                            </Picker>
                        ) : (
                            <Text style={styles.noCommunitiesText}>You haven't joined any communities yet.</Text>
                        )}
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Visibility</Text>
                    <View style={styles.toggleRow}>
                        <View>
                            <Text style={styles.toggleTitle}>Public</Text>
                            <Text style={styles.toggleSubtitle}>Visible to all lynkt members</Text>
                        </View>
                        <Switch
                            value={isPublic}
                            onValueChange={setIsPublic}
                            trackColor={{ false: '#767577', true: '#81b0ff' }}
                            thumbColor={isPublic ? Colors.PRIMARY : '#f4f3f4'}
                        />
                    </View>
                </View>

            </KeyboardAwareScrollView>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.footerButton, styles.publishButton]} 
                    onPress={handlePublishPost}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color={Colors.WHITE} /> : <Text style={styles.publishButtonText}>Publish Post</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.footerButton, styles.draftButton]}>
                    <Text style={styles.draftButtonText}>Save Draft</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.WHITE },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    closeButton: { position: 'absolute', right: 16, top: 16 },
    container: { flex: 1 },
    scrollContent: { padding: 16 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: { borderWidth: 1.5, borderColor: '#005f9e4d', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
    textArea: { minHeight: 120, textAlignVertical: 'top' },
    mediaButtonContainer: { flexDirection: 'row', gap: 12 },
    mediaButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1.5 },
    mediaButtonOutlined: { borderColor: '#005f9e', backgroundColor: Colors.WHITE },
    mediaButtonFilled: { borderColor: '#005f9e', backgroundColor: '#005f9e' },
    mediaButtonTextOutlined: { color: '#005f9e', fontWeight: 'bold' },
    mediaButtonTextFilled: { color: Colors.WHITE, fontWeight: 'bold' },
    previewContainer: { marginTop: 10 },
    previewItem: { position: 'relative', marginRight: 10 },
    previewImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f0f0f0' },
    removeMediaButton: { position: 'absolute', top: -5, right: -5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 2 },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    toggleTitle: { fontSize: 16, fontWeight: '500' },
    toggleSubtitle: { fontSize: 12, color: Colors.GRAY, marginTop: 4 },
    pickerContainer: { borderWidth: 1.5, borderColor: '#005f9e4d', borderRadius: 8, marginTop: 8 },
    noCommunitiesText: { padding: 12, fontStyle: 'italic', color: Colors.GRAY },
    footer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', gap: 12, backgroundColor: Colors.WHITE },
    footerButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    publishButton: { backgroundColor: '#005f9e' },
    draftButton: { backgroundColor: Colors.WHITE, borderWidth: 1.5, borderColor: '#005f9e' },
    publishButtonText: { color: Colors.WHITE, fontWeight: 'bold', fontSize: 16 },
    draftButtonText: { color: '#005f9e', fontWeight: 'bold', fontSize: 16 },
});