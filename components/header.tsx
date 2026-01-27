import { Bell } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AdminControls } from "./admin-controls";
import { NotificationDropdown } from "./notification-dropdown";

interface HeaderProps {
  notificationCount?: number;
  themeColor?: string;
  onThemeColorChange?: (color: string) => void;
  notificationTarget?: string;
  onNotificationRead?: () => void;
}

export const Header = ({
  notificationCount = 0,
  themeColor,
  onThemeColorChange,
  notificationTarget,
  onNotificationRead,
}: HeaderProps) => {
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);

  return (
    <View style={styles.header}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.title}>Outix</Text>
          <Text style={[styles.subtitle, { marginLeft: 4 }]}>Live</Text>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => setShowNotificationDropdown(true)}
          >
            <Bell size={20} color="#fafafa" />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 9 ? "9+" : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <AdminControls
            variant="header"
            themeColor={themeColor}
            onThemeColorChange={onThemeColorChange}
            notificationTarget={notificationTarget}
          />
        </View>
      </View>

      <NotificationDropdown
        visible={showNotificationDropdown}
        onClose={() => setShowNotificationDropdown(false)}
        notificationCount={notificationCount}
        onNotificationRead={onNotificationRead}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "rgba(10, 10, 10, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    paddingTop: 8,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 16,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fafafa",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#22c55e", // primary emerald
  },
  notificationButton: {
    position: "relative",
    padding: 8,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444", // destructive
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
});
