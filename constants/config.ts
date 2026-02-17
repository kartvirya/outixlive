/**
 * Environment configuration for push notifications
 * Switch between local development and production endpoints
 */
const ENV =
  (typeof __DEV__ !== "undefined" && __DEV__) ||
  process.env.NODE_ENV === "development"
    ? "development"
    : "production";

const API_BASE_URL = "https://outix.co/apis";

const environments = {
  development: {
    BASE_URL: API_BASE_URL,
    PUSH_API_BASE_URL: API_BASE_URL,
    DEBUG: true,
  },
  production: {
    BASE_URL: API_BASE_URL,
    PUSH_API_BASE_URL: API_BASE_URL,
    DEBUG: false,
  },
};

/**
 * Always use outix.co/apis - no env overrides
 */
const getBaseUrl = (): string => {
  return API_BASE_URL;
};

// Get push API URL - use same as BASE_URL so physical device in dev uses production
const getPushApiUrl = (): string => {
  return getBaseUrl();
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
  HEALTH_CHECK: `${getBaseUrl().replace(/\/$/, "")}/health`,
};
