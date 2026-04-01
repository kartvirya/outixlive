import { getMyAlerts, markAlertAsRead } from "@/lib/api";
import { formatRelativeTime } from "@/lib/dateUtils";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useBuyback } from "./BuybackContext";
import { type Notification } from "@/data/mockData";

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

type ApiAlert = {
  // API naming varies; keep as optional.
  NotificationID?: string;
  id?: string;
  notification_type?: string;
  notification_message?: string;
  notification?: string;
  PushedDate?: string;
  pushedDate?: string;
  opened?: unknown;
  alertinfo?: string;
  image?: string;
  notification_image?: string;
  image_url?: string;
  imageUrl?: string;
  isRead?: boolean;
  [key: string]: unknown;
};

interface NotificationContextType {
  unreadCount: number;
  alerts: ApiAlert[];
  notifications: Notification[];
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { offers } = useBuyback();

  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const markAsReadInFlightRef = useRef<Map<string, Promise<void>>>(new Map());
  const refreshInFlightRef = useRef<Promise<void> | null>(null);
  const lastRefreshAtRef = useRef<number>(0);
  const MIN_REFRESH_INTERVAL_MS = 1500;

  const getIsReadFromOpened = (openedValue: unknown): boolean => {
    if (openedValue === null || openedValue === undefined) return false;
    if (typeof openedValue === "boolean") return openedValue;
    if (typeof openedValue === "number") return openedValue === 1 || openedValue > 0;
    if (typeof openedValue === "string") {
      const trimmed = openedValue.trim();
      if (
        trimmed === "1" ||
        trimmed.toLowerCase() === "true" ||
        trimmed.toLowerCase() === "yes" ||
        trimmed.toLowerCase() === "on"
      ) {
        return true;
      }
      if (
        trimmed === "0" ||
        trimmed.toLowerCase() === "false" ||
        trimmed.toLowerCase() === "no" ||
        trimmed.toLowerCase() === "off" ||
        trimmed === ""
      ) {
        return false;
      }
      const num = Number(trimmed);
      if (!Number.isNaN(num)) return num === 1 || num > 0;
    }
    return false;
  };

  const transformApiAlertToNotification = (a: ApiAlert): Notification => {
    // Handle the 'opened' field from API (0 or 1 as string or number)
    const isRead = getIsReadFromOpened(a.opened);

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
      id: (a.NotificationID as string) || (a.id as string) || String(Math.random()),
      title: (a.notification_type as string) || "Alert",
      message: message || "No message",
      time: timeLabel,
      type: mappedType,
      eventName: (a.EventInfo as string) || (a.alertinfo as string) || undefined,
      // The API uses different keys; keep them optional.
      eventId: (a.EventID as string) || (a.eventId as string) || undefined,
      venueId: undefined,
      userId: undefined,
      isRead,
      details: (a.alertinfo as string) || undefined,
      imageUrl:
        (a.image as string) ||
        (a.notification_image as string) ||
        (a.image_url as string) ||
        (a.imageUrl as string) ||
        undefined,
    };
  };

  const refreshNotifications = useCallback(async () => {
    const now = Date.now();

    // If we just refreshed very recently, avoid hammering the backend.
    if (now - lastRefreshAtRef.current < MIN_REFRESH_INTERVAL_MS) {
      return;
    }

    // If a refresh is already in-flight, reuse it.
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current;
    }

    const promise = (async () => {
    try {
      setIsLoading(true);
      console.log("[ALERTS] refreshNotifications: fetching getMyAlerts...");
      const data = await getMyAlerts();

      // Extract alerts from API response
      const alertsList = Array.isArray(data)
        ? data
        : data?.msg || data?.alerts || data?.notifications || [];

      if (!Array.isArray(alertsList)) {
        setAlerts([]);
        return;
      }

      // Normalize + compute read state once
      const normalized: ApiAlert[] = alertsList
        .filter((a: ApiAlert | null | undefined): a is ApiAlert => !!a)
        .map((a) => ({
          ...a,
          isRead: getIsReadFromOpened(a.opened),
        }));

      setAlerts(normalized);
      const unreadAlerts = normalized.filter((a) => !a.isRead).length;
      console.log(
        "[ALERTS] refreshNotifications: fetched",
        normalized.length,
        "alerts (unread:",
        unreadAlerts,
        ")",
      );
    } catch (error) {
      console.error("Error loading notifications:", error);
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
    })();

    refreshInFlightRef.current = promise;
    lastRefreshAtRef.current = now;

    try {
      await promise;
    } finally {
      refreshInFlightRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Single network call on app start. Avoid re-fetching on buyback offer updates.
    refreshNotifications();
  }, [refreshNotifications]);

  const notifications = useMemo(() => {
    return alerts.map((a) => transformApiAlertToNotification(a));
  }, [alerts]);

  const unreadCount = useMemo(() => {
    const unreadAlerts = alerts.filter((a) => !a.isRead).length;
    const activeBuybackOffers = offers.filter((o) => {
      if (o.status === "pending") return true;
      return Date.now() - o.createdAt.getTime() < 24 * 60 * 60 * 1000;
    });
    const pendingBuybacks = activeBuybackOffers.filter(
      (o) => o.status === "pending",
    ).length;
    return unreadAlerts + pendingBuybacks;
  }, [alerts, offers]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const normalizedId = String(notificationId);

      // If it's already marked read in local state, no-op.
      const alreadyRead = alerts.some((a) => {
        const id = (a.NotificationID as string) || (a.id as string) || "";
        return id === normalizedId && !!a.isRead;
      });
      if (alreadyRead) {
        return;
      }

      // Deduplicate concurrent requests for the same notification id.
      const inFlight = markAsReadInFlightRef.current.get(normalizedId);
      if (inFlight) {
        return inFlight;
      }

      // Optimistic update to keep UI responsive.
      setAlerts((prev) =>
        prev.map((a) => {
          const id = (a.NotificationID as string) || (a.id as string);
          if (id === normalizedId) {
            return { ...a, isRead: true };
          }
          return a;
        }),
      );

      const promise = (async () => {
        try {
          await markAlertAsRead(normalizedId);
        } finally {
          // Keep context consistent with server state.
          await refreshNotifications();
        }
      })();

      markAsReadInFlightRef.current.set(normalizedId, promise);
      try {
        await promise;
      } finally {
        markAsReadInFlightRef.current.delete(normalizedId);
      }
    },
    [alerts, refreshNotifications],
  );

  const value = useMemo(
    () => ({
      unreadCount,
      alerts,
      notifications,
      isLoading,
      refreshNotifications,
      markAsRead,
    }),
    [unreadCount, alerts, notifications, isLoading, refreshNotifications, markAsRead],
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
