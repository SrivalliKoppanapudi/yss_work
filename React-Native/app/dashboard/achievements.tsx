import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import Colors from "../../constant/Colors";
import { ProgressBar } from "react-native-paper"; // For progress bars
import { useRouter } from "expo-router";

// Mock data for achievements
const achievements = [
  {
    id: 1,
    title: "First Steps",
    description: "Complete your first task.",
    progress: 1.0, // 100% completed
    badge: require("../../assets/images/Lynkt.png"), // Add badge images
  },
  {
    id: 2,
    title: "Task Master",
    description: "Complete 10 tasks.",
    progress: 0.6, // 60% completed
    badge: require("../../assets/images/Lynkt.png"),
  },
  {
    id: 3,
    title: "Social Butterfly",
    description: "Connect with 5 friends.",
    progress: 0.3, // 30% completed
    badge: require("../../assets/images/Lynkt.png"),
  },
  {
    id: 4,
    title: "Early Bird",
    description: "Complete a task before 8 AM.",
    progress: 0.0, // 0% completed
    badge: require("../../assets/images/Lynkt.png"),
  },
];

export default function AchievementsScreen() {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Achievements</Text>

      {/* Certificates Card/Button */}
      <TouchableOpacity
        style={styles.certificatesCard}
        onPress={() => router.push({ pathname: '/certificates_section/List' })}
        activeOpacity={0.8}
      >
        <Image source={require("../../assets/images/Lynkt.png")} style={styles.certBadge} />
        <View style={{ flex: 1 }}>
          <Text style={styles.certTitle}>Certificates</Text>
          <Text style={styles.certDesc}>View and download your course certificates</Text>
        </View>
      </TouchableOpacity>

      {/* Achievement Cards */}
      {achievements.map((achievement) => (
        <View key={achievement.id} style={styles.card}>
          {/* Badge */}
          <Image source={achievement.badge} style={styles.badge} />

          {/* Achievement Details */}
          <View style={styles.details}>
            <Text style={styles.cardTitle}>{achievement.title}</Text>
            <Text style={styles.cardDescription}>{achievement.description}</Text>

            {/* Progress Bar */}
            <ProgressBar
              progress={achievement.progress}
              color={Colors.PRIMARY}
              style={styles.progressBar}
            />

            {/* Progress Text */}
            <Text style={styles.progressText}>
              {Math.round(achievement.progress * 100)}% Completed
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: Colors.WHITE,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.PRIMARY,
    marginBottom: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'lightgray',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  badge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  details: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: 'black',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'lightgray',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: 'lightgray',
  },
  certificatesCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.PRIMARY,
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  certBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    backgroundColor: "#fff",
  },
  certTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  certDesc: {
    fontSize: 13,
    color: "#f0f0f0",
  },
});