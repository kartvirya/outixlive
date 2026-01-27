/**
 * AWS SNS Topic Management
 *
 * Manages subscriptions to AWS SNS topics for push notifications
 * Works with your existing SNS setup
 */

import { BASE_URL } from "@/constants/config";
import { getStoredDeviceToken } from "./iosDeviceTokenManager";

/**
 * SNS Topic configuration
 * Update these ARNs with your actual topic ARNs from AWS
 */
export const SNS_TOPICS = {
  // Your AWS SNS topic
  NOTIFICATIONS: "arn:aws:sns:eu-north-1:828043587172:outixracer-notifications",
  // Add more topics as needed
  // EVENTS: 'arn:aws:sns:eu-north-1:828043587172:outixracer-events',
  // ALERTS: 'arn:aws:sns:eu-north-1:828043587172:outixracer-alerts',
} as const;

export type TopicName = keyof typeof SNS_TOPICS;

/**
 * Subscribe device to an SNS topic
 */
export async function subscribeToTopic(topicArn: string): Promise<{
  success: boolean;
  subscriptionArn?: string;
  error?: string;
}> {
  try {
    const deviceToken = await getStoredDeviceToken();
    
    if (!deviceToken) {
      throw new Error("No iOS device token available");
    }

    const response = await fetch(`${BASE_URL}/subscribe-topic`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceToken,
        topicArn,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("✅ Subscribed to topic:", topicArn);
    return result;
  } catch (error) {
    console.error("❌ Error subscribing to topic:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Unsubscribe device from an SNS topic
 */
export async function unsubscribeFromTopic(topicArn: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const deviceToken = await getStoredDeviceToken();
    
    if (!deviceToken) {
      throw new Error("No iOS device token available");
    }

    const response = await fetch(`${BASE_URL}/unsubscribe-topic`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceToken,
        topicArn,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("✅ Unsubscribed from topic:", topicArn);
    return result;
  } catch (error) {
    console.error("❌ Error unsubscribing from topic:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Subscribe to topic by name (convenience function)
 */
export async function subscribeToTopicByName(topicName: TopicName) {
  const topicArn = SNS_TOPICS[topicName];
  if (!topicArn) {
    throw new Error(`Topic ${topicName} not configured`);
  }
  return subscribeToTopic(topicArn);
}

/**
 * Unsubscribe from topic by name (convenience function)
 */
export async function unsubscribeFromTopicByName(topicName: TopicName) {
  const topicArn = SNS_TOPICS[topicName];
  if (!topicArn) {
    throw new Error(`Topic ${topicName} not configured`);
  }
  return unsubscribeFromTopic(topicArn);
}

/**
 * Subscribe to multiple topics at once
 */
export async function subscribeToMultipleTopics(topicArns: string[]): Promise<{
  success: boolean;
  results: { topicArn: string; success: boolean; error?: string }[];
}> {
  const results = await Promise.all(
    topicArns.map(async (topicArn) => {
      const result = await subscribeToTopic(topicArn);
      return {
        topicArn,
        success: result.success,
        error: result.error,
      };
    }),
  );

  const allSuccessful = results.every((r) => r.success);

  return {
    success: allSuccessful,
    results,
  };
}

/**
 * Get user's current topic subscriptions
 */
export async function getUserSubscriptions(): Promise<{
  success: boolean;
  subscriptions?: { topicArn: string; subscriptionArn: string }[];
  error?: string;
}> {
  try {
    const deviceToken = await getDeviceToken();

    const response = await fetch(
      `${BASE_URL}/user-subscriptions?deviceToken=${deviceToken}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error getting subscriptions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Subscribe to venue-specific notifications
 * Assumes your backend creates SNS topics per venue
 */
export async function subscribeToVenue(venueId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const deviceToken = await getDeviceToken();

    const response = await fetch(`${BASE_URL}/venues/${venueId}/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ deviceToken }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log("✅ Subscribed to venue:", venueId);
    return await response.json();
  } catch (error) {
    console.error("❌ Error subscribing to venue:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Unsubscribe from venue notifications
 */
export async function unsubscribeFromVenue(venueId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const deviceToken = await getDeviceToken();

    const response = await fetch(`${BASE_URL}/venues/${venueId}/unsubscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ deviceToken }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log("✅ Unsubscribed from venue:", venueId);
    return await response.json();
  } catch (error) {
    console.error("❌ Error unsubscribing from venue:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
