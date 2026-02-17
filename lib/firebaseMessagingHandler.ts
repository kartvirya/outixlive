/**
 * Firebase Messaging Handler for FCM/SNS push notifications
 *
 * When using SNS with FCM tokens directly, messages bypass Expo's push service.
 * FCM delivers to @react-native-firebase/messaging. We must handle:
 * - Foreground: FCM does NOT auto-display - we show via expo-notifications
 * - Background: FCM auto-displays IF message has notification payload
 *
 * This ensures notifications from SNS/FCM are displayed on Android.
 * Uses dynamic imports - Firebase & expo-notifications not available in Expo Go.
 */

import Constants from "expo-constants";
import { Platform } from "react-native";

let isInitialized = false;

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  try {
    const Notifications = await import("expo-notifications");
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  } catch {
    // Expo Go - notifications not available
  }
}

async function displayNotificationFromFCM(remoteMessage: {
  notification?: { title?: string; body?: string };
  data?: Record<string, string>;
}) {
  const title =
    remoteMessage.notification?.title || remoteMessage.data?.title || "Notification";
  const body =
    remoteMessage.notification?.body || remoteMessage.data?.body || "";

  try {
    const Notifications = await import("expo-notifications");
    await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: remoteMessage.data || {},
      sound: true,
      channelId: "default",
    },
    trigger: null, // Show immediately
  });
  } catch {
    // Expo Go - notifications not available
  }
}

export function initializeFirebaseMessagingHandler() {
  if (Platform.OS !== "android") return;
  if (Constants.appOwnership === "expo") return; // Skip in Expo Go - RNFBAppModule not available
  if (isInitialized) return;
  isInitialized = true;

  import("@react-native-firebase/messaging")
    .then(({ default: messaging }) => {
      if (typeof messaging !== "function") return;

      // Foreground: FCM does not auto-display - we must show manually
      messaging().onMessage(async (remoteMessage) => {
        console.log("[FCM] 📩 Foreground message received:", remoteMessage);
        try {
          await ensureAndroidChannel();
          await displayNotificationFromFCM(remoteMessage);
          console.log("[FCM] ✅ Notification displayed");
        } catch (err) {
          console.error("[FCM] ❌ Failed to display notification:", err);
        }
      });

      // Background/quit: optional handler for data messages
      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log("[FCM] 📩 Background message:", remoteMessage.messageId);
        // For notification messages, FCM displays automatically
        // This runs for data-only or to process before display
      });

      console.log("[FCM] ✅ Firebase Messaging handlers initialized");
    })
    .catch((err) => {
      console.warn("[FCM] ⚠️ Firebase Messaging not available:", err?.message);
    });
}
