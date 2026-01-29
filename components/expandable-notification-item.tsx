import {
    AlertTriangle,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    Droplets,
    Fuel,
    Info,
    Loader2,
    Users,
    Wrench,
} from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type NotificationType =
  | "event"
  | "alert"
  | "info"
  | "schedule"
  | "call"
  | "urgent"
  | "service_request";
export type ServiceStatus = "pending" | "in_progress" | "completed";

export interface ExpandableNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: NotificationType;
  eventName?: string;
  eventId?: string;
  venueId?: string;
  userId?: string;
  isRead?: boolean;
  serviceType?: "fuel" | "pump_out" | "repair" | "other";
  serviceStatus?: ServiceStatus;
  serviceAmount?: number;
  pitNumber?: string;
  details?: string;
}

interface ExpandableNotificationItemProps extends ExpandableNotification {
  onMarkRead?: (id: string) => void;
}

const getTypeConfig = (
  type: NotificationType,
  serviceStatus?: ServiceStatus,
) => {
  switch (type) {
    case "service_request":
      if (serviceStatus === "completed") {
        return {
          icon: CheckCircle,
          label: "Service Complete",
          bgColor: "rgba(16, 185, 129, 0.15)",
          textColor: "#10b981",
        };
      }
      if (serviceStatus === "in_progress") {
        return {
          icon: Loader2,
          label: "In Progress",
          bgColor: "rgba(245, 158, 11, 0.15)",
          textColor: "#f59e0b",
        };
      }
      return {
        icon: Clock,
        label: "Service Requested",
        bgColor: "rgba(59, 130, 246, 0.15)",
        textColor: "#3b82f6",
      };
    case "call":
      return {
        icon: Users,
        label: "Class Call",
        bgColor: "rgba(59, 130, 246, 0.15)",
        textColor: "#3b82f6",
      };
    case "schedule":
      return {
        icon: Clock,
        label: "Schedule Update",
        bgColor: "rgba(59, 130, 246, 0.15)",
        textColor: "#3b82f6",
      };
    case "urgent":
    case "alert":
      return {
        icon: AlertTriangle,
        label: "Urgent",
        bgColor: "rgba(239, 68, 68, 0.15)",
        textColor: "#ef4444",
      };
    case "event":
      return {
        icon: Calendar,
        label: "Event",
        bgColor: "rgba(59, 130, 246, 0.15)",
        textColor: "#3b82f6",
      };
    case "info":
    default:
      return {
        icon: Info,
        label: "Info",
        bgColor: "#1f2937",
        textColor: "#737373",
      };
  }
};

const getServiceIcon = (serviceType?: string) => {
  switch (serviceType) {
    case "fuel":
      return Fuel;
    case "pump_out":
      return Droplets;
    case "repair":
      return Wrench;
    default:
      return Wrench;
  }
};

export const ExpandableNotificationItem = ({
  id,
  title,
  message,
  time,
  type,
  eventName,
  isRead = false,
  serviceType,
  serviceStatus,
  serviceAmount,
  pitNumber,
  details,
  onMarkRead,
}: ExpandableNotificationItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const config = getTypeConfig(type, serviceStatus);
  const Icon =
    type === "service_request" ? getServiceIcon(serviceType) : config.icon;

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && !isRead && onMarkRead) {
      onMarkRead(id);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, !isRead && styles.containerUnread]}
      onPress={handleToggle}
      activeOpacity={0.7}
    >
      <View style={styles.mainContent}>
        <View
          style={[styles.iconContainer, { backgroundColor: config.bgColor }]}
        >
          <Icon size={20} color={config.textColor} />
        </View>

        <View style={styles.contentArea}>
          <View style={styles.headerRow}>
            <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
              <Text style={[styles.badgeText, { color: config.textColor }]}>
                {config.label}
              </Text>
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{time}</Text>
              {!isRead && <View style={styles.unreadDot} />}
            </View>
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.message} numberOfLines={isOpen ? undefined : 2}>
            {message}
          </Text>

          {eventName && (
            <Text style={styles.eventName} numberOfLines={1}>
              {eventName}
            </Text>
          )}

          {isOpen && (type === "service_request" || details) && (
            <View style={styles.expandedContent}>
              {type === "service_request" && (
                <View style={styles.serviceDetails}>
                  {pitNumber && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Pit Location</Text>
                      <Text style={styles.detailValue}>{pitNumber}</Text>
                    </View>
                  )}
                  {serviceAmount !== undefined && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Amount</Text>
                      <Text style={styles.detailValue}>
                        ${serviceAmount.toFixed(2)}
                      </Text>
                    </View>
                  )}
                  {serviceStatus && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Status</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          serviceStatus === "completed" &&
                            styles.statusBadgeCompleted,
                          serviceStatus === "in_progress" &&
                            styles.statusBadgeInProgress,
                          serviceStatus === "pending" &&
                            styles.statusBadgePending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            serviceStatus === "completed" &&
                              styles.statusTextCompleted,
                            serviceStatus === "in_progress" &&
                              styles.statusTextInProgress,
                            serviceStatus === "pending" &&
                              styles.statusTextPending,
                          ]}
                        >
                          {serviceStatus === "completed"
                            ? "Completed"
                            : serviceStatus === "in_progress"
                              ? "In Progress"
                              : "Pending"}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {details && <Text style={styles.detailsText}>{details}</Text>}
            </View>
          )}
        </View>

        <View style={styles.chevronContainer}>
          {isOpen ? (
            <ChevronUp size={20} color="#737373" />
          ) : (
            <ChevronDown size={20} color="#737373" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  containerUnread: {
    backgroundColor: "rgba(34, 197, 94, 0.05)",
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  mainContent: {
    flexDirection: "row",
    padding: 14,
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contentArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    color: "#737373",
    fontWeight: "500",
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22c55e",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fafafa",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: "#d1d5db",
    lineHeight: 20,
  },
  eventName: {
    fontSize: 12,
    color: "#737373",
    marginTop: 8,
    fontWeight: "500",
  },
  chevronContainer: {
    marginLeft: 8,
    marginTop: 8,
  },
  expandedContent: {
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  serviceDetails: {
    gap: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fafafa",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeCompleted: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  statusBadgeInProgress: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  statusBadgePending: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  statusTextCompleted: {
    color: "#10b981",
  },
  statusTextInProgress: {
    color: "#f59e0b",
  },
  statusTextPending: {
    color: "#3b82f6",
  },
  detailsText: {
    fontSize: 13,
    color: "#d1d5db",
    lineHeight: 19,
    marginTop: 4,
  },
});
