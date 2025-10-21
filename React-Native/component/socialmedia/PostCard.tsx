import React, { useState, useEffect } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Share } from "react-native";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, UserPlus, Trash2 } from "lucide-react-native";
import { supabase } from "../../lib/Superbase";
import Colors from "../../constant/Colors";
import ViewPostModal from "./ViewPostModal";
import ThreeDotsMenu from "./ThreeDotsMenu";

interface PostCardProps {
  currentUserId?: string | null;
  currentUserRole?: string | null;
  postId: string;
  userId: string;
  user: { name: string; role: string; avatar: string; time: string; };
  content: string;
  images: string[];
  stats: { likes: number; comments: number; shares: number; saves: number; };
  onDelete?: (postId: string) => void;
}

const PostCard = (props: PostCardProps) => {
    const { currentUserId, currentUserRole, postId, userId, user, content, images, onDelete } = props;
    
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [likeCount, setLikeCount] = useState(props.stats.likes);
    const [commentCount, setCommentCount] = useState(props.stats.comments);
    const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
    const [isMenuVisible, setMenuVisible] = useState(false);
    
    const isOwner = currentUserId === userId;
    const isAdmin = currentUserRole === 'admin';

    useEffect(() => {
        const checkStatus = async () => {
            if (!currentUserId) return;
            const { data: likeData } = await supabase.from('post_likes').select('post_id').eq('post_id', postId).eq('user_id', currentUserId).maybeSingle();
            setLiked(!!likeData);
            const { data: saveData } = await supabase.from('post_saves').select('post_id').eq('post_id', postId).eq('user_id', currentUserId).maybeSingle();
            setSaved(!!saveData);
        };
        checkStatus();
    }, [postId, currentUserId]);

    const toggleLike = async () => {
        if (!currentUserId) { Alert.alert("Please sign in to like posts."); return; }
        const newLikedStatus = !liked;
        const newLikeCount = newLikedStatus ? likeCount + 1 : Math.max(0, likeCount - 1);
        setLiked(newLikedStatus);
        setLikeCount(newLikeCount);
        try {
            if (newLikedStatus) {
                await supabase.from('post_likes').insert({ post_id: postId, user_id: currentUserId });
            } else {
                await supabase.from('post_likes').delete().match({ post_id: postId, user_id: currentUserId });
            }
            await supabase.from('posts').update({ likes: newLikeCount }).eq('id', postId);
        } catch (error) {
            setLiked(!newLikedStatus);
            setLikeCount(likeCount);
            console.error("Error toggling like:", error);
        }
    };
    
    const handleDelete = () => {
        const alertTitle = isAdmin && !isOwner ? "Admin Action: Delete Post" : "Delete Post";
        const alertMessage = isAdmin && !isOwner
            ? "As an admin, you are about to permanently delete another user's post. This action cannot be undone."
            : "Are you sure you want to permanently delete this post?";

        Alert.alert(alertTitle, alertMessage,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: async () => {
                        if (onDelete) {
                            try {
                                const { error } = await supabase.from('posts').delete().eq('id', postId);
                                if (error) throw error;
                                onDelete(postId);
                            } catch (e: any) {
                                Alert.alert("Error", "Could not delete post: " + e.message);
                            }
                        }
                    },
                },
            ]
        );
    };

    // (Your other handlers for save, share, comment remain the same)
    const toggleSave = async () => { /* ... */ };
    const handleShare = async () => { /* ... */ };
    const handleCommentPosted = (updatedPostId, newCount) => { /* ... */ };

    return (
        <>
            <View style={styles.card}>
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <Image source={{ uri: user.avatar || 'https://via.placeholder.com/40' }} style={styles.avatar} />
                        <View style={styles.userInfoText}>
                            <Text style={styles.name}>{user.name}</Text>
                            <Text style={styles.role}>{user.role} • {user.time}</Text>
                        </View>
                    </View>

                    <View style={styles.headerActions}>
                        {!isOwner && (
                            <TouchableOpacity style={styles.followButton}>
                                <UserPlus size={16} color={Colors.WHITE} />
                                <Text style={styles.followText}>Follow</Text>
                            </TouchableOpacity>
                        )}
                        
                        {/* --- FIX: Always show the three-dots menu icon --- */}
                        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.actionIcon}>
                            <MoreHorizontal size={20} color={Colors.GRAY} />
                        </TouchableOpacity>
                    </View>
                </View>

                {content ? <Text style={styles.contentText}>{content}</Text> : null}
                {images && images.length > 0 && <Image source={{ uri: images[0] }} style={styles.postImage} />}

                <View style={styles.statsRow}>
                    <TouchableOpacity style={styles.statItem} onPress={toggleLike}>
                        <Heart size={18} color={liked ? Colors.ERROR : Colors.GRAY} fill={liked ? Colors.ERROR : 'none'} />
                        <Text style={styles.statText}>{likeCount}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.statItem} onPress={() => setIsCommentModalVisible(true)}>
                        <MessageCircle size={18} color={Colors.GRAY} />
                        <Text style={styles.statText}>{commentCount} </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.statItem} onPress={handleShare}>
                        <Share2 size={18} color={Colors.GRAY} />
                        <Text style={styles.statText}>{props.stats.shares} </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.statItem} onPress={toggleSave}>
                        <Bookmark size={18} color={saved ? Colors.PRIMARY : Colors.GRAY} fill={saved ? Colors.PRIMARY : 'none'} />
                        <Text style={styles.statText}>Save</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ViewPostModal 
                visible={isCommentModalVisible}
                onClose={() => setIsCommentModalVisible(false)}
                post={props} 
                onCommentPosted={handleCommentPosted}
            />

            <ThreeDotsMenu
                visible={isMenuVisible}
                onClose={() => setMenuVisible(false)}
                onReport={() => Alert.alert("Report", "Report functionality coming soon.")}
                onMute={() => Alert.alert("Mute", "Mute functionality coming soon.")}
                isOwner={isOwner}
                isAdmin={isAdmin}
                onDelete={handleDelete}
            />
        </>
    );
};

const styles = StyleSheet.create({
    card: { backgroundColor: "#fff", borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#f0f0f0' },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12 },
    userInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0f0f0' },
    userInfoText: { marginLeft: 10 },
    name: { fontSize: 15, fontWeight: "bold" },
    role: { fontSize: 12, color: Colors.GRAY, marginTop: 2 },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    followButton: { backgroundColor: Colors.PRIMARY, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginRight: 8 },
    followText: { color: "#fff", fontWeight: "600", fontSize: 13, marginLeft: 4 },
    actionIcon: { padding: 6 },
    contentText: { paddingHorizontal: 12, fontSize: 15, lineHeight: 22, marginBottom: 12 },
    postImage: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#f0f0f0' },
    statsRow: { flexDirection: "row", justifyContent: "space-between",padding: 12 },
    statItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    statText: { fontSize: 13, color: Colors.GRAY, fontWeight: '500' },
});


export default PostCard;