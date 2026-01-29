import { getAlertDetails, markAlertAsRead } from "@/lib/api";
import { formatDateTime } from "@/lib/dateUtils";
import { Bell, Calendar, CheckCircle, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface NotificationData {
  NotificationID: string;
  EventID: string;
  PushedDate: string;
  opened: string;
  OpenDate: string | null;
  notification_type: string;
  notification: string;
  notification_message: string;
  EventInfo: string;
  alertinfo: string;
  notification_icon: string;
}

interface NotificationPopupModalProps {
  notificationId: string | null;
  visible: boolean;
  onClose: () => void;
}

export function NotificationPopupModal({
  notificationId,
  visible,
  onClose,
}: NotificationPopupModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationData, setNotificationData] =
    useState<NotificationData | null>(null);

  useEffect(() => {
    if (visible && notificationId) {
      loadNotificationDetails();
    } else {
      // Reset when closed
      setNotificationData(null);
      setError(null);
    }
  }, [visible, notificationId]);

  const loadNotificationDetails = async () => {
    if (!notificationId) {
      console.log("[NOTIFICATION-POPUP] ⚠️ No notification ID provided");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(
        "[NOTIFICATION-POPUP] 📥 Fetching details for:",
        notificationId,
      );

      // Fetch notification details
      const response = await getAlertDetails(notificationId);

      console.log(
        "[NOTIFICATION-POPUP] 📦 API Response:",
        JSON.stringify(response, null, 2),
      );

      if (response.error) {
        throw new Error(response.msg || "Failed to load notification details");
      }

      setNotificationData(response.msg);

      // Mark as read if not already opened
      if (response.msg.opened === "0") {
        console.log("[NOTIFICATION-POPUP] 📖 Marking as read...");
        await markAlertAsRead(notificationId);
      }

      console.log("[NOTIFICATION-POPUP] ✅ Details loaded successfully");
    } catch (err) {
      console.error("[NOTIFICATION-POPUP] ❌ Error loading details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load notification",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {/* Close Button */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#737373" />
          </Pressable>

          {loading && (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.loadingText}>Loading notification...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={loadNotificationDetails}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </Pressable>
            </View>
          )}

          {!loading && !error && notificationData && (
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Bell size={24} color="#22c55e" />
                </View>
                <Text style={styles.title}>Notification</Text>
              </View>

              {/* Type Badge */}
              {!!notificationData.notification_type && (
                <View style={styles.typeCard}>
                  <Text style={styles.typeLabel}>Type</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {notificationData.notification_type}
                    </Text>
                  </View>
                </View>
              )}

              {/* Notification Title */}
              {!!notificationData.notification && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {notificationData.notification}
                  </Text>
                </View>
              )}

              {/* Message */}
              {!!notificationData.notification_message && (
                <View style={styles.messageCard}>
                  <Text style={styles.message}>
                    {notificationData.notification_message}
                  </Text>
                </View>
              )}

              {/* Event Info */}
              {!!notificationData.EventInfo && (
                <View style={styles.eventCard}>
                  <Text style={styles.eventLabel}>Event</Text>
                  <Text style={styles.eventName}>
                    {notificationData.EventInfo}
                  </Text>
                </View>
              )}

              {/* Alert Info */}
              {!!notificationData.alertinfo && (
                <View style={styles.section}>
                  <Text style={styles.label}>Additional Information</Text>
                  <Text style={styles.value}>{notificationData.alertinfo}</Text>
                </View>
              )}

              {/* Date and Status */}
              <View style={styles.footer}>
                <View style={styles.footerItem}>
                  <Calendar size={16} color="#737373" />
                  <Text style={styles.footerText}>
                    {formatDateTime(notificationData.PushedDate)}
                  </Text>
                </View>
                <View style={styles.footerItem}>
                  {notificationData.opened === "0" ? (
                    <>
                      <Bell size={16} color="#22c55e" />
                      <Text style={[styles.footerText, { color: "#22c55e" }]}>
                        New
                      </Text>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} color="#737373" />
                      <Text style={styles.footerText}>Read</Text>
                    </>
                  )}
                </View>
              </View>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  centerContent: {
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: "#737373",
    marginTop: 16,
    fontSize: 14,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    marginTop: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fafafa",
  },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  typeLabel: {
    fontSize: 14,
    color: "#737373",
    fontWeight: "500",
  },
  badge: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: "#0a0a0a",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fafafa",
    lineHeight: 28,
  },
  label: {
    fontSize: 14,
    color: "#737373",
    fontWeight: "500",
  },
  value: {
    fontSize: 16,
    color: "#fafafa",
    lineHeight: 24,
  },
  messageCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: "#fafafa",
  },
  eventCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  eventLabel: {
    fontSize: 12,
    color: "#737373",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  eventName: {
    fontSize: 15,
    color: "#fafafa",
    fontWeight: "600",
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
    marginTop: 8,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: "#737373",
  },
});
