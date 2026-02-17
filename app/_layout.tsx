import { AddPaymentPrompt } from "@/components/add-payment-prompt";
import { BuybackNotification } from "@/components/buyback-notification";
import { BuybackSuccessModal } from "@/components/buyback-success-modal";
import { NotificationDetailModal } from "@/components/notification-detail-modal";
import { AdminProvider } from "@/contexts/AdminContext";
import { BuybackProvider } from "@/contexts/BuybackContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { useLocationPermission } from "@/hooks/useLocationPermission";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { verifyConfiguration } from "@/lib/verifyConfig";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import Constants from "expo-constants";
import { Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import "../global.css";
import { initializeFirebaseMessagingHandler } from "@/lib/firebaseMessagingHandler";

// Initialize FCM handler for SNS/direct FCM notifications (Android)
initializeFirebaseMessagingHandler();

// Notification handler setup moved to useEffect - expo-notifications Android push
// was removed from Expo Go in SDK 53, so we use dynamic import

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

  // State for notification modal
  const [isNotificationModalVisible, setIsNotificationModalVisible] =
    useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    string | null
  >(null);

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

  // Helper function to open modal - PRODUCTION READY
  const openNotificationModal = useCallback(
    async (notificationId: string) => {
      console.log("[NOTIFICATION] 🔼 Opening notification modal...");

      // Wait for navigation to be ready first
      const navReady = await waitForNavigationReady();
      if (!navReady) {
        console.warn(
          "[NOTIFICATION] ⚠️ Navigation not ready, but proceeding anyway...",
        );
      }

      // Open the modal with the notification ID
      setIsNotificationModalVisible(true);
      console.log("[NOTIFICATION] ✅ Modal opened successfully!");
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
        // Note: Modal opening disabled - only debug popup shows
        // setSelectedNotificationId(notificationId);
        // openNotificationModal(notificationId);
        console.log(
          "[NOTIFICATION] 🎯 Notification processed (debug popup only)",
        );
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
            // Note: Modal opening disabled - only debug popup shows
            // setSelectedNotificationId(matchingAlert.NotificationID);
            // openNotificationModal(matchingAlert.NotificationID);
            console.log(
              "[NOTIFICATION] 🎯 Notification processed via fallback (debug popup only)",
            );
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
    [extractNotificationId], // Removed openNotificationModal dependency
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

  // Setup notification handler - dynamic import for Expo Go compatibility
  useEffect(() => {
    const setup = async () => {
      if (Platform.OS === "android" && Constants.appOwnership === "expo") {
        return; // Expo Go on Android - notifications not supported in SDK 53+
      }
      try {
        const Notifications = await import("expo-notifications");
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
      } catch {
        // Expo Go or notifications not available
      }
    };
    setup();
  }, []);

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
          const Notifications = await import("expo-notifications");
          const response =
            await Notifications.getLastNotificationResponseAsync();
          if (response) {
            console.log("[NOTIFICATION] 📬 Found last notification response!");
            console.log(
              "[NOTIFICATION] 📦 Response:",
              JSON.stringify(response, null, 2),
            );

            const data = response.notification.request.content.data;
            const content = response.notification.request.content;

            // Extract notification ID
            const notificationId =
              data?.NotificationID ||
              data?.notificationId ||
              data?.notification_id ||
              data?.id ||
              "NOT FOUND";

            console.log(
              "[NOTIFICATION] 📦 Data:",
              JSON.stringify(data, null, 2),
            );

            // DEBUG: Show beautifully formatted debug popup for app closed notification
            const { Alert } = require("react-native");

            // Helper function to check if value exists and is meaningful
            const hasValue = (value: any) => {
              return value !== null && value !== undefined && value !== "";
            };

            const formatValue = (value: any, maxLength = 50) => {
              const str = String(value);
              return str.length > maxLength
                ? `${str.substring(0, maxLength)}...`
                : str;
            };

            // Build sections only if they have content
            const sections = [];

            // Notification content section
            const messageContent = [];
            if (hasValue(notificationId) && notificationId !== "Not found")
              messageContent.push(`ID: ${notificationId}`);
            if (hasValue(content.body)) messageContent.push(`${content.body}`);
            if (hasValue(content.subtitle))
              messageContent.push(`${content.subtitle}`);
            if (hasValue(content.categoryIdentifier))
              messageContent.push(`Category: ${content.categoryIdentifier}`);

            const popupTitle = content.title || "Notification";
            const popupMessage =
              messageContent.length > 0
                ? messageContent.join("\n\n")
                : "No content available";

            Alert.alert(popupTitle, popupMessage, [{ text: "OK" }], {
              cancelable: true,
            });

            console.log("[NOTIFICATION] 📋 App closed notification:", {
              title: content.title,
              body: content.body,
              notificationId,
            });

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

  // Direct notification listener - captures notification data when received
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    const setup = async () => {
      try {
        const Notifications = await import("expo-notifications");
        subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        // Get all content fields
        const content = notification.request.content;
        const data = content.data;

        console.log(
          "[NOTIFICATION] 🔔 Notification received via direct listener",
        );
        console.log(
          "[NOTIFICATION] 📦 Full content object:",
          JSON.stringify(content, null, 2),
        );
        console.log(
          "[NOTIFICATION] 📦 Data field:",
          JSON.stringify(data, null, 2),
        );
        console.log(
          "[NOTIFICATION] 📋 Title:",
          content.title,
          content.NotificationID,
        );
        console.log("[NOTIFICATION] 📋 Body:", content.body);
        console.log("[NOTIFICATION] 📋 Subtitle:", content.subtitle);
        console.log("[NOTIFICATION] 🔑 Data keys:", Object.keys(data || {}));

        // Try to find NotificationID in various places
        const notificationId =
          data?.NotificationID ||
          data?.notificationId ||
          data?.notification_id ||
          data?.id ||
          // Also check if it's in the raw content somewhere
          (content as any)?.NotificationID ||
          (content as any)?.notificationId ||
          "Not found";

        console.log("[NOTIFICATION] 🔑 Notification ID:", notificationId);

        // Note: Removed custom alert popup for production - iOS native popup is working
        // Custom popup only shows on notification tap now

        // Do NOT process notification when received - only when tapped
        // This prevents auto-opening the modal when notification appears
        console.log(
          "[NOTIFICATION] 📝 Notification received but not processed (waiting for user tap)",
        );
      },
    );
      } catch {
        // Expo Go - notifications not available
      }
    };
    setup();
    return () => subscription?.remove();
  }, [isReadyForNotifications, handleNotificationData]);

  // Notification response listener - when user taps on notification
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    const setup = async () => {
      try {
        const Notifications = await import("expo-notifications");
        subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        console.log(
          "[NOTIFICATION] 👆 Notification tapped via direct listener",
        );
        console.log(
          "[NOTIFICATION] 📦 Full payload:",
          JSON.stringify(data, null, 2),
        );
        console.log(
          "[NOTIFICATION] 🔑 Notification ID:",
          data?.notificationId || data?.NotificationID || "Not found",
        );

        // DEBUG: Show alert with full payload data
        const { Alert } = require("react-native");
        const notificationId =
          data?.NotificationID ||
          data?.notificationId ||
          data?.notification_id ||
          data?.id ||
          "Not found";

        const content = response.notification.request.content;

        // Helper function to check if value exists and is meaningful
        const hasValue = (value: any) => {
          return value !== null && value !== undefined && value !== "";
        };

        const formatValue = (value: any, maxLength = 50) => {
          const str = String(value);
          return str.length > maxLength
            ? `${str.substring(0, maxLength)}...`
            : str;
        };

        // Build sections only if they have content
        const sections = [];

        // Notification content section
        const messageContent = [];
        if (hasValue(notificationId) && notificationId !== "Not found")
          messageContent.push(`ID: ${notificationId}`);
        if (hasValue(content.body)) messageContent.push(`${content.body}`);
        if (hasValue(content.subtitle))
          messageContent.push(`${content.subtitle}`);
        if (hasValue(content.categoryIdentifier))
          messageContent.push(`Category: ${content.categoryIdentifier}`);

        const popupTitle = content.title || "Notification";
        const popupMessage =
          messageContent.length > 0
            ? messageContent.join("\n\n")
            : "No content available";

        Alert.alert(popupTitle, popupMessage, [{ text: "OK" }], {
          cancelable: true,
        });

        // Process notification if ready
        if (isReadyForNotifications && data) {
          setTimeout(() => {
            handleNotificationData(data, "tap");
          }, 300);
        }
      },
    );
      } catch {
        // Expo Go - notifications not available
      }
    };
    setup();
    return () => subscription?.remove();
  }, [isReadyForNotifications, handleNotificationData]);

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
              <NotificationDetailModal
                visible={isNotificationModalVisible}
                notificationId={selectedNotificationId || ""}
                onClose={() => {
                  console.log("[NOTIFICATION] 🔽 Modal closed");
                  setIsNotificationModalVisible(false);
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
