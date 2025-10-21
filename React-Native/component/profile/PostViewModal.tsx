// component/PostViewModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, Image, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, Alert } from 'react-native';
import { supabase } from '../../lib/Superbase';
import Colors from '../../constant/Colors';
import { X, Send, Heart, MessageCircle } from 'lucide-react-native';
import { useAuth } from '../../Context/auth';

const PostViewModal = ({ post, visible, onClose }) => {
    const { session } = useAuth();
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    const fetchComments = useCallback(async () => {
        if (!post?.id) return;
        setLoadingComments(true);
        try {
            // Step 1: Fetch all comments for the post
            const { data: commentsData, error: commentsError } = await supabase
                .from('post_comments')
                .select(`*`) // Select all columns, including user_id
                .eq('post_id', post.id)
                .order('created_at', { ascending: true });

            if (commentsError) throw commentsError;
            if (!commentsData || commentsData.length === 0) {
                setComments([]); // No comments to show
                return;
            }

            // Step 2: Collect all unique user IDs from the comments
            const userIds = [...new Set(commentsData.map(c => c.user_id).filter(id => id))];
            
            if (userIds.length === 0) {
                setComments(commentsData); // Comments exist but have no users, show as is
                return;
            }
            
            // Step 3: Fetch all the profiles for those user IDs in a single query
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, name, profilePicture')
                .in('id', userIds);

            if (profilesError) throw profilesError;

            // Step 4: Create a map for easy profile lookup
            const profilesMap = new Map(profilesData.map(p => [p.id, p]));

            // Step 5: Combine the comments with their author's profile information
            const commentsWithUsers = commentsData.map(comment => ({
                ...comment,
                user: profilesMap.get(comment.user_id) || { name: 'User', profilePicture: null } // Add profile data
            }));
            
            setComments(commentsWithUsers);

        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoadingComments(false);
        }
    }, [post]);

    useEffect(() => {
        if (visible && post?.id) {
            fetchComments();
        }
    }, [visible, post, fetchComments]);

    const handlePostComment = async () => {
        // ... (This function remains unchanged)
        if (!newComment.trim() || !session?.user?.id || !post?.id || isPosting) return;
        setIsPosting(true);
        try {
            const { error } = await supabase.from('post_comments').insert({ post_id: post.id, user_id: session.user.id, content: newComment.trim() });
            if (error) throw error;
            setNewComment('');
            fetchComments();
        } catch (error: any) {
            Alert.alert("Error", `Could not post comment: ${error.message}`);
        } finally {
            setIsPosting(false);
        }
    };
    
    const renderComment = ({ item }) => (
        <View style={styles.commentContainer}>
            <Image 
                source={{ uri: item.user?.profilePicture || 'https://via.placeholder.com/40' }} 
                style={styles.commentAvatar} 
            />
            <View style={styles.commentBody}>
                <Text style={styles.commentUserName}>{item.user?.name || 'User'}</Text>
                <Text style={styles.commentContent}>{item.content}</Text>
            </View>
        </View>
    );

    if (!post) return null;
    
    // The data passed to the modal should now have the correct structure
    const authorName = post.user?.name || 'Unknown';
    const authorAvatar = post.user?.profilePicture || 'https://via.placeholder.com/40';

    return (
        <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={onClose}>
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.header}>
                    <View style={styles.authorInfo}>
                        <Image source={{ uri: authorAvatar }} style={styles.headerAvatar} />
                        <Text style={styles.headerUserName}>{authorName}</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color={Colors.BLACK} />
                    </TouchableOpacity>
                </View>
                
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={10}>
                    <FlatList
                        ListHeaderComponent={
                            <>
                                {post.media_urls?.[0] && <Image source={{ uri: post.media_urls?.[0] }} style={styles.postImage} />}
                                <View style={styles.contentSection}>
                                    <Text style={styles.postContent}>{post.content}</Text>
                                    <View style={styles.engagementBar}>
                                        <TouchableOpacity style={styles.engagementButton}><Heart size={20} color={Colors.GRAY} /><Text style={styles.engagementText}>{post.likes || 0} Likes</Text></TouchableOpacity>
                                        <TouchableOpacity style={styles.engagementButton}><MessageCircle size={20} color={Colors.GRAY} /><Text style={styles.engagementText}>{comments.length} Comments</Text></TouchableOpacity>
                                    </View>
                                    <View style={styles.divider} />
                                    <Text style={styles.commentsTitle}>Comments</Text>
                                </View>
                            </>
                        }
                        data={comments}
                        renderItem={renderComment}
                        keyExtractor={(item) => item.id.toString()}
                        ListEmptyComponent={
                            loadingComments ? 
                            <ActivityIndicator style={{marginTop: 20}} color={Colors.PRIMARY}/> :
                            <Text style={styles.emptyComments}>Be the first to comment!</Text>
                        }
                        contentContainerStyle={{ paddingBottom: 60 }}
                    />
                    <View style={styles.commentInputContainer}>
                        <TextInput style={styles.textInput} placeholder="Add a comment..." value={newComment} onChangeText={setNewComment} multiline />
                        <TouchableOpacity style={styles.sendButton} onPress={handlePostComment} disabled={isPosting}>
                            {isPosting ? <ActivityIndicator size="small" color={Colors.PRIMARY} /> : <Send size={24} color={Colors.PRIMARY} />}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: Colors.WHITE },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    authorInfo: { flexDirection: 'row', alignItems: 'center' },
    headerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#e0e0e0' },
    headerUserName: { fontSize: 16, fontWeight: 'bold' },
    closeButton: { padding: 8 },
    postImage: { width: '100%', aspectRatio: 1, backgroundColor: '#f0f0f0' },
    contentSection: { padding: 16 },
    postContent: { fontSize: 15, lineHeight: 22, color: Colors.BLACK, marginBottom: 16 },
    engagementBar: { flexDirection: 'row', gap: 20, marginBottom: 16 },
    engagementButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    engagementText: { color: Colors.GRAY, fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 16 },
    commentsTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    commentContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15, paddingHorizontal: 16 },
    commentAvatar: { width: 35, height: 35, borderRadius: 17.5, marginRight: 10, backgroundColor: '#e0e0e0' },
    commentBody: { flex: 1, backgroundColor: '#f0f2f5', padding: 10, borderRadius: 8 },
    commentUserName: { fontWeight: 'bold', marginBottom: 3 },
    commentContent: {},
    emptyComments: { textAlign: 'center', color: Colors.GRAY, marginTop: 20 },
    commentInputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderColor: '#eee', backgroundColor: 'white' },
    textInput: { flex: 1, backgroundColor: '#f0f2f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 10 : 8, marginRight: 10, minHeight: 40, maxHeight: 100 },
    sendButton: { padding: 8 },
});

export default PostViewModal;