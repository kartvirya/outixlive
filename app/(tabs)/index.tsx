import { Header } from "@/components/header";
import { PromoterCard } from "@/components/promoter-card";
import { SearchBar } from "@/components/search-bar";
import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/contexts/AdminContext";
import { useBuyback } from "@/contexts/BuybackContext";
import type { Notification, Promoter } from "@/data/mockData";
import { getMyAlerts, getPromoters } from "@/lib/api";
import {
    distanceKm,
    getBrowserLocation,
    isValidLatLng,
    type LatLng,
} from "@/lib/utils";
import { useRouter } from "expo-router";
import {
    Bell,
    ChevronDown,
    ChevronUp,
    MapPin,
    Navigation,
    Search,
} from "lucide-react-native";
import { MotiView } from "moti";
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

export default function HomeScreen() {
  const router = useRouter();
  const { canAccessPromoter } = useAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [hasLocation, setHasLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "subscribed">("all");
  const [promotersList, setPromotersList] = useState<Promoter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { offers } = useBuyback();

  // Calculate unread notification count from real data
  const unreadCount = notifications.filter(
    (n: Notification) => !n.isRead,
  ).length;
  const activeBuybackOffers = offers.filter((o) => {
    if (o.status === "pending") return true;
    return Date.now() - o.createdAt.getTime() < 24 * 60 * 60 * 1000;
  });
  const totalUnread =
    unreadCount +
    activeBuybackOffers.filter((o) => o.status === "pending").length;

  useEffect(() => {
    loadPromoters();
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getMyAlerts();

      // Extract alerts from API response
      const alertsList = Array.isArray(data)
        ? data
        : data?.msg || data?.alerts || data?.notifications || [];

      if (Array.isArray(alertsList)) {
        // Transform API alerts to match Notification interface
        const transformed: Notification[] = alertsList
          .filter((a: any) => a)
          .map((a: any) => {
            const openedValue = a.opened;
            const isRead =
              typeof openedValue === "string"
                ? openedValue === "1" || openedValue.toLowerCase() === "true"
                : Boolean(openedValue);

            return {
              id: a.id || a._id || String(Math.random()),
              title: a.title || a.Title || "Notification",
              message: a.message || a.Message || "",
              time: a.time || a.PushedDate || "",
              type: a.type || "info",
              eventName: a.eventName || a.EventName,
              eventId: a.eventId || a.EventId,
              venueId: a.venueId || a.VenueId,
              userId: a.userId || a.UserId,
              isRead: isRead,
            };
          });

        setNotifications(transformed);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
    }
  };

  const loadPromoters = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const data = await getPromoters();

      // Transform API response to match Promoter interface
      // API likely returns data in 'msg' property (similar to events)
      const promoters = Array.isArray(data)
        ? data
        : data?.msg || data?.promoters || data?.data || [];

      const transformedPromoters = promoters
        .filter((p: any) => p) // Filter out null/undefined
        .map((p: any) => {
          // Keep raw isSubscribed value (0 or 1) - don't convert to boolean
          // Convert string "0"/"1" to number 0/1
          let isSubscribed = p.isSubscribed;
          if (typeof isSubscribed === "string") {
            isSubscribed = isSubscribed === "1" ? 1 : 0;
          } else if (typeof isSubscribed === "number") {
            isSubscribed = isSubscribed > 0 ? 1 : 0;
          } else {
            isSubscribed = 0; // default to 0 for undefined/null
          }

          const transformed = {
            id:
              p.id ||
              p._id ||
              String(p.promoterId || Math.random().toString(36)),
            name: p.name || p.promoterName || "Untitled Venue",
            logo:
              p.logo ||
              p.logoUrl ||
              p.venuelogo ||
              "https://via.placeholder.com/200",
            coverImage:
              p.coverImage ||
              p.coverImageUrl ||
              "https://via.placeholder.com/800",
            eventCount: p.eventCount || p.eventsCount || 0,
            isSubscribed: isSubscribed,
            brandColor: p.brandColor || "0 84% 60%",
            website: p.website || p.websiteUrl || "",
            latitude: parseFloat(p.latitude || p.lat || "0"),
            longitude: parseFloat(p.longitude || p.lng || "0"),
            address: p.address || p.location || "",
          };
          return transformed;
        });

      setPromotersList(transformedPromoters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load promoters");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadPromoters(true);
    loadNotifications(); // Also reload notifications on refresh
  };

  // Filter by search query
  const filteredPromoters = promotersList.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalCount = filteredPromoters.length;
  const subscribedCount = filteredPromoters.filter(
    (p) => p.isSubscribed === 1,
  ).length;

  const tabFilteredPromoters =
    activeTab === "all"
      ? filteredPromoters
      : filteredPromoters.filter((p) => p.isSubscribed === 1);

  const sortedPromoters = (() => {
    if (!hasLocation || !isValidLatLng(userLocation))
      return tabFilteredPromoters;
    const origin = userLocation;
    return [...tabFilteredPromoters].sort((a, b) => {
      const aLoc = { latitude: a.latitude, longitude: a.longitude };
      const bLoc = { latitude: b.latitude, longitude: b.longitude };
      const aValid = isValidLatLng(aLoc);
      const bValid = isValidLatLng(bLoc);
      if (!aValid && !bValid) return 0;
      if (!aValid) return 1;
      if (!bValid) return -1;
      return distanceKm(origin, aLoc) - distanceKm(origin, bLoc);
    });
  })();

  const requestLocationSort = async () => {
    try {
      setIsLocating(true);
      const loc = await getBrowserLocation();
      setUserLocation(loc);
      setHasLocation(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to get location";
      Alert.alert("Location unavailable", msg);
      setHasLocation(false);
      setUserLocation(null);
    } finally {
      setIsLocating(false);
    }
  };

  // TEST BUTTON: Show notification popup
  const testNotificationPopup = () => {
    console.log("[TEST] 🧪 Testing notification popup...");
    // Call the global handler if available
    if ((global as any).handleNotificationData) {
      (global as any).handleNotificationData({
        NotificationID: "Mjg4NDQ3NTMwMjQ=",
        notificationId: "Mjg4NDQ3NTMwMjQ=",
      });
    } else {
      Alert.alert(
        "Error",
        "handleNotificationData not available. Check console.",
      );
      console.error("[TEST] ❌ handleNotificationData not available");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header />
      <View style={styles.content}>
        {/* TEST BUTTON - Remove this in production */}
        <TouchableOpacity
          style={{
            backgroundColor: "#22c55e",
            padding: 16,
            borderRadius: 12,
            margin: 16,
            alignItems: "center",
          }}
          onPress={testNotificationPopup}
        >
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
            🧪 TEST NOTIFICATION POPUP
          </Text>
        </TouchableOpacity>
        {/* Single Collapsible Section */}
        <View style={styles.collapsibleSection}>
          <AnimatedPressable
            onPress={() => setIsHeaderExpanded(!isHeaderExpanded)}
            animationType="press"
            style={styles.collapsibleHeader}
          >
            <View style={styles.heroCompact}>
              <Text style={styles.heroTitleCompact}>Find Your Venue</Text>
              {!isHeaderExpanded && (
                <Text style={styles.heroSubtitleCompact}>
                  {hasLocation
                    ? "Sorted by distance"
                    : "Browse venues near you"}
                </Text>
              )}
            </View>
            {isHeaderExpanded ? (
              <ChevronUp size={24} color="#22c55e" />
            ) : (
              <ChevronDown size={24} color="#737373" />
            )}
          </AnimatedPressable>

          {/* Expandable Content */}
          {isHeaderExpanded && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "timing", duration: 300 }}
              style={styles.expandableContent}
            >
              <View style={styles.hero}>
                <Text style={styles.heroSubtitle}>Browse venues near you</Text>
              </View>

              {!hasLocation && (
                <Button
                  variant="outline"
                  onPress={requestLocationSort}
                  style={styles.locationButton}
                  disabled={isLocating}
                >
                  <Navigation
                    size={16}
                    color="#22c55e"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.buttonText}>
                    {isLocating
                      ? "Getting your location..."
                      : "Use my location to sort by distance"}
                  </Text>
                </Button>
              )}

              {hasLocation && (
                <View style={styles.locationStatus}>
                  <MapPin
                    size={16}
                    color="#22c55e"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.locationStatusText}>
                    Sorted by distance from you
                  </Text>
                </View>
              )}

              <View style={styles.searchContainer}>
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search venues or locations..."
                />
              </View>
            </MotiView>
          )}
        </View>

        <View style={styles.filterContainer}>
          <View style={{ flexDirection: "row" }}>
            <Button
              variant="ghost"
              style={[
                styles.filterButton,
                activeTab === "all" && styles.filterButtonActive,
              ]}
              onPress={() => setActiveTab("all")}
            >
              <Text
                style={[
                  styles.filterText,
                  activeTab === "all" && styles.filterTextActive,
                ]}
              >
                All ({totalCount})
              </Text>
            </Button>

            <Button
              variant="ghost"
              style={[
                styles.filterButton,
                activeTab === "subscribed" && styles.filterButtonActive,
              ]}
              onPress={() => setActiveTab("subscribed")}
            >
              <Bell
                size={14}
                color={activeTab === "subscribed" ? "#22c55e" : "#737373"}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.filterText,
                  activeTab === "subscribed" && styles.filterTextActive,
                ]}
              >
                Subscribed ({subscribedCount})
              </Text>
            </Button>
          </View>
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
              <Text style={styles.emptyTitle}>Loading venues...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Error loading venues</Text>
              <Text style={styles.emptySubtitle}>{error}</Text>
              <Button onPress={loadPromoters} style={{ marginTop: 16 }}>
                Retry
              </Button>
            </View>
          ) : promotersList.length === 0 ? (
            <View style={styles.emptyState}>
              <Search size={40} color="#737373" />
              <Text style={styles.emptyTitle}>No venues found</Text>
              <Text style={styles.emptySubtitle}>
                No venues available at this time
              </Text>
            </View>
          ) : sortedPromoters.length > 0 ? (
            sortedPromoters.map((promoter) => (
              <PromoterCard
                key={promoter.id}
                id={promoter.id}
                name={promoter.name}
                logo={promoter.logo}
                coverImage={promoter.coverImage}
                eventCount={promoter.eventCount}
                brandColor={promoter.brandColor}
                website={promoter.website}
                latitude={promoter.latitude}
                longitude={promoter.longitude}
                address={promoter.address}
                isSubscribed={promoter.isSubscribed}
                isAdminOwned={canAccessPromoter(promoter.id)}
                onPress={() => router.push(`/(tabs)/promoter/${promoter.id}`)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Search size={40} color="#737373" />
              <Text style={styles.emptyTitle}>No venues found</Text>
              <Text style={styles.emptySubtitle}>
                Try a different search term
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
  collapsibleSection: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#27272a",
    overflow: "hidden",
  },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  heroCompact: {
    flex: 1,
  },
  heroTitleCompact: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fafafa",
    marginBottom: 2,
  },
  heroSubtitleCompact: {
    fontSize: 12,
    color: "#737373",
  },
  expandableContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  hero: {
    alignItems: "center",
    paddingBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fafafa",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#737373",
  },
  locationButton: {
    width: "100%",
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "500",
  },
  locationStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginBottom: 16,
  },
  locationStatusText: {
    fontSize: 14,
    color: "#22c55e",
  },
  searchContainer: {
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  filterButtonActive: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
  },
  filterText: {
    fontSize: 14,
    color: "#737373",
  },
  filterTextActive: {
    color: "#22c55e",
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
});
