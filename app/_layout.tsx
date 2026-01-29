import { AddPaymentPrompt } from "@/components/add-payment-prompt";
import { BuybackNotification } from "@/components/buyback-notification";
import { BuybackSuccessModal } from "@/components/buyback-success-modal";
import { NotificationDetailBottomSheet } from "@/components/notification-detail-bottom-sheet";
import { AdminProvider } from "@/contexts/AdminContext";
import { BuybackProvider } from "@/contexts/BuybackContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { useLocationPermission } from "@/hooks/useLocationPermission";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { verifyConfiguration } from "@/lib/verifyConfig";
import BottomSheetLib from "@gorhom/bottom-sheet";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import "../global.css";

export const unstable_settings = {
  anchor: "(tabs)",
};

// Custom dark theme matching the design system
const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#0a0a0a",
    card: "#111827",
    text: "#fafafa",
    border: "rgba(255, 255, 255, 0.1)",
    primary: "#22c55e",
  },
};

export default function RootLayout() {
  // Initialize push notifications
  const { nativePushToken, devicePushToken, notification, error } =
    usePushNotifications();

  // Initialize location permissions
  const { requestPermission } = useLocationPermission();

  // Ref for notification bottom sheet
  const notificationSheetRef = useRef<BottomSheetLib>(null);
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    string | null
  >(null);

  // Track if we've checked for last notification response
  const [hasCheckedLastResponse, setHasCheckedLastResponse] = useState(false);

  // Track processed notification IDs to prevent duplicate handling
  const processedNotificationIds = useRef<Set<string>>(new Set());

  // Extract notification ID from data (supports multiple field names)
  const extractNotificationId = useCallback((data: any): string | null => {
    if (!data || typeof data !== "object") {
      return null;
    }

    // Check for notification ID in various field names (case-insensitive)
    const possibleFields = [
      "notificationId",
      "NotificationID",
      "notification_id",
      "NOTIFICATIONID",
      "id",
      "ID",
      "alertId",
      "AlertID",
      "alert_id",
      "ALERTID",
      "orderId",
      "OrderID",
      "order_id",
    ];

    for (const field of possibleFields) {
      // Check exact match first
      if (
        data[field] !== undefined &&
        data[field] !== null &&
        data[field] !== ""
      ) {
        const id = String(data[field]).trim();
        if (id) {
          console.log(
            `[NOTIFICATION] ✅ Found notification ID in field "${field}":`,
            id,
          );
          return id;
        }
      }

      // Check case-insensitive match
      const lowerField = field.toLowerCase();
      for (const key in data) {
        if (key.toLowerCase() === lowerField) {
          const value = data[key];
          if (value !== undefined && value !== null && value !== "") {
            const id = String(value).trim();
            if (id) {
              console.log(
                `[NOTIFICATION] ✅ Found notification ID in field "${key}":`,
                id,
              );
              return id;
            }
          }
        }
      }
    }

    return null;
  }, []);

  // Helper function to open bottom sheet with retries
  const openNotificationSheet = useCallback(
    (notificationId: string, retryCount = 0) => {
      const maxRetries = 3;
      const delay = retryCount === 0 ? 500 : 1000;

      setTimeout(() => {
        console.log(
          `[NOTIFICATION] 🔼 Attempting to open bottom sheet (attempt ${retryCount + 1}/${maxRetries + 1})...`,
        );
        if (notificationSheetRef.current) {
          try {
            notificationSheetRef.current.snapToIndex(2);
            console.log("[NOTIFICATION] ✅ Bottom sheet opened successfully!");
          } catch (error) {
            console.error(
              "[NOTIFICATION] ❌ Error opening bottom sheet:",
              error,
            );
            if (retryCount < maxRetries) {
              console.log(`[NOTIFICATION] 🔄 Retrying in ${delay}ms...`);
              openNotificationSheet(notificationId, retryCount + 1);
            }
          }
        } else {
          console.warn(
            `[NOTIFICATION] ⚠️ Bottom sheet ref is null (attempt ${retryCount + 1}/${maxRetries + 1})`,
          );
          if (retryCount < maxRetries) {
            console.log(`[NOTIFICATION] 🔄 Retrying in ${delay}ms...`);
            openNotificationSheet(notificationId, retryCount + 1);
          } else {
            console.error(
              "[NOTIFICATION] ❌ Failed to open bottom sheet after all retries!",
            );
          }
        }
      }, delay);
    },
    [],
  );

  // Handle notification data extraction and opening bottom sheet
  const handleNotificationData = useCallback(
    async (notificationData: any, source: string = "unknown") => {
      console.log(
        `[NOTIFICATION] 🔍 Processing notification data (source: ${source})...`,
      );
      console.log(
        "[NOTIFICATION] 📦 Full notification data:",
        JSON.stringify(notificationData, null, 2),
      );
      console.log(
        "[NOTIFICATION] 📦 Available keys:",
        Object.keys(notificationData || {}),
      );

      // First, try to extract NotificationID directly (preferred method)
      const notificationId = extractNotificationId(notificationData);

      if (notificationId) {
        // Check if we've already processed this notification to prevent duplicates
        if (processedNotificationIds.current.has(notificationId)) {
          console.log(
            `[NOTIFICATION] ⏭️ Notification ${notificationId} already processed, skipping...`,
          );
          return;
        }

        // Mark as processed
        processedNotificationIds.current.add(notificationId);

        // Clear after 5 seconds to allow re-tapping if needed
        setTimeout(() => {
          processedNotificationIds.current.delete(notificationId);
        }, 5000);

        console.log(
          "[NOTIFICATION] ✅ Using NotificationID directly:",
          notificationId,
        );
        setSelectedNotificationId(notificationId);
        openNotificationSheet(notificationId);
        return;
      }

      // Fallback: Try to match by notification_type and notification_message
      console.log(
        "[NOTIFICATION] ⚠️ No NotificationID found, trying fallback matching...",
      );
      const notificationType =
        notificationData?.notification_type || notificationData?.type || "";
      const notificationMessage =
        notificationData?.notification_message ||
        notificationData?.message ||
        notificationData?.body ||
        "";

      console.log("[NOTIFICATION] 📋 Type:", notificationType);
      console.log("[NOTIFICATION] 📋 Message:", notificationMessage);

      if (notificationType || notificationMessage) {
        console.log("[NOTIFICATION] 🔎 Fetching all alerts to find match...");

        try {
          // Import getMyAlerts at the top of the file
          const { getMyAlerts } = await import("@/lib/api");
          const alertsResponse = await getMyAlerts();

          // Extract alerts from response
          const alerts = Array.isArray(alertsResponse)
            ? alertsResponse
            : alertsResponse?.msg || alertsResponse?.alerts || [];

          console.log("[NOTIFICATION] 📦 Found", alerts.length, "total alerts");

          // Find matching alert by notification_type and notification_message
          const matchingAlert = alerts.find((alert: any) => {
            const typeMatch = alert.notification_type === notificationType;
            const messageMatch =
              alert.notification_message === notificationMessage ||
              alert.notification === notificationMessage;

            console.log(
              "[NOTIFICATION] 🔍 Checking alert:",
              alert.NotificationID,
            );
            console.log(
              "[NOTIFICATION]   Type match:",
              typeMatch,
              `(${alert.notification_type} === ${notificationType})`,
            );
            console.log("[NOTIFICATION]   Message match:", messageMatch);

            return typeMatch && messageMatch;
          });

          if (matchingAlert) {
            console.log(
              "[NOTIFICATION] ✅ Found matching alert:",
              matchingAlert.NotificationID,
            );
            setSelectedNotificationId(matchingAlert.NotificationID);
            openNotificationSheet(matchingAlert.NotificationID);
          } else {
            console.warn("[NOTIFICATION] ⚠️ No matching alert found");
            console.warn(
              "[NOTIFICATION] 🔍 Searched for type:",
              notificationType,
            );
            console.warn(
              "[NOTIFICATION] 🔍 Searched for message:",
              notificationMessage,
            );
            console.warn(
              "[NOTIFICATION] 💡 Tip: Include 'NotificationID' in notification data payload for direct matching",
            );
          }
        } catch (error) {
          console.error("[NOTIFICATION] ❌ Error fetching alerts:", error);
        }
      } else {
        console.warn(
          "[NOTIFICATION] ⚠️ No notification ID, type, or message found in data",
        );
        console.warn(
          "[NOTIFICATION] 📦 Received keys:",
          Object.keys(notificationData || {}),
        );
        console.warn(
          "[NOTIFICATION] 📦 Full data:",
          JSON.stringify(notificationData, null, 2),
        );
        console.warn(
          "[NOTIFICATION] 💡 Tip: Include 'NotificationID' in notification data payload",
        );
      }
    },
    [extractNotificationId, openNotificationSheet],
  );

  useEffect(() => {
    // Verify configuration on app start (only in development)
    if (__DEV__) {
      // Run after a short delay to avoid cluttering initial logs
      setTimeout(() => {
        verifyConfiguration();
      }, 2000);
    }

    // Request location permission on app load
    requestPermission();
  }, []);

  // Check for notification that opened the app (when app was killed)
  // This handles the case when app is completely closed and user taps notification
  useEffect(() => {
    if (!hasCheckedLastResponse) {
      console.log(
        "[NOTIFICATION] 🔍 Checking for last notification response (app was closed)...",
      );

      // Add a small delay to ensure the app is fully mounted
      const checkTimer = setTimeout(() => {
        Notifications.getLastNotificationResponseAsync()
          .then((response) => {
            if (response) {
              console.log(
                "[NOTIFICATION] 📬 Found last notification response!",
              );
              console.log(
                "[NOTIFICATION] 📦 Response:",
                JSON.stringify(response, null, 2),
              );

              const data = response.notification.request.content.data;
              console.log(
                "[NOTIFICATION] 📦 Data:",
                JSON.stringify(data, null, 2),
              );

              handleNotificationData(data, "app-closed");
            } else {
              console.log(
                "[NOTIFICATION] ℹ️ No last notification response found",
              );
            }
            setHasCheckedLastResponse(true);
          })
          .catch((err) => {
            console.error(
              "[NOTIFICATION] ❌ Error checking last response:",
              err,
            );
            setHasCheckedLastResponse(true);
          });
      }, 300); // Small delay to ensure app is ready

      return () => clearTimeout(checkTimer);
    }
  }, [hasCheckedLastResponse, handleNotificationData]);

  useEffect(() => {
    if (nativePushToken) {
      console.log("📱 Native Push Token (APNs/FCM):", nativePushToken);
    }
    if (devicePushToken) {
      console.log(
        "🔔 Device Push Token:",
        devicePushToken.data.substring(0, 50) + "...",
      );
      console.log("📱 Platform:", devicePushToken.type);
    }
    if (error) {
      console.error("❌ Push notification error:", error);
    }
  }, [nativePushToken, devicePushToken, error]);

  // Handle notification from usePushNotifications hook (for foreground/background taps)
  useEffect(() => {
    if (notification) {
      console.log(
        "[NOTIFICATION] 🔔 Notification received in _layout:",
        notification,
      );

      // Extract notification data
      const notificationData = notification.request.content.data || {};

      // Log the full content for debugging
      console.log(
        "[NOTIFICATION] 📋 Title:",
        notification.request.content.title,
      );
      console.log("[NOTIFICATION] 📋 Body:", notification.request.content.body);

      // Determine source based on notification state
      const source = "app-open"; // App is already open (foreground/background)
      handleNotificationData(notificationData, source);
    }
  }, [notification, handleNotificationData]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AdminProvider>
        <BuybackProvider>
          <NotificationProvider>
            <ThemeProvider value={customDarkTheme}>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
              <BuybackNotification />
              <BuybackSuccessModal />
              <AddPaymentPrompt />
              <NotificationDetailBottomSheet
                ref={notificationSheetRef}
                notificationId={selectedNotificationId}
                onClose={() => {
                  console.log("[NOTIFICATION] 🔽 Bottom sheet closed");
                  setSelectedNotificationId(null);
                }}
              />
              <StatusBar style="light" />
            </ThemeProvider>
          </NotificationProvider>
        </BuybackProvider>
      </AdminProvider>
    </GestureHandlerRootView>
  );
}
