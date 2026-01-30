import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  Droplets,
  Fuel,
  HelpCircle,
  Info,
  Megaphone,
  MessageSquare,
  Phone,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
  Zap,
} from "lucide-react-native";
import React from "react";

export type ActionIconType =
  | "zap"
  | "fuel"
  | "wrench"
  | "alert"
  | "help"
  | "phone"
  | "message"
  | "bell"
  | "shield"
  | "truck"
  | "droplets"
  | "settings";

export type ContactType = "email" | "sms" | "username";

export type PriceType = "none" | "fixed" | "user-input";

const ICON_MAP: Record<
  ActionIconType,
  React.ComponentType<{ size?: number; color?: string; style?: any }>
> = {
  zap: Zap,
  fuel: Fuel,
  wrench: Wrench,
  alert: AlertCircle,
  help: HelpCircle,
  phone: Phone,
  message: MessageSquare,
  bell: Bell,
  shield: ShieldCheck,
  truck: Truck,
  droplets: Droplets,
  settings: Settings,
};

// Notification icon mapping for alerts
// Maps icon numbers (1-9) to actual icon components
const NOTIFICATION_ICON_MAP: Record<
  string,
  React.ComponentType<{
    size?: number;
    color?: string;
    style?: any;
    fill?: string;
  }>
> = {
  "1": Bell, // Bell
  "2": AlertTriangle, // Alert
  "3": Calendar, // Schedule
  "4": Users, // Group
  "5": Megaphone, // Announce
  "6": Info, // Info
  "7": Clock, // Time
  "8": CheckCircle, // Check
  "9": Zap, // Urgent
};

export const getActionIconComponent = (iconId: ActionIconType) => {
  return ICON_MAP[iconId] || Zap;
};

/**
 * Get the notification icon component based on the icon number
 * @param iconNumber - The icon number (1-9) as string or number
 * @returns The corresponding icon component
 */
export const getNotificationIcon = (iconNumber: string | number) => {
  const iconKey = String(iconNumber);
  return NOTIFICATION_ICON_MAP[iconKey] || Bell; // Default to Bell if not found
};

/**
 * Get all available notification icons with their labels
 * Used for icon picker UI
 */
export const NOTIFICATION_ICONS = [
  { number: "1", icon: Bell, label: "Bell" },
  { number: "2", icon: AlertTriangle, label: "Alert" },
  { number: "3", icon: Calendar, label: "Schedule" },
  { number: "4", icon: Users, label: "Group" },
  { number: "5", icon: Megaphone, label: "Announce" },
  { number: "6", icon: Info, label: "Info" },
  { number: "7", icon: Clock, label: "Time" },
  { number: "8", icon: CheckCircle, label: "Check" },
  { number: "9", icon: Zap, label: "Urgent" },
] as const;
