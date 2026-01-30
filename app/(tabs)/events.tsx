import { EventCard } from "@/components/event-card";
import { Header } from "@/components/header";
import { SearchBar } from "@/components/search-bar";
import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/contexts/AdminContext";
import type { Event } from "@/data/mockData";
import { getEvents } from "@/lib/api";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EventsScreen() {
  const router = useRouter();
  const { canAccessEvent } = useAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [hasLocation, setHasLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "subscribed">("all");
  const [eventsList, setEventsList] = useState<
    (Event & {
      logo?: string;
      coverImage?: string;
      endDate?: string;
      promoterName?: string;
      venuelogo?: string;
      brandColor?: string;
      latitude?: string | number;
      longitude?: string | number;
      address?: string;
    })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      console.log("[EVENTS] 🔄 Refreshing events list...");
      const data = await getEvents();

      // Transform API response to match Event interface
      // API returns data in 'msg' property
      const events = Array.isArray(data)
        ? data
        : data?.msg || data?.events || data?.data || [];

      const transformedEvents = events
        .filter((e: any) => e) // Filter out null/undefined
        .map((e: any) => {
          // Convert isSubscribed to number (0 or 1) to match card component expectation
          let isSubscribed = e.isSubscribed;
          if (typeof isSubscribed === "string") {
            isSubscribed = isSubscribed === "1" ? 1 : 0;
          } else if (typeof isSubscribed === "number") {
            isSubscribed = isSubscribed > 0 ? 1 : 0;
          } else if (typeof isSubscribed === "boolean") {
            isSubscribed = isSubscribed ? 1 : 0;
          } else {
            isSubscribed = 0; // default to 0 for undefined/null
          }

          // Format date from "2026-03-07 10:00:00" to readable format
          const formatDate = (dateStr: string) => {
            if (!dateStr) return "Date TBA";
            try {
              const date = new Date(dateStr);
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
            } catch {
              return dateStr;
            }
          };

          const transformed = {
            id:
              e.id || e._id || String(e.eventId || Math.random().toString(36)),
            name: e.name || e.eventName || e.title || "Untitled Event",
            image:
              e.image ||
              e.coverImage ||
              e.imageUrl ||
              e.coverImage ||
              e.thumbnail ||
              "https://via.placeholder.com/400",
            date: formatDate(e.date || e.eventDate || e.startDate),
            location:
              e.address ||
              e.location ||
              e.venue ||
              e.venueName ||
              "Location TBA",
            isSubscribed: isSubscribed,
            promoterId: e.promoterId || e.promoter?.id || "",
            // Store additional fields for detail page
            logo: e.logo || e.venuelogo || "",
            coverImage: e.coverImage || e.image || "",
            endDate: e.endDate || "",
            promoterName: e.promoterName || "",
            venuelogo: e.venuelogo || "",
            brandColor: e.brandColor || "0 84% 60%",
            latitude: e.latitude || "",
            longitude: e.longitude || "",
            address: e.address || e.location || "",
          };
          return transformed;
        });

      setEventsList(transformedEvents);
      console.log("[EVENTS] ✅ Events loaded:", transformedEvents.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
      console.error("[EVENTS] ❌ Error loading events:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    console.log("[EVENTS] 👆 Pull to refresh triggered");
    loadEvents(true);
  };

  // Filter events by search query
  const filteredEvents = eventsList.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalCount = filteredEvents.length;
  const subscribedCount = filteredEvents.filter((e) => e.isSubscribed).length;

  const tabFilteredEvents =
    activeTab === "all"
      ? filteredEvents
      : filteredEvents.filter((e) => e.isSubscribed);

  const sortedEvents = (() => {
    if (!hasLocation || !isValidLatLng(userLocation)) return tabFilteredEvents;
    const origin = userLocation;
    return [...tabFilteredEvents].sort((a, b) => {
      const aLoc = {
        latitude:
          typeof a.latitude === "string"
            ? parseFloat(a.latitude)
            : (a.latitude ?? NaN),
        longitude:
          typeof a.longitude === "string"
            ? parseFloat(a.longitude)
            : (a.longitude ?? NaN),
      };
      const bLoc = {
        latitude:
          typeof b.latitude === "string"
            ? parseFloat(b.latitude)
            : (b.latitude ?? NaN),
        longitude:
          typeof b.longitude === "string"
            ? parseFloat(b.longitude)
            : (b.longitude ?? NaN),
      };
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header />
      <View style={styles.content}>
        {/* Collapsible Section */}
        <View style={styles.collapsibleSection}>
          <AnimatedPressable
            onPress={() => setIsHeaderExpanded(!isHeaderExpanded)}
            animationType="press"
            style={styles.collapsibleHeader}
          >
            <View style={styles.heroCompact}>
              <Text style={styles.heroTitleCompact}>Find Your Events</Text>
              {!isHeaderExpanded && (
                <Text style={styles.heroSubtitleCompact}>
                  {hasLocation
                    ? "Sorted by distance"
                    : "Browse events from your venues"}
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
                <Text style={styles.heroSubtitle}>
                  Browse events from your venues
                </Text>
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
                  placeholder="Search events..."
                />
              </View>
            </MotiView>
          )}
        </View>

        <View style={styles.filterContainer}>
          <View style={{ flexDirection: "row" }}>
            <Button
              variant="ghost"
              onPress={() => setActiveTab("all")}
              style={[
                styles.filterButton,
                activeTab === "all" && styles.filterButtonActive,
              ]}
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
              onPress={() => setActiveTab("subscribed")}
              style={[
                styles.filterButton,
                activeTab === "subscribed" && styles.filterButtonActive,
              ]}
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
              <Text style={styles.emptyTitle}>Loading events...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Error loading events</Text>
              <Text style={styles.emptySubtitle}>{error}</Text>
              <Button onPress={loadEvents} style={{ marginTop: 16 }}>
                Retry
              </Button>
            </View>
          ) : eventsList.length === 0 ? (
            <View style={styles.emptyState}>
              <Search size={40} color="#737373" />
              <Text style={styles.emptyTitle}>No events found</Text>
              <Text style={styles.emptySubtitle}>
                No events available at this time
              </Text>
            </View>
          ) : sortedEvents.length > 0 ? (
            sortedEvents.map((event) => {
              // Find the original event data from the API response to pass full details
              const originalEvent = eventsList.find((e) => e.id === event.id);
              return (
                <EventCard
                  key={event.id}
                  id={event.id}
                  name={event.name}
                  image={event.image}
                  coverImage={event.coverImage}
                  date={event.date}
                  location={event.location}
                  logo={event.logo}
                  venuelogo={event.venuelogo}
                  isSubscribed={event.isSubscribed}
                  promoterId={event.promoterId}
                  isAdminOwned={canAccessEvent(event.promoterId)}
                  onPress={() =>
                    router.push({
                      pathname: `/(tabs)/event/${event.id}` as any,
                      params: {
                        eventData: JSON.stringify(originalEvent || event),
                      },
                    })
                  }
                />
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Search size={40} color="#737373" />
              <Text style={styles.emptyTitle}>No events found</Text>
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
    marginTop: 12,
    backgroundColor: "#18181b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 16,
    overflow: "hidden",
  },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#18181b",
  },
  heroCompact: {
    flex: 1,
  },
  heroTitleCompact: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fafafa",
    marginBottom: 4,
  },
  heroSubtitleCompact: {
    fontSize: 13,
    color: "#737373",
  },
  expandableContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  hero: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 20,
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
