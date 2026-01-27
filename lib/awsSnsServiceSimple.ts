/**
 * Simplified AWS SNS Service for React Native
 *
 * This provides functions to register tokens with your backend server
 * which then handles AWS SNS endpoint creation
 */

import { Platform } from "react-native";

// Store registered endpoint ARNs locally
const registeredEndpoints = new Map<string, string>();

/**
 * Register device token with backend server that handles AWS SNS
 * Uses the native iOS APNs token (64-char hex) as the device identifier
 */
export async function registerTokenWithSNS(
  deviceToken: string,
): Promise<string | null> {
  try {
    console.log(
      `[SNS Registration] 🔧 Registering APNs device token: ${deviceToken.substring(0, 20)}...`,
    );
    console.log(
      `[SNS Registration] 📊 Token length: ${deviceToken.length} characters`,
    );

    // Check if we already have this endpoint cached
    if (registeredEndpoints.has(deviceToken)) {
      const cachedArn = registeredEndpoints.get(deviceToken);
      console.log(`[SNS Registration] ✅ Using cached endpoint: ${cachedArn}`);
      return cachedArn!;
    }

    // Call your backend server that handles AWS SNS endpoint creation
    // Uses native iOS APNs token as device identifier
    const response = await fetch(
      "https://outix.co/apis/registertoken/" + deviceToken,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          devicetoken: deviceToken,
        },
        body: JSON.stringify({
          deviceToken: deviceToken,
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[SNS Registration] ❌ Backend error:`,
        response.status,
        errorText,
      );
      return null;
    }

    const result = await response.json();

    if (result.endpointArn) {
      const endpointArn = result.endpointArn;
      console.log(
        `[SNS Registration] ✅ Backend created endpoint: ${endpointArn}`,
      );

      // Cache the endpoint ARN
      registeredEndpoints.set(deviceToken, endpointArn);

      return endpointArn;
    } else if (result.success) {
      console.log(`[SNS Registration] ✅ Token registered successfully`);
      return "registered"; // Backend handled it, no specific ARN returned
    } else {
      console.error(`[SNS Registration] ❌ No endpoint ARN in response`);
      return null;
    }
  } catch (error: any) {
    console.error(`[SNS Registration] ❌ Registration failed:`, error);
    return null;
  }
}

/**
 * Send push notification via backend that uses AWS SNS
 */
export async function sendPushNotificationViaSNS(
  endpointArn: string,
  message: string,
  options: {
    title?: string;
    sound?: string;
    badge?: number;
    data?: any;
  } = {},
): Promise<boolean> {
  try {
    console.log(`[SNS Push] 📤 Sending notification via backend...`);

    const response = await fetch("https://outix.co/apis/sendpush", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpointArn: endpointArn,
        message: message,
        title: options.title || "OutixRacer",
        sound: options.sound || "default",
        badge: options.badge || 1,
        data: options.data || {},
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SNS Push] ❌ Backend error:`, response.status, errorText);
      return false;
    }

    const result = await response.json();

    if (result.success) {
      console.log(`[SNS Push] ✅ Notification sent successfully!`);
      if (result.messageId) {
        console.log(`[SNS Push] 📧 Message ID: ${result.messageId}`);
      }
      return true;
    } else {
      console.error(`[SNS Push] ❌ Backend reported failure:`, result.message);
      return false;
    }
  } catch (error) {
    console.error(`[SNS Push] ❌ Error sending notification:`, error);
    return false;
  }
}

/**
 * Get or create endpoint ARN for immediate use
 */
export async function getOrCreateEndpointArn(
  deviceToken: string,
): Promise<string | null> {
  // Check cache first
  const cachedArn = registeredEndpoints.get(deviceToken);
  if (cachedArn) {
    return cachedArn;
  }

  // Register with backend
  return await registerTokenWithSNS(deviceToken);
}

/**
 * Get cached endpoint ARN for a device token
 */
export function getCachedEndpointArn(deviceToken: string): string | null {
  return registeredEndpoints.get(deviceToken) || null;
}

/**
 * Clear cached endpoints (useful for testing)
 */
export function clearEndpointCache(): void {
  registeredEndpoints.clear();
  console.log(`[SNS Registration] 🧹 Endpoint cache cleared`);
}
