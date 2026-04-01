import { BuybackAlertItem } from "@/components/buyback-alert-item";
import { ExpandableNotificationItem } from "@/components/expandable-notification-item";
import { Header } from "@/components/header";
import { NotificationDetailModal } from "@/components/notification-detail-modal";
import { useBuyback } from "@/contexts/BuybackContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { Bell } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AlertsScreen() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] =
    useState<string>("");
  const { offers } = useBuyback();
  const {
    notifications,
    unreadCount,
    refreshNotifications,
    markAsRead,
    isLoading,
  } = useNotifications();

  const activeBuybackOffers = offers.filter((o) => {
    if (o.status === "pending") return true;
    return Date.now() - o.createdAt.getTime() < 24 * 60 * 60 * 1000;
  });

  useEffect(() => {
    // NotificationContext already fetches on app start, but deep-links can arrive early.
    if (notifications.length === 0) {
      refreshNotifications();
    }
  }, [notifications.length, refreshNotifications]);

  const onRefresh = () => {
    setIsRefreshing(true);
    refreshNotifications().finally(() => setIsRefreshing(false));
  };

  const handleLongPress = (id: string) => {
    console.log("[ALERTS] 🔍 Long-press detected for notification:", id);
    setSelectedNotificationId(id);
    setIsModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header />
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Alerts</Text>
            <Text style={styles.subtitle}>
              Event updates & service requests
            </Text>
          </View>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount} new</Text>
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
          ) : notifications.length > 0 || activeBuybackOffers.length > 0 ? (
            <>
              {activeBuybackOffers.map((offer) => (
                <BuybackAlertItem key={offer.id} offer={offer} />
              ))}
              {notifications.map((notification) => (
                <ExpandableNotificationItem
                  key={notification.id}
                  {...notification}
                  onMarkRead={markAsRead}
                  onLongPress={handleLongPress}
                />
              ))}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Bell size={40} color="#737373" />
              <Text style={styles.emptyTitle}>
                You have not subscribed to any events or promoters
              </Text>
              <Text style={styles.emptySubtitle}>
                Subscribe to venues to get alerts
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
      <NotificationDetailModal
        visible={isModalVisible}
        notificationId={selectedNotificationId}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedNotificationId("");
        }}
      />
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
});
