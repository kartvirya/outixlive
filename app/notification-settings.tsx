import { Header } from "@/components/header";
import { TopicSubscriptionToggle } from "@/components/topic-subscription-toggle";
import { SNS_TOPICS } from "@/lib/snsTopics";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationSettingsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header />

      <View style={styles.titleContainer}>
        <Text style={styles.pageTitle}>Notification Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📬 General Notifications</Text>
          <Text style={styles.sectionDescription}>
            Choose which types of notifications you want to receive
          </Text>

          <TopicSubscriptionToggle
            topicArn={SNS_TOPICS.NOTIFICATIONS}
            topicName="🔔 Push Notifications"
            topicDescription="Get notified about events, alerts, and updates"
            initialSubscribed={true}
          />

          {/* Add more topic toggles as you create more SNS topics */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎭 Venue Subscriptions</Text>
          <Text style={styles.sectionDescription}>
            Manage your venue-specific notifications in the venue details page
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.infoText}>
            💡 You can manage individual venue notifications from the Events tab
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 16,
    lineHeight: 20,
  },
  info: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#22c55e",
  },
  infoText: {
    fontSize: 14,
    color: "#22c55e",
    lineHeight: 20,
  },
});
