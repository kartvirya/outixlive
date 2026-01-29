import { AddPaymentPrompt } from "@/components/add-payment-prompt";
import { BuybackNotification } from "@/components/buyback-notification";
import { BuybackSuccessModal } from "@/components/buyback-success-modal";
import { NotificationPopupModal } from "@/components/notification-popup-modal";
import { AdminProvider } from "@/contexts/AdminContext";
import { BuybackProvider } from "@/contexts/BuybackContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { useLocationPermission } from "@/hooks/useLocationPermission";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { verifyConfiguration } from "@/lib/verifyConfig";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import "../global.css";

// CRITICAL: Configure notification handler BEFORE anything else
// This MUST be called at module level, not inside a component
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
  // Use segments to detect when navigation is ready
  const segments = useSegments();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Initialize push notifications
  const { nativePushToken, devicePushToken, notification, error } =
    usePushNotifications();

  // Initialize location permissions
  const { requestPermission } = useLocationPermission();

  // State for notification popup modal
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    string | null
  >(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  // Track if we've checked for last notification response
  const [hasCheckedLastResponse, setHasCheckedLastResponse] = useState(false);

  // Track processed notification IDs to prevent duplicate handling
  const processedNotificationIds = useRef<Set<string>>(new Set());

  // Track if we're ready to show notifications (navigation + bottom sheet ready)
  const [isReadyForNotifications, setIsReadyForNotifications] = useState(false);

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

  // Helper function to wait for navigation to be ready
  const waitForNavigationReady = useCallback(
    (maxWait = 5000): Promise<boolean> => {
      return new Promise((resolve) => {
        if (isNavigationReady && segments.length > 0) {
          resolve(true);
          return;
        }

        let attempts = 0;
        const maxAttempts = maxWait / 100;
        const checkInterval = setInterval(() => {
          attempts++;
          if (
            (isNavigationReady && segments.length > 0) ||
            attempts >= maxAttempts
          ) {
            clearInterval(checkInterval);
            resolve(isNavigationReady && segments.length > 0);
          }
        }, 100);
      });
    },
    [isNavigationReady, segments],
  );

  // Helper function to open notification popup modal
  const openNotificationPopup = useCallback(
    async (notificationId: string) => {
      console.log("[NOTIFICATION] 🔼 Opening notification popup for:", notificationId);
      
      // Wait for navigation to be ready first
      const navReady = await waitForNavigationReady();
      if (!navReady) {
        console.warn(
          "[NOTIFICATION] ⚠️ Navigation not ready, but proceeding anyway...",
        );
      }

      // Small delay to ensure UI is ready
      setTimeout(() => {
        setSelectedNotificationId(notificationId);
        setIsPopupVisible(true);
        console.log("[NOTIFICATION] ✅ Popup opened successfully!");
      }, 300);
    },
    [waitForNavigationReady],
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
        openNotificationPopup(notificationId);
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
            openNotificationPopup(matchingAlert.NotificationID);
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
    [extractNotificationId, openNotificationPopup],
  );

  // Expose handleNotificationData globally for testing (ALWAYS - needed for test button)
  useEffect(() => {
    // @ts-ignore - For testing purposes
    global.handleNotificationData = (data: any) => {
      console.log("[TEST] 🧪 Testing notification handler with:", data);
      handleNotificationData(data, "test");
    };
    console.log("[TEST] ✅ handleNotificationData exposed globally");
    console.log(
      "[TEST] 💡 Use: global.handleNotificationData({ NotificationID: 'Mjg4NDQ3NTMwMjQ=' })",
    );
  }, [handleNotificationData]);

  // Track navigation ready state - when segments are available, navigation is ready
  useEffect(() => {
    if (segments.length > 0 && !isNavigationReady) {
      setIsNavigationReady(true);
      // Add small delay to ensure everything is mounted
      setTimeout(() => {
        setIsReadyForNotifications(true);
        console.log(
          "[NOTIFICATION] ✅ Navigation is ready, ready for notifications",
        );
      }, 500);
    }
  }, [segments, isNavigationReady]);

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
  // CRITICAL: Wait for navigation to be ready before processing
  useEffect(() => {
    if (!hasCheckedLastResponse && isReadyForNotifications) {
      console.log(
        "[NOTIFICATION] 🔍 Checking for last notification response (app was closed)...",
      );
      console.log(
        `[NOTIFICATION] 📊 Ready state - Navigation: ${isNavigationReady}, Segments: ${segments.length}`,
      );

      // Wait for navigation to be ready, then check for notification
      const checkNotification = async () => {
        // Wait up to 2 seconds for navigation to be ready
        const navReady = await waitForNavigationReady(2000);
        if (!navReady) {
          console.warn(
            "[NOTIFICATION] ⚠️ Navigation not ready after wait, proceeding anyway...",
          );
        }

        try {
          const response =
            await Notifications.getLastNotificationResponseAsync();
          if (response) {
            console.log("[NOTIFICATION] 📬 Found last notification response!");
            console.log(
              "[NOTIFICATION] 📦 Response:",
              JSON.stringify(response, null, 2),
            );

            const data = response.notification.request.content.data;
            console.log(
              "[NOTIFICATION] 📦 Data:",
              JSON.stringify(data, null, 2),
            );

            // Small delay to ensure UI is fully rendered
            setTimeout(() => {
              handleNotificationData(data, "app-closed");
            }, 500);
          } else {
            console.log(
              "[NOTIFICATION] ℹ️ No last notification response found",
            );
          }
          setHasCheckedLastResponse(true);
        } catch (err) {
          console.error("[NOTIFICATION] ❌ Error checking last response:", err);
          setHasCheckedLastResponse(true);
        }
      };

      // Start checking after a small delay to ensure app is mounted
      const checkTimer = setTimeout(() => {
        checkNotification();
      }, 300);

      return () => clearTimeout(checkTimer);
    }
  }, [
    hasCheckedLastResponse,
    isReadyForNotifications,
    isNavigationReady,
    segments,
    handleNotificationData,
    waitForNavigationReady,
  ]);

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
  // This listener fires when app is already running (foreground or background)
  useEffect(() => {
    if (notification && isReadyForNotifications) {
      console.log(
        "[NOTIFICATION] 🔔 Notification received in _layout (app was open):",
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

      // Small delay to ensure navigation is ready
      setTimeout(() => {
        handleNotificationData(notificationData, source);
      }, 300);
    } else if (notification && !isReadyForNotifications) {
      console.log(
        "[NOTIFICATION] ⏳ Notification received but app not ready yet, will process when ready...",
      );
    }
  }, [notification, isReadyForNotifications, handleNotificationData]);

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
              <NotificationPopupModal
                notificationId={selectedNotificationId}
                visible={isPopupVisible}
                onClose={() => {
                  console.log("[NOTIFICATION] 🔽 Popup closed");
                  setIsPopupVisible(false);
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
