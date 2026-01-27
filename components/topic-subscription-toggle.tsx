/**
 * Topic Subscription Toggle Component
 *
 * Use this to let users subscribe/unsubscribe from notification topics
 */

import { subscribeToTopic, unsubscribeFromTopic } from "@/lib/snsTopics";
import React, { useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";

interface TopicToggleProps {
  topicArn: string;
  topicName: string;
  topicDescription?: string;
  initialSubscribed?: boolean;
  onSubscriptionChange?: (subscribed: boolean) => void;
}

export function TopicSubscriptionToggle({
  topicArn,
  topicName,
  topicDescription,
  initialSubscribed = false,
  onSubscriptionChange,
}: TopicToggleProps) {
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (value: boolean) => {
    setIsLoading(true);
    try {
      if (value) {
        const result = await subscribeToTopic(topicArn);
        if (result.success) {
          setIsSubscribed(true);
          onSubscriptionChange?.(true);
        }
      } else {
        const result = await unsubscribeFromTopic(topicArn);
        if (result.success) {
          setIsSubscribed(false);
          onSubscriptionChange?.(false);
        }
      }
    } catch (error) {
      console.error("Error toggling subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.name}>{topicName}</Text>
        {topicDescription && (
          <Text style={styles.description}>{topicDescription}</Text>
        )}
      </View>
      {isLoading ? (
        <ActivityIndicator color="#22c55e" />
      ) : (
        <Switch
          value={isSubscribed}
          onValueChange={handleToggle}
          trackColor={{ false: "#374151", true: "#22c55e" }}
          thumbColor={isSubscribed ? "#ffffff" : "#9ca3af"}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    marginBottom: 12,
  },
  content: {
    flex: 1,
    marginRight: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#9ca3af",
    lineHeight: 18,
  },
});
