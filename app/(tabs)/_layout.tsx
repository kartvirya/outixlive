import { Colors } from "@/constants/theme";
import { useNotifications } from "@/contexts/NotificationContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Tabs, useSegments } from "expo-router";
import { Bell, Calendar, Home, User } from "lucide-react-native";
import React from "react";
import { StyleSheet } from "react-native";
import "../../global.css";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { unreadCount } = useNotifications();
  const segments = useSegments();

  // Determine which tab should be active based on current route
  const isOnEventPage = segments.includes("event");
  const isOnPromoterPage = segments.includes("promoter");

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "dark"].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? "dark"].tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(10, 10, 10, 0.95)",
          borderTopWidth: 1,
          borderTopColor: "rgba(255, 255, 255, 0.1)",
          paddingBottom: 28,
          paddingTop: 8,
          height: 84,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
        tabBarShowLabel: true, // Always show labels
        tabBarLabelPosition: "below-icon", // Position labels below icons
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Venues",
          tabBarIcon: ({ color, size, focused }) => (
            <Home
              size={size || 20}
              color={
                focused || isOnPromoterPage
                  ? Colors[colorScheme ?? "dark"].tint
                  : color
              }
            />
          ),
        }}
      />

      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color, size, focused }) => (
            <Calendar
              size={size || 20}
              color={
                focused || isOnEventPage
                  ? Colors[colorScheme ?? "dark"].tint
                  : color
              }
            />
          ),
        }}
      />

      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: styles.badge,
          tabBarIcon: ({ color, size }) => (
            <Bell size={size || 20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <User size={size || 20} color={color} />
          ),
        }}
      />

      {/* Hidden tabs for detail pages - keeps tab bar visible */}
      {/* Event detail pages - should highlight Events tab */}
      <Tabs.Screen
        name="event/[id]"
        options={{
          href: null, // Hide from tab bar
        }}
      />

      {/* Promoter detail pages - should highlight Venues tab */}
      <Tabs.Screen
        name="promoter/[id]"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: "#ef4444",
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    minWidth: 18,
    height: 18,
  },
});
