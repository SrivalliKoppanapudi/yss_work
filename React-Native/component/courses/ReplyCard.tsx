// D:/LynkTT/React-Native/component/courses/ReplyCard.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ThumbsUp, MessageSquare } from 'lucide-react-native';
import Colors from '../../constant/Colors';
import { supabase } from '../../lib/Superbase';
import { useAuth } from '../../Context/auth';
import timeSince from '../../utils/timeSince'; // We will create this utility

interface ReplyCardProps {
  reply: any;
  allReplies: any[];
  onReply: (replyId: string) => void;
}

const ReplyCard: React.FC<ReplyCardProps> = ({ reply, allReplies, onReply }) => {
  const { session } = useAuth();
  const [likes, setLikes] = useState(reply.likes || 0);
  const [isLiked, setIsLiked] = useState(reply.is_liked_by_user || false);

  const nestedReplies = allReplies.filter(r => r.parent_reply_id === reply.id);

  const handleLike = async () => {
    if (!session?.user) return;
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikes(prev => newLikedState ? prev + 1 : prev - 1);

    if (newLikedState) {
      await supabase.from('discussion_reply_likes').insert({ reply_id: reply.id, user_id: session.user.id });
    } else {
      await supabase.from('discussion_reply_likes').delete().match({ reply_id: reply.id, user_id: session.user.id });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.replyContent}>
        <Image source={{ uri: reply.profiles?.avatar || require('../../assets/images/default.png') }} style={styles.avatar} />
        <View style={styles.textContainer}>
          <View style={styles.header}>
            <Text style={styles.author}>{reply.profiles?.name || 'User'}</Text>
            <Text style={styles.timestamp}>{timeSince(new Date(reply.created_at))}</Text>
          </View>
          <Text style={styles.content}>{reply.content}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <ThumbsUp size={16} color={isLiked ? Colors.PRIMARY : Colors.GRAY} />
              <Text style={[styles.actionText, isLiked && { color: Colors.PRIMARY }]}>{likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => onReply(reply.id)}>
              <MessageSquare size={16} color={Colors.GRAY} />
              <Text style={styles.actionText}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {nestedReplies.length > 0 && (
        <View style={styles.nestedContainer}>
          {nestedReplies.map(nestedReply => (
            <ReplyCard key={nestedReply.id} reply={nestedReply} allReplies={allReplies} onReply={onReply} />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  replyContent: { flexDirection: 'row' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  textContainer: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  author: { fontWeight: 'bold', marginRight: 8 },
  timestamp: { color: Colors.GRAY, fontSize: 12 },
  content: { color: Colors.BLACK, lineHeight: 22 },
  actions: { flexDirection: 'row', marginTop: 8, gap: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { color: Colors.GRAY, fontSize: 13 },
  nestedContainer: { marginLeft: 32, borderLeftWidth: 1, borderLeftColor: '#e0e0e0', paddingLeft: 20 },
});

export default ReplyCard;