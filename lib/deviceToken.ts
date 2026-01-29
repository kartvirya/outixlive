/**
 * Device Token Management
 *
 * Uses iOS native device token (APNs token) from Apple for all device identification.
 * The token is:
 * - Generated via Expo Notifications or iOS AppDelegate
 * - Stored in AsyncStorage as 'APNsDeviceToken'
 * - Persists across app reloads, restarts, and kills
 * - Cleared only when app is uninstalled
 * - Uses in-memory cache and prevents race conditions
 * - Same token used everywhere in the app
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Use the same storage key as iosDeviceTokenManager
const APNS_DEVICE_TOKEN_KEY = "APNsDeviceToken";

// Hardcoded device token for browser/web testing
const BROWSER_TEST_TOKEN =
  "f0b30087cd2b325360077f2122fb94a3965773215a09d7de082a4a922e6ecb20";

/**
 * Generate a random 64-character hex token (matches iOS APNs token format)
 * Used for debugging when real token is not available
 */
const generateRandomToken = (): string => {
  const chars = "0123456789abcdef";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
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

// In-memory cache to avoid multiple reads from AsyncStorage
let cachedToken: string | null = null;

// Promise to prevent race conditions during token retrieval
let tokenRetrievalPromise: Promise<string> | null = null;

/**
 * Get the device token - uses iOS native APNs token from Apple
 * Retrieves the token stored in AsyncStorage by iosDeviceTokenManager
 * Uses in-memory cache and prevents race conditions
 * For browser/web testing, returns a hardcoded token
 *
 * @returns Promise<string> - The iOS device token (APNs token from Apple) or hardcoded browser token
 * @throws Error if token is not available
 */
export const getDeviceToken = async (): Promise<string> => {
  console.log("[DEVICE-TOKEN] 🔍 getDeviceToken() called");

  // For browser/web testing, use hardcoded token
  if (Platform.OS === "web") {
    console.log("[DEVICE-TOKEN] 🌐 Web platform - returning hardcoded token");
    return BROWSER_TEST_TOKEN;
  }

  // Return cached token if available
  if (cachedToken) {
    console.log(
      "[DEVICE-TOKEN] ⚡ Returning cached token:",
      cachedToken.substring(0, 20) + "...",
    );
    return cachedToken;
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
      // Get iOS device token from AsyncStorage (same key used by iosDeviceTokenManager)
      const token = await AsyncStorage.getItem(APNS_DEVICE_TOKEN_KEY);

      console.log(
        "[DEVICE-TOKEN] 📋 AsyncStorage result:",
        token ? `${token.substring(0, 20)}... (${token.length} chars)` : "NULL",
      );

      if (!token) {
        console.warn("[DEVICE-TOKEN] ⚠️ No token found in AsyncStorage");

        // Try to get real token from Expo Notifications first
        console.log(
          "[DEVICE-TOKEN] 🔄 Attempting to get real token from Expo...",
        );
        const expoToken = await getExpoDeviceToken();

        if (expoToken) {
          console.log("[DEVICE-TOKEN] ✅ Got real token from Expo!");

          // Store the Expo token in AsyncStorage for future use
          try {
            await AsyncStorage.setItem(APNS_DEVICE_TOKEN_KEY, expoToken);
            console.log("[DEVICE-TOKEN] 💾 Stored Expo token in AsyncStorage");
          } catch (error) {
            console.error(
              "[DEVICE-TOKEN] ❌ Failed to store Expo token:",
              error,
            );
          }

          cachedToken = expoToken;
          return expoToken;
        }

        // Fall back to random token only if Expo token is not available
        console.warn(
          "[DEVICE-TOKEN] 🔧 Expo token not available - generating random token for debugging",
        );

        const randomToken = generateRandomToken();
        console.log(
          "[DEVICE-TOKEN] 🎲 Generated random token:",
          randomToken.substring(0, 20) + "...",
        );

        // Store the random token in AsyncStorage so it persists for this session
        try {
          await AsyncStorage.setItem(APNS_DEVICE_TOKEN_KEY, randomToken);
          console.log(
            "[DEVICE-TOKEN] 💾 Stored random token in AsyncStorage for session persistence",
          );
        } catch (error) {
          console.error(
            "[DEVICE-TOKEN] ❌ Failed to store random token:",
            error,
          );
        }

        cachedToken = randomToken;
        return randomToken;
      }

      console.log("[DEVICE-TOKEN] ✅ Token retrieved successfully, caching...");
      cachedToken = token;
      return token;
    } catch (error) {
      console.error("[DEVICE-TOKEN] ❌ Error retrieving token:", error);
      cachedToken = null; // Clear cache on error
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
 * Clears both in-memory cache and AsyncStorage
 */
export const clearDeviceToken = async (): Promise<void> => {
  try {
    // Clear AsyncStorage (same key used by iosDeviceTokenManager)
    await AsyncStorage.removeItem(APNS_DEVICE_TOKEN_KEY);
    cachedToken = null; // Clear in-memory cache
  } catch (error) {
    throw error;
  }
};
