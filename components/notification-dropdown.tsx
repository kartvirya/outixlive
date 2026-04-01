import { useNotifications } from "@/contexts/NotificationContext";
import { formatFullDateTime } from "@/lib/dateUtils";
import { getNotificationIcon } from "@/lib/icon-utils";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface NotificationDropdownProps {
  visible: boolean;
  onClose: () => void;
  notificationCount?: number;
  onNotificationRead?: () => void;
}

interface Alert {
  id: string;
  notification_type: string;
  notification_message: string;
  PushedDate: string;
  isRead?: boolean;
  notification_icon?: string | number;
}

export const NotificationDropdown = ({
  visible,
  onClose,
  notificationCount = 0,
  onNotificationRead,
}: NotificationDropdownProps) => {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [markingReadIds, setMarkingReadIds] = useState<Set<string>>(new Set());

  const { alerts: contextAlerts, isLoading, markAsRead: contextMarkAsRead } =
    useNotifications();

  const getAlertId = (alert: Alert) =>
    (alert as any).NotificationID || alert.id;

  useEffect(() => {
    if (visible) {
      const mapped: Alert[] = (contextAlerts || [])
        .slice()
        .sort(
          (a: any, b: any) =>
            new Date(b.PushedDate || 0).getTime() -
            new Date(a.PushedDate || 0).getTime(),
        )
        .slice(0, 5) as any;
      setAlerts(mapped);
    }
  }, [visible, contextAlerts]);

  const markAsReadLocal = async (notificationId: string) => {
    try {
      setMarkingReadIds((prev) => new Set([...prev, notificationId]));
      await contextMarkAsRead(notificationId);

      // Update local state to mark as read
      setAlerts((prev) =>
        prev.map((alert) =>
          getAlertId(alert) === notificationId ? { ...alert, isRead: true } : alert,
        ),
      );

      // Notify parent component to update notification count
      if (onNotificationRead) {
        onNotificationRead();
      }
    } catch (error) {
      console.error("Error marking alert as read:", error);
    } finally {
      setMarkingReadIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      return "Unknown time";
    }
  };

  const handleSeeMore = () => {
    onClose();
    router.push("/(tabs)/alerts");
  };

  const handleAlertPress = async (alert: Alert) => {
    // Mark as read if not already read
    if (!alert.isRead) {
      await markAsReadLocal(getAlertId(alert));
    }

    onClose();
    router.push("/(tabs)/alerts");
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.dropdown}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Recent Notifications</Text>
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 9 ? "9+" : notificationCount}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.content}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#22c55e" />
                <Text style={styles.loadingText}>Loading notifications...</Text>
              </View>
            ) : alerts.length > 0 ? (
              <>
                <ScrollView
                  style={styles.alertsList}
                  showsVerticalScrollIndicator={false}
                >
                {alerts.map((alert) => {
                    const isMarkingRead = markingReadIds.has(alertId);
                    const isRead = alert.isRead;
                    const iconNumber = String(alert.notification_icon || "1");
                    const AlertIcon = getNotificationIcon(iconNumber);
                    const alertId = getAlertId(alert);

                    return (
                      <TouchableOpacity
                        key={alertId}
                        style={[
                          styles.alertItem,
                          isRead && styles.alertItemRead,
                        ]}
                        onPress={() => handleAlertPress(alert)}
                        disabled={isMarkingRead}
                      >
                        <View style={styles.alertHeader}>
                          <View
                            style={[
                              styles.alertIconContainer,
                              isRead && styles.alertIconContainerRead,
                            ]}
                          >
                            {isMarkingRead ? (
                              <ActivityIndicator size="small" color="#22c55e" />
                            ) : (
                              <AlertIcon
                                size={14}
                                color={isRead ? "#737373" : "#22c55e"}
                              />
                            )}
                          </View>
                          <View style={styles.alertContent}>
                            <View style={styles.alertTypeContainer}>
                              <Text
                                style={[
                                  styles.alertType,
                                  isRead && styles.alertTypeRead,
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {alert.notification_type || "Alert"}
                              </Text>
                              {!isRead && !isMarkingRead && (
                                <View style={styles.unreadDot} />
                              )}
                            </View>
                            <Text style={styles.alertTime}>
                              {formatFullDateTime(alert.PushedDate || "")}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.alertMessage,
                            isRead && styles.alertMessageRead,
                          ]}
                          numberOfLines={2}
                        >
                          {alert.notification_message || "No message"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity
                  style={styles.seeMoreButton}
                  onPress={handleSeeMore}
                >
                  <Text style={styles.seeMoreText}>See All Notifications</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyState}>
                {(() => {
                  const EmptyIcon = getNotificationIcon("1");
                  return <EmptyIcon size={32} color="#737373" />;
                })()}
                <Text style={styles.emptyTitle}>No notifications</Text>
                <Text style={styles.emptySubtitle}>
                  You will see your recent notifications here
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    paddingTop: 60, // Position below header
    paddingHorizontal: 16,
  },
  dropdown: {
    backgroundColor: "#111827",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fafafa",
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#d1d5db",
  },
  alertsList: {
    maxHeight: 300,
  },
  alertItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  alertItemRead: {
    opacity: 0.6,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 12,
  },
  alertIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertIconContainerRead: {
    backgroundColor: "rgba(115, 115, 115, 0.2)",
  },
  alertContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: 0, // Allow shrinking
  },
  alertTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
    minWidth: 0, // Allow shrinking
  },
  alertType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22c55e",
    flex: 1,
    minWidth: 0, // Allow shrinking
  },
  alertTypeRead: {
    color: "#737373",
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22c55e",
    flexShrink: 0, // Prevent shrinking
  },
  alertTime: {
    fontSize: 12,
    color: "#737373",
    marginLeft: 8,
    flexShrink: 0, // Prevent shrinking
    width: 60, // Fixed width for time
    textAlign: "right",
  },
  alertMessage: {
    fontSize: 14,
    color: "#d1d5db",
    lineHeight: 20,
    marginLeft: 40, // Align with alert content
  },
  alertMessageRead: {
    color: "#737373",
  },
  seeMoreButton: {
    margin: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#22c55e",
    borderRadius: 12,
    alignItems: "center",
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fafafa",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#737373",
    textAlign: "center",
  },
});
