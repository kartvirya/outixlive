import { getMyAlerts } from "@/lib/api";
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useBuyback } from "./BuybackContext";

interface NotificationContextType {
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { offers } = useBuyback();

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getMyAlerts();

      // Extract alerts from API response
      const alertsList = Array.isArray(data)
        ? data
        : data?.msg || data?.alerts || data?.notifications || [];

      if (Array.isArray(alertsList)) {
        // Count unread alerts (opened === "0")
        const unreadAlerts = alertsList.filter((a: any) => {
          const openedValue = a.opened;
          const isRead =
            typeof openedValue === "string"
              ? openedValue === "1" || openedValue.toLowerCase() === "true"
              : Boolean(openedValue);
          return !isRead;
        }).length;

        // Count pending buyback offers
        const activeBuybackOffers = offers.filter((o) => {
          if (o.status === "pending") return true;
          return Date.now() - o.createdAt.getTime() < 24 * 60 * 60 * 1000;
        });
        const pendingBuybacks = activeBuybackOffers.filter(
          (o) => o.status === "pending",
        ).length;

        setUnreadCount(unreadAlerts + pendingBuybacks);
      } else {
        // Only count buyback offers if no alerts
        const activeBuybackOffers = offers.filter((o) => {
          if (o.status === "pending") return true;
          return Date.now() - o.createdAt.getTime() < 24 * 60 * 60 * 1000;
        });
        const pendingBuybacks = activeBuybackOffers.filter(
          (o) => o.status === "pending",
        ).length;
        setUnreadCount(pendingBuybacks);
      }
    } catch (error) {
      console.error("Error loading notifications for badge:", error);
      // Still count buyback offers on error
      const activeBuybackOffers = offers.filter((o) => {
        if (o.status === "pending") return true;
        return Date.now() - o.createdAt.getTime() < 24 * 60 * 60 * 1000;
      });
      const pendingBuybacks = activeBuybackOffers.filter(
        (o) => o.status === "pending",
      ).length;
      setUnreadCount(pendingBuybacks);
    }
  }, [offers]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  const value = useMemo(
    () => ({
      unreadCount,
      refreshNotifications,
    }),
    [unreadCount, refreshNotifications],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
