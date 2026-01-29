import { BuybackAlertItem } from "@/components/buyback-alert-item";
import { ExpandableNotificationItem } from "@/components/expandable-notification-item";
import { Header } from "@/components/header";
import { useBuyback } from "@/contexts/BuybackContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { type Notification } from "@/data/mockData";
import { getMyAlerts, markAlertAsRead } from "@/lib/api";
import { formatRelativeTime } from "@/lib/dateUtils";
import { scheduleLocalNotification } from "@/lib/pushNotifications";
import { Bell, Send } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AlertsScreen() {
  const [notificationsList, setNotificationsList] = useState<Notification[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { offers } = useBuyback();
  const { refreshNotifications } = useNotifications();

  const unreadCount = notificationsList.filter((n) => !n.isRead).length;
  const activeBuybackOffers = offers.filter((o) => {
    if (o.status === "pending") return true;
    return Date.now() - o.createdAt.getTime() < 24 * 60 * 60 * 1000;
  });
  const totalUnread =
    unreadCount +
    activeBuybackOffers.filter((o) => o.status === "pending").length;

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const data = await getMyAlerts();

      console.log("[ALERTS] 📦 Loaded", Array.isArray(data) ? data.length : data?.msg?.length || 0, "alerts");

      const alerts = Array.isArray(data)
        ? data
        : data?.msg || data?.alerts || data?.notifications || [];

      if (!Array.isArray(alerts)) {
        setNotificationsList([]);
        return;
      }

      const transformed: Notification[] = alerts
        .filter((a: any) => a)
        .map((a: any) => {
          // Handle the 'opened' field from API (0 or 1 as string or number)
          const openedValue = a.opened;
          const isRead =
            typeof openedValue === "string"
              ? openedValue === "1" || openedValue.toLowerCase() === "true"
              : Boolean(openedValue);

          // Log for debugging
          if (openedValue !== "1" && openedValue !== "0") {
            console.log("[ALERTS] ⚠️ Unexpected opened value:", openedValue, "for notification:", a.NotificationID);
          }

          // Parse and format the PushedDate using timezone-aware utility
          const pushedDateStr = a.PushedDate || a.pushedDate || "";
          const timeLabel = formatRelativeTime(pushedDateStr);

          // Map notification_type to our type system
          const typeRaw = (a.notification_type || "").toString().toLowerCase();
          let mappedType: Notification["type"] = "alert";
          if (typeRaw.includes("urgent")) mappedType = "urgent";
          else if (typeRaw.includes("schedule")) mappedType = "schedule";
          else if (typeRaw.includes("class") || typeRaw.includes("call"))
            mappedType = "call";
          else if (typeRaw.includes("service")) mappedType = "service_request";

          // Get the message, preferring notification_message over notification
          const messageRaw = a.notification_message || a.notification || "";
          const message = (messageRaw as string).replace(/\r\n/g, "\n").trim();

          return {
            id: a.NotificationID || a.id || String(Math.random()),
            title: a.notification_type || "Alert",
            message: message || "No message",
            time: timeLabel,
            type: mappedType,
            eventName: a.EventInfo || a.alertinfo || undefined,
            eventId: a.EventID || a.eventId || undefined,
            venueId: undefined,
            userId: undefined,
            isRead,
            details: a.alertinfo || undefined,
          };
        });

      setNotificationsList(transformed);
      
      // Refresh the notification badge count after loading
      await refreshNotifications();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load alerts";
      setError(msg);
      if (!isRefresh) {
        Alert.alert("Error", msg);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadAlerts(true);
  };

  const markAsRead = async (id: string) => {
    console.log("[ALERTS] 📖 Marking notification as read:", id);
    
    // Optimistic update
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );

    try {
      const response = await markAlertAsRead(id);
      console.log("[ALERTS] 📦 Mark as read response:", response);
      
      // Small delay to allow backend to update before refreshing
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Refresh the notification badge count
      await refreshNotifications();
      console.log("[ALERTS] ✅ Marked notification as read:", id);
    } catch (err) {
      // Revert on error
      setNotificationsList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
      );
      const msg =
        err instanceof Error ? err.message : "Failed to mark alert as read";
      console.error("[ALERTS] ❌ Error marking as read:", err);
      Alert.alert("Error", msg);
    }
  };

  const sendTestNotification = async () => {
    try {
      console.log("[DEBUG] 🧪 Sending test notification...");
      
      // Use hardcoded values that match your backend alerts
      await scheduleLocalNotification({
        title: "Class Call",
        body: "Pro and sportsman should be heading to the lanes.",
        data: {
          notification_type: "Class Call",
          notification_message: "Pro and sportsman should be heading to the lanes.",
        },
        badge: 1,
        sound: "default",
      });

      Alert.alert(
        "Test Notification Sent!",
        "Now close the app and tap the notification to test deep linking.\n\nExpected behavior:\n1. App opens\n2. Finds matching alert\n3. Shows details in bottom sheet",
        [
          {
            text: "OK",
            onPress: () => console.log("[DEBUG] ✅ Test notification sent"),
          },
        ],
      );
    } catch (error) {
      console.error("[DEBUG] ❌ Error sending test notification:", error);
      Alert.alert("Error", "Failed to send test notification");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Alerts</Text>
              <Text style={styles.subtitle}>Event updates & service requests</Text>
            </View>
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={sendTestNotification}
            >
              <Send size={16} color="#fff" />
              <Text style={styles.debugButtonText}>Test</Text>
            </TouchableOpacity>
          </View>
          {totalUnread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalUnread} new</Text>
            </View>
          )}
        </View>

        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#22c55e"
              colors={["#22c55e"]}
            />
          }
        >
          {isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.emptyTitle}>Loading alerts...</Text>
            </View>
          ) : notificationsList.length > 0 || activeBuybackOffers.length > 0 ? (
            <>
              {activeBuybackOffers.map((offer) => (
                <BuybackAlertItem key={offer.id} offer={offer} />
              ))}
              {notificationsList.map((notification) => (
                <ExpandableNotificationItem
                  key={notification.id}
                  {...notification}
                  onMarkRead={markAsRead}
                />
              ))}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Bell size={40} color="#737373" />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                Subscribe to venues to get alerts
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fafafa",
  },
  subtitle: {
    fontSize: 14,
    color: "#737373",
    marginTop: 4,
  },
  debugButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#22c55e",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  debugButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#737373",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#737373",
    marginTop: 4,
  },
  badge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#22c55e",
  },
});
