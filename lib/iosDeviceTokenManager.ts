/**
 * iOS Device Token Bridge
 * Listens to native iOS device token events and integrates with React Native
 * Falls back gracefully when native bridge is not available
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EventSubscription } from "react-native";
import { Platform } from "react-native";

interface DeviceTokenEvent {
  deviceToken: string;
}

interface NotificationTappedEvent {
  [key: string]: any;
}

class IOSDeviceTokenManager {
  private deviceTokenListener: EventSubscription | null = null;
  private notificationTapListener: EventSubscription | null = null;
  private fallbackToken: string | null = null;

  constructor() {
    if (Platform.OS === "ios") {
      console.log(
        "[iOS Token Manager] 📱 iOS Device Token Manager initialized",
      );
      // Check for stored token immediately
      this.checkForStoredToken();
    } else {
      console.log(
        "[iOS Token Manager] ⚠️ iOS Device Token Manager only works on iOS",
      );
    }
  }

  private async checkForStoredToken() {
    try {
      const storedToken = await this.getStoredDeviceToken();
      if (storedToken) {
        this.fallbackToken = storedToken;
        console.log("[iOS Token Manager] 📱 Found existing token on startup");
      }
    } catch (error) {
      console.error("[iOS Token Manager] Error checking stored token:", error);
    }
  }

  /**
   * Start listening for device token from iOS AppDelegate
   * Uses native bridge if available, falls back to polling storage
   */
  startListeningForDeviceToken(callback: (token: string) => void): () => void {
    if (Platform.OS !== "ios") {
      console.warn("[iOS Token Manager] Only available on iOS");
      return () => {};
    }

    console.log(
      "[iOS Token Manager] 🎯 Starting to listen for device token...",
    );

    // If we already have a token, call the callback immediately
    const hasExistingFallbackToken = !!this.fallbackToken;
    if (this.fallbackToken) {
      console.log("[iOS Token Manager] ✅ Using existing token");
      setTimeout(() => callback(this.fallbackToken!), 100);
    }

    // Try to set up native bridge listener
    let eventEmitter: any = null;
    try {
      const { NativeEventEmitter, NativeModules } = require("react-native");
      const { DeviceTokenBridge } = NativeModules;

      if (DeviceTokenBridge) {
        eventEmitter = new NativeEventEmitter(DeviceTokenBridge);

        this.deviceTokenListener = eventEmitter.addListener(
          "DeviceTokenReceived",
          (event: DeviceTokenEvent) => {
            console.log(
              "[iOS Token Manager] ✅ Device token received from native bridge:",
              event.deviceToken.substring(0, 20) + "...",
            );
            console.log(
              `[iOS Token Manager] 📊 Token length: ${event.deviceToken.length} characters`,
            );
            this.fallbackToken = event.deviceToken;
            callback(event.deviceToken);
          },
        );

        console.log("[iOS Token Manager] 🔗 Native bridge listener set up");
      } else {
        console.warn(
          "[iOS Token Manager] ⚠️ Native DeviceTokenBridge not available, using fallback polling",
        );
        // If we already have a token (from storage), there's no point polling.
        if (!hasExistingFallbackToken) {
          this.setupFallbackPolling(callback);
        } else {
          console.log(
            "[iOS Token Manager] ℹ️ Skipping fallback polling (token already available from storage)",
          );
        }
      }
    } catch (error) {
      console.warn(
        "[iOS Token Manager] ⚠️ Could not set up native bridge, using fallback:",
        error,
      );
      // If token is already available, avoid starting a redundant polling loop.
      if (!hasExistingFallbackToken) {
        this.setupFallbackPolling(callback);
      } else {
        console.log(
          "[iOS Token Manager] ℹ️ Skipping fallback polling (token already available from storage)",
        );
      }
    }

    // Return cleanup function
    return () => {
      this.stopListeningForDeviceToken();
    };
  }

  private setupFallbackPolling(callback: (token: string) => void) {
    console.log(
      "[iOS Token Manager] 🔄 Setting up fallback polling for device token...",
    );

    // If we already have a token, no need to poll (avoid wasting CPU and logs).
    if (this.fallbackToken) {
      console.log(
        "[iOS Token Manager] ℹ️ Fallback token already set; not starting polling loop",
      );
      return;
    }

    // Poll for token in storage every 2 seconds
    const pollInterval = setInterval(async () => {
      try {
        const storedToken = await this.getStoredDeviceToken();
        if (!storedToken) {
          return;
        }

        // If stored token equals fallbackToken, we can stop polling (token already known).
        if (storedToken === this.fallbackToken) {
          clearInterval(pollInterval);
          return;
        }

        if (storedToken && storedToken !== this.fallbackToken) {
          console.log(
            "[iOS Token Manager] ✅ Device token found via polling:",
            storedToken.substring(0, 20) + "...",
          );
          this.fallbackToken = storedToken;
          callback(storedToken);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("[iOS Token Manager] Error polling for token:", error);
      }
    }, 2000);

    // Stop polling after 60 seconds
    setTimeout(() => {
      clearInterval(pollInterval);
      console.log("[iOS Token Manager] ⏱️ Token polling timeout reached");
    }, 60000);
  }

  /**
   * Start listening for notification tap events
   */
  startListeningForNotificationTaps(
    callback: (userInfo: any) => void,
  ): () => void {
    if (Platform.OS !== "ios") {
      console.warn("[iOS Token Manager] Only available on iOS");
      return () => {};
    }

    console.log(
      "[iOS Token Manager] 👆 Starting to listen for notification taps...",
    );

    try {
      const { NativeEventEmitter, NativeModules } = require("react-native");
      const { DeviceTokenBridge } = NativeModules;

      if (DeviceTokenBridge) {
        const eventEmitter = new NativeEventEmitter(DeviceTokenBridge);

        this.notificationTapListener = eventEmitter.addListener(
          "NotificationTapped",
          (userInfo: NotificationTappedEvent) => {
            console.log(
              "[iOS Token Manager] 👆 Notification tapped:",
              userInfo,
            );
            callback(userInfo);
          },
        );

        console.log("[iOS Token Manager] 🔗 Notification tap listener set up");
      } else {
        console.warn(
          "[iOS Token Manager] ⚠️ Native bridge not available for notification taps",
        );
      }
    } catch (error) {
      console.warn(
        "[iOS Token Manager] ⚠️ Could not set up notification tap listener:",
        error,
      );
    }

    // Return cleanup function
    return () => {
      this.stopListeningForNotificationTaps();
    };
  }

  /**
   * Stop listening for device token
   */
  stopListeningForDeviceToken() {
    if (this.deviceTokenListener) {
      console.log("[iOS Token Manager] 🛑 Stopping device token listener");
      this.deviceTokenListener.remove();
      this.deviceTokenListener = null;
    }
  }

  /**
   * Stop listening for notification taps
   */
  stopListeningForNotificationTaps() {
    if (this.notificationTapListener) {
      console.log("[iOS Token Manager] 🛑 Stopping notification tap listener");
      this.notificationTapListener.remove();
      this.notificationTapListener = null;
    }
  }

  /**
   * Get stored device token from AsyncStorage
   */
  async getStoredDeviceToken(): Promise<string | null> {
    if (Platform.OS !== "ios") {
      return null;
    }

    try {
      console.log("[iOS Token Manager] 🔍 Checking for stored device token...");
      const storedToken = await AsyncStorage.getItem("APNsDeviceToken");

      if (storedToken) {
        console.log(
          `[iOS Token Manager] 📱 Found stored device token: ${storedToken.substring(0, 20)}...`,
        );
        return storedToken;
      }

      console.log("[iOS Token Manager] ⚠️ No stored device token found");
      return null;
    } catch (error) {
      console.error(
        "[iOS Token Manager] ❌ Error getting stored token:",
        error,
      );
      return null;
    }
  }

  /**
   * Store device token for later use
   */
  async storeDeviceToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem("APNsDeviceToken", token);
      console.log(
        `[iOS Token Manager] 💾 Device token stored successfully: ${token.substring(0, 20)}...`,
      );
    } catch (error) {
      console.error("[iOS Token Manager] ❌ Error storing token:", error);
    }
  }

  /**
   * Cleanup all listeners
   */
  cleanup() {
    console.log("[iOS Token Manager] 🧹 Cleaning up all listeners");
    this.stopListeningForDeviceToken();
    this.stopListeningForNotificationTaps();
  }
}

// Export singleton instance
export const iosDeviceTokenManager = new IOSDeviceTokenManager();

// Export types
export type { DeviceTokenEvent, NotificationTappedEvent };

// Export class for advanced usage
  export { IOSDeviceTokenManager };

// Convenience functions
export const startListeningForDeviceToken = (
  callback: (token: string) => void,
) => {
  return iosDeviceTokenManager.startListeningForDeviceToken(callback);
};

export const startListeningForNotificationTaps = (
  callback: (userInfo: any) => void,
) => {
  return iosDeviceTokenManager.startListeningForNotificationTaps(callback);
};

export const getStoredDeviceToken = () => {
  return iosDeviceTokenManager.getStoredDeviceToken();
};

export const storeDeviceToken = (token: string) => {
  return iosDeviceTokenManager.storeDeviceToken(token);
};
