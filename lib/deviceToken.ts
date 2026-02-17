/**
 * Device Token Management
 *
 * Platform-specific token generation:
 * - iOS: Uses APNs token from Apple (Expo Notifications or iOS AppDelegate)
 * - Android: Uses FCM token via FirebaseMessaging.getInstance().getToken()
 *
 * The token is:
 * - Stored in AsyncStorage as 'DeviceToken' (or 'APNsDeviceToken' for iOS compatibility)
 * - Persists across app reloads, restarts, and kills
 * - Cleared only when app is uninstalled
 * - Prevents race conditions during retrieval
 * - Same token used everywhere in the app
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

// expo-notifications: Use dynamic import - Android push was removed from Expo Go in SDK 53

// Use the same storage key as iosDeviceTokenManager for iOS
const APNS_DEVICE_TOKEN_KEY = "APNsDeviceToken";
// FCM token storage key for Android
const FCM_DEVICE_TOKEN_KEY = "FCMDeviceToken";

/**
 * Get FCM device token for Android using FirebaseMessaging.getInstance().getToken()
 * This is the recommended way to get the FCM registration token on Android
 */
const getFirebaseDeviceToken = async (): Promise<string | null> => {
  if (Platform.OS !== "android") return null;

  try {
    const messaging = (
      await import("@react-native-firebase/messaging")
    ).default;
    if (typeof messaging !== "function") return null;
    const token = await messaging().getToken();
    if (token) {
      console.log(
        "[DEVICE-TOKEN] ✅ Got FCM token from Firebase:",
        token.substring(0, 20) + "...",
      );
      console.log(
        "[DEVICE-TOKEN] 📊 FCM token length:",
        token.length,
        "chars",
      );
      return token;
    }
    return null;
  } catch (error) {
    console.error(
      "[DEVICE-TOKEN] ❌ Error getting Firebase FCM token:",
      error,
    );
    return null;
  }
};

/**
 * Try to get real device token from Expo Notifications
 * This bypasses the native bridge and gets token directly from iOS
 */
const getExpoDeviceToken = async (): Promise<string | null> => {
  try {
    console.log(
      "[DEVICE-TOKEN] 🔄 Attempting to get token via Expo Notifications...",
    );

    // Must be on physical device
    if (!Device.isDevice) {
      console.log(
        "[DEVICE-TOKEN] ⚠️ Not a physical device - Expo token not available",
      );
      return null;
    }

    // Dynamic import - expo-notifications Android push removed from Expo Go in SDK 53
    let Notifications: typeof import("expo-notifications");
    try {
      Notifications = await import("expo-notifications");
    } catch (e) {
      console.warn(
        "[DEVICE-TOKEN] ⚠️ expo-notifications not available (Expo Go?):",
        (e as Error)?.message,
      );
      return null;
    }

    // Check permissions
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      console.log("[DEVICE-TOKEN] ⚠️ Notification permissions not granted");
      return null;
    }

    // Get native device push token from Expo
    const devicePushToken = await Notifications.getDevicePushTokenAsync();

    if (devicePushToken?.data) {
      console.log(
        "[DEVICE-TOKEN] ✅ Got token from Expo:",
        devicePushToken.data.substring(0, 20) + "...",
      );
      console.log(
        "[DEVICE-TOKEN] 📊 Token length:",
        devicePushToken.data.length,
        "chars",
      );
      return devicePushToken.data;
    }

    return null;
  } catch (error) {
    console.error("[DEVICE-TOKEN] ❌ Error getting Expo token:", error);
    return null;
  }
};

// Promise to prevent race conditions during token retrieval
let tokenRetrievalPromise: Promise<string> | null = null;

/**
 * Get the device token - uses iOS native APNs token from Apple
 * Retrieves the token stored in AsyncStorage by iosDeviceTokenManager
 * Prevents race conditions during token retrieval
 *
 * @returns Promise<string> - The device token (APNs on iOS, FCM on Android)
 * @throws Error if token is not available
 */
export const getDeviceToken = async (): Promise<string> => {
  console.log("[DEVICE-TOKEN] 🔍 getDeviceToken() called");

  if (Platform.OS === "web") {
    throw new Error("Device token not available on web platform");
  }

  // If token is currently being retrieved, wait for it
  if (tokenRetrievalPromise) {
    console.log("[DEVICE-TOKEN] ⏳ Waiting for ongoing token retrieval...");
    return tokenRetrievalPromise;
  }

  console.log("[DEVICE-TOKEN] 📦 Retrieving token from AsyncStorage...");

  // Start new token retrieval
  tokenRetrievalPromise = (async () => {
    try {
      const storageKey =
        Platform.OS === "android" ? FCM_DEVICE_TOKEN_KEY : APNS_DEVICE_TOKEN_KEY;

      // Get device token from AsyncStorage (platform-specific key)
      let token = await AsyncStorage.getItem(storageKey);

      // Android FCM tokens are ~150+ chars; 64-char tokens are stale random fallbacks - clear and refetch
      if (
        token &&
        Platform.OS === "android" &&
        token.length === 64 &&
        /^[0-9a-f]{64}$/i.test(token)
      ) {
        console.log(
          "[DEVICE-TOKEN] 🧹 Clearing stale 64-char token (was random fallback), refetching...",
        );
        await AsyncStorage.removeItem(storageKey);
        token = null;
      }

      console.log(
        "[DEVICE-TOKEN] 📋 AsyncStorage result:",
        token ? `${token.substring(0, 20)}... (${token.length} chars)` : "NULL",
      );

      if (!token) {
        console.warn("[DEVICE-TOKEN] ⚠️ No token found in AsyncStorage");

        let platformToken: string | null = null;

        if (Platform.OS === "android" && Constants.appOwnership !== "expo") {
          // Android: Use Firebase when not in Expo Go (RNFBAppModule not available in Expo Go)
          console.log(
            "[DEVICE-TOKEN] 🔄 Attempting to get FCM token from Firebase...",
          );
          platformToken = await getFirebaseDeviceToken();
        }

        if (!platformToken) {
          // iOS or Firebase fallback: Try Expo Notifications
          console.log(
            "[DEVICE-TOKEN] 🔄 Attempting to get token from Expo Notifications...",
          );
          platformToken = await getExpoDeviceToken();
        }

        if (platformToken) {
          console.log("[DEVICE-TOKEN] ✅ Got real token!");
          console.log(
            "[DEVICE-TOKEN] 📱 GENERATED DEVICE TOKEN (full, for debugging):",
            platformToken,
          );

          // Store the token in AsyncStorage for future use
          try {
            await AsyncStorage.setItem(storageKey, platformToken);
            console.log(
              "[DEVICE-TOKEN] 💾 Stored token in AsyncStorage (",
              storageKey,
              ")",
            );
          } catch (error) {
            console.error(
              "[DEVICE-TOKEN] ❌ Failed to store token:",
              error,
            );
          }

          return platformToken;
        }

        throw new Error(
          "Failed to get device token from Firebase or Expo Notifications",
        );
      }

      console.log("[DEVICE-TOKEN] ✅ Token retrieved from AsyncStorage");
      console.log(
        "[DEVICE-TOKEN] 📱 DEVICE TOKEN (full, for debugging):",
        token,
      );
      return token;
    } catch (error) {
      console.error("[DEVICE-TOKEN] ❌ Error retrieving token:", error);
      throw error;
    } finally {
      tokenRetrievalPromise = null; // Reset promise
      console.log("[DEVICE-TOKEN] 🏁 Token retrieval complete");
    }
  })();

  return tokenRetrievalPromise;
};

/**
 * Clear the device token (for testing/debugging only)
 * WARNING: This will break all subscriptions!
 * Clears AsyncStorage so next run fetches fresh token from Firebase/Expo
 */
export const clearDeviceToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(APNS_DEVICE_TOKEN_KEY);
    await AsyncStorage.removeItem(FCM_DEVICE_TOKEN_KEY);
  } catch (error) {
    throw error;
  }
};
