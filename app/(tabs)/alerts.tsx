import { BuybackAlertItem } from "@/components/buyback-alert-item";
import { ExpandableNotificationItem } from "@/components/expandable-notification-item";
import { Header } from "@/components/header";
import { useBuyback } from "@/contexts/BuybackContext";
import { type Notification } from "@/data/mockData";
import { getMyAlerts, markAlertAsRead } from "@/lib/api";
import { Bell } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          const openedValue = a.opened;
          const isRead =
            typeof openedValue === "string"
              ? openedValue === "1" || openedValue.toLowerCase() === "true"
              : Boolean(openedValue);

          const pushedDateStr = a.PushedDate || a.pushedDate || "";
          let timeLabel = pushedDateStr;
          if (pushedDateStr) {
            const parsed = new Date(pushedDateStr.replace(" ", "T"));
            if (!Number.isNaN(parsed.getTime())) {
              const now = new Date();
              const diffMs = now.getTime() - parsed.getTime();
              const diffMinutes = Math.floor(diffMs / 60000);
              if (diffMinutes < 1) {
                timeLabel = "Just now";
              } else if (diffMinutes < 60) {
                timeLabel = `${diffMinutes}m ago`;
              } else {
                const diffHours = Math.floor(diffMinutes / 60);
                if (diffHours < 24) {
                  timeLabel = `${diffHours}h ago`;
                } else {
                  timeLabel = parsed.toLocaleString();
                }
              }
            }
          }

          const typeRaw = (a.notification_type || "").toString().toLowerCase();
          let mappedType: Notification["type"] = "alert";
          if (typeRaw.includes("urgent")) mappedType = "urgent";
          else if (typeRaw.includes("schedule")) mappedType = "schedule";
          else if (typeRaw.includes("class") || typeRaw.includes("call"))
            mappedType = "call";

          const messageRaw = a.notification_message || a.notification || "";
          const message = (messageRaw as string).replace(/\r\n/g, "\n").trim();

          return {
            id: a.NotificationID || a.id || String(Math.random()),
            title: a.notification_type || "Alert",
            message: message || "No message",
            time: timeLabel,
            type: mappedType,
            eventName: a.alertinfo || undefined,
            eventId: a.EventID || a.eventId || undefined,
            venueId: undefined,
            userId: undefined,
            isRead,
            details: a.alertinfo || undefined,
          };
        });

      setNotificationsList(transformed);
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
    // Optimistic update
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );

    try {
      await markAlertAsRead(id);
    } catch (err) {
      // Revert on error
      setNotificationsList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
      );
      const msg =
        err instanceof Error ? err.message : "Failed to mark alert as read";
      Alert.alert("Error", msg);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header notificationCount={totalUnread} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Alerts</Text>
          <Text style={styles.subtitle}>Event updates & service requests</Text>
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
            <View style={styles.notificationList}>
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
            </View>
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
  notificationList: {
    borderRadius: 12,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  unreadNotification: {
    backgroundColor: "rgba(34, 197, 94, 0.05)",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fafafa",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#d1d5db",
    marginBottom: 4,
  },
  notificationDetails: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
    fontStyle: "italic",
  },
  serviceAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#22c55e",
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#737373",
    marginTop: 4,
  },
});
