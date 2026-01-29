/**
 * usePushNotifications Hook
 *
 * Manages push notification setup, permissions, and listeners
 * Automatically registers push tokens with backend (local or production)
 */

import { DEBUG_PUSH, IS_DEVELOPMENT } from "@/constants/config";
import {
  checkBackendHealth,
  getDevicePushToken,
  getExpoPushTokenAsync,
  registerForPushNotificationsAsync,
  registerTokenWithBothServices,
  requestNotificationPermissions,
  setupNotificationListeners,
  initializeIOSDeviceTokenListener,
} from "@/lib/pushNotifications";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

export interface UsePushNotificationsResult {
  expoPushToken: string | null;
  nativePushToken: string | null; // Native APNs/FCM token for AWS SNS
  devicePushToken: { data: string; type: string } | null;
  notification: Notifications.Notification | null;
  error: Error | null;
  isLoading: boolean;
  isBackendHealthy: boolean;
  backendInfo: any | null;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [nativePushToken, setNativePushToken] = useState<string | null>(null);
  const [devicePushToken, setDevicePushToken] = useState<{
    data: string;
    type: string;
  } | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendHealthy, setIsBackendHealthy] = useState(false);
  const [backendInfo, setBackendInfo] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function setupPushNotifications() {
      try {
        setIsLoading(true);
        if (DEBUG_PUSH) {
          console.log(
            "[PUSH] 🚀 Setting up push notifications (" +
              (IS_DEVELOPMENT ? "LOCAL BACKEND" : "PRODUCTION") +
              ")...",
          );
        }

        // Step 0: Initialize iOS integration if on iOS
        if (Platform.OS === 'ios') {
          console.log("[PUSH] 📱 Step 0: Initializing iOS native integration...");
          try {
            const cleanup = initializeIOSDeviceTokenListener();
            if (cleanup) {
              console.log("[PUSH] ✅ iOS integration initialized successfully");
            }
          } catch (iosError) {
            console.warn("[PUSH] ⚠️ iOS integration setup failed:", iosError);
          }
        }

        // Step 1: Check backend health first (for local development)
        if (IS_DEVELOPMENT) {
          try {
            console.log("[PUSH] 🏥 Checking local backend health...");
            const health = await checkBackendHealth();
            if (isMounted) {
              setIsBackendHealthy(true);
              setBackendInfo(health);
              console.log(
                "[PUSH] ✅ Local backend is healthy:",
                health.message,
              );
            }
          } catch (healthError) {
            console.warn(
              "[PUSH] ⚠️ Local backend health check failed:",
              healthError,
            );
            if (isMounted) {
              setIsBackendHealthy(false);
              // Continue setup anyway - maybe backend will come online
            }
          }
        } else {
          setIsBackendHealthy(true); // Assume production is healthy
        }

        // Step 2: Request permissions
        console.log("[PUSH] 📋 Step 2: Requesting permissions...");
        const hasPermission = await requestNotificationPermissions();

        if (!hasPermission) {
          console.log("[PUSH] ⚠️ Permissions not granted, setup stopped");
          if (isMounted) {
            setError(new Error("Notification permissions not granted"));
          }
          return;
        }

        // Step 3: Get tokens
        console.log("[PUSH] Step 3: Getting tokens...");
        const expoToken = await getExpoPushTokenAsync();
        const nativeToken = await registerForPushNotificationsAsync();
        const devToken = await getDevicePushToken();

        if (isMounted) {
          setExpoPushToken(expoToken);
          setNativePushToken(nativeToken);
          setDevicePushToken(devToken);

          if (DEBUG_PUSH) {
            console.log(
              "[PUSH] ✅ Native token obtained:",
              nativeToken ? "Yes" : "No",
            );
            console.log(
              "[PUSH] ✅ Device token obtained:",
              devToken ? "Yes" : "No",
            );
            console.log(
              "[PUSH] ✅ Expo token obtained:",
              expoToken ? "Yes" : "No",
            );
          }

          // Step 4: Register with both AWS SNS and backend
          if (devToken || nativeToken || expoToken) {
            try {
              console.log("[PUSH] Step 4: Registering with services...");
              const registrationResult = await registerTokenWithBothServices();

              if (registrationResult.success) {
                console.log(
                  "[PUSH] ✅ Setup complete! Device registered with services",
                );
                if (registrationResult.primaryEndpoint) {
                  console.log("[PUSH] 🎯 Primary endpoint: AWS SNS");
                } else {
                  console.log("[PUSH] 🎯 Primary endpoint: Backend");
                }
              } else {
                console.warn(
                  "[PUSH] ⚠️ All registration methods failed, but continuing...",
                );
              }
            } catch (backendError) {
              console.error("[PUSH] ❌ Registration failed:", backendError);
              // Don't set error state - tokens are still valid locally
              if (IS_DEVELOPMENT) {
                console.log(
                  "[PUSH] 💡 Tip: Check AWS credentials and local backend status",
                );
              }
            }
          } else {
            console.log(
              "[PUSH] ⚠️ Skipping backend registration - tokens missing",
            );
          }
        }
      } catch (err) {
        console.error("[PUSH] ❌ Setup error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Setup failed"));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    setupPushNotifications();

    // Setup notification listeners
    const cleanup = setupNotificationListeners(
      (notification) => {
        setNotification(notification);
      },
      (response) => {
        // Handle notification tap
        console.log("[PUSH] 👆 User tapped notification:", response);
        
        // Extract notification data
        const notificationData = response.notification.request.content;
        console.log("[PUSH] 📦 Notification data:", notificationData.data);
        
        // Pass the notification to state so _layout can handle showing the modal
        setNotification(response.notification);
      },
    );

    return () => {
      isMounted = false;
      cleanup();
    };
  }, []);

  return {
    expoPushToken,
    nativePushToken,
    devicePushToken,
    notification,
    error,
    isLoading,
    isBackendHealthy,
    backendInfo,
  };
}
