/**
 * Configuration for OutixRacer App
 * Switch between local development and production endpoints
 */

// Environment configuration
const ENV = "development"; // Change to 'production' when ready to deploy

const API_BASE_URL = "https://outix.co/apis";

const config = {
  development: {
    API_BASE_URL,
    ENVIRONMENT: "development",
    DEBUG: true,
  },
  production: {
    API_BASE_URL,
    ENVIRONMENT: "production",
    DEBUG: false,
  },
};

// Export the current configuration
export default config[ENV];

// For easy access to specific URLs
export const API_ENDPOINTS = {
  REGISTER_PUSH_TOKEN: `${config[ENV].API_BASE_URL}/register-push-token`,
  REGISTER_SNS_ENDPOINT: `${config[ENV].API_BASE_URL}/register-sns-endpoint`,
  SEND_PUSH_NOTIFICATION: `${config[ENV].API_BASE_URL}/send-push-notification`,
  BROADCAST_NOTIFICATION: `${config[ENV].API_BASE_URL}/broadcast-notification`,
  TEST_NOTIFICATION: `${config[ENV].API_BASE_URL}/test-notification`,
  GET_DEVICES: `${config[ENV].API_BASE_URL}/devices`,
  GET_NOTIFICATIONS_HISTORY: `${config[ENV].API_BASE_URL}/notifications/history`,
  HEALTH_CHECK: `${config[ENV].API_BASE_URL}/../health`,
};

// Helper function for making API requests
export const makeApiRequest = async (endpoint, method = "GET", data = null) => {
  try {
    const config = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(endpoint, config);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || `HTTP error! status: ${response.status}`,
      );
    }

    return result;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
};

// Push notification helper functions
export const pushNotificationAPI = {
  // Register device for push notifications
  registerDevice: async (deviceToken, pushToken, platform, userId) => {
    return makeApiRequest(API_ENDPOINTS.REGISTER_PUSH_TOKEN, "POST", {
      deviceToken,
      pushToken,
      platform,
      userId,
    });
  },

  // Register device token with SNS endpoint
  registerSNSEndpoint: async (deviceToken, platform, userId) => {
    return makeApiRequest(API_ENDPOINTS.REGISTER_SNS_ENDPOINT, "POST", {
      deviceToken,
      platform,
      userId,
      endpointType: "sns",
      timestamp: new Date().toISOString(),
    });
  },

  // Send notification to specific device
  sendNotification: async (deviceToken, title, body, data = {}) => {
    return makeApiRequest(API_ENDPOINTS.SEND_PUSH_NOTIFICATION, "POST", {
      deviceToken,
      title,
      body,
      data,
    });
  },

  // Send broadcast notification
  sendBroadcast: async (title, body, data = {}) => {
    return makeApiRequest(API_ENDPOINTS.BROADCAST_NOTIFICATION, "POST", {
      title,
      body,
      data,
    });
  },

  // Test notification with push token
  testNotification: async (pushToken) => {
    return makeApiRequest(API_ENDPOINTS.TEST_NOTIFICATION, "POST", {
      pushToken,
    });
  },

  // Get registered devices
  getDevices: async () => {
    return makeApiRequest(API_ENDPOINTS.GET_DEVICES);
  },

  // Get notification history
  getHistory: async () => {
    return makeApiRequest(API_ENDPOINTS.GET_NOTIFICATIONS_HISTORY);
  },

  // Health check
  healthCheck: async () => {
    return makeApiRequest(API_ENDPOINTS.HEALTH_CHECK);
  },
};
