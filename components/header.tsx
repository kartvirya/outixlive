import { MotiView } from "moti";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AdminControls } from "./admin-controls";

interface HeaderProps {
  themeColor?: string;
  onThemeColorChange?: (color: string) => void;
  notificationTarget?: string;
}

export const Header = ({
  themeColor,
  onThemeColorChange,
  notificationTarget,
}: HeaderProps) => {
  return (
    <View style={styles.header}>
      <View style={styles.overlay} />

      <View style={styles.container}>
        {/* Left */}
        <MotiView
          from={{ opacity: 0, translateY: -8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 300 }}
          style={styles.brand}
        >
          <View>
            <Text style={styles.title}>
              Outix <Text style={styles.live}>LIVE</Text>
            </Text>
          </View>
        </MotiView>

        {/* Right */}
        <AdminControls
          variant="header"
          themeColor={themeColor}
          onThemeColorChange={onThemeColorChange}
          notificationTarget={notificationTarget}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 64,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  live: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
