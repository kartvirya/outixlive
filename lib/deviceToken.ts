/**
 * Device Token Management
 *
 * Generates a persistent device token that:
 * - Is created ONCE on first app launch
 * - Persists across app reloads, restarts, and kills
 * - Is cleared only when app is uninstalled
 * - Uses expo-crypto for React Native compatible UUID generation
 * - Automatically removes hyphens for AWS SNS compatibility
 * - Prevents race conditions with singleton pattern
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const DEVICE_TOKEN_KEY = "outix_device_token";

// In-memory cache to avoid multiple reads from AsyncStorage
let cachedToken: string | null = null;

// Promise to prevent race conditions during token generation
let tokenGenerationPromise: Promise<string> | null = null;

/**
 * Generate a UUID v4 using expo-crypto and remove hyphens for AWS SNS compatibility
 */
const generateUUID = async (): Promise<string> => {
  const uuid = await Crypto.randomUUID();
  // Remove hyphens for AWS SNS compatibility
  return uuid.replace(/-/g, '');
};

/**
 * Get the device token - generates once, then reuses forever
 * Uses in-memory cache and prevents race conditions
 *
 * @returns Promise<string> - The device token (UUID v4)
 */
export const getDeviceToken = async (): Promise<string> => {
  // Return cached token if available
  if (cachedToken) {
    return cachedToken;
  }

  // If token is currently being generated, wait for it
  if (tokenGenerationPromise) {
    return tokenGenerationPromise;
  }

  // Start new token generation
  tokenGenerationPromise = (async () => {
    try {
      // 1. Check if token already exists in storage
      const existingToken = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);

      if (existingToken) {
        // Check if existing token has hyphens and migrate if needed
        const cleanToken = existingToken.replace(/-/g, '');
        
        // If token was cleaned (had hyphens), save the cleaned version
        if (cleanToken !== existingToken) {
          console.log("[DEVICE-TOKEN] 🔄 Migrating token: removing hyphens for AWS SNS compatibility");
          await AsyncStorage.setItem(DEVICE_TOKEN_KEY, cleanToken);
          cachedToken = cleanToken;
          return cleanToken;
        }
        
        cachedToken = existingToken;
        return existingToken;
      }

      // 2. Generate new token (first install only) - already without hyphens
      const newToken = await generateUUID();

      // 3. Save to storage
      await AsyncStorage.setItem(DEVICE_TOKEN_KEY, newToken);

      // 4. Verify it was saved
      const savedToken = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
      if (savedToken !== newToken) {
        throw new Error("Token save verification failed");
      }

      cachedToken = newToken;
      return newToken;
    } catch (error) {
      cachedToken = null; // Clear cache on error
      throw error;
    } finally {
      tokenGenerationPromise = null; // Reset promise
    }
  })();

  return tokenGenerationPromise;
};

/**
 * Clear the device token (for testing/debugging only)
 * WARNING: This will break all subscriptions!
 */
export const clearDeviceToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(DEVICE_TOKEN_KEY);
    cachedToken = null; // Clear in-memory cache
  } catch (error) {
    throw error;
  }
};
