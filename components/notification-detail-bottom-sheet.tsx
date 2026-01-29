import { getAlertDetails, markAlertAsRead } from "@/lib/api";
import { formatDateTime } from "@/lib/dateUtils";
import BottomSheetLib from "@gorhom/bottom-sheet";
import { AlertCircle, Bell, Calendar, CheckCircle } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { FadeInView, SlideInView } from "./ui/animated-card";
import { GlassCard } from "./ui/blur-view-wrapper";
import { BottomSheet } from "./ui/bottom-sheet";

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

interface NotificationDetailBottomSheetProps {
  notificationId: string | null;
  onClose?: () => void;
}

export const NotificationDetailBottomSheet = React.forwardRef<
  BottomSheetLib,
  NotificationDetailBottomSheetProps
>(({ notificationId, onClose }, ref) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationData, setNotificationData] =
    useState<NotificationData | null>(null);

  useEffect(() => {
    console.log(
      "[NOTIFICATION-SHEET] 🔄 notificationId changed:",
      notificationId,
    );
    if (notificationId) {
      loadNotificationDetails();
    }
  }, [notificationId]);

  const loadNotificationDetails = async () => {
    if (!notificationId) {
      console.log("[NOTIFICATION-SHEET] ⚠️ No notification ID provided");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(
        "[NOTIFICATION-SHEET] 📥 Fetching details for:",
        notificationId,
      );

      // Fetch notification details
      const response = await getAlertDetails(notificationId);

      console.log(
        "[NOTIFICATION-SHEET] 📦 API Response:",
        JSON.stringify(response, null, 2),
      );

      if (response.error) {
        throw new Error(response.msg || "Failed to load notification details");
      }

      setNotificationData(response.msg);

      // Mark as read if not already opened
      if (response.msg.opened === "0") {
        console.log("[NOTIFICATION-SHEET] 📖 Marking as read...");
        await markAlertAsRead(notificationId);
      }

      console.log("[NOTIFICATION-SHEET] ✅ Details loaded successfully");
    } catch (err) {
      console.error("[NOTIFICATION-SHEET] ❌ Error loading details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load notification",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    setNotificationData(null);
    setError(null);
    if (typeof ref !== "function" && ref?.current) {
      ref.current.close();
    }
    onClose?.();
  }, [ref, onClose]);

  return (
    <BottomSheet
      ref={ref}
      snapPoints={["50%", "75%", "90%"]}
      enablePanDownToClose={true}
      index={-1}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {loading && (
          <FadeInView>
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.loadingText}>Loading notification...</Text>
            </View>
          </FadeInView>
        )}

        {error && (
          <FadeInView>
            <View style={styles.errorContainer}>
              <AlertCircle size={48} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadNotificationDetails}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </FadeInView>
        )}

        {!loading && !error && notificationData && (
          <View style={styles.content}>
            {/* Header */}
            <FadeInView delay={0}>
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Bell size={24} color="#22c55e" />
                </View>
                <Text style={styles.title}>Notification</Text>
              </View>
            </FadeInView>

            {/* Type Badge */}
            {!!notificationData.notification_type && (
              <SlideInView direction="left" delay={100}>
                <GlassCard intensity={20} tint="light" style={styles.typeCard}>
                  <Text style={styles.typeLabel}>Type</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {notificationData.notification_type}
                    </Text>
                  </View>
                </GlassCard>
              </SlideInView>
            )}

            {/* Notification Title */}
            {!!notificationData.notification && (
              <SlideInView direction="right" delay={200}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {notificationData.notification}
                  </Text>
                </View>
              </SlideInView>
            )}

            {/* Message */}
            {!!notificationData.notification_message && (
              <SlideInView direction="left" delay={300}>
                <GlassCard
                  intensity={20}
                  tint="light"
                  style={styles.messageCard}
                >
                  <Text style={styles.message}>
                    {notificationData.notification_message}
                  </Text>
                </GlassCard>
              </SlideInView>
            )}

            {/* Event Info */}
            {!!notificationData.EventInfo && (
              <SlideInView direction="right" delay={400}>
                <GlassCard intensity={20} tint="light" style={styles.eventCard}>
                  <Text style={styles.eventLabel}>Event</Text>
                  <Text style={styles.eventName}>
                    {notificationData.EventInfo}
                  </Text>
                </GlassCard>
              </SlideInView>
            )}

            {/* Alert Info */}
            {!!notificationData.alertinfo && (
              <SlideInView direction="right" delay={450}>
                <View style={styles.section}>
                  <Text style={styles.label}>Additional Information</Text>
                  <Text style={styles.value}>{notificationData.alertinfo}</Text>
                </View>
              </SlideInView>
            )}

            {/* Date and Status */}
            <SlideInView direction="bottom" delay={500}>
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
            </SlideInView>

            {/* Close Button */}
            <FadeInView delay={600}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </FadeInView>
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
});

NotificationDetailBottomSheet.displayName = "NotificationDetailBottomSheet";

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginTop: 16,
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
  content: {
    gap: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
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
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    padding: 20,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: "#fafafa",
  },
  eventCard: {
    padding: 16,
    gap: 8,
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
  closeButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  closeButtonText: {
    color: "#0a0a0a",
    fontSize: 16,
    fontWeight: "600",
  },
});

export const useNotificationDetailBottomSheet = () => {
  const bottomSheetRef = useRef<BottomSheetLib>(null);

  const open = useCallback((notificationId: string) => {
    console.log("[NOTIFICATION-SHEET] 🔓 Opening for ID:", notificationId);
    bottomSheetRef.current?.snapToIndex(2);
  }, []);

  const close = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  return { bottomSheetRef, open, close };
};
