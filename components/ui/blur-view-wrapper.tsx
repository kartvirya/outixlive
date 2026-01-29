import React, { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface BlurViewWrapperProps {
  children: ReactNode;
  intensity?: number;
  tint?: "light" | "dark" | "default";
  style?: ViewStyle;
  blurStyle?: ViewStyle;
}

export const BlurViewWrapper = ({
  children,
  intensity = 50,
  tint = "light",
  style,
  blurStyle,
}: BlurViewWrapperProps) => {
  const backgroundColor =
    tint === "dark" ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)";
  return (
    <View style={[styles.container, style]}>
      <View style={[StyleSheet.absoluteFill, blurStyle, { backgroundColor }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

// Glassmorphism Card Component
interface GlassCardProps {
  children: ReactNode;
  intensity?: number;
  tint?: "light" | "dark" | "default";
  style?: ViewStyle;
}

export const GlassCard = ({
  children,
  intensity = 30,
  tint = "light",
  style,
}: GlassCardProps) => {
  const backgroundColor =
    tint === "dark" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";
  return (
    <View style={[styles.glassCard, style]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor }]} />
      <View style={styles.glassContent}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  content: {
    flex: 1,
  },
  glassCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  glassContent: {
    padding: 16,
  },
});
