import { getAlertDetails, getMyAlerts, markAlertAsRead } from "@/lib/api";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FullScreenImageModal } from "./full-screen-image-modal";
import { ModalComponent } from "./ui/modal";

interface NotificationData {
  NotificationID: string;
  EventID: string;
  PushedDate: string;
  opened: string;
  OpenDate: string | null;
  notification_type: string;
  notification: string;
  notification_message: string;
  alertinfo: string;
  image?: string;
  notification_image?: string;
  image_url?: string;
}

interface NotificationDetailModalProps {
  visible: boolean;
  onClose: () => void;
  notificationId: string;
}

export const NotificationDetailModal = ({
  visible,
  onClose,
  notificationId,
}: NotificationDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationData, setNotificationData] =
    useState<NotificationData | null>(null);
  const [fullScreenImageUri, setFullScreenImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (visible && notificationId) {
      loadNotificationDetails();
    }
  }, [visible, notificationId]);

  const loadNotificationDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        "[NOTIFICATION-MODAL] 📥 Fetching details for:",
        notificationId,
      );

      // First, try direct API call to get alert details
      let data: NotificationData | null = null;

      try {
        const response = await getAlertDetails(notificationId);

        if (!response.error && response.msg) {
          data = response.msg;
          console.log("[NOTIFICATION-MODAL] ✅ Loaded via direct API call");
        }
      } catch (directErr) {
        console.log(
          "[NOTIFICATION-MODAL] ⚠️ Direct API call failed, trying fallback...",
        );
      }

      // Fallback: Fetch all alerts and filter by notificationId
      if (!data) {
        console.log(
          "[NOTIFICATION-MODAL] 🔄 Trying fallback: fetching all alerts...",
        );
        try {
          const alertsResponse = await getMyAlerts();

          // Extract alerts from response
          const alerts = Array.isArray(alertsResponse)
            ? alertsResponse
            : alertsResponse?.msg || alertsResponse?.alerts || [];

          console.log(
            "[NOTIFICATION-MODAL] 📦 Found",
            alerts.length,
            "total alerts",
          );

          // Find matching alert by NotificationID (case-insensitive comparison)
          const matchingAlert = alerts.find((alert: any) => {
            const alertId =
              alert.NotificationID || alert.notificationId || alert.id;
            return (
              alertId &&
              (alertId === notificationId ||
                alertId.toLowerCase() === notificationId.toLowerCase())
            );
          });

          if (matchingAlert) {
            console.log(
              "[NOTIFICATION-MODAL] ✅ Found matching alert via fallback",
            );
            data = {
              NotificationID:
                matchingAlert.NotificationID ||
                matchingAlert.notificationId ||
                matchingAlert.id,
              EventID: matchingAlert.EventID || matchingAlert.eventId || "",
              PushedDate:
                matchingAlert.PushedDate || matchingAlert.pushedDate || "",
              opened: matchingAlert.opened || "0",
              OpenDate:
                matchingAlert.OpenDate || matchingAlert.openDate || null,
              notification_type:
                matchingAlert.notification_type || matchingAlert.type || "",
              notification:
                matchingAlert.notification || matchingAlert.title || "",
              notification_message:
                matchingAlert.notification_message ||
                matchingAlert.message ||
                "",
              alertinfo:
                matchingAlert.alertinfo || matchingAlert.EventInfo || "",
              image:
                matchingAlert.image ||
                matchingAlert.notification_image ||
                matchingAlert.image_url ||
                matchingAlert.imageUrl ||
                "",
              notification_image: matchingAlert.notification_image || "",
              image_url: matchingAlert.image_url || matchingAlert.imageUrl || "",
            };
          } else {
            console.log(
              "[NOTIFICATION-MODAL] ❌ No matching alert found in fallback",
            );
          }
        } catch (fallbackErr) {
          console.error(
            "[NOTIFICATION-MODAL] ❌ Fallback also failed:",
            fallbackErr,
          );
        }
      }

      if (!data) {
        throw new Error("Failed to load notification details");
      }

      setNotificationData(data);

      // Mark as read if not already opened
      if (data.opened === "0") {
        console.log("[NOTIFICATION-MODAL] 📖 Marking as read...");
        try {
          await markAlertAsRead(notificationId);
        } catch (markErr) {
          console.warn(
            "[NOTIFICATION-MODAL] ⚠️ Failed to mark as read:",
            markErr,
          );
        }
      }

      console.log("[NOTIFICATION-MODAL] ✅ Details loaded successfully");
    } catch (err) {
      console.error("[NOTIFICATION-MODAL] ❌ Error loading details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load notification",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNotificationData(null);
    setError(null);
    onClose();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <ModalComponent
      visible={visible}
      onClose={handleClose}
      title="Notification Details"
    >
      <ScrollView style={styles.container}>
        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Loading notification...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ {error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadNotificationDetails}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && notificationData && (
          <View style={styles.content}>
            {/* Notification Type */}
            {notificationData.notification_type && (
              <View style={styles.section}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationData.notification_type}
                  </Text>
                </View>
              </View>
            )}

            {/* Title */}
            {notificationData.notification && (
              <View style={styles.section}>
                <Text style={styles.label}>Title</Text>
                <Text style={styles.value}>
                  {notificationData.notification}
                </Text>
              </View>
            )}

            {/* Message */}
            {notificationData.notification_message && (
              <View style={styles.section}>
                <Text style={styles.label}>Message</Text>
                <Text style={styles.message}>
                  {notificationData.notification_message}
                </Text>
              </View>
            )}

            {/* Image */}
            {(notificationData.image ||
              notificationData.notification_image ||
              notificationData.image_url) && (
              <View style={styles.section}>
                <Text style={styles.label}>Image</Text>
                <Pressable
                  onPress={() =>
                    setFullScreenImageUri(
                      notificationData.image ||
                        notificationData.notification_image ||
                        notificationData.image_url ||
                        null,
                    )
                  }
                >
                  <Image
                    source={{
                      uri:
                        notificationData.image ||
                        notificationData.notification_image ||
                        notificationData.image_url ||
                        "",
                    }}
                    style={styles.alertImage}
                  />
                  <Text style={styles.tapToExpandHint}>Tap to view full size</Text>
                </Pressable>
              </View>
            )}
            <FullScreenImageModal
              visible={!!fullScreenImageUri}
              imageUri={fullScreenImageUri}
              onClose={() => setFullScreenImageUri(null)}
            />

            {/* Alert Info */}
            {notificationData.alertinfo && (
              <View style={styles.section}>
                <Text style={styles.label}>Additional Info</Text>
                <Text style={styles.value}>{notificationData.alertinfo}</Text>
              </View>
            )}

            {/* Date */}
            <View style={styles.section}>
              <Text style={styles.label}>Received</Text>
              <Text style={styles.date}>
                {formatDate(notificationData.PushedDate)}
              </Text>
            </View>

            {/* Status */}
            <View style={styles.section}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.value}>
                {notificationData.opened === "0" ? "📬 New" : "✅ Read"}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {!loading && !error && notificationData && (
        <TouchableOpacity
          style={styles.closeActionButton}
          onPress={handleClose}
        >
          <Text style={styles.closeActionButtonText}>Close</Text>
        </TouchableOpacity>
      )}
    </ModalComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 500,
  },
  centerContent: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: "#9ca3af",
    marginTop: 16,
    fontSize: 14,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#374151",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fafafa",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    gap: 20,
  },
  section: {
    gap: 8,
  },
  label: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    color: "#fafafa",
    fontSize: 16,
  },
  message: {
    color: "#e5e7eb",
    fontSize: 16,
    lineHeight: 24,
  },
  alertImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "#0b0f19",
  },
  tapToExpandHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#737373",
    textAlign: "center",
  },
  date: {
    color: "#d1d5db",
    fontSize: 14,
  },
  badge: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "600",
  },
  closeActionButton: {
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  closeActionButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
});
