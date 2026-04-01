/**
 * Push Notification Setup for AWS SNS/Pinpoint
 *
 * This module handles:
 * - Requesting notification permissions
 * - Getting push notification tokens (APNs for iOS, FCM for Android)
 * - Registering tokens with AWS SNS via backend
 * - Handling incoming notifications
 */

import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

// expo-notifications: Use dynamic import - Android push removed from Expo Go in SDK 53
async function getNotifications() {
  try {
    return await import("expo-notifications");
  } catch {
    return null;
  }
}
import {
  getOrCreateEndpointArn,
  registerTokenWithSNS,
  sendPushNotificationViaSNS,
} from "./awsSnsServiceSimple";
import {
  logTokenValidation,
  validateAndFormatSNSToken,
} from "./awsSnsTokenUtils";
import { getDeviceToken } from "./deviceToken";
import {
  startListeningForDeviceToken,
  storeDeviceToken,
} from "./iosDeviceTokenManager";
import { ensureDeviceTokenRegistered } from "./tokenRegistration";

// NOTE: Notification handler is now configured in app/_layout.tsx at module level
// This ensures it's set up BEFORE any components mount (critical for production)

/**
 * Request notification permissions and setup Android channel
 * This should be called before getting push tokens
 */
export async function requestNotificationPermissions() {
  const Notifications = await getNotifications();
  if (!Notifications) return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (!Device.isDevice) {
    return false;
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: false,
          allowCriticalAlerts: false,
          provideAppNotificationSettings: false,
          allowProvisional: false,
          allowAnnouncements: false,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Request notification permissions from the user
 * Returns native device token for AWS SNS (APNs/FCM)
 */
export async function registerForPushNotificationsAsync() {
  const hasPermission = await requestNotificationPermissions();

  if (!hasPermission) {
    return null;
  }

  try {
    const Notifications = await getNotifications();
    if (!Notifications) return null;
    // Get native device token (APNs for iOS, FCM for Android)
    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    const token = devicePushToken.data;

    return token;
  } catch (error) {
    return null;
  }
}

/**
 * Get Expo Push Token (for Expo Push Service)
 * This is the token used by expo-server-sdk
 */
export async function getExpoPushTokenAsync() {
  console.log("[EXPO-TOKEN] 🚀 Starting Expo push token generation...");

  if (!Device.isDevice) {
    console.log(
      "[EXPO-TOKEN] ⚠️ Must use physical device for Push Notifications",
    );
    return null;
  }
  console.log("[EXPO-TOKEN] ✅ Running on physical device");

  try {
    console.log("[EXPO-TOKEN] 🔍 Looking for project ID in app config...");
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.warn("[EXPO-TOKEN] ⚠️ Project ID not found in app config");
    } else {
      console.log(`[EXPO-TOKEN] ✅ Found project ID: ${projectId}`);
    }

    console.log("[EXPO-TOKEN] 📱 Requesting Expo push token from service...");
    const Notifications = await getNotifications();
    if (!Notifications) return null;
    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log(
      "[EXPO-TOKEN] ✅ Expo Push Token obtained:",
      pushToken.data.substring(0, 20) + "...",
    );
    console.log(
      `[EXPO-TOKEN] 📊 Token length: ${pushToken.data.length} characters`,
    );

    return pushToken.data;
  } catch (error) {
    console.error("[EXPO-TOKEN] ❌ Error getting expo push token:", error);
    console.error("[EXPO-TOKEN] 🔍 Error details:", {
      message: error.message,
      stack: error.stack,
    });
    return null;
  }
}

/**
 * Format push token for AWS SNS compatibility
 * Ensures token meets AWS SNS requirements (≤400 hex characters)
 */
const formatTokenForSNS = (
  token: string,
  platform: string,
): { formattedToken: string; isValid: boolean; warnings: string[] } => {
  const validation = validateAndFormatSNSToken(
    token,
    platform as "ios" | "android",
  );

  // Log validation results for debugging
  logTokenValidation(validation, platform);

  return {
    formattedToken: validation.formattedToken || token,
    isValid: validation.isValid,
    warnings: validation.warnings,
  };
};

/**
 * Get device-specific push token (APNs/FCM)
 * This is the token AWS SNS needs for direct push notifications
 * Assumes permissions have already been granted
 */
export async function getDevicePushToken() {
  console.log("[DEVICE-TOKEN] 🚀 Starting device token generation process...");

  if (!Device.isDevice) {
    console.log(
      "[DEVICE-TOKEN] ⚠️ Must use physical device for Push Notifications",
    );
    return null;
  }
  console.log("[DEVICE-TOKEN] ✅ Running on physical device");

  // Check permissions first (should already be granted)
  console.log("[DEVICE-TOKEN] 🔍 Checking notification permissions...");
  const Notifications = await getNotifications();
  if (!Notifications) return null;
  const { status } = await Notifications.getPermissionsAsync();
  console.log(`[DEVICE-TOKEN] 📋 Permission status: ${status}`);

  if (status !== "granted") {
    console.log("[DEVICE-TOKEN] ❌ Permissions not granted");
    return null;
  }
  console.log("[DEVICE-TOKEN] ✅ Permissions confirmed as granted");

  try {
    let tokenData: string;
    let tokenType: "ios" | "android";

    if (Platform.OS === "android") {
      // Skip Firebase in Expo Go - native module not available, causes RNFBAppModule error
      const isExpoGo = Constants.appOwnership === "expo";
      if (!isExpoGo) {
        console.log(
          "[DEVICE-TOKEN] 📱 Requesting FCM token from Firebase Messaging...",
        );
        try {
          const messaging = (await import("@react-native-firebase/messaging"))
            .default;
        if (typeof messaging === "function") {
          tokenData = await messaging().getToken();
          tokenType = "android";
          console.log(
            "[DEVICE-TOKEN] 🎯 FCM token generation successful via Firebase!",
          );
        } else {
          throw new Error("Firebase messaging not available");
        }
      } catch (firebaseError) {
        console.warn(
          "[DEVICE-TOKEN] ⚠️ Firebase unavailable, using Expo for FCM token:",
          firebaseError?.message || firebaseError,
        );
        const NotificationsFallback = await getNotifications();
        if (!NotificationsFallback) throw new Error("Expo notifications not available");
        const devicePushToken =
          await NotificationsFallback.getDevicePushTokenAsync();
        tokenData = devicePushToken.data;
        tokenType = devicePushToken.type as "ios" | "android";
        console.log(
          "[DEVICE-TOKEN] 🎯 FCM token obtained via Expo Notifications",
        );
      }
      } else {
        // Expo Go: Use Expo Notifications directly, skip Firebase
        const NotificationsFallback = await getNotifications();
        if (!NotificationsFallback) throw new Error("Expo notifications not available");
        const devicePushToken =
          await NotificationsFallback.getDevicePushTokenAsync();
        tokenData = devicePushToken.data;
        tokenType = devicePushToken.type as "ios" | "android";
        console.log(
          "[DEVICE-TOKEN] 🎯 FCM token obtained via Expo Notifications (Expo Go)",
        );
      }
    } else {
      // iOS: Use Expo Notifications for APNs token
      console.log(
        "[DEVICE-TOKEN] 📱 Requesting native device push token from system...",
      );
      const devicePushToken =
        await Notifications.getDevicePushTokenAsync();
      tokenData = devicePushToken.data;
      tokenType = devicePushToken.type as "ios" | "android";
      console.log(
        `[DEVICE-TOKEN] 🎯 Token generation successful! Platform: ${devicePushToken.type}`,
      );
    }

    console.log(
      "[DEVICE-TOKEN] 🔍 Raw token obtained:",
      tokenData.substring(0, 20) + "...",
      `(${tokenData.length} chars)`,
    );

    // Format token for AWS SNS compatibility using comprehensive validation
    const formatResult = formatTokenForSNS(tokenData, tokenType);

    if (!formatResult.isValid) {
      console.error("[DEVICE-TOKEN] ❌ Token validation failed");
      return null;
    }

    if (formatResult.warnings.length > 0) {
      console.warn(
        "[DEVICE-TOKEN] ⚠️ Token formatting warnings:",
        formatResult.warnings,
      );
    }

    console.log(
      "[DEVICE-TOKEN] ✅ Formatted token:",
      formatResult.formattedToken.substring(0, 20) + "...",
      `(${formatResult.formattedToken.length} chars)`,
    );
    console.log(
      "[DEVICE-TOKEN] 📱 GENERATED DEVICE TOKEN (full, for debugging):",
      formatResult.formattedToken,
    );

    return {
      data: formatResult.formattedToken,
      type: tokenType,
      originalData: tokenData,
      isValid: formatResult.isValid,
      warnings: formatResult.warnings,
    };
  } catch (error) {
    console.error("[DEVICE-TOKEN] ❌ Error getting device push token:", error);
    return null;
  }
}

/**
 * Register push token with your backend (local development or production)
 * @param backendUrl - Your API base URL (legacy parameter, now uses PUSH_ENDPOINTS)
 */
export async function registerPushTokenWithBackend(backendUrl?: string) {
  console.log("[BACKEND-REGISTER] 🚀 Starting backend registration process...");

  try {
    // Import here to avoid circular dependency
    const {
      PUSH_ENDPOINTS,
      IS_DEVELOPMENT,
      DEBUG_PUSH,
    } = require("@/constants/config");

    console.log(
      `[BACKEND-REGISTER] 🔧 Environment: ${IS_DEVELOPMENT ? "DEVELOPMENT" : "PRODUCTION"}`,
    );
    console.log(
      `[BACKEND-REGISTER] 📍 Register endpoint: ${PUSH_ENDPOINTS.REGISTER_TOKEN}`,
    );

    console.log("[BACKEND-REGISTER]  Getting push tokens...");
    const pushToken = await getExpoPushTokenAsync(); // Expo Token
    console.log(
      `[BACKEND-REGISTER] ${pushToken ? "✅" : "❌"} Expo token: ${pushToken ? pushToken.substring(0, 20) + "..." : "Failed"}`,
    );

    const nativeToken = await getDevicePushToken(); // Native Token (APNs/FCM)
    console.log(
      `[BACKEND-REGISTER] ${nativeToken ? "✅" : "❌"} Native token: ${nativeToken ? nativeToken.data.substring(0, 20) + "..." : "Failed"}`,
    );

    if (!nativeToken && !pushToken) {
      console.log("[TOKEN] ⚠️ No push tokens available (Native or Expo)");
      return null;
    }

    // deviceToken = native push token used for backend identification
    const deviceToken = nativeToken?.data ?? null;

    // Validate native token for AWS SNS
    if (nativeToken) {
      const tokenLength = nativeToken.data.length;
      const platform = nativeToken.type;

      console.log(
        `[TOKEN] 🔍 Validating ${platform} token: ${tokenLength} chars`,
      );

      if (tokenLength > 400) {
        console.error(
          `[TOKEN] ❌ Token too long for AWS SNS: ${tokenLength} chars (max 400)`,
        );
        return null;
      }

      if (platform === "ios" && tokenLength !== 64) {
        console.warn(
          `[TOKEN] ⚠️ iOS token unexpected length: ${tokenLength} (expected 64)`,
        );
      }

      // Check if token contains only valid characters
      // Android FCM tokens from Expo use format senderId:fcmToken (colon is valid)
      const validPattern =
        platform === "ios" ? /^[a-fA-F0-9]+$/ : /^[a-zA-Z0-9\+\/\=\_\-:]+$/;
      if (!validPattern.test(nativeToken.data)) {
        console.warn(
          `[TOKEN] ⚠️ Token contains invalid characters for ${platform}`,
        );
      }

      console.log(`[TOKEN] ✅ Token validation passed for ${platform}`);
    }

    if (DEBUG_PUSH) {
      console.log(
        "[PUSH] 🚀 Registering with backend (" +
          (IS_DEVELOPMENT ? "LOCAL" : "PRODUCTION") +
          ")...",
      );
      console.log(
        "[PUSH] Device Token:",
        deviceToken?.substring(0, 20) + "...",
      );
      if (nativeToken) {
        console.log(
          "[PUSH] Native Token:",
          nativeToken.data.substring(0, 20) +
            "... (" +
            nativeToken.data.length +
            " chars)",
        );
        console.log("[PUSH] Platform:", nativeToken.type);
        if (
          nativeToken.originalData &&
          nativeToken.originalData !== nativeToken.data
        ) {
          console.log(
            "[PUSH] Original Token (pre-format):",
            nativeToken.originalData.substring(0, 20) + "...",
          );
        }
      }
      if (pushToken) {
        console.log(
          "[PUSH] Expo Push Token:",
          pushToken.substring(0, 20) + "...",
        );
      }
    }

    // Use new local backend endpoint
    const url = PUSH_ENDPOINTS.REGISTER_TOKEN;
    console.log("[BACKEND-REGISTER] 📍 Backend URL:", url);

    const requestPayload = {
      deviceToken: deviceToken,
      pushToken: nativeToken?.data, // Send formatted Native Token (APNs/FCM) for AWS SNS
      expoPushToken: pushToken, // Send Expo token as auxiliary
      platform: nativeToken?.type || Platform.OS, // Use native token type or Platform.OS
      userId: deviceToken ?? pushToken ?? null, // Use deviceToken or pushToken as userId
      timestamp: new Date().toISOString(),
      // Add metadata for debugging AWS SNS issues
      tokenLength: nativeToken?.data?.length,
      originalTokenLength: nativeToken?.originalData?.length,
    };

    console.log("[BACKEND-REGISTER] 📦 Request payload:", {
      ...requestPayload,
      deviceToken: requestPayload.deviceToken?.substring(0, 20) + "...",
      pushToken: requestPayload.pushToken?.substring(0, 20) + "...",
      expoPushToken: requestPayload.expoPushToken?.substring(0, 20) + "...",
    });

    console.log("[BACKEND-REGISTER] ═══════════════════════════════════════");
    console.log(`[BACKEND-REGISTER] 🌐 URL: ${url}`);
    console.log(
      "[BACKEND-REGISTER] 📡 Sending POST (if this hangs or fails, check:)",
    );
    console.log(
      "   - Dev: Is backend running? Use 'adb reverse tcp:3000 tcp:3000' for physical device",
    );
    console.log("   - Network: Can device reach this URL?");
    console.log("[BACKEND-REGISTER] ═══════════════════════════════════════");
    // Send to your backend (updated for new API format)
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    console.log(
      `[BACKEND-REGISTER] 📡 Backend response status: ${response.status} ${response.statusText}`,
    );

    if (!response.ok) {
      const errorText = await response.text();
      const isInvalidRoute =
        response.status === 404 && errorText.includes("Invalid route");

      // Check if it's actually a "token already exists" success case
      if (
        response.status === 404 &&
        errorText.includes("Token may already exist")
      ) {
        console.log(
          "[BACKEND-REGISTER] ✅ Token already registered (this is acceptable)",
        );
        return { success: true, message: "Token already exists" };
      }

      // Known backend limitation: route not implemented - log as info, not error
      if (isInvalidRoute) {
        console.log(
          "[BACKEND-REGISTER] ℹ️ register-push-token route not implemented on backend (using SNS/registertoken instead)",
        );
        return null;
      }

      console.warn(
        `[BACKEND-REGISTER] ⚠️ Backend registration failed: ${response.status} - ${errorText.slice(0, 100)}`,
      );
      return null;
    }

    console.log("[BACKEND-REGISTER] ✅ Backend responded successfully");
    const result = await response.json();
    console.log("[BACKEND-REGISTER] 📋 Backend registration response:", result);

    if (result.success !== false) {
      console.log(
        "[BACKEND-REGISTER] 🎉 Push token registered successfully with backend!",
      );
    }
    return result;
  } catch (error: any) {
    console.error(
      "[BACKEND-REGISTER] ❌ ================================================",
    );
    console.error(
      "[BACKEND-REGISTER] ❌ BACKEND REGISTRATION FAILED WITH EXCEPTION",
    );
    console.error(
      "[BACKEND-REGISTER] ❌ ================================================",
    );
    console.error(`[BACKEND-REGISTER] ❌ Error type: ${error?.name ?? "unknown"}`);
    console.error(`[BACKEND-REGISTER] ❌ Message: ${error?.message ?? String(error)}`);
    if (error?.message === "Network request failed") {
      console.error(
        "[BACKEND-REGISTER] ❌ 'Network request failed' = device cannot reach URL",
      );
      console.error(
        "[BACKEND-REGISTER] ❌ Dev+physical device: run 'adb reverse tcp:3000 tcp:3000'",
      );
    }
    if (error?.message === "Network request failed") {
      console.error(
        "[BACKEND-REGISTER] ❌ 'Network request failed' = fetch could not connect.",
      );
      console.error(
        "   → Dev + localhost: Physical device cannot reach localhost (use adb reverse tcp:3000 tcp:3000)",
      );
      console.error("   → Check: WiFi, DNS, firewall, backend running");
    }
    console.error(`[BACKEND-REGISTER] ❌ Stack: ${error?.stack?.slice(0, 300)}`);
    console.error(
      "[BACKEND-REGISTER] ❌ ================================================",
    );
    // Don't throw - allow app to continue even if registration fails
    return null;
  }
}

/**
 * Setup notification listeners
 * Returns Promise<cleanup> - use async/await or .then() for cleanup
 */
export async function setupNotificationListeners(
  onNotificationReceived?: (notification: any) => void,
  onNotificationTapped?: (response: any) => void,
): Promise<() => void> {
  const Notifications = await getNotifications();
  if (!Notifications) return () => {};

  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification: any) => {
      console.log("Notification received:", notification);
      onNotificationReceived?.(notification);
    },
  );

  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log("Notification tapped:", response);
      onNotificationTapped?.(response);
    });

  return () => {
    notificationListener?.remove();
    responseListener?.remove();
  };
}

/**
 * Send push notification data to AWS SNS endpoint
 * (This would typically be called from your backend)
 */
export interface SNSPushPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(payload: SNSPushPayload) {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      data: payload.data,
      badge: payload.badge,
      sound: payload.sound || "default",
    },
    trigger: null, // Show immediately
  });
}

/**
 * New API functions for local backend integration
 */

/**
 * Send a test notification using the local backend
 * @param pushToken - Optional push token, if not provided will get current device token
 */
export async function sendTestNotification(pushToken?: string) {
  try {
    const { PUSH_ENDPOINTS, DEBUG_PUSH } = require("@/constants/config");

    let tokenToUse = pushToken;
    if (!tokenToUse) {
      const devicePushToken = await getDevicePushToken();
      if (!devicePushToken) {
        throw new Error("No push token available");
      }
      tokenToUse = devicePushToken.data;
    }

    if (DEBUG_PUSH) {
      console.log("[TEST] 📤 Sending test notification...");
    }

    const response = await fetch(PUSH_ENDPOINTS.TEST_NOTIFICATION, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pushToken: tokenToUse,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Test notification failed: ${response.status} ${errorText}`,
      );
    }

    const result = await response.json();
    if (DEBUG_PUSH) {
      console.log("[TEST] ✅ Test notification sent successfully");
    }
    return result;
  } catch (error) {
    console.error("[TEST] ❌ Error sending test notification:", error);
    throw error;
  }
}

/**
 * Initialize iOS native device token listener
 * This connects the iOS AppDelegate device token to React Native
 */
export function initializeIOSDeviceTokenListener() {
  console.log(
    "[iOS INTEGRATION] 🔗 Initializing iOS device token integration...",
  );

  if (Platform.OS !== "ios") {
    console.log(
      "[iOS INTEGRATION] ⚠️ iOS integration only available on iOS platform",
    );
    return null;
  }

  // Start listening for device token from iOS AppDelegate
  const cleanup = startListeningForDeviceToken(async (deviceToken: string) => {
    console.log(
      "[iOS INTEGRATION] 🎯 Device token received from iOS AppDelegate!",
    );
    console.log(
      `[iOS INTEGRATION] 📱 Token: ${deviceToken.substring(0, 20)}...`,
    );
    console.log(
      `[iOS INTEGRATION] 📊 Length: ${deviceToken.length} characters`,
    );

    // Store the token
    await storeDeviceToken(deviceToken);

    try {
      console.log("[iOS INTEGRATION] ☁️ Registering device token (once)...");
      const reg = await ensureDeviceTokenRegistered(deviceToken);
      if (!reg.skipped) {
        console.log(
          "[iOS INTEGRATION] ✅ Device token registered successfully",
        );
      } else if (reg.error) {
        console.warn(
          "[iOS INTEGRATION] ⚠️ Device token registration skipped/error:",
          reg.error,
        );
      } else {
        console.log(
          "[iOS INTEGRATION] ✅ Device token already registered, skipping",
        );
      }
    } catch (error) {
      console.error(
        "[iOS INTEGRATION] ❌ Error during device token registration:",
        error,
      );
    }
  });

  console.log("[iOS INTEGRATION] ✅ iOS device token listener initialized");
  return cleanup;
}

/**
 * Get device token with iOS integration
 * Tries iOS native first, then falls back to Expo method
 */
export async function getDeviceTokenWithIOSIntegration() {
  console.log("[iOS TOKEN] 🔍 Getting device token with iOS integration...");

  if (Platform.OS === "ios") {
    // Try to get stored token from iOS first (same token used everywhere)
    console.log("[iOS TOKEN] 📱 Checking for stored iOS native token...");
    try {
      const storedToken = await getDeviceToken();

      console.log(
        `[iOS TOKEN] ✅ Found stored iOS token: ${storedToken.substring(0, 20)}...`,
      );
      return {
        data: storedToken,
        type: "ios",
        source: "native_ios",
        isValid: true,
        warnings: [],
      };
    } catch (error) {
      console.log(
        "[iOS TOKEN] ⚠️ No stored iOS token found, falling back to Expo method...",
      );
    }
  }

  // Fall back to regular Expo method
  return getDevicePushToken();
}

/**
 * Complete push notification setup with automatic SNS endpoint registration
 * This function handles the entire flow: permissions -> token -> SNS registration
 */
export async function setupPushNotificationsWithSNS() {
  console.log("[SETUP] 🚀 ================================================");
  console.log("[SETUP] 🚀 Starting COMPLETE push notification setup with SNS");
  console.log("[SETUP] 🚀 ================================================");

  try {
    // Step 1: Request permissions
    console.log("[SETUP] 📋 STEP 1: Requesting notification permissions...");
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.error(
        "[SETUP] ❌ STEP 1 FAILED: Push notification permissions denied",
      );
      return {
        success: false,
        error: "Push notification permissions denied",
      };
    }
    console.log("[SETUP] ✅ STEP 1 COMPLETE: Permissions granted");

    // Step 2: Get device token
    console.log("[SETUP] 📱 STEP 2: Getting device push token...");
    const nativeToken = await getDevicePushToken();
    if (!nativeToken || !nativeToken.data) {
      console.error("[SETUP] ❌ STEP 2 FAILED: Failed to obtain device token");
      return {
        success: false,
        error: "Failed to obtain device token",
      };
    }

    console.log(
      `[SETUP] ✅ STEP 2 COMPLETE: Device token obtained: ${nativeToken.data.substring(0, 20)}... (${nativeToken.type})`,
    );
    console.log(
      `[SETUP] 📊 Token details: ${nativeToken.data.length} characters, platform: ${nativeToken.type}`,
    );

    // Step 3: Register with backend
    console.log("[SETUP] 🏢 STEP 3: Registering with backend...");
    const backendResult = await registerPushTokenWithBackend();
    if (!backendResult) {
      console.warn(
        "[SETUP] ⚠️ STEP 3 WARNING: Backend registration failed, continuing with SNS...",
      );
      console.warn(
        "[SETUP] 🔍 This might be okay if backend is not required for SNS",
      );
    } else {
      console.log(
        "[SETUP] ✅ STEP 3 COMPLETE: Backend registration successful",
      );
    }

    // Step 4: Register device token with SNS endpoint
    console.log(
      "[SETUP] ☁️ STEP 4: Registering device token with SNS endpoint...",
    );
    const snsResult = await registerDeviceTokenWithSNSEndpoint(
      nativeToken.data,
    );
    if (!snsResult || !snsResult.success) {
      console.error(
        "[SETUP] ❌ STEP 4 FAILED: SNS endpoint registration failed",
      );
      console.error(
        `[SETUP] 🔍 SNS Error: ${snsResult?.error || "Unknown error"}`,
      );
      console.error("[SETUP] 🔍 Possible issues:");
      console.error("  - Backend SNS endpoint not configured");
      console.error("  - AWS credentials/permissions");
      console.error("  - Network connectivity");
      console.error("  - Invalid device token");
      return {
        success: false,
        error: snsResult?.error || "SNS endpoint registration failed",
        deviceToken: nativeToken.data,
        platform: nativeToken.type,
      };
    }
    console.log(
      "[SETUP] ✅ STEP 4 COMPLETE: SNS endpoint registration successful",
    );
    if (snsResult.endpointArn) {
      console.log(`[SETUP] 🎯 SNS Endpoint ARN: ${snsResult.endpointArn}`);
    }

    console.log("[SETUP] 🎉 ================================================");
    console.log("[SETUP] 🎉 COMPLETE SETUP SUCCESSFUL!");
    console.log(`[SETUP] 🎉 Platform: ${nativeToken.type}`);
    console.log(
      `[SETUP] 🎉 Device Token: ${nativeToken.data.substring(0, 20)}...`,
    );
    console.log(
      `[SETUP] 🎉 SNS Endpoint: ${snsResult.endpointArn ? "Created" : "N/A"}`,
    );
    console.log("[SETUP] 🎉 ================================================");

    return {
      success: true,
      deviceToken: nativeToken.data,
      platform: nativeToken.type,
      endpointArn: snsResult.endpointArn,
      message: "Push notifications setup complete with SNS endpoint",
    };
  } catch (error: any) {
    console.error(
      "[SETUP] ❌ ================================================",
    );
    console.error("[SETUP] ❌ SETUP FAILED WITH EXCEPTION");
    console.error(
      "[SETUP] ❌ ================================================",
    );
    console.error("[SETUP] ❌ Error details:", error);
    console.error(`[SETUP] ❌ Error message: ${error.message}`);
    console.error(`[SETUP] ❌ Error stack: ${error.stack}`);
    console.error(
      "[SETUP] ❌ ================================================",
    );
    return {
      success: false,
      error: error.message || "Unknown error during setup",
    };
  }
}

/**
 * Register device token with SNS endpoint
 * Creates an SNS platform endpoint for the device token
 */
export async function registerDeviceTokenWithSNSEndpoint(
  deviceToken?: string,
): Promise<{
  success: boolean;
  endpointArn?: string;
  message?: string;
  error?: string;
} | null> {
  console.log(
    "[SNS ENDPOINT] 🚀 Starting SNS endpoint registration process...",
  );

  try {
    const { PUSH_ENDPOINTS, DEBUG_PUSH } = require("@/constants/config");
    console.log(
      `[SNS ENDPOINT] 📍 SNS endpoint URL: ${PUSH_ENDPOINTS.REGISTER_SNS_ENDPOINT}`,
    );

    // Get device token if not provided
    let tokenToUse = deviceToken;
    if (!tokenToUse) {
      console.log(
        "[SNS ENDPOINT] 📱 No device token provided, fetching from device...",
      );
      const nativeToken = await getDevicePushToken();
      if (!nativeToken || !nativeToken.data) {
        console.error(
          "[SNS ENDPOINT] ❌ Failed to get device token for SNS registration",
        );
        return {
          success: false,
          error: "No valid device token available",
        };
      }
      tokenToUse = nativeToken.data;
      console.log(
        `[SNS ENDPOINT] ✅ Retrieved device token: ${tokenToUse.substring(0, 20)}... (${nativeToken.type})`,
      );
    } else {
      console.log(
        `[SNS ENDPOINT] ✅ Using provided device token: ${tokenToUse.substring(0, 20)}...`,
      );
    }

    console.log(
      "[SNS ENDPOINT] 🎯 Preparing SNS endpoint registration request...",
    );

    const requestPayload = {
      deviceToken: tokenToUse,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
      endpointType: "sns", // Specify this is for SNS endpoint creation
    };

    console.log("[SNS ENDPOINT] 📦 Request payload:", {
      ...requestPayload,
      deviceToken: requestPayload.deviceToken.substring(0, 20) + "...",
    });

    console.log(
      "[SNS ENDPOINT] 🌐 Sending SNS endpoint registration request...",
    );
    // Call the dedicated SNS endpoint registration endpoint
    const response = await fetch(PUSH_ENDPOINTS.REGISTER_SNS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        devicetoken: tokenToUse,
      },
      body: JSON.stringify(requestPayload),
    });

    console.log(
      `[SNS ENDPOINT] 📡 SNS registration response status: ${response.status} ${response.statusText}`,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[SNS ENDPOINT] ❌ SNS registration failed: ${response.status} ${response.statusText}`,
      );
      console.error("[SNS ENDPOINT] 📄 Error details:", errorText);
      console.error("[SNS ENDPOINT] 🔍 This might indicate:");
      console.error("  - Backend endpoint not available");
      console.error("  - AWS SNS configuration issues");
      console.error("  - Network connectivity problems");
      console.error("  - Invalid device token format");
      return {
        success: false,
        error: `Registration failed: ${response.status} ${errorText}`,
      };
    }

    console.log("[SNS ENDPOINT] ✅ SNS registration request successful");
    const result = await response.json();
    console.log("[SNS ENDPOINT] 📋 SNS registration response:", result);

    if (result.endpointArn) {
      console.log(
        `[SNS ENDPOINT] 🎯 SNS Endpoint ARN created: ${result.endpointArn}`,
      );
    } else {
      console.warn("[SNS ENDPOINT] ⚠️ No endpoint ARN returned in response");
    }

    console.log(
      "[SNS ENDPOINT] 🎉 SNS endpoint registration completed successfully!",
    );
    return {
      success: true,
      endpointArn: result.endpointArn,
      message: result.message || "Device token registered with SNS endpoint",
    };
  } catch (error: any) {
    console.error(
      "[SNS ENDPOINT] ❌ Error registering with SNS endpoint:",
      error,
    );
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
}

/**
 * Send a notification to a specific device
 */
export async function sendNotificationToDevice(
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, any>,
) {
  try {
    const { PUSH_ENDPOINTS, DEBUG_PUSH } = require("@/constants/config");

    if (DEBUG_PUSH) {
      console.log(
        "[SEND] 📤 Sending notification to device:",
        deviceToken.substring(0, 20) + "...",
      );
    }

    const response = await fetch(PUSH_ENDPOINTS.SEND_NOTIFICATION, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceToken,
        title,
        body,
        data,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Send notification failed: ${response.status} ${errorText}`,
      );
    }

    const result = await response.json();
    if (DEBUG_PUSH) {
      console.log("[SEND] ✅ Notification sent successfully");
    }
    return result;
  } catch (error) {
    console.error("[SEND] ❌ Error sending notification:", error);
    throw error;
  }
}

/**
 * Send a broadcast notification to all registered devices
 */
export async function sendBroadcastNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
) {
  try {
    const { PUSH_ENDPOINTS, DEBUG_PUSH } = require("@/constants/config");

    if (DEBUG_PUSH) {
      console.log("[BROADCAST] 📢 Sending broadcast notification...");
    }

    const response = await fetch(PUSH_ENDPOINTS.BROADCAST, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        body,
        data,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Broadcast failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    if (DEBUG_PUSH) {
      console.log(
        "[BROADCAST] ✅ Broadcast sent successfully to",
        result.deviceCount || 0,
        "devices",
      );
    }
    return result;
  } catch (error) {
    console.error("[BROADCAST] ❌ Error sending broadcast:", error);
    throw error;
  }
}

/**
 * Get all registered devices
 */
export async function getRegisteredDevices() {
  try {
    const { PUSH_ENDPOINTS } = require("@/constants/config");

    const response = await fetch(PUSH_ENDPOINTS.GET_DEVICES);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Get devices failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[DEVICES] ❌ Error getting devices:", error);
    throw error;
  }
}

/**
 * Get notification history
 */
export async function getNotificationHistory() {
  try {
    const { PUSH_ENDPOINTS } = require("@/constants/config");

    const response = await fetch(PUSH_ENDPOINTS.GET_HISTORY);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Get history failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[HISTORY] ❌ Error getting history:", error);
    throw error;
  }
}

/**
 * Check backend health - returns null if health endpoint unavailable
 */
export async function checkBackendHealth() {
  try {
    const { PUSH_ENDPOINTS } = require("@/constants/config");

    const response = await fetch(PUSH_ENDPOINTS.HEALTH_CHECK);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(
        "[HEALTH] ⚠️ Health endpoint returned",
        response.status,
        "- backend may use different path",
      );
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.warn("[HEALTH] ⚠️ Backend health check failed:", (error as Error)?.message);
    return null;
  }
}

/**
 * Register token for SNS notifications (primary `/registertoken` path).
 * We intentionally skip the secondary `/register-push-token` attempt to avoid
 * inconsistent payloads / route 404s.
 */
export async function registerTokenWithBothServices() {
  try {
    console.log("[PUSH SETUP] 🚀 Starting comprehensive token registration...");

    const results = {
      sns: null as string | null,
      backend: null as any,
      deviceToken: null as string | null,
    };

    // Get device token first
    const nativeToken = await getDevicePushToken();
    if (nativeToken?.data) {
      results.deviceToken = nativeToken.data;
      console.log(
        `[PUSH SETUP] 📱 Device token: ${nativeToken.data.substring(0, 20)}...`,
      );
    }

    // 1. Register with outix.co/apis/registertoken (backend has this endpoint)
    if (nativeToken?.data) {
      try {
        const snsResult = await registerTokenWithSNS(nativeToken.data);
        results.sns = snsResult;
        if (snsResult) {
          console.log(
            "[PUSH SETUP] ✅ SNS/registertoken registration successful",
          );
        }
      } catch (error) {
        console.error("[PUSH SETUP] ⚠️ SNS registration failed:", error);
      }
    }

    // 2. Intentionally skip the secondary register-push-token call.
    // The backend may not implement this route and it can create inconsistent token payloads.
    const hasAnySuccess = !!results.sns;

    console.log("[PUSH SETUP] ═══════════════════════════════════════");
    console.log("[PUSH SETUP] 📊 Registration Summary:");
    console.log(
      `  • SNS (outix.co/registertoken): ${results.sns ? "✅" : "❌"}`,
    );
    console.log(`  • Backend (register-push-token): skipped`);
    console.log(`  • Overall: ${hasAnySuccess ? "✅" : "❌"}`);

    if (!hasAnySuccess) {
      console.log("[PUSH SETUP] ❌ Token NOT registered. Check logs above:");
      if (!results.sns) {
        console.log(
          "  → SNS: Look for [SNS Registration] - fetch failed? HTTP error?",
        );
      }
    }
    console.log("[PUSH SETUP] ═══════════════════════════════════════");

    return {
      success: hasAnySuccess,
      results,
      primaryEndpoint: results.sns,
      deviceToken: results.deviceToken,
    };
  } catch (error) {
    console.error(
      "[PUSH SETUP] ❌ Error in registration:",
      error,
    );
    return {
      success: false,
      results: null,
      primaryEndpoint: null,
      deviceToken: null,
    };
  }
}

/**
 * Send push notification directly via AWS SNS
 * @param message - The notification message
 * @param options - Additional notification options
 */
export async function sendPushViaSNS(
  message: string,
  options: {
    title?: string;
    sound?: string;
    badge?: number;
    data?: any;
  } = {},
) {
  try {
    console.log("[SNS PUSH] 📤 Sending push notification via SNS...");

    // Get device token
    const nativeToken = await getDevicePushToken();
    if (!nativeToken?.data) {
      console.error("[SNS PUSH] ❌ No device token available");
      return false;
    }

    // Get or create endpoint ARN
    const endpointArn = await getOrCreateEndpointArn(nativeToken.data);
    if (!endpointArn) {
      console.error("[SNS PUSH] ❌ Could not get endpoint ARN");
      return false;
    }

    // Send notification
    const success = await sendPushNotificationViaSNS(
      endpointArn,
      message,
      options,
    );

    if (success) {
      console.log("[SNS PUSH] ✅ Push notification sent successfully!");
    } else {
      console.error("[SNS PUSH] ❌ Failed to send push notification");
    }

    return success;
  } catch (error) {
    console.error("[SNS PUSH] ❌ Error sending push notification:", error);
    return false;
  }
}

/**
 * Debug function to test token generation and validation
 * Call this function to verify your push token setup
 */
export async function debugPushTokenSetup() {
  console.log("\n🔍 DEBUGGING PUSH TOKEN SETUP FOR AWS SNS");
  console.log("=".repeat(50));

  try {
    // 1. Check device and permissions
    console.log("\n1. Device & Permissions Check:");
    console.log(`   - Is Physical Device: ${Device.isDevice}`);
    console.log(`   - Platform: ${Platform.OS}`);

    const Notifications = await getNotifications();
    if (!Notifications) {
      console.log("❌ expo-notifications not available (Expo Go on Android?)");
      return;
    }
    const { status } = await Notifications.getPermissionsAsync();
    console.log(`   - Permission Status: ${status}`);

    if (!Device.isDevice) {
      console.log("❌ Cannot test on simulator/emulator");
      return;
    }

    if (status !== "granted") {
      console.log("❌ Notifications not permitted");
      return;
    }

    // 2. Get and validate device token
    console.log("\n2. Device Token Generation:");
    const nativeToken = await getDevicePushToken();

    if (!nativeToken) {
      console.log("❌ Failed to get native push token");
      return;
    }

    console.log(`   ✅ Token Type: ${nativeToken.type}`);
    console.log(`   ✅ Token Valid: ${nativeToken.isValid}`);
    console.log(
      `   ✅ Original Length: ${nativeToken.originalData?.length} chars`,
    );
    console.log(`   ✅ Formatted Length: ${nativeToken.data.length} chars`);

    if (nativeToken.warnings && nativeToken.warnings.length > 0) {
      console.log(`   ⚠️ Warnings: ${nativeToken.warnings.join(", ")}`);
    }

    // 3. Get device identifier (same token used everywhere)
    console.log("\n3. Device Identifier:");
    try {
      const deviceId = await getDeviceToken();
      console.log(
        `   ✅ Device ID (iOS Native Token): ${deviceId.substring(0, 20)}...`,
      );
    } catch (error) {
      console.log(
        `   ⚠️ Device ID not available: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // 4. Test token registration (backend manages SNS)
    console.log("\n4. Token Registration Test:");

    // Test backend registration
    console.log("   - Testing backend registration:");
    const registrationResult = await registerPushTokenWithBackend();

    if (registrationResult) {
      console.log("     ✅ Backend registration successful");
    } else {
      console.log(
        "     ⚠️ Backend registration returned null (check backend logs)",
      );
    }

    console.log("\n" + "=".repeat(50));
    console.log("🔍 DEBUG COMPLETE");
    console.log("\nIf you're still getting AWS SNS errors, check:");
    console.log("1. AWS credentials are correctly configured");
    console.log("2. AWS SNS endpoint ARN is correct");
    console.log("3. Device token is valid and properly formatted");
    console.log("4. AWS credentials are correctly configured");
    console.log("5. Push notifications are enabled on the device");

    // Return debug info for external use
    return {
      deviceType: Device.isDevice,
      platform: Platform.OS,
      permissionStatus: status,
      tokenValid: nativeToken?.isValid,
      tokenLength: nativeToken?.data.length,
      originalTokenLength: nativeToken?.originalData?.length,
      warnings: nativeToken?.warnings,
      registrationSuccess: !!registrationResult,
    };
  } catch (error) {
    console.error("\n❌ Debug failed:", error);
    return { error: error.message };
  }
}
