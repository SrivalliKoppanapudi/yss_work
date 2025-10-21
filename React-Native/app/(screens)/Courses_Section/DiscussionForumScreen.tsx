import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator,
  Alert, FlatList, Image, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../lib/Superbase';
import { useAuth } from '../../../Context/auth';
import Colors from '../../../constant/Colors';
import { ArrowLeft, Send } from 'lucide-react-native';

const DiscussionForumScreen = () => {
  const router = useRouter();
  const { session } = useAuth();
  const { courseId, moduleId } = useLocalSearchParams<{ courseId: string; moduleId: string }>();

  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<any[]>([]);
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newReplyContent, setNewReplyContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [activeReplyThreadId, setActiveReplyThreadId] = useState<string | null>(null);

  const fetchForumData = useCallback(async (isSilentRefresh = false) => {
    if (!moduleId) return;
    if (!isSilentRefresh) setLoading(true);

    try {
      const { data: threadsData, error: threadsError } = await supabase
        .from('discussion_threads')
        .select('*')
        .eq('module_id', moduleId)
        .order('created_at', { ascending: false });
      if (threadsError) throw threadsError;

      if (!threadsData || threadsData.length === 0) {
        setThreads([]);
        if (!isSilentRefresh) setLoading(false);
        return;
      }
      
      const threadIds = threadsData.map(t => t.id);
      
      const { data: repliesData, error: repliesError } = await supabase
        .from('discussion_replies')
        .select('*')
        .in('thread_id', threadIds);
      if (repliesError) throw repliesError;
      
      const userIds = new Set<string>();
      threadsData.forEach(thread => userIds.add(thread.user_id));
      (repliesData || []).forEach(reply => userIds.add(reply.user_id));

      let profilesMap = new Map<string, any>();
      if (userIds.size > 0) {
          const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, name, profilePicture')
              .in('id', Array.from(userIds));
          
          if (profilesError) throw profilesError;
          
          (profilesData || []).forEach(profile => profilesMap.set(profile.id, profile));
      }

      const enrichedReplies = (repliesData || []).map(reply => ({
          ...reply,
          author: profilesMap.get(reply.user_id) || { name: 'User' }
      }));

      const enrichedThreads = threadsData.map(thread => ({
        ...thread,
        author: profilesMap.get(thread.user_id) || { name: 'Instructor' },
        replies: enrichedReplies
          .filter(reply => reply.thread_id === thread.id)
          .sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      }));

      setThreads(enrichedThreads);

    } catch (err: any) {
      Alert.alert("Error", "Could not load the discussion forum.");
      console.error("Fetch Forum Error:", err);
    } finally {
      if (!isSilentRefresh) setLoading(false);
    }
  }, [moduleId]);

  useFocusEffect(useCallback(() => { fetchForumData(); }, [fetchForumData]));
  
  const handlePostThread = async () => {
    if (!newThreadContent.trim() || !session?.user?.id) return;
    setIsPosting(true);
    try {
      const { error } = await supabase.from('discussion_threads').insert({
        module_id: moduleId,
        course_id: courseId,
        user_id: session.user.id,
        title: newThreadContent.trim().substring(0, 50),
        content: newThreadContent.trim()
      });
      if (error) throw error;
      setNewThreadContent('');
      await fetchForumData(true);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handlePostReply = async (threadId: string) => {
    if (!newReplyContent.trim() || !session?.user?.id) return;
    setIsPosting(true);
    try {
      const { error } = await supabase.from('discussion_replies').insert({
        thread_id: threadId,
        user_id: session.user.id,
        content: newReplyContent.trim(),
      });
      if (error) throw error;
      setNewReplyContent('');
      setActiveReplyThreadId(null);
      await fetchForumData(true);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setIsPosting(false);
    }
  };

  const timeSince = (date: string) => {
    if (!date) return '';
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const ForumPostCard = ({ item: thread }: { item: any }) => {
    // --- THIS IS THE FIX ---
    const getAvatarSource = (profile: any) => {
        return profile?.profilePicture 
            ? { uri: profile.profilePicture } 
            : require('../../../assets/images/default.png');
    };
    // --- END OF FIX ---

    return (
        <View style={styles.postCard}>
        <View style={styles.postHeader}>
            <Image source={getAvatarSource(thread.author)} style={styles.avatar} />
            <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{thread.author?.name || 'User'}</Text>
            <Text style={styles.postTime}>{timeSince(thread.created_at)}</Text>
            </View>
            <TouchableOpacity><Text>...</Text></TouchableOpacity>
        </View>
        <Text style={styles.postContent}>{thread.content}</Text>
        
        {thread.replies.map((reply: any) => (
            <View key={reply.id} style={styles.replyContainer}>
            <Image source={getAvatarSource(reply.author)} style={styles.avatarSmall} />
            <View style={styles.replyContent}>
                <Text style={styles.authorName}>{reply.author?.name || 'User'}</Text>
                <Text>{reply.content}</Text>
            </View>
            </View>
        ))}

        <View style={styles.replyInputBox}>
            <Image source={getAvatarSource({ profilePicture: session?.user?.user_metadata?.avatar_url })} style={styles.avatarSmall} />
            <TextInput
            style={styles.replyInput}
            placeholder="Write a reply..."
            value={activeReplyThreadId === thread.id ? newReplyContent : ''}
            onChangeText={setNewReplyContent}
            onFocus={() => setActiveReplyThreadId(thread.id)}
            multiline
            />
            {activeReplyThreadId === thread.id && (
                <TouchableOpacity onPress={() => handlePostReply(thread.id)} disabled={isPosting}>
                {isPosting ? <ActivityIndicator size="small" color={Colors.PRIMARY} /> : <Send size={24} color={Colors.PRIMARY} />}
                </TouchableOpacity>
            )}
        </View>
        </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color={Colors.BLACK} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Discussion Forum</Text>
        <View style={{width: 24}}/>
      </View>
      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={60}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ flex: 1 }} />
        ) : (
          <FlatList
            data={threads}
            keyExtractor={(item) => item.id}
            renderItem={ForumPostCard}
            ListHeaderComponent={
              <View style={styles.createThreadContainer}>
                <TextInput
                  style={styles.createThreadInput}
                  placeholder="Write your thought/question here..."
                  value={newThreadContent}
                  onChangeText={setNewThreadContent}
                  multiline
                />
                <TouchableOpacity style={styles.postButton} onPress={handlePostThread} disabled={isPosting}>
                  {isPosting ? <ActivityIndicator color={Colors.WHITE} /> : <Text style={styles.postButtonText}>Post</Text>}
                </TouchableOpacity>
              </View>
            }
            ListEmptyComponent={<Text style={styles.emptyText}>No discussions started yet. Be the first!</Text>}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4f8' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: Colors.WHITE },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  listContainer: { padding: 16, paddingBottom: 20 },
  createThreadContainer: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  createThreadInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  postButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  postButtonText: {
    color: Colors.WHITE,
    fontWeight: 'bold',
  },
  postCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#e0e0e0',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  postTime: {
    fontSize: 12,
    color: Colors.GRAY,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  replyContainer: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#e0e0e0',
  },
  replyContent: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
  },
  replyInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.GRAY,
    marginTop: 40,
    fontStyle: 'italic',
    fontSize: 15,
  },
});

export default DiscussionForumScreen;