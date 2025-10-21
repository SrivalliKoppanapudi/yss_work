// import React, { useState, useEffect, useCallback } from 'react';
// import { View, StyleSheet, ScrollView, ActivityIndicator, Text, RefreshControl } from 'react-native';
// import Colors from '../../constant/Colors';
// import { supabase } from '../../lib/Superbase';
// import { useAuth } from '../../Context/auth';

// // Import Mobile-First Components
// import SocialMediaHeader from '../../component/socialmedia/SocialMediaHeader';
// import CreatePostPrompt from '../../component/socialmedia/CreatePostPrompt';
// import TrendingTopics from '../../component/socialmedia/TrendingTopics';
// import PostCard from '../../component/socialmedia/PostCard';

// export default function SocialMediaDashboard() {
//     const { session } = useAuth();
//     const [posts, setPosts] = useState<any[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [refreshing, setRefreshing] = useState(false);

//     const fetchPosts = useCallback(async () => {
//         // Prevent setting loading to true on pull-to-refresh to avoid a full screen loader
//         if (!refreshing) {
//             setLoading(true);
//         }
        
//         const { data, error } = await supabase
//             .from('posts')
//             .select(`
//                 *,
//                 user:user_id (
//                     name,
//                     profilePicture,
//                     occupation
//                 )
//             `)
//             .order('created_at', { ascending: false });

//         if (error) {
//             console.error('Error fetching posts:', error);
//         } else {
//             setPosts(data || []);
//         }
//         setLoading(false);
//         setRefreshing(false);
//     }, [refreshing]);

//     useEffect(() => {
//         fetchPosts();
//     }, [fetchPosts]);

//     const onRefresh = () => {
//         setRefreshing(true);
//         // fetchPosts will be called again due to the `refreshing` state change in its dependency array
//     };

//     const timeSince = (date: string) => {
//         if (!date) return 'just now';
//         const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
//         let interval = seconds / 3600;
//         if (interval > 1) return `${Math.floor(interval)}h ago`;
//         interval = seconds / 60;
//         if (interval > 1) return `${Math.floor(interval)}m ago`;
//         return `${Math.floor(seconds)}s ago`;
//     };

//     const handleDeletePost = (postId: string) => {
//         setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
//     };

//     return (
//         // Using a standard View as the root, as the parent layout already handles SafeArea
//         <View style={styles.container}>
//             <SocialMediaHeader />
//             <ScrollView
//                 style={styles.scrollView}
//                 contentContainerStyle={styles.scrollContent}
//                 showsVerticalScrollIndicator={false}
//                 refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.PRIMARY]} />}
//             >
//                 <CreatePostPrompt />
//                 <TrendingTopics />
                
//                 <View style={styles.feedContainer}>
//                     <Text style={styles.feedTitle}>Your Feed</Text>
//                     {loading && posts.length === 0 ? (
//                         <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ marginTop: 50 }} />
//                     ) : posts.length > 0 ? (
//                         posts.map(post => (
//                             <PostCard
//                                 key={post.id}
//                                 currentUserId={session?.user?.id} // Pass current user's ID for logic
//                                 postId={post.id}
//                                 userId={post.user_id}
//                                 content={post.content}
//                                 images={post.media_urls || []}
//                                 user={{
//                                     name: post.user?.name || post.user_name || 'Anonymous',
//                                     role: post.user?.occupation || post.user_role || 'Member',
//                                     avatar: post.user?.profilePicture || post.user_avatar,
//                                     time: timeSince(post.created_at),
//                                 }}
//                                 stats={{
//                                     likes: post.likes || 0,
//                                     comments: post.comments || 0,
//                                     shares: post.shares || 0,
//                                     saves: post.saves || 0,
//                                 }}
//                                 onDelete={handleDeletePost}
//                             />
//                         ))
//                     ) : (
//                         <View style={styles.emptyContainer}>
//                             <Text style={styles.emptyText}>Your feed is empty.</Text>
//                             <Text style={styles.emptySubtext}>Follow people or communities to see their posts here.</Text>
//                         </View>
//                     )}
//                 </View>
//             </ScrollView>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#fff', // Light grey background like Figma
//     },
//     scrollView: {
//         flex: 1,
//     },
//     scrollContent: {
//         paddingVertical: 16, // Add vertical padding to the content
//         paddingBottom: 30,
//     },
//     feedContainer: {
//         paddingHorizontal: 16,
//         marginTop: 16,
//     },
//     feedTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         marginBottom: 8,
//         color: '#111827', // A darker grey for better readability
//     },
//     emptyContainer: {
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingVertical: 60,
//         backgroundColor: Colors.WHITE,
//         borderRadius: 12,
//         marginHorizontal: 16,
//     },
//     emptyText: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: Colors.GRAY,
//     },
//     emptySubtext: {
//         fontSize: 14,
//         color: Colors.GRAY,
//         textAlign: 'center',
//         marginTop: 8,
//     },
// });

// import React, { useState, useEffect, useCallback } from 'react';
// import { View, StyleSheet, ScrollView, ActivityIndicator, Text, RefreshControl } from 'react-native';
// import Colors from '../../constant/Colors';
// import { supabase } from '../../lib/Superbase';
// import { useAuth } from '../../Context/auth';

// // Import Mobile-First Components
// import SocialMediaHeader from '../../component/socialmedia/SocialMediaHeader';
// import CreatePostPrompt from '../../component/socialmedia/CreatePostPrompt';
// import TrendingTopics from '../../component/socialmedia/TrendingTopics';
// import PostCard from '../../component/socialmedia/PostCard';

// export default function SocialMediaDashboard() {
//     const { session } = useAuth();
//     const [posts, setPosts] = useState<any[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [refreshing, setRefreshing] = useState(false);

//     const fetchPosts = useCallback(async () => {
//         if (!refreshing) setLoading(true);
        
//         // --- THIS IS THE FIX ---
//         // Fetch posts where 'shared_community' is either NULL or an empty array '{}'
//         const { data, error } = await supabase
//             .from('posts')
//             .select(`
//                 *,
//                 user:user_id (
//                     name,
//                     profilePicture,
//                     occupation
//                 )
//             `)
//             .or('shared_community.is.null,shared_community.eq.{}') // <-- This is the key change
//             .order('created_at', { ascending: false });
//         // -----------------------

//         if (error) {
//             console.error('Error fetching posts:', error);
//         } else {
//             setPosts(data || []);
//         }
//         setLoading(false);
//         setRefreshing(false);
//     }, [refreshing]);

//     useEffect(() => {
//         fetchPosts();
//     }, [fetchPosts]);

//     const onRefresh = () => {
//         setRefreshing(true);
//     };

//     const timeSince = (date: string) => {
//         if (!date) return 'just now';
//         const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
//         let interval = seconds / 3600;
//         if (interval > 1) return `${Math.floor(interval)}h ago`;
//         interval = seconds / 60;
//         if (interval > 1) return `${Math.floor(interval)}m ago`;
//         return `${Math.floor(seconds)}s ago`;
//     };

//     const handleDeletePost = (postId: string) => {
//         setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
//     };

//     return (
//         <View style={styles.container}>
//             <SocialMediaHeader />
//             <ScrollView
//                 style={styles.scrollView}
//                 contentContainerStyle={styles.scrollContent}
//                 showsVerticalScrollIndicator={false}
//                 refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.PRIMARY]} />}
//             >
//                 <CreatePostPrompt />
//                 <TrendingTopics />
                
//                 <View style={styles.feedContainer}>
//                     <Text style={styles.feedTitle}>Your Feed</Text>
//                     {loading && posts.length === 0 ? (
//                         <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ marginTop: 50 }} />
//                     ) : posts.length > 0 ? (
//                         posts.map(post => (
//                             <PostCard
//                                 key={post.id}
//                                 currentUserId={session?.user?.id}
//                                 postId={post.id}
//                                 userId={post.user_id}
//                                 content={post.content}
//                                 images={post.media_urls || []}
//                                 user={{
//                                     name: post.user?.name || post.user_name || 'Anonymous',
//                                     role: post.user?.occupation || post.user_role || 'Member',
//                                     avatar: post.user?.profilePicture || post.user_avatar,
//                                     time: timeSince(post.created_at),
//                                 }}
//                                 stats={{
//                                     likes: post.likes || 0,
//                                     comments: post.comments || 0,
//                                     shares: post.shares || 0,
//                                     saves: post.saves || 0,
//                                 }}
//                                 onDelete={handleDeletePost}
//                             />
//                         ))
//                     ) : (
//                         <View style={styles.emptyContainer}>
//                             <Text style={styles.emptyText}>Your feed is empty.</Text>
//                             <Text style={styles.emptySubtext}>Follow people or communities to see their posts here.</Text>
//                         </View>
//                     )}
//                 </View>
//             </ScrollView>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#fff', 
//     },
//     scrollView: {
//         flex: 1,
//     },
//     scrollContent: {
//         paddingVertical: 16, 
//         paddingBottom: 30,
//     },
//     feedContainer: {
//         paddingHorizontal: 16,
//         marginTop: 16,
//     },
//     feedTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         marginBottom: 8,
//         color: '#111827',
//     },
//     emptyContainer: {
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingVertical: 60,
//         backgroundColor: Colors.WHITE,
//         borderRadius: 12,
//         marginHorizontal: 16,
//     },
//     emptyText: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: Colors.GRAY,
//     },
//     emptySubtext: {
//         fontSize: 14,
//         color: Colors.GRAY,
//         textAlign: 'center',
//         marginTop: 8,
//     },
// });
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constant/Colors';
import { supabase } from '../../lib/Superbase';
import { useAuth } from '../../Context/auth';

// Import Mobile-First Components
import SocialMediaHeader from '../../component/socialmedia/SocialMediaHeader';
import CreatePostPrompt from '../../component/socialmedia/CreatePostPrompt';
import TrendingTopics from '../../component/socialmedia/TrendingTopics';
import PostCard from '../../component/socialmedia/PostCard';

export default function SocialMediaDashboard() {
    const { session } = useAuth();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

    const fetchUserRole = useCallback(async () => {
        if (session?.user?.id) {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role') // Make sure you have a 'role' column in your profiles table
                    .eq('id', session.user.id)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;
                
                if (data) {
                    setCurrentUserRole(data.role);
                }
            } catch (err) {
                console.error("Error fetching user role:", err);
                // Set to a non-admin role on error as a safe default
                setCurrentUserRole('user'); 
            }
        }
    }, [session?.user?.id]);

    const fetchPosts = useCallback(async () => {
        const { data, error } = await supabase
            .from('posts')
            .select('*, user:user_id(name, profilePicture, occupation)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching posts:', error);
        } else {
            setPosts(data || []);
        }
    }, []);

    const loadAllData = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            await Promise.all([fetchPosts(), fetchUserRole()]);
        } catch (error) {
            console.error("Failed to load all dashboard data:", error);
        } finally {
            setLoading(false);
            if(isRefresh) setRefreshing(false);
        }
    }, [fetchPosts, fetchUserRole]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadAllData(true);
    };

    const timeSince = (date: string) => {
        if (!date) return 'just now';
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 3600;
        if (interval > 1) return `${Math.floor(interval)}h ago`;
        interval = seconds / 60;
        if (interval > 1) return `${Math.floor(interval)}m ago`;
        return `${Math.floor(seconds)}s ago`;
    };

    const handleDeletePost = (postId: string) => {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    };

    return (
        <View style={styles.safeArea}>
            <SocialMediaHeader />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.PRIMARY]} />}
            >
                <CreatePostPrompt />
                <TrendingTopics />
                
                <View style={styles.feedContainer}>
                    <Text style={styles.feedTitle}>Your Feed</Text>
                    {loading && posts.length === 0 ? (
                        <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ marginTop: 50 }} />
                    ) : posts.length > 0 ? (
                        posts.map(post => (
                            <PostCard
                                key={post.id}
                                currentUserRole={currentUserRole}
                                currentUserId={session?.user?.id}
                                postId={post.id}
                                userId={post.user_id}
                                content={post.content}
                                images={post.media_urls || []}
                                user={{
                                    name: post.user?.name || post.user_name || 'Anonymous',
                                    role: post.user?.occupation || post.user_role || 'Member',
                                    avatar: post.user?.profilePicture || post.user_avatar,
                                    time: timeSince(post.created_at),
                                }}
                                stats={{
                                    likes: post.likes || 0,
                                    comments: post.comments || 0,
                                    shares: post.shares || 0,
                                    saves: post.saves || 0,
                                }}
                                onDelete={handleDeletePost}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Your feed is empty.</Text>
                            <Text style={styles.emptySubtext}>Follow people or communities to see their posts here.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    feedContainer: {
        paddingHorizontal: 16,
        marginTop: 16,
    },
    feedTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.GRAY,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.GRAY,
        textAlign: 'center',
        marginTop: 8,
    },
});