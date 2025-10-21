import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, Image, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, Alert } from 'react-native';
import { supabase } from '../../lib/Superbase';
import Colors from '../../constant/Colors';
import { X, Send } from 'lucide-react-native';
import { useAuth } from '../../Context/auth';

const ViewPostModal = ({ post, visible, onClose, onCommentPosted }) => {
    const { session } = useAuth();
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    // --- FIX: Depend on post.postId for fetching ---
    const fetchComments = useCallback(async () => {
        if (!post?.postId) return;
        setLoadingComments(true);
        try {
            const { data, error } = await supabase
                .from('post_comments')
                .select('*, user:user_id(name, profilePicture)')
                .eq('post_id', post.postId) // Corrected from post.id
                .order('created_at', { ascending: true });

            if (error) throw error;
            setComments(data || []);
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoadingComments(false);
        }
    }, [post?.postId]);

    useEffect(() => {
        if (visible) {
            fetchComments();
        }
    }, [visible, fetchComments]);

    const handlePostComment = async () => {
        // --- FIX: Use post.postId and check correctly ---
        if (!newComment.trim() || !session?.user?.id || !post?.postId || isPosting) return;
        
        setIsPosting(true);
        try {
            // --- FIX: Use post.postId to insert comment ---
            const { error: insertError } = await supabase.from('post_comments').insert({
                post_id: post.postId,
                user_id: session.user.id,
                content: newComment.trim()
            });
            if (insertError) throw insertError;

            // --- FIX: Correctly access stats and postId for update ---
            const newCommentCount = (post.stats.comments || 0) + 1;
            await supabase.from('posts').update({ comments: newCommentCount }).eq('id', post.postId);
            
            setNewComment('');
            fetchComments(); 
            onCommentPosted(post.postId, newCommentCount); // Notify parent component

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
    
    const authorName = post.user?.name || 'Unknown';
    const authorAvatar = post.user?.avatar || 'https://via.placeholder.com/40';

    return (
        <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={onClose}>
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.header}>
                    <View style={styles.authorInfo}>
                        <Image source={{ uri: authorAvatar }} style={styles.headerAvatar} />
                        <Text style={styles.headerUserName}>{authorName}'s Post</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color={Colors.BLACK} />
                    </TouchableOpacity>
                </View>
                
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <FlatList
                        ListHeaderComponent={
                            <View style={styles.contentSection}>
                                {post.images?.[0] && <Image source={{ uri: post.images[0] }} style={styles.postImage} />}
                                <Text style={styles.postContent}>{post.content}</Text>
                                <View style={styles.divider} />
                                <Text style={styles.commentsTitle}>Comments</Text>
                            </View>
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

// ... (Your existing styles for ViewPostModal remain the same)
const styles = StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: Colors.WHITE },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    authorInfo: { flexDirection: 'row', alignItems: 'center' },
    headerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#e0e0e0' },
    headerUserName: { fontSize: 16, fontWeight: 'bold' },
    closeButton: { padding: 8 },
    contentSection: { padding: 16 },
    postImage: { width: '100%', aspectRatio: 16/9, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 12 },
    postContent: { fontSize: 15, lineHeight: 22, color: Colors.BLACK },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 16 },
    commentsTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    commentContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 16, justifyContent:"center" },
    commentAvatar: { width: 35, height: 35, borderRadius: 17.5, marginRight: 10, backgroundColor: '#e0e0e0' },
    commentBody: { flex: 1, backgroundColor: '#f0f2f5', padding: 10, borderRadius: 12 },
    commentUserName: { fontWeight: 'bold', marginBottom: 3 },
    commentContent: {},
    emptyComments: { textAlign: 'center', color: Colors.GRAY, marginTop: 20 },
    commentInputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderColor: '#eee', backgroundColor: 'white' },
    textInput: { flex: 1, backgroundColor: '#f0f2f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 10 : 8, marginRight: 10, minHeight: 40, maxHeight: 100 },
    sendButton: { padding: 8 },
});


export default ViewPostModal;