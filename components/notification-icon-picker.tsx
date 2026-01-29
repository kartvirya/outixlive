import {
    AlertTriangle,
    Bell,
    Calendar,
    CheckCircle,
    Clock,
    Flag,
    Info,
    Megaphone,
    MessageSquare,
    Star,
    Users,
    Zap,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type NotificationIconType =
  | "bell"
  | "alert"
  | "calendar"
  | "users"
  | "megaphone"
  | "info"
  | "clock"
  | "check"
  | "zap"
  | "flag"
  | "star"
  | "message";

interface IconOption {
  id: NotificationIconType;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  number: string; // for backward compatibility with API
}

const ICON_OPTIONS: IconOption[] = [
  { id: "bell", icon: Bell, label: "Bell", number: "1" },
  { id: "alert", icon: AlertTriangle, label: "Alert", number: "2" },
  { id: "calendar", icon: Calendar, label: "Calendar", number: "3" },
  { id: "users", icon: Users, label: "Users", number: "4" },
  { id: "megaphone", icon: Megaphone, label: "Announce", number: "5" },
  { id: "info", icon: Info, label: "Info", number: "6" },
  { id: "clock", icon: Clock, label: "Clock", number: "7" },
  { id: "check", icon: CheckCircle, label: "Check", number: "8" },
  { id: "zap", icon: Zap, label: "Urgent", number: "9" },
  { id: "flag", icon: Flag, label: "Flag", number: "10" },
  { id: "star", icon: Star, label: "Star", number: "11" },
  { id: "message", icon: MessageSquare, label: "Message", number: "12" },
];

interface NotificationIconPickerProps {
  selectedIcon: string; // number string like "1", "2", etc.
  onSelectIcon: (iconNumber: string) => void;
  accentColor?: string;
}

export const NotificationIconPicker: React.FC<NotificationIconPickerProps> = ({
  selectedIcon,
  onSelectIcon,
  accentColor = "#22c55e",
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Notification Icon</Text>
      <View style={styles.iconGrid}>
        {ICON_OPTIONS.map((option) => {
          const IconComponent = option.icon;
          const isSelected = selectedIcon === option.number;

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.iconButton,
                isSelected && {
                  backgroundColor: accentColor + "20",
                  borderColor: accentColor,
                },
              ]}
              onPress={() => onSelectIcon(option.number)}
            >
              <IconComponent
                size={24}
                color={isSelected ? accentColor : "#737373"}
              />
              <Text
                style={[styles.iconLabel, isSelected && { color: accentColor }]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    color: "#d1d5db",
    marginBottom: 12,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  iconButton: {
    width: "23%",
    aspectRatio: 1,
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  iconLabel: {
    fontSize: 10,
    color: "#737373",
    marginTop: 4,
    textAlign: "center",
  },
});

// Helper function to get icon component by number (for display purposes)
export const getIconByNumber = (iconNumber: string) => {
  const option = ICON_OPTIONS.find((opt) => opt.number === iconNumber);
  return option?.icon || Bell;
};
