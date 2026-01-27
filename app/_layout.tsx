import { AddPaymentPrompt } from "@/components/add-payment-prompt";
import { BuybackNotification } from "@/components/buyback-notification";
import { BuybackSuccessModal } from "@/components/buyback-success-modal";
import { AdminProvider } from "@/contexts/AdminContext";
import { BuybackProvider } from "@/contexts/BuybackContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { verifyConfiguration } from "@/lib/verifyConfig";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
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

  useEffect(() => {
    // Verify configuration on app start (only in development)
    if (__DEV__) {
      // Run after a short delay to avoid cluttering initial logs
      setTimeout(() => {
        verifyConfiguration();
      }, 2000);
    }
  }, []);

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

  useEffect(() => {
    if (notification) {
      console.log("🔔 New notification:", notification);
      // Handle notification here (show alert, navigate, etc.)
    }
  }, [notification]);

  return (
    <AdminProvider>
      <BuybackProvider>
        <ThemeProvider value={customDarkTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="event/[id]"
              options={{ headerShown: false, presentation: "card" }}
            />
            <Stack.Screen
              name="promoter/[id]"
              options={{ headerShown: false, presentation: "card" }}
            />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
          </Stack>
          <BuybackNotification />
          <BuybackSuccessModal />
          <AddPaymentPrompt />
          <StatusBar style="light" />
        </ThemeProvider>
      </BuybackProvider>
    </AdminProvider>
  );
}
