import Constants from "expo-constants";

/**
 * Environment configuration for push notifications
 * Switch between local development and production endpoints
 */
const ENV =
  (typeof __DEV__ !== "undefined" && __DEV__) ||
  process.env.NODE_ENV === "development"
    ? "development"
    : "production";

const environments = {
  development: {
    BASE_URL: "http://localhost:3000/api",
    PUSH_API_BASE_URL: "http://localhost:3000/api",
    DEBUG: true,
  },
  production: {
    BASE_URL: "https://outix.co/apis",
    PUSH_API_BASE_URL: "https://outix.co/apis", // Replace with your production push API
    DEBUG: false,
  },
};

/**
 * Get Base URL from environment variables with fallback to environment config
 * Priority:
 * 1. EXPO_PUBLIC_BASE_URL from app.config.js extra
 * 2. EXPO_PUBLIC_BASE_URL from process.env
 * 3. BASE_URL from process.env
 * 4. Environment-based config
 */
const getBaseUrl = (): string => {
  // Try to get from expo constants first (set in app.config.js)
  const baseUrl = Constants.expoConfig?.extra?.baseUrl;

  if (baseUrl && typeof baseUrl === "string") {
    return baseUrl;
  }

  // Fallback to process.env (works in some setups)
  if (typeof process !== "undefined") {
    if (process.env?.EXPO_PUBLIC_BASE_URL) {
      return process.env.EXPO_PUBLIC_BASE_URL;
    }
    if (process.env?.BASE_URL) {
      return process.env.BASE_URL;
    }
  }

  // Use environment-based configuration
  return environments[ENV].BASE_URL;
};

// Get push API URL (for new local backend)
const getPushApiUrl = (): string => {
  return environments[ENV].PUSH_API_BASE_URL;
};

export const BASE_URL = getBaseUrl();
export const PUSH_API_BASE_URL = getPushApiUrl();
export const IS_DEVELOPMENT = ENV === "development";
export const DEBUG_PUSH = environments[ENV].DEBUG;

// Push notification API endpoints
export const PUSH_ENDPOINTS = {
  REGISTER_TOKEN: `${PUSH_API_BASE_URL}/register-push-token`,
  REGISTER_SNS_ENDPOINT: `${PUSH_API_BASE_URL}/register-sns-endpoint`,
  SEND_NOTIFICATION: `${PUSH_API_BASE_URL}/send-push-notification`,
  BROADCAST: `${PUSH_API_BASE_URL}/broadcast-notification`,
  TEST_NOTIFICATION: `${PUSH_API_BASE_URL}/test-notification`,
  GET_DEVICES: `${PUSH_API_BASE_URL}/devices`,
  GET_HISTORY: `${PUSH_API_BASE_URL}/notifications/history`,
  HEALTH_CHECK: `${PUSH_API_BASE_URL}/../health`,
};
