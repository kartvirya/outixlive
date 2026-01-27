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
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  getOrCreateEndpointArn,
  registerTokenWithSNS,
  sendPushNotificationViaSNS,
} from "./awsSnsServiceSimple";
import {
  logTokenValidation,
  validateAndFormatSNSToken,
} from "./awsSnsTokenUtils";
import {
  getStoredDeviceToken,
  startListeningForDeviceToken,
  storeDeviceToken,
} from "./iosDeviceTokenManager";

console.log(
  "🚀 [PUSH-NOTIFICATIONS] Module loaded - Push notification service initialized",
);

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions and setup Android channel
 * This should be called before getting push tokens
 */
export async function requestNotificationPermissions() {
  console.log("[PERMISSIONS] 🔔 Requesting notification permissions...");

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
    console.log("[PERMISSIONS] ✅ Android notification channel created");
  }

  if (!Device.isDevice) {
    console.log(
      "[PERMISSIONS] ⚠️ Must use physical device for Push Notifications",
    );
    return false;
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    console.log("[PERMISSIONS] Current status:", existingStatus);

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      console.log("[PERMISSIONS] 📱 Requesting permissions from user...");
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
      console.log("[PERMISSIONS] User responded with:", finalStatus);
    }

    if (finalStatus !== "granted") {
      console.log("[PERMISSIONS] ❌ Permission denied!");
      return false;
    }

    console.log("[PERMISSIONS] ✅ Permissions granted!");
    return true;
  } catch (error) {
    console.error("[PERMISSIONS] ❌ Error requesting permissions:", error);
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
    // Get native device token (APNs for iOS, FCM for Android)
    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    const token = devicePushToken.data;

    console.log(
      "[TOKEN] ✅ Native Push Token obtained:",
      token.substring(0, 20) + "...",
    );
    console.log("[TOKEN] 📱 Platform:", devicePushToken.type);

    return token;
  } catch (error) {
    console.error("[TOKEN] ❌ Error getting native push token:", error);
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
  const { status } = await Notifications.getPermissionsAsync();
  console.log(`[DEVICE-TOKEN] 📋 Permission status: ${status}`);

  if (status !== "granted") {
    console.log("[DEVICE-TOKEN] ❌ Permissions not granted");
    return null;
  }
  console.log("[DEVICE-TOKEN] ✅ Permissions confirmed as granted");

  try {
    console.log(
      "[DEVICE-TOKEN] 📱 Requesting native device push token from system...",
    );
    // Get native device token (APNs for iOS, FCM for Android)
    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    console.log(
      `[DEVICE-TOKEN] 🎯 Token generation successful! Platform: ${devicePushToken.type}`,
    );

    console.log(
      "[DEVICE-TOKEN] 🔍 Raw token obtained:",
      devicePushToken.data.substring(0, 20) + "...",
      `(${devicePushToken.data.length} chars)`,
    );

    // Format token for AWS SNS compatibility using comprehensive validation
    const formatResult = formatTokenForSNS(
      devicePushToken.data,
      devicePushToken.type,
    );

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

    return {
      data: formatResult.formattedToken,
      type: devicePushToken.type, // 'ios' or 'android'
      originalData: devicePushToken.data, // Keep original for debugging
      isValid: formatResult.isValid,
      warnings: formatResult.warnings,
    };
  } catch (error) {
    console.error("[DEVICE-TOKEN] ❌ Error getting device push token:", error);
    return null;
  }
}

/**
 * Register device token directly with AWS SNS
 * Creates platform endpoint for direct push notifications
 */
export async function registerTokenDirectlyWithSNS() {
  console.log("[AWS SNS DIRECT] 🔧 Starting direct SNS registration...");

  try {
    const nativeToken = await getDevicePushToken();

    if (!nativeToken || !nativeToken.data) {
      console.error(
        "[AWS SNS DIRECT] ❌ No valid native token available for direct SNS registration",
      );
      return null;
    }

    console.log(
      `[AWS SNS DIRECT] 📱 Registering ${nativeToken.type} token: ${nativeToken.data.substring(0, 20)}...`,
    );
    console.log(
      `[AWS SNS DIRECT] 📊 Token length: ${nativeToken.data.length} characters`,
    );

    console.log("[AWS SNS DIRECT] 🌐 Calling registerTokenWithSNS...");
    // Register with AWS SNS directly
    const endpointArn = await registerTokenWithSNS(nativeToken.data);

    if (endpointArn) {
      console.log("[AWS SNS DIRECT] ✅ Token registered successfully!");
      console.log(`[AWS SNS DIRECT] 🎯 Endpoint ARN: ${endpointArn}`);

      return {
        success: true,
        endpointArn,
        deviceToken: nativeToken.data,
        platform: nativeToken.type,
        message: "Token registered with AWS SNS",
      };
    } else {
      console.error(
        "[AWS SNS DIRECT] ❌ Failed to register token - no endpoint ARN returned",
      );
      return null;
    }
  } catch (error) {
    console.error(
      "[AWS SNS DIRECT] ❌ Error in direct SNS registration:",
      error,
    );
    console.error("[AWS SNS DIRECT] 🔍 Error details:", {
      message: error.message,
      stack: error.stack,
    });
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
      const validPattern =
        platform === "ios" ? /^[a-fA-F0-9]+$/ : /^[a-zA-Z0-9\+\/\=\_\-]+$/;
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
      userId: deviceToken, // Use deviceToken as userId for now
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

    console.log(
      "[BACKEND-REGISTER] 🌐 Sending registration request to backend...",
    );
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
      console.error(
        `[BACKEND-REGISTER] ❌ Backend registration failed: ${response.status} ${response.statusText}`,
      );
      console.error("[BACKEND-REGISTER] 📄 Error details:", errorText);

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

      // For other errors, don't throw - just log and return null
      console.error(
        "[BACKEND-REGISTER] ⚠️ Registration failed, continuing with app flow...",
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
  } catch (error) {
    console.error(
      "[BACKEND-REGISTER] ❌ ================================================",
    );
    console.error(
      "[BACKEND-REGISTER] ❌ BACKEND REGISTRATION FAILED WITH EXCEPTION",
    );
    console.error(
      "[BACKEND-REGISTER] ❌ ================================================",
    );
    console.error("[BACKEND-REGISTER] ❌ Error details:", error);
    console.error(`[BACKEND-REGISTER] ❌ Error message: ${error.message}`);
    console.error(`[BACKEND-REGISTER] ❌ Error stack: ${error.stack}`);
    console.error("[BACKEND-REGISTER] ❌ This might indicate:");
    console.error("  - Network connectivity issues");
    console.error("  - Backend server not running");
    console.error("  - Incorrect endpoint URL");
    console.error("  - CORS or authentication issues");
    console.error(
      "[BACKEND-REGISTER] ❌ ================================================",
    );
    // Don't throw - allow app to continue even if registration fails
    return null;
  }
}

/**
 * Setup notification listeners
 * Returns cleanup function to remove listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void,
) {
  // Listener for notifications received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("Notification received:", notification);
      onNotificationReceived?.(notification);
    },
  );

  // Listener for when user taps on notification
  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification tapped:", response);
      onNotificationTapped?.(response);
    });

  // Return cleanup function - subscriptions have .remove() method
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

    // Automatically register with SNS endpoint
    try {
      console.log("[iOS INTEGRATION] ☁️ Auto-registering with SNS endpoint...");
      const snsResult = await registerDeviceTokenWithSNSEndpoint(deviceToken);

      if (snsResult?.success) {
        console.log(
          "[iOS INTEGRATION] ✅ Auto-registration with SNS successful!",
        );
        if (snsResult.endpointArn) {
          console.log(
            `[iOS INTEGRATION] 🎯 SNS Endpoint ARN: ${snsResult.endpointArn}`,
          );
        }
      } else {
        console.error(
          `[iOS INTEGRATION] ❌ Auto-registration with SNS failed: ${snsResult?.error}`,
        );
      }
    } catch (error) {
      console.error(
        "[iOS INTEGRATION] ❌ Error during auto-registration:",
        error,
      );
    }

    // Also register with backend
    try {
      console.log("[iOS INTEGRATION] 🏢 Auto-registering with backend...");
      await registerPushTokenWithBackend();
    } catch (error) {
      console.error(
        "[iOS INTEGRATION] ❌ Error during backend registration:",
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
    // Try to get stored token from iOS first
    console.log("[iOS TOKEN] 📱 Checking for stored iOS native token...");
    const storedToken = await getStoredDeviceToken();

    if (storedToken) {
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
    }

    console.log(
      "[iOS TOKEN] ⚠️ No stored iOS token found, falling back to Expo method...",
    );
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
 * Check backend health
 */
export async function checkBackendHealth() {
  try {
    const { PUSH_ENDPOINTS } = require("@/constants/config");

    const response = await fetch(PUSH_ENDPOINTS.HEALTH_CHECK);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Health check failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[HEALTH] ❌ Backend health check failed:", error);
    throw error;
  }
}

/**
 * Register token with both AWS SNS and backend
 * Provides redundancy and flexibility
 */
export async function registerTokenWithBothServices() {
  try {
    console.log("[PUSH SETUP] 🚀 Starting comprehensive token registration...");

    const results = {
      sns: null as any,
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

    // Try AWS SNS registration first
    try {
      results.sns = await registerTokenDirectlyWithSNS();
      if (results.sns?.success) {
        console.log("[PUSH SETUP] ✅ SNS registration successful");
      }
    } catch (error) {
      console.error("[PUSH SETUP] ⚠️ SNS registration failed:", error);
    }

    // Try backend registration as fallback/supplement
    try {
      results.backend = await registerPushTokenWithBackend();
      if (results.backend?.success) {
        console.log("[PUSH SETUP] ✅ Backend registration successful");
      }
    } catch (error) {
      console.error("[PUSH SETUP] ⚠️ Backend registration failed:", error);
    }

    const hasAnySuccess = results.sns?.success || results.backend?.success;

    console.log("[PUSH SETUP] 📊 Registration Summary:");
    console.log(`  • AWS SNS: ${results.sns?.success ? "✅" : "❌"}`);
    console.log(`  • Backend: ${results.backend?.success ? "✅" : "❌"}`);
    console.log(`  • Overall: ${hasAnySuccess ? "✅" : "❌"}`);

    return {
      success: hasAnySuccess,
      results,
      primaryEndpoint: results.sns?.endpointArn || null,
      deviceToken: results.deviceToken,
    };
  } catch (error) {
    console.error(
      "[PUSH SETUP] ❌ Error in comprehensive registration:",
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

    // 3. Get device identifier
    console.log("\n3. Device Identifier:");
    const deviceId = await getStoredDeviceToken();
    console.log(`   ✅ Device ID (iOS Native Token): ${deviceId?.substring(0, 20)}...`);

    // 4. Test token registration
    console.log("\n4. Token Registration Test:");

    // Test AWS SNS registration
    console.log("   - Testing AWS SNS registration:");
    const snsResult = await registerTokenDirectlyWithSNS();
    if (snsResult?.success) {
      console.log("     ✅ SNS registration successful");
      console.log(`     ✅ Endpoint ARN: ${snsResult.endpointArn}`);
    } else {
      console.log("     ❌ SNS registration failed");
    }

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
