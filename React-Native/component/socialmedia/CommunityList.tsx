import React, { useState, useEffect, useCallback } from 'react';
import{
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import Colors from "../../constant/Colors";
import ActiveCommunityCard from "./ActiveCommunityCard";
import { supabase } from "../../lib/Superbase";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "expo-router";

// --- CommunityGridCard Component with Navigation & Join/Leave Logic ---
const CommunityGridCard = ({ item, isMember, onToggleMembership }) => {
  const router = useRouter();
  const activityColor = item.activity === "High" ? "#FEE2E2" : "#FEF3C7";
  const activityTextColor = item.activity === "High" ? "#B91C1C" : "#9A3412";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: `/socialmedia/community/[id]`,
          params: { id: item.id },
        })
      }
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.name}
        </Text>
        {item.activity && (
          <View
            style={[styles.activityBadge, { backgroundColor: activityColor }]}
          >
            <Text style={[styles.activityText, { color: activityTextColor }]}>
              {item.activity}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.cardDesc} numberOfLines={2}>
        {item.description}
      </Text>
      <Text style={styles.cardTags} numberOfLines={1}>
        {(item.topics || []).join(" ")}
      </Text>
      <TouchableOpacity
        style={[styles.joinButton, isMember && styles.joinedButton]}
        onPress={(e) => {
          e.stopPropagation(); // Prevents navigation
          onToggleMembership(item.id, isMember);
        }}
      >
        <Text style={[styles.joinButtonText, isMember && styles.joinedButtonText]}>
          {isMember ? "Joined" : "Join Community"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// --- The main CommunityList Component ---
const CommunityList = ({
  title,
  communities,
  layout = "grid",
  session,
}: {
  title: string;
  communities: any[];
  layout?: "grid" | "list";
  session: Session | null;
}) => {
  const [memberships, setMemberships] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // --- FIX: Re-implemented the fetching logic ---
  const fetchMemberships = useCallback(async () => {
    if (!session?.user) {
      setMemberships(new Set());
      setLoading(false);
      return;
    }
    // Don't set loading to true here on every re-fetch, only on initial component load.
    // The parent component handles the main loading state.
    try {
      const { data, error } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", session.user.id);

      if (error) throw error;

      const memberSet = new Set(data.map((m) => m.community_id));
      setMemberships(memberSet);
    } catch (error) {
      console.error("Error fetching memberships:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]); // Depend on user ID to refetch if user changes

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);
  // --- END OF FIX ---

  // --- FIX: Re-implemented the join/leave logic ---
  const handleToggleMembership = async (
    communityId: string,
    isCurrentlyMember: boolean
  ) => {
    if (!session?.user) {
      Alert.alert("Authentication Required", "Please sign in to join communities.");
      return;
    }

    const newMemberships = new Set(memberships);
    if (isCurrentlyMember) {
      newMemberships.delete(communityId);
    } else {
      newMemberships.add(communityId);
    }
    setMemberships(newMemberships); // Optimistic UI update

    try {
      if (isCurrentlyMember) {
        const { error } = await supabase
          .from("community_members")
          .delete()
          .match({ community_id: communityId, user_id: session.user.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("community_members")
          .insert({
            community_id: communityId,
            user_id: session.user.id,
            role: "member",
          });
        if (error) throw error;
      }
    } catch (error: any) {
      Alert.alert("Error", `Could not ${isCurrentlyMember ? "leave" : "join"} the community.`);
      setMemberships(memberships); // Revert on error
    }
  };
  // --- END OF FIX ---

  if (loading) {
    return <ActivityIndicator color={Colors.PRIMARY} style={{ marginVertical: 20 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {communities.length === 0 ? (
        <Text style={styles.emptyText}>No communities to display.</Text>
      ) : layout === "grid" ? (
        <FlatList
          data={communities}
          renderItem={({ item }) => (
            <CommunityGridCard
              item={item}
              isMember={memberships.has(item.id)}
              onToggleMembership={handleToggleMembership}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          scrollEnabled={false}
        />
      ) : (
        <View>
          {communities.map((item) => (
            <ActiveCommunityCard
              key={item.id}
              item={item}
              isMember={memberships.has(item.id)}
              onToggleMembership={handleToggleMembership}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  row: { justifyContent: "space-between" },
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: "48%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: { fontSize: 15, fontWeight: "bold", flex: 1, marginRight: 4 },
  activityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityText: { fontSize: 10, fontWeight: "bold" },
  cardDesc: {
    fontSize: 12,
    color: Colors.GRAY,
    marginVertical: 8,
    minHeight: 30,
  },
  cardTags: { fontSize: 11, color: Colors.PRIMARY, marginBottom: 12 },
  joinButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: "auto",
  },
  joinedButton: {
    backgroundColor: Colors.WHITE,
    borderWidth: 1.5,
    borderColor: Colors.PRIMARY,
  },
  joinButtonText: {
    color: Colors.WHITE,
    fontWeight: "bold",
    fontSize: 13,
  },
  joinedButtonText: {
    color: Colors.PRIMARY,
  },
  emptyText: { textAlign: "center", color: Colors.GRAY, padding: 20 },
});

export default CommunityList;