import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { supabase } from '../../lib/Superbase';
import { useAuth } from '../../Context/auth';
import Colors from '../../constant/Colors';
import ReplyCard from './ReplyCard';
import { Send } from 'lucide-react-native';

interface DiscussionForumProps {
  moduleId: string; 
  courseId: string;
}

const DiscussionForum: React.FC<DiscussionForumProps> = ({ moduleId, courseId }) => {
  const { session } = useAuth();
  const [thread, setThread] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReply, setNewReply] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string, author: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!moduleId || !session?.user) return;
    setLoading(true);
    try {
      let { data: threadData, error: threadError } = await supabase
        .from('discussion_threads').select('*, profiles(name, avatar)').eq('module_id', moduleId).single();
      
      if (!threadData && !threadError) {
        const {data: moduleData} = await supabase.from('modules').select('title, description').eq('id', moduleId).single();
        const { data: newThreadData, error: newThreadError } = await supabase
            .from('discussion_threads').insert({
                module_id: moduleId,
                course_id: courseId,
                user_id: session.user.id, 
                title: moduleData?.title || 'Module Discussion',
                content: moduleData?.description || 'Let\'s discuss this module.'
            }).select('*, profiles(name, avatar)').single();
        if(newThreadError) throw newThreadError;
        threadData = newThreadData;
      } else if (threadError) { throw threadError; }

      setThread(threadData);

      const { data: repliesData, error: repliesError } = await supabase.rpc('get_discussion_replies_with_likes', {
        p_thread_id: threadData.id,
        p_user_id: session.user.id
      });
      if (repliesError) throw repliesError;
      setReplies(repliesData || []);

    } catch (error: any) {
      console.error("Error fetching discussion:", error);
    } finally {
      setLoading(false);
    }
  }, [moduleId, courseId, session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePostReply = async () => {
    if (!newReply.trim() || !thread || !session?.user) return;
    const replyData = {
        thread_id: thread.id,
        user_id: session.user.id,
        content: newReply.trim(),
        parent_reply_id: replyingTo?.id || null
    };

    const { error } = await supabase.from('discussion_replies').insert(replyData);
    if (error) {
        Alert.alert("Error", "Could not post reply.");
    } else {
        setNewReply('');
        setReplyingTo(null);
        fetchData();
    }
  };

  const topLevelReplies = replies.filter(r => !r.parent_reply_id);

  if (loading) {
    return <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ marginVertical: 40 }} />;
  }

  if (!thread) {
    return <Text style={styles.errorText}>Could not load discussion.</Text>;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 100 : 80}
    >
        <FlatList
          style={styles.container}
          data={topLevelReplies}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.threadContainer}>
              <Text style={styles.threadTitle}>{thread.title}</Text>
              <Text style={styles.threadContent}>{thread.content}</Text>
            </View>
          }
          renderItem={({ item }) => <ReplyCard reply={item} allReplies={replies} onReply={(id) => setReplyingTo({ id, author: item.profiles.name })} />}
        />
        <View style={styles.replyInputContainer}>
            {replyingTo && (
                <View style={styles.replyingToBanner}>
                    <Text style={styles.replyingToText}>Replying to {replyingTo.author}</Text>
                    <TouchableOpacity onPress={() => setReplyingTo(null)}>
                        <Text style={styles.cancelReplyText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.textInput}
                    value={newReply}
                    onChangeText={setNewReply}
                    placeholder={replyingTo ? "Write your reply..." : "Ask a question or share your thoughts..."}
                    multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={handlePostReply}>
                    <Send size={24} color={Colors.WHITE} />
                </TouchableOpacity>
            </View>
        </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  threadContainer: { marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  threadTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  threadContent: { fontSize: 16, lineHeight: 24, color: '#333' },
  errorText: { textAlign: 'center', color: Colors.ERROR, marginTop: 20 },
  replyInputContainer: { borderTopWidth: 1, borderTopColor: '#e0e0e0', padding: 12, backgroundColor: Colors.WHITE },
  replyingToBanner: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#e7f3ff', padding: 8, borderRadius: 4, marginBottom: 8 },
  replyingToText: { color: Colors.PRIMARY },
  cancelReplyText: { color: Colors.ERROR, fontWeight: 'bold' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  textInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, minHeight: 44, maxHeight: 120 },
  sendButton: { backgroundColor: Colors.PRIMARY, borderRadius: 22, width: 44, height: 44, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});

export default DiscussionForum;