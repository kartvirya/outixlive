import { BASE_URL } from "@/constants/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDeviceToken as getDeviceTokenFromStorage } from "./deviceToken";

const TOKEN_STORAGE_KEY = "outix_token";
const SESSION_COOKIE_KEY = "outix_session_cookie";

/**
 * Parse isSubscribed value from API response
 * Handles: string "0"/"1", number 0/1, boolean true/false, null/undefined
 * Returns: boolean
 */
export const parseIsSubscribed = (value: any): boolean => {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return false;
  }

  // Handle boolean
  if (typeof value === "boolean") {
    return value;
  }

  // Handle number
  if (typeof value === "number") {
    return value === 1 || value > 0;
  }

  // Handle string
  if (typeof value === "string") {
    const trimmed = value.trim();
    // Check for "1", "true", "yes", "on"
    if (
      trimmed === "1" ||
      trimmed.toLowerCase() === "true" ||
      trimmed.toLowerCase() === "yes" ||
      trimmed.toLowerCase() === "on"
    ) {
      return true;
    }
    // Check for "0", "false", "no", "off", empty string
    if (
      trimmed === "0" ||
      trimmed.toLowerCase() === "false" ||
      trimmed.toLowerCase() === "no" ||
      trimmed.toLowerCase() === "off" ||
      trimmed === ""
    ) {
      return false;
    }
    // Try to parse as number
    const num = Number(trimmed);
    if (!Number.isNaN(num)) {
      return num === 1 || num > 0;
    }
  }

  // Default to false for any other type
  return false;
};

/**
 * Base64 encode a string (works in both web and React Native)
 */
const base64Encode = (str: string): string => {
  if (typeof btoa !== "undefined") {
    // Web environment
    return btoa(str);
  }
  // React Native fallback - simple base64 encoding
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let result = "";
  let i = 0;
  while (i < str.length) {
    const a = str.charCodeAt(i++);
    const b = i < str.length ? str.charCodeAt(i++) : 0;
    const c = i < str.length ? str.charCodeAt(i++) : 0;
    const bitmap = (a << 16) | (b << 8) | c;
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : "=";
    result += i - 1 < str.length ? chars.charAt(bitmap & 63) : "=";
  }
  return result;
};

/**
 * Convert hex color (e.g., "#006699") to HSL string (e.g., "200 100% 30%")
 */
export const hexToHsl = (hex: string): string => {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Parse hex values
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

/**
 * Convert HSL string (e.g., "160 84% 39%") to hex color (e.g., "#10B981")
 */
export const hslToHex = (hslString: string): string => {
  const parts = hslString.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!parts) return "#10B981";

  const h = parseInt(parts[1]) / 360;
  const s = parseInt(parts[2]) / 100;
  const l = parseInt(parts[3]) / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

/**
 * Get the stored authentication token
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * Get the stored device token
 * Returns the native iOS APNs device token (64-char hex string)
 * Uses the same token from deviceToken.ts (stored in AsyncStorage as 'APNsDeviceToken')
 */
export const getDeviceToken = async (): Promise<string | null> => {
  try {
    // Use the same device token from deviceToken.ts (iOS APNs token from Apple)
    const token = await getDeviceTokenFromStorage();
    console.log(
      "[API] ✅ Device token retrieved:",
      token ? `${token.substring(0, 20)}...` : "NULL",
    );
    return token;
  } catch (error) {
    // Device token not available yet - this is normal on first launch
    console.error("[API] ❌ Failed to retrieve device token:", error);
    // Return null instead of throwing to allow API calls to proceed without it
    return null;
  }
};

/**
 * Set the device token
 * NOTE: This is deprecated - device tokens are now managed by iOS native system
 * and stored via iosDeviceTokenManager. This function is kept for backward compatibility.
 */
export const setDeviceToken = async (token: string): Promise<void> => {
  // Deprecated - device tokens are auto-managed by iOS native system
};

/**
 * Clear the device token (for debugging/testing)
 * WARNING: This will break all subscriptions!
 * Delegates to deviceToken.ts
 */
export const clearDeviceToken = async (): Promise<void> => {
  const { clearDeviceToken: clearToken } = await import("./deviceToken");
  await clearToken();
};

/**
 * Get the stored session cookie (PHPSESSID)
 */
export const getSessionCookie = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(SESSION_COOKIE_KEY);
  } catch {
    return null;
  }
};

/**
 * Set the session cookie (PHPSESSID)
 */
export const setSessionCookie = async (cookie: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(SESSION_COOKIE_KEY, cookie);
  } catch {
    // Ignore errors
  }
};

/**
 * Set the stored authentication token
 */
export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore errors
  }
};

/**
 * Make an authenticated API request
 */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> => {
  const token = await getAuthToken();
  const deviceToken = await getDeviceToken();

  const headers: Record<string, string> = {};

  // Copy existing headers if they're a plain object
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  // Only set Content-Type if body is not FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (deviceToken) {
    headers["devicetoken"] = deviceToken; // Server expects lowercase
  } else {
    console.warn(`[API] ⚠️ Device token not available for ${endpoint}`);
  }

  return fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    redirect: "follow",
  });
};

/**
 * Helper to parse API response
 * Handles both JSON and text responses
 */
export const parseApiResponse = async <T = any>(
  response: Response,
): Promise<T> => {
  const contentType = response.headers.get("content-type");

  let data;
  if (contentType?.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      // If not JSON, return the text
      if (!response.ok) {
        throw new Error(text || "Request failed");
      }
      return text as unknown as T;
    }
  }

  // Check for success flag if present
  if (data.success === false || (!response.ok && !data.success)) {
    throw new Error(data.error?.message || data.message || "Request failed");
  }

  // Return data or data.data depending on structure
  return data.data || data;
};

export interface NotificationImageUpload {
  uri: string;
  name: string;
  type: string;
}

// ============================================================================
// AUTH API
// ============================================================================

/**
 * Login user
 * POST /auth/login
 */
export const login = async (email: string, password: string) => {
  try {
    const formdata = new FormData();
    formdata.append("email", email);
    formdata.append("password", password);

    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      body: formdata,
      redirect: "follow",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Login failed: ${response.status} - ${errorText}`);
    }

    // Parse response manually to handle the structure correctly
    const contentType = response.headers.get("content-type");
    let responseData: any;

    if (contentType?.includes("application/json")) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      responseData = JSON.parse(text);
    }

    // Extract and save authentication token
    // Response structure: { success: true, data: { token: "...", refreshToken: "...", user: {...} } }
    const token = responseData?.data?.token || responseData?.token;

    if (token && typeof token === "string") {
      await setAuthToken(token);
    } else {
      throw new Error("Authentication token not found in response");
    }

    // Also extract and save session cookie if present in response headers
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      const phpsessidRegex = /PHPSESSID=([^;]+)/;
      const phpsessidMatch = phpsessidRegex.exec(setCookieHeader);
      if (phpsessidMatch) {
        await setSessionCookie(`PHPSESSID=${phpsessidMatch[1]}`);
      }
    }

    return responseData;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to connect to server. Please check your connection.",
      );
    }
    throw error;
  }
};

/**
 * Logout user
 * POST /auth/logout
 */
export const logout = async () => {
  const token = await getAuthToken();
  if (!token) {
    return;
  }

  const formdata = new FormData();
  // Note: Some APIs require formdata even for logout

  const response = await apiRequest("/auth/logout", {
    method: "POST",
    body: formdata,
  });

  return parseApiResponse(response);
};

/**
 * Validate token
 * GET /validatetoken/{token}
 */
export const validateToken = async (token: string) => {
  const response = await fetch(`${BASE_URL}/validatetoken/${token}`, {
    method: "GET",
    redirect: "follow",
  });

  return parseApiResponse(response);
};

/**
 * Register device token
 * POST /registertoken/{token}
 * Note: Uses native iOS APNs token (64-char hex) as device identifier
 * Server accepts token registration without authentication
 */
export const registerToken = async (deviceToken: string) => {
  // Use the provided device token directly (APNs native token)

  try {
    const authToken = await getAuthToken();
    const BASE_URL = (await import("@/constants/config")).BASE_URL;

    const formdata = new FormData();
    // Some APIs require formdata even if empty

    const headers: Record<string, string> = {};
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    // Add devicetoken header (lowercase - server expectation)
    headers["devicetoken"] = deviceToken;

    const url = `${BASE_URL}/registertoken/${deviceToken}`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formdata,
      redirect: "follow",
    });

    const responseText = await response.text();

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      // Response is not valid JSON
    }

    // Handle "token already exists" case - this is actually success
    if (
      response.status === 404 &&
      responseData?.msg?.includes("already exist")
    ) {
      // Token already exists on server - this is OK
      return {
        error: false,
        msg: "Token already registered",
        status: 200,
        alreadyExists: true,
      };
    }

    if (!response.ok) {
      throw new Error(
        `Token registration failed: ${response.status} - ${responseText}`,
      );
    }

    // Token is managed by deviceToken.ts - verify it's stored
    // Token is managed by deviceToken.ts - it should already be saved

    if (responseData) {
      return responseData;
    }
    return parseApiResponse(response);
  } catch (error) {
    console.error("[TOKEN] ❌ Error registering token:", error);
    throw error;
  }
};

// ============================================================================
// PROMOTERS API
// ============================================================================

/**
 * Get list of promoters
 * GET /promoters
 * DeviceToken is optional
 */
export const getPromoters = async () => {
  console.log("[GET PROMOTERS] 🔍 Getting device token...");
  const deviceToken = await getDeviceToken();
  console.log(
    "[GET PROMOTERS] 📱 Device token result:",
    deviceToken ? `${deviceToken.substring(0, 20)}...` : "NULL",
  );

  const sessionCookie = await getSessionCookie();
  console.log(
    "[GET PROMOTERS] 🍪 Session cookie:",
    sessionCookie ? "Present" : "NULL",
  );

  const headers: Record<string, string> = {};
  if (deviceToken) {
    headers["devicetoken"] = deviceToken; // Server expects lowercase
    console.log("[GET PROMOTERS] ✅ Added devicetoken header");
  } else {
    console.error(
      "[GET PROMOTERS] ❌ NO DEVICE TOKEN - Headers will not include devicetoken!",
    );
  }
  // Send Cookie header if session cookie exists (required for subscription status)
  if (sessionCookie) {
    headers["Cookie"] = sessionCookie;
  }

  const url = `${BASE_URL}/promoters`;

  console.log("[GET PROMOTERS] 📤 Request:", {
    url,
    headers,
  });

  const response = await fetch(url, {
    method: "GET",
    headers,
    redirect: "follow",
  });

  // Extract and save session cookie from response if present
  const setCookieHeader = response.headers.get("set-cookie");
  if (setCookieHeader) {
    const phpsessidRegex = /PHPSESSID=([^;]+)/;
    const phpsessidMatch = phpsessidRegex.exec(setCookieHeader);
    if (phpsessidMatch) {
      await setSessionCookie(`PHPSESSID=${phpsessidMatch[1]}`);
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch promoters: ${response.status}`);
  }

  const data = await parseApiResponse(response);

  return data;
};

/**
 * Get promoter details
 * GET /promoters/{id}
 * Returns: { info: {...promoter details}, msg: [...events] }
 */
export const getPromoterDetails = async (id: string) => {
  const deviceToken = await getDeviceToken();

  const headers: Record<string, string> = {};
  if (deviceToken) {
    headers["devicetoken"] = deviceToken; // Server expects lowercase
  } else {
    console.warn(
      `[API] ⚠️ Device token not available for getPromoterDetails(${id})`,
    );
  }

  const url = `${BASE_URL}/promoters/${id}`;

  const response = await fetch(url, {
    method: "GET",
    headers,
    redirect: "follow",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[PROMOTER DETAILS API] Error:", errorText);
    throw new Error(`Failed to fetch promoter details: ${response.status}`);
  }

  const responseText = await response.text();

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error("[PROMOTER DETAILS API] Failed to parse JSON:", e);
    throw new Error("Invalid JSON response from promoter details API");
  }

  // The new API returns:
  // - info: promoter details
  // - msg: array of events for this promoter

  if (!data?.info) {
    console.error(
      "[PROMOTER DETAILS API] No 'info' field in response. Keys:",
      Object.keys(data || {}),
    );
    throw new Error("Invalid response structure: missing 'info' field");
  }

  // Parse isSubscribed field
  const promoterInfo = data.info;
  promoterInfo.isSubscribed = parseIsSubscribed(promoterInfo.isSubscribed);

  return data;
};

/**
 * Subscribe to promoter
 * POST /promoters/subscribe/{id}
 */
export const subscribeToPromoter = async (id: string) => {
  try {
    console.log("[SUBSCRIBE API] 🔍 Getting device token...");
    const deviceToken = await getDeviceToken();
    console.log(
      "[SUBSCRIBE API] 📱 Device token result:",
      deviceToken ? `${deviceToken.substring(0, 20)}...` : "NULL",
    );

    const myHeaders = new Headers();
    // Send devicetoken in header (lowercase - server expectation)
    if (deviceToken) {
      myHeaders.append("devicetoken", deviceToken);
      console.log("[SUBSCRIBE API] ✅ Added devicetoken header");
    } else {
      console.error(
        "[SUBSCRIBE API] ❌ NO DEVICE TOKEN - Headers will not include devicetoken!",
      );
    }

    const url = `${BASE_URL}/promoters/subscribe/${id}`;

    console.log("[SUBSCRIBE API] 📤 Subscribe Request:", {
      url,
      promoterId: id,
      deviceTokenPreview: deviceToken
        ? `${deviceToken.substring(0, 20)}...`
        : "NULL",
      deviceTokenFull: deviceToken || "NULL", // Log full token for debugging
      headers: Object.fromEntries(myHeaders.entries()),
    });

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      redirect: "follow",
    };

    const response = await fetch(url, requestOptions);

    const responseText = await response.text();

    console.log("[SUBSCRIBE API] 📥 Subscribe Response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText.substring(0, 200), // First 200 chars
    });

    if (!response.ok) {
      throw new Error(
        `Failed to subscribe: ${response.status} - ${responseText}`,
      );
    }

    // Parse the responseText we already read instead of calling parseApiResponse
    // This avoids "Already read" error since response body can only be read once
    let data;
    try {
      data = JSON.parse(responseText);
      console.log("[SUBSCRIBE API] ✅ Parsed Response:", data);
      console.log(
        "[SUBSCRIBE API] 🎉 Subscription successful for promoter:",
        id,
      );
    } catch {
      // If not JSON, return the text
      data = responseText as any;
      console.log("[SUBSCRIBE API] ⚠️  Non-JSON Response:", responseText);
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to connect to server. Please check your connection.",
      );
    }
    throw error;
  }
};

/**
 * Unsubscribe from promoter
 * POST /promoters/subscribe/{id} with unsubscribe flag
 */
export const unsubscribeFromPromoter = async (id: string) => {
  try {
    const deviceToken = await getDeviceToken();

    const myHeaders = new Headers();
    // Send devicetoken in header (lowercase - server expectation)
    if (deviceToken) {
      myHeaders.append("devicetoken", deviceToken);
    }

    const formdata = new FormData();
    // Send unsubscribe=1 in form-data body
    formdata.append("unsubscribe", "1");

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    const response = await fetch(
      `${BASE_URL}/promoters/subscribe/${id}`,
      requestOptions,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to unsubscribe: ${response.status} - ${errorText}`,
      );
    }

    return parseApiResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to connect to server. Please check your connection.",
      );
    }
    throw error;
  }
};

/**
 * Get promoter alerts
 * POST /promoters/alerts/{id}
 */
export const mapAlertResponse = (alert: any) => {
  if (!alert) return alert;

  const image =
    alert.image ||
    alert.notification_image ||
    alert.image_url ||
    alert.imageUrl ||
    null;

  return {
    ...alert,
    image,
    notification_image: image,
    image_url: image,
  };
};

export const mapAlertListResponse = (data: any) => {
  if (Array.isArray(data)) {
    return data.map(mapAlertResponse);
  }

  if (data && typeof data === "object") {
    const keys = ["msg", "alerts", "notifications", "data"];
    const cloned = { ...data };
    keys.forEach((key) => {
      if (Array.isArray(cloned[key])) {
        cloned[key] = cloned[key].map(mapAlertResponse);
      }
    });
    cloned.image =
      cloned.image || cloned.notification_image || cloned.image_url || null;
    if (cloned.image) {
      cloned.notification_image = cloned.image;
      cloned.image_url = cloned.image;
    }
    return cloned;
  }

  return data;
};

export const getPromoterAlerts = async (id: string) => {
  try {
    const deviceToken = await getDeviceToken();
    const sessionCookie = await getSessionCookie();

    const myHeaders = new Headers();
    // Send DeviceToken in header
    if (deviceToken) {
      myHeaders.append("DeviceToken", deviceToken);
    }
    // Send Cookie in header
    if (sessionCookie) {
      myHeaders.append("Cookie", sessionCookie);
    }

    const formdata = new FormData();

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    const response = await fetch(
      `${BASE_URL}/promoters/alerts/${id}`,
      requestOptions,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch promoter alerts: ${response.status} - ${errorText}`,
      );
    }

    const parsed = await parseApiResponse(response);
    return mapAlertListResponse(parsed);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to connect to server. Please check your connection.",
      );
    }
    throw error;
  }
};

/**
 * Get alerts for current user
 * POST /myalerts
 */
export const getMyAlerts = async () => {
  try {
    console.log("[MY ALERTS] 🔍 Getting device token...");
    const deviceToken = await getDeviceToken();
    console.log(
      "[MY ALERTS] 📱 Device token result:",
      deviceToken ? `${deviceToken.substring(0, 20)}...` : "NULL",
    );

    const sessionCookie = await getSessionCookie();
    console.log(
      "[MY ALERTS] 🍪 Session cookie:",
      sessionCookie ? "Present" : "NULL",
    );

    const myHeaders = new Headers();
    // Send devicetoken in header (lowercase - server expectation)
    if (deviceToken) {
      myHeaders.append("devicetoken", deviceToken);
      console.log("[MY ALERTS] ✅ Added devicetoken header");
    } else {
      console.error(
        "[MY ALERTS] ❌ NO DEVICE TOKEN - Headers will not include devicetoken!",
      );
    }
    // Send Cookie in header
    if (sessionCookie) {
      myHeaders.append("Cookie", sessionCookie);
    }

    console.log(
      "[MY ALERTS] 📤 Request headers:",
      Object.fromEntries(myHeaders.entries()),
    );

    const formdata = new FormData();

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    const response = await fetch(`${BASE_URL}/myalerts`, requestOptions);

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(
        `Failed to fetch alerts: ${response.status} - ${responseText}`,
      );
    }

    const parsed = await parseApiResponse(response);
    return mapAlertListResponse(parsed);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to connect to server. Please check your connection.",
      );
    }
    throw error;
  }
};

/**
 * Get specific alert details by notification ID
 * POST /myalerts/{notificationId}
 */
export const getAlertDetails = async (notificationId: string) => {
  try {
    console.log("[API] 📥 Fetching alert details for:", notificationId);

    const deviceToken = await getDeviceToken();
    const sessionCookie = await getSessionCookie();

    const myHeaders = new Headers();
    // Send devicetoken in header (lowercase - server expectation)
    if (deviceToken) {
      myHeaders.append("devicetoken", deviceToken);
      console.log("[API] ✅ Device token added to headers");
    } else {
      console.warn("[API] ⚠️ Device token not available for getAlertDetails");
    }
    // Send Cookie in header
    if (sessionCookie) {
      myHeaders.append("Cookie", sessionCookie);
      console.log("[API] ✅ Session cookie added to headers");
    }

    const formdata = new FormData();

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    console.log("[API] 🌐 Calling:", `${BASE_URL}/myalerts/${notificationId}`);
    const response = await fetch(
      `${BASE_URL}/myalerts/${notificationId}`,
      requestOptions,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[API] ❌ Failed to fetch alert details:",
        response.status,
        errorText,
      );
      throw new Error(
        `Failed to fetch alert details: ${response.status} - ${errorText}`,
      );
    }

    const parsed = await parseApiResponse(response);
    console.log("[API] ✅ Alert details fetched successfully");
    return parsed;
  } catch (error) {
    console.error("[API] ❌ Error in getAlertDetails:", error);
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to connect to server. Please check your connection.",
      );
    }
    throw error;
  }
};

/**
 * Mark an alert as read
 * POST /myalerts/read/{notificationId}
 */
export const markAlertAsRead = async (notificationId: string) => {
  try {
    const deviceToken = await getDeviceToken();
    const sessionCookie = await getSessionCookie();

    const myHeaders = new Headers();
    // Send DeviceToken in header (both variations for compatibility)
    if (deviceToken) {
      myHeaders.append("DeviceToken", deviceToken);
      myHeaders.append("devicetoken", deviceToken); // Server might expect lowercase
    } else {
      console.warn("[API] ⚠️ Device token not available for markAlertAsRead");
    }
    // Send Cookie in header
    if (sessionCookie) {
      myHeaders.append("Cookie", sessionCookie);
    }

    const formdata = new FormData();

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    const response = await fetch(
      `${BASE_URL}/myalerts/read/${notificationId}`,
      requestOptions,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to mark alert as read: ${response.status} - ${errorText}`,
      );
    }

    // Response shape: { msg: "...", error: false, status: 200 }
    return parseApiResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to connect to server. Please check your connection.",
      );
    }
    throw error;
  }
};

/**
 * Send alert to promoter (Admin only)
 * POST /promoters/sendalerts/{id}
 */
export const sendPromoterAlert = async (
  id: string,
  notificationType: string,
  notificationMessage: string,
  notificationIcon: string,
  notificationImage?: NotificationImageUpload | null,
) => {
  try {
    const authToken = await getAuthToken();
    const sessionCookie = await getSessionCookie();

    const myHeaders = new Headers();
    // Send Authorization Bearer token for admin
    if (authToken) {
      myHeaders.append("Authorization", `Bearer ${authToken}`);
    }
    // Send Cookie in header
    if (sessionCookie) {
      myHeaders.append("Cookie", sessionCookie);
    }

    const formdata = new FormData();
    formdata.append("notification_type", notificationType);
    formdata.append("notification_message", notificationMessage);
    formdata.append("notification_icon", notificationIcon);
    if (notificationImage) {
      formdata.append("image", notificationImage as any);
    }

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    const response = await fetch(
      `${BASE_URL}/promoters/sendalerts/${id}`,
      requestOptions,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to send alert: ${response.status} - ${errorText}`,
      );
    }

    return parseApiResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to connect to server. Please check your connection.",
      );
    }
    throw error;
  }
};

/**
 * Set event color settings (Admin only)
 * POST /promoters/settings
 * @param hslColor - HSL color string (e.g., "160 84% 39%") - will be converted to hex
 * @param eventId - Event ID (will be base64 encoded)
 */
export const setEventColor = async (hslColor: string, eventId: string) => {
  try {
    const authToken = await getAuthToken();
    const sessionCookie = await getSessionCookie();

    const myHeaders = new Headers();
    // Send auth-token header (not Authorization Bearer)
    if (authToken) {
      myHeaders.append("auth-token", authToken);
    }
    // Send Cookie in header
    if (sessionCookie) {
      myHeaders.append("Cookie", sessionCookie);
    }

    // Convert HSL to hex
    const hexColor = hslToHex(hslColor);

    const formdata = new FormData();
    formdata.append("skin_colour", hexColor);
    // Base64 encode the eventId
    const encodedEventId = base64Encode(eventId);
    formdata.append("eventid", encodedEventId);

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    const response = await fetch(
      `${BASE_URL}/promoters/settings`,
      requestOptions,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to set event color: ${response.status} - ${errorText}`,
      );
    }

    return parseApiResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to connect to server. Please check your connection.",
      );
    }
    throw error;
  }
};

/**
 * Set promoter color settings (Admin only)
 * POST /promoters/settings
 * @param hslColor - HSL color string (e.g., "160 84% 39%") - will be converted to hex
 * @param eventId - Optional Event ID (will be base64 encoded if provided)
 */
export const setPromoterColor = async (hslColor: string, eventId?: string) => {
  try {
    const authToken = await getAuthToken();
    const sessionCookie = await getSessionCookie();

    const myHeaders = new Headers();
    // Send auth-token header (not Authorization Bearer)
    if (authToken) {
      myHeaders.append("auth-token", authToken);
    }
    // Send Cookie in header
    if (sessionCookie) {
      myHeaders.append("Cookie", sessionCookie);
    }

    // Convert HSL to hex
    const hexColor = hslToHex(hslColor);

    const formdata = new FormData();
    formdata.append("skin_colour", hexColor);
    // Only add eventid if provided
    if (eventId) {
      // Base64 encode the eventId
      const encodedEventId = base64Encode(eventId);
      formdata.append("eventid", encodedEventId);
    }

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    const response = await fetch(
      `${BASE_URL}/promoters/settings`,
      requestOptions,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to set promoter color: ${response.status} - ${errorText}`,
      );
    }

    return parseApiResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to connect to server. Please check your connection.",
      );
    }
    throw error;
  }
};

// ============================================================================
// EVENTS API
// ============================================================================

/**
 * Get list of events
 * GET /listevents
 * DeviceToken is optional
 */
export const getEvents = async () => {
  const deviceToken = await getDeviceToken();

  const headers: Record<string, string> = {};
  if (deviceToken) {
    headers["devicetoken"] = deviceToken; // Server expects lowercase
  }

  const response = await fetch(`${BASE_URL}/listevents`, {
    method: "GET",
    headers,
    redirect: "follow",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch events: ${response.status}`);
  }

  const data = await parseApiResponse(response);
  return data;
};

/**
 * Subscribe to event
 * POST /listevents/subscribe/{id}
 */
export const subscribeToEvent = async (id: string) => {
  try {
    console.log("[SUBSCRIBE EVENT] 🔍 Getting device token...");
    const deviceToken = await getDeviceToken();
    console.log(
      "[SUBSCRIBE EVENT] 📱 Device token result:",
      deviceToken ? `${deviceToken.substring(0, 20)}...` : "NULL",
    );

    const myHeaders = new Headers();
    // Send devicetoken in header (lowercase - server expectation)
    if (deviceToken) {
      myHeaders.append("devicetoken", deviceToken);
      console.log("[SUBSCRIBE EVENT] ✅ Added devicetoken header");
    } else {
      console.error(
        "[SUBSCRIBE EVENT] ❌ NO DEVICE TOKEN - Headers will not include devicetoken!",
      );
    }

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      redirect: "follow",
    };

    console.log("[SUBSCRIBE EVENT] 📤 Request:", {
      url: `${BASE_URL}/listevents/subscribe/${id}`,
      deviceToken: deviceToken ? `${deviceToken.substring(0, 20)}...` : "NULL",
      headers: Object.fromEntries(myHeaders.entries()),
    });

    const response = await fetch(
      `${BASE_URL}/listevents/subscribe/${id}`,
      requestOptions,
    );

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        `Failed to subscribe: ${response.status} - ${responseText}`,
      );
    }

    // Parse the responseText we already read instead of calling parseApiResponse
    // This avoids "Already read" error since response body can only be read once
    try {
      const data = JSON.parse(responseText);
      return data;
    } catch {
      // If not JSON, return the text
      return responseText as any;
    }
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to connect to server. Please check your connection.",
      );
    }
    throw error;
  }
};

/**
 * Get event quick links
 * POST /listevents/quicklinks/{id}
 */
export const getEventQuickLinks = async (id: string) => {
  try {
    const deviceToken = await getDeviceToken();

    const myHeaders = new Headers();
    // Send DeviceToken in form data body to avoid CORS issues
    // if (deviceToken) {
    //   myHeaders.append('DeviceToken', deviceToken);
    // }

    const formdata = new FormData();
    // Send DeviceToken in form data body to avoid CORS issues
    if (deviceToken) {
      formdata.append("DeviceToken", deviceToken);
    }

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    const response = await fetch(
      `${BASE_URL}/listevents/quicklinks/${id}`,
      requestOptions,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch quick links: ${response.status} - ${errorText}`,
      );
    }

    const data = await parseApiResponse(response);
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to connect to server. Please check your connection.",
      );
    }
    throw error;
  }
};

/**
 * Add quick link to event (Admin only)
 * POST /listevents/addquicklinks/{id}
 */
export const addEventQuickLink = async (
  id: string,
  buttonLabel: string,
  buttonLink: string,
  buttonIcon: string,
) => {
  try {
    const authToken = await getAuthToken();
    const sessionCookie = await getSessionCookie();

    const myHeaders = new Headers();
    // Send Authorization Bearer token for admin
    if (authToken) {
      myHeaders.append("Authorization", `Bearer ${authToken}`);
    }
    // Send Cookie in header
    if (sessionCookie) {
      myHeaders.append("Cookie", sessionCookie);
    }

    const formdata = new FormData();
    formdata.append("button_label", buttonLabel);
    formdata.append("button_link", buttonLink);
    formdata.append("button_icon", buttonIcon);

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    const response = await fetch(
      `${BASE_URL}/listevents/addquicklinks/${id}`,
      requestOptions,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to add quick link: ${response.status} - ${errorText}`,
      );
    }

    return parseApiResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to connect to server. Please check your connection.",
      );
    }
    throw error;
  }
};

/**
 * Delete quick link from event (Admin only)
 * POST /listevents/quicklinks/delete/{linkId}
 */
export const deleteEventQuickLink = async (linkId: string) => {
  try {
    const deviceToken = await getDeviceToken();
    const sessionCookie = await getSessionCookie();

    const myHeaders = new Headers();
    // Send DeviceToken in header
    if (deviceToken) {
      myHeaders.append("DeviceToken", deviceToken);
    }
    // Send Cookie in header
    if (sessionCookie) {
      myHeaders.append("Cookie", sessionCookie);
    }

    const formdata = new FormData();

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    const response = await fetch(
      `${BASE_URL}/listevents/quicklinks/delete/${linkId}`,
      requestOptions,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to delete quick link: ${response.status} - ${errorText}`,
      );
    }

    return parseApiResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to connect to server. Please check your connection.",
      );
    }
    throw error;
  }
};

/**
 * Unsubscribe from event
 * POST /listevents/subscribe/{id} with unsubscribe flag
 */
export const unsubscribeFromEvent = async (id: string) => {
  try {
    const deviceToken = await getDeviceToken();
    const myHeaders = new Headers();
    // Send devicetoken in header (lowercase - server expectation)
    if (deviceToken) {
      myHeaders.append("devicetoken", deviceToken);
    }

    const formdata = new FormData();
    // Send unsubscribe=1 in form-data body
    formdata.append("unsubscribe", "1");

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    const response = await fetch(
      `${BASE_URL}/listevents/subscribe/${id}`,
      requestOptions,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to unsubscribe: ${response.status} - ${errorText}`,
      );
    }

    return parseApiResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to connect to server. Please check your connection.",
      );
    }
    throw error;
  }
};

/**
 * Get event alerts
 * POST /listevents/alerts/{id}
 */
export const getEventAlerts = async (id: string) => {
  try {
    const deviceToken = await getDeviceToken();
    const sessionCookie = await getSessionCookie();

    const myHeaders = new Headers();
    // Send DeviceToken in header
    if (deviceToken) {
      myHeaders.append("DeviceToken", deviceToken);
    }
    // Send Cookie in header
    if (sessionCookie) {
      myHeaders.append("Cookie", sessionCookie);
    }

    const formdata = new FormData();

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    const response = await fetch(
      `${BASE_URL}/listevents/alerts/${id}`,
      requestOptions,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch event alerts: ${response.status} - ${errorText}`,
      );
    }

    const parsed = await parseApiResponse(response);
    return mapAlertListResponse(parsed);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to connect to server. Please check your connection.",
      );
    }
    throw error;
  }
};

/**
 * Send alert to event (Admin only)
 * POST /promoters/sendalerts/{promoterId}
 * Note: Uses promoter endpoint but includes event ID in body
 */
export const sendEventAlert = async (
  promoterId: string,
  eventId: string,
  notificationType: string,
  notificationMessage: string,
  notificationIcon: string,
  notificationImage?: NotificationImageUpload | null,
) => {
  try {
    const authToken = await getAuthToken();
    const sessionCookie = await getSessionCookie();

    const myHeaders = new Headers();
    // Send Authorization Bearer token for admin
    if (authToken) {
      myHeaders.append("Authorization", `Bearer ${authToken}`);
    }
    // Send Cookie in header
    if (sessionCookie) {
      myHeaders.append("Cookie", sessionCookie);
    }

    const formdata = new FormData();
    formdata.append("notification_type", notificationType);
    formdata.append("notification_message", notificationMessage);
    formdata.append("notification_icon", notificationIcon);
    formdata.append("event", eventId);
    if (notificationImage) {
      formdata.append("image", notificationImage as any);
    }

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    const response = await fetch(
      `${BASE_URL}/promoters/sendalerts/${promoterId}`,
      requestOptions,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to send alert: ${response.status} - ${errorText}`,
      );
    }

    return parseApiResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to connect to server. Please check your connection.",
      );
    }
    throw error;
  }
};
