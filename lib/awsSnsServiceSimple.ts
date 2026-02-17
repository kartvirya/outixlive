/**
 * Simplified AWS SNS Service for React Native
 *
 * This provides functions to register tokens with your backend server
 * which then handles AWS SNS endpoint creation
 */

import { Platform } from "react-native";

// Store registered endpoint ARNs locally
const registeredEndpoints = new Map<string, string>();

const SNS_REGISTER_URL = "https://outix.co/apis/registertoken";

/**
 * Register device token with backend server that handles AWS SNS
 * Uses the native iOS APNs token (64-char hex) as the device identifier
 */
export async function registerTokenWithSNS(
  deviceToken: string,
): Promise<string | null> {
  const url = SNS_REGISTER_URL + "/" + encodeURIComponent(deviceToken);
  const requestBody = {
    deviceToken: deviceToken,
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
  };

  try {
    console.log("[SNS Registration] ═══════════════════════════════════════");
    console.log(
      `[SNS Registration] 🔧 Registering ${Platform.OS} token: ${deviceToken.substring(0, 25)}...`,
    );
    console.log(
      `[SNS Registration] 📊 Token length: ${deviceToken.length} characters`,
    );

    // Check if we already have this endpoint cached
    if (registeredEndpoints.has(deviceToken)) {
      const cachedArn = registeredEndpoints.get(deviceToken);
      console.log(
        `[SNS Registration] ✅ Using cached endpoint: ${cachedArn?.substring(0, 50)}...`,
      );
      return cachedArn!;
    }

    console.log(`[SNS Registration] 🌐 URL: ${url.substring(0, 80)}...`);
    console.log(
      `[SNS Registration] 📤 Request body: ${JSON.stringify(requestBody).slice(0, 120)}...`,
    );
    console.log("[SNS Registration] 📡 Sending fetch request...");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        devicetoken: deviceToken,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log(
      `[SNS Registration] 📥 Response: status=${response.status} ${response.statusText}, body length=${responseText.length}`,
    );

    // Backend returns 404 with "Token may already exist" - treat as success
    if (response.status === 404 && responseText.includes("already exist")) {
      console.log(
        "[SNS Registration] ✅ Token already registered (404 with 'already exist' - treating as success)",
      );
      return "registered";
    }

    if (!response.ok) {
      console.error(
        `[SNS Registration] ❌ HTTP ${response.status} - Backend error:`,
      );
      console.error(`[SNS Registration] ❌ Response body: ${responseText}`);
      return null;
    }

    let result: any;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error(
        `[SNS Registration] ❌ Failed to parse JSON response:`,
        parseError,
      );
      console.error(
        `[SNS Registration] ❌ Raw response (first 300 chars): ${responseText.slice(0, 300)}`,
      );
      return null;
    }

    console.log(
      `[SNS Registration] 📋 Parsed response keys: ${Object.keys(result).join(", ")}`,
    );
    console.log(
      `[SNS Registration] 📋 Response: ${JSON.stringify(result).slice(0, 200)}`,
    );

    if (result.endpointArn) {
      const endpointArn = result.endpointArn;
      console.log(
        `[SNS Registration] ✅ Backend created endpoint: ${endpointArn.substring(0, 60)}...`,
      );
      registeredEndpoints.set(deviceToken, endpointArn);
      return endpointArn;
    }
    // Backend may return various success formats (e.g. {error: false, status: 200, msg: "..."})
    if (
      result.success === true ||
      (result.error === false && response.ok) ||
      (result.status === 200 && result.error !== true)
    ) {
      console.log(
        `[SNS Registration] ✅ Token registered successfully`,
        result.msg ? `(${result.msg})` : "",
      );
      return "registered";
    }
    console.error(
      `[SNS Registration] ❌ Unexpected response format - expected endpointArn, success, or error:false`,
    );
    console.error(
      `[SNS Registration] ❌ Full response: ${JSON.stringify(result)}`,
    );
    return null;
  } catch (error: any) {
    console.error("[SNS Registration] ❌ ═══════════════════════════════════");
    console.error("[SNS Registration] ❌ FETCH FAILED (network/connection)");
    console.error(`[SNS Registration] ❌ Error type: ${error?.name ?? "unknown"}`);
    console.error(`[SNS Registration] ❌ Message: ${error?.message ?? String(error)}`);
    if (error?.cause) {
      console.error(`[SNS Registration] ❌ Cause:`, error.cause);
    }
    console.error(
      "[SNS Registration] ❌ Possible reasons: no network, DNS failure, SSL error, timeout, or server unreachable",
    );
    console.error("[SNS Registration] ❌ ═══════════════════════════════════");
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
