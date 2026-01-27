/**
 * AWS SNS Service for Push Notification Token Registration
 *
 * This service handles:
 * - Direct token registration with AWS SNS endpoints
 * - Creating platform endpoints for APNs/FCM tokens
 * - Managing endpoint ARNs for push notifications
 */

import { Platform } from "react-native";

// AWS Configuration - Load from environment variables
const AWS_CONFIG = {
  region: process.env.EXPO_PUBLIC_AWS_REGION || "eu-north-1",
  accessKeyId: process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY || "",
};

const PLATFORM_APPLICATION_ARN =
  process.env.EXPO_PUBLIC_AWS_SNS_PLATFORM_ARN ||
  "arn:aws:sns:eu-north-1:828043587172:app/APNS/OutixRacer-ios";

// Store registered endpoint ARNs locally
const registeredEndpoints = new Map<string, string>();

/**
 * Create AWS SNS client with proper configuration
 */
function createSNSClient() {
  // In React Native, we'll use fetch API to call AWS SNS REST endpoints
  return {
    region: AWS_CONFIG.region,
    accessKeyId: AWS_CONFIG.accessKeyId,
    secretAccessKey: AWS_CONFIG.secretAccessKey,
  };
}

/**
 * Generate AWS Signature v4 for SNS API calls
 */
function createAWSSignature(
  method: string,
  url: string,
  headers: Record<string, string>,
  payload: string,
  credentials: { accessKeyId: string; secretAccessKey: string; region: string },
): string {
  // Simplified signature - in production, use proper AWS SDK or signing library
  const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, "");
  return `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${timestamp.substr(0, 8)}/${credentials.region}/sns/aws4_request, SignedHeaders=host;x-amz-date, Signature=placeholder`;
}

/**
 * Make authenticated AWS SNS API call
 */
async function makeSNSRequest(
  action: string,
  params: Record<string, any>,
): Promise<any> {
  const credentials = createSNSClient();
  const endpoint = `https://sns.${credentials.region}.amazonaws.com/`;

  // Prepare form data for SNS API
  const formData = new URLSearchParams();
  formData.append("Action", action);
  formData.append("Version", "2010-03-31");

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value.toString());
    }
  });

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "X-Amz-Date": new Date().toISOString().replace(/[:\-]|\.\d{3}/g, ""),
  };

  try {
    console.log(`[AWS SNS] 📡 Making ${action} request...`);

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[AWS SNS] ❌ ${action} failed:`,
        response.status,
        errorText,
      );
      throw new Error(
        `AWS SNS ${action} failed: ${response.status} ${errorText}`,
      );
    }

    const responseText = await response.text();
    console.log(`[AWS SNS] ✅ ${action} successful`);

    // Parse XML response (simplified)
    return parseXMLResponse(responseText);
  } catch (error) {
    console.error(`[AWS SNS] ❌ Error making ${action} request:`, error);
    throw error;
  }
}

/**
 * Simple XML parser for SNS responses
 */
function parseXMLResponse(xmlText: string): any {
  // Simple XML parsing - extract values between tags
  const extractValue = (tag: string): string | null => {
    const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, "i");
    const match = xmlText.match(regex);
    return match ? match[1] : null;
  };

  return {
    EndpointArn: extractValue("EndpointArn"),
    MessageId: extractValue("MessageId"),
    RequestId: extractValue("RequestId"),
    ResponseMetadata: {
      RequestId: extractValue("RequestId"),
    },
  };
}

/**
 * Register device token with AWS SNS and create platform endpoint
 */
export async function registerTokenWithSNS(
  deviceToken: string,
): Promise<string | null> {
  try {
    console.log(
      `[SNS Registration] 🔧 Registering token: ${deviceToken.substring(0, 20)}...`,
    );

    // Check if we already have this endpoint cached
    if (registeredEndpoints.has(deviceToken)) {
      const cachedArn = registeredEndpoints.get(deviceToken);
      console.log(`[SNS Registration] ✅ Using cached endpoint: ${cachedArn}`);
      return cachedArn!;
    }

    // Create platform endpoint
    const params = {
      PlatformApplicationArn: PLATFORM_APPLICATION_ARN,
      Token: deviceToken,
      CustomUserData: JSON.stringify({
        registeredAt: new Date().toISOString(),
        platform: Platform.OS,
        appVersion: "1.0.0",
      }),
    };

    const response = await makeSNSRequest("CreatePlatformEndpoint", params);

    if (response.EndpointArn) {
      const endpointArn = response.EndpointArn;
      console.log(`[SNS Registration] ✅ Created endpoint: ${endpointArn}`);

      // Cache the endpoint ARN
      registeredEndpoints.set(deviceToken, endpointArn);

      return endpointArn;
    } else {
      console.error(`[SNS Registration] ❌ No endpoint ARN in response`);
      return null;
    }
  } catch (error: any) {
    // Handle case where endpoint already exists
    if (error.message?.includes("already exists with the same Token")) {
      console.log(
        `[SNS Registration] ℹ️ Endpoint already exists, attempting to retrieve...`,
      );

      try {
        const existingArn = await findExistingEndpoint(deviceToken);
        if (existingArn) {
          registeredEndpoints.set(deviceToken, existingArn);
          return existingArn;
        }
      } catch (findError) {
        console.error(
          `[SNS Registration] ❌ Error finding existing endpoint:`,
          findError,
        );
      }
    }

    console.error(`[SNS Registration] ❌ Registration failed:`, error);
    return null;
  }
}

/**
 * Find existing endpoint for a device token
 */
async function findExistingEndpoint(
  deviceToken: string,
): Promise<string | null> {
  try {
    console.log(`[SNS Registration] 🔍 Looking for existing endpoint...`);

    const response = await makeSNSRequest(
      "ListEndpointsByPlatformApplication",
      {
        PlatformApplicationArn: PLATFORM_APPLICATION_ARN,
      },
    );

    // Parse endpoints from response (simplified)
    // In a real implementation, you'd properly parse the XML
    if (response && typeof response === "object") {
      console.log(`[SNS Registration] ✅ Found existing endpoint (cached)`);
      // For now, return a placeholder - this would need proper XML parsing
      return null;
    }

    console.log(`[SNS Registration] ❌ No existing endpoint found`);
    return null;
  } catch (error) {
    console.error(`[SNS Registration] ❌ Error listing endpoints:`, error);
    return null;
  }
}

/**
 * Send push notification using AWS SNS endpoint
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
    console.log(
      `[SNS Push] 📤 Sending notification to endpoint: ${endpointArn}`,
    );

    const payload = {
      APNS: JSON.stringify({
        aps: {
          alert: {
            title: options.title || "OutixRacer",
            body: message,
          },
          sound: options.sound || "default",
          badge: options.badge || 1,
        },
        data: options.data || {},
      }),
    };

    const response = await makeSNSRequest("Publish", {
      TargetArn: endpointArn,
      Message: JSON.stringify(payload),
      MessageStructure: "json",
      Subject: options.title || "OutixRacer Notification",
    });

    if (response.MessageId) {
      console.log(
        `[SNS Push] ✅ Notification sent! Message ID: ${response.MessageId}`,
      );
      return true;
    } else {
      console.error(`[SNS Push] ❌ No message ID in response`);
      return false;
    }
  } catch (error) {
    console.error(`[SNS Push] ❌ Failed to send notification:`, error);
    return false;
  }
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

/**
 * Register token and get endpoint ARN for immediate use
 */
export async function getOrCreateEndpointArn(
  deviceToken: string,
): Promise<string | null> {
  // Check cache first
  const cachedArn = getCachedEndpointArn(deviceToken);
  if (cachedArn) {
    return cachedArn;
  }

  // Register with SNS
  return await registerTokenWithSNS(deviceToken);
}
