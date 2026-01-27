import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/contexts/AdminContext";
import type { Event, Promoter } from "@/data/mockData";
import {
    getEvents,
    getPromoterAlerts,
    getPromoterDetails,
    hexToHsl,
    hslToHex,
    sendPromoterAlert,
    setPromoterColor,
    subscribeToPromoter,
    unsubscribeFromPromoter,
} from "@/lib/api";
import { AdminControls } from "@/components/admin-controls";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    AlertTriangle,
    ArrowLeft,
    Bell,
    ChevronRight,
    Clock,
    Globe,
    Info,
    Mail,
    MapPin,
    Megaphone,
    Phone,
    Plus,
    Send,
    Share2,
    Users,
    X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PromoterDetailScreen() {
  const { id, promoterData } = useLocalSearchParams<{
    id: string;
    promoterData?: string;
  }>();
  const router = useRouter();

  // Initialize with data passed from list page if available
  const initialPromoter: Promoter | undefined = promoterData
    ? JSON.parse(promoterData)
    : undefined;

  const [promoter, setPromoter] = useState<Promoter | undefined>(
    initialPromoter,
  );
  const [promoterEvents, setPromoterEvents] = useState<Event[]>([]);
  const [promoterAlerts, setPromoterAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!initialPromoter); // Don't show loading if we have initial data
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAdmin();
  const [showSendAlertModal, setShowSendAlertModal] = useState(false);
  const [alertNotificationType, setAlertNotificationType] = useState("");
  const [alertNotificationMessage, setAlertNotificationMessage] = useState("");
  const [alertNotificationIcon, setAlertNotificationIcon] = useState("1");
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [showAllPromoterAlerts, setShowAllPromoterAlerts] = useState(false);

  useEffect(() => {
    loadPromoterDetails();
    loadEvents();
    loadPromoterAlerts();
  }, [id]);

  const loadPromoterDetails = async () => {
    try {
      // Only show loading if we don't have initial data
      if (!promoter) {
        setIsLoading(true);
      }
      setError(null);
      const data = await getPromoterDetails(id);

      // Transform API response to match Promoter interface
      // API might return data in 'msg' property (like events) or directly
      // Also check if data itself is an object with promoter fields
      let p = data?.msg || data?.promoter || data?.data || data;

      // If data is an object with promoter fields directly, use it
      if (data && typeof data === "object" && !Array.isArray(data)) {
        // Check if data has promoter-like fields
        if (data.name || data.promoterName || data.venuename) {
          p = data;
        }
      }

      // More lenient validation - just check if we have some data
      if (!p || typeof p !== "object") {
        // If we have initial data, keep it; otherwise throw error
        if (!promoter) {
          throw new Error("No promoter data received from API");
        }
        // Keep existing promoter data if API fails
        setIsLoading(false);
        return;
      }

      // Handle isSubscribed - can be string "0"/"1" or boolean
      const isSubscribedValue = p.isSubscribed;
      const isSubscribed =
        typeof isSubscribedValue === "string"
          ? isSubscribedValue === "1" || isSubscribedValue === "true"
          : Boolean(isSubscribedValue);

      // Use the route id as fallback if no ID found in response
      const promoterId = p.id || p._id || p.promoterId || p.venueid || id;

      // Merge API data with existing promoter data (use existing as fallback)
      const currentPromoter = promoter || ({} as Promoter);

      const transformed: Promoter = {
        id: String(promoterId || currentPromoter.id || id),
        name:
          p.name ||
          p.promoterName ||
          p.venuename ||
          p.venue_name ||
          currentPromoter.name ||
          "",
        logo:
          p.logo ||
          p.logoUrl ||
          p.venuelogo ||
          p.venue_logo ||
          p.venueLogo ||
          currentPromoter.logo ||
          "",
        coverImage:
          p.coverImage ||
          p.coverImageUrl ||
          p.venuecover ||
          p.venue_cover ||
          p.venueCover ||
          currentPromoter.coverImage ||
          "",
        eventCount:
          p.eventCount ||
          p.eventsCount ||
          p.event_count ||
          currentPromoter.eventCount ||
          0,
        // Preserve initial isSubscribed if it was passed from list page
        isSubscribed:
          currentPromoter.isSubscribed !== undefined
            ? currentPromoter.isSubscribed
            : isSubscribed,
        brandColor:
          p.brandColor ||
          p.brand_color ||
          currentPromoter.brandColor ||
          "#ef4444",
        website:
          p.website ||
          p.websiteUrl ||
          p.website_url ||
          currentPromoter.website ||
          "",
        latitude: parseFloat(
          String(
            p.latitude ||
              p.lat ||
              p.venue_latitude ||
              p.venueLatitude ||
              currentPromoter.latitude ||
              "0",
          ),
        ),
        longitude: parseFloat(
          String(
            p.longitude ||
              p.lng ||
              p.venue_longitude ||
              p.venueLongitude ||
              currentPromoter.longitude ||
              "0",
          ),
        ),
        address:
          p.address ||
          p.location ||
          p.venue_address ||
          p.venueaddress ||
          p.venueAddress ||
          currentPromoter.address ||
          "",
        phone:
          p.phone ||
          p.phoneNumber ||
          p.venue_phone ||
          p.venuePhone ||
          currentPromoter.phone ||
          "",
        email:
          p.email ||
          p.emailAddress ||
          p.venue_email ||
          p.venueEmail ||
          currentPromoter.email ||
          "",
      };

      setPromoter(transformed);
    } catch (err) {
      // Only set error if we don't have initial data
      if (!promoter) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load promoter details",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const data = await getEvents();
      // API returns events in 'msg' property
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

          // Get original date string for sorting
          const originalDateStr = e.date || e.eventDate || "";

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

          return {
            id: e.id || e._id || String(e.eventId || ""),
            name: e.name || e.eventName || "",
            image:
              e.image ||
              e.coverImage ||
              e.imageUrl ||
              "https://via.placeholder.com/400",
            date: formatDate(originalDateStr),
            originalDate: originalDateStr, // Keep original for sorting
            location: e.address || e.location || e.venue || "Location TBA",
            isSubscribed: isSubscribed,
            promoterId: e.promoterId || e.promoter?.id || "",
          };
        });

      // Filter events for this promoter
      const filteredEvents = transformedEvents.filter(
        (e: any) => e.promoterId === id,
      );
      // Sort by original date (upcoming first) and limit to 3 events
      const sortedEvents = filteredEvents.sort((a: any, b: any) => {
        // Sort by original date - upcoming events first
        const dateA = a.originalDate ? new Date(a.originalDate).getTime() : 0;
        const dateB = b.originalDate ? new Date(b.originalDate).getTime() : 0;
        return dateA - dateB;
      });
      // Remove originalDate before setting state (keep only formatted date)
      const limitedEvents = sortedEvents
        .slice(0, 3)
        .map(({ originalDate, ...rest }: any) => rest);
      setPromoterEvents(limitedEvents);

      // Update event count based on actual filtered events (not limited)
      setPromoter((prev) => {
        if (!prev) return prev; // Don't update if no promoter data
        return { ...prev, eventCount: filteredEvents.length };
      });
    } catch (err) {
      // Error loading events - silently fail
    }
  };

  const loadPromoterAlerts = async () => {
    try {
      const data = await getPromoterAlerts(id);

      // Extract alerts from API response
      // API might return data in 'msg' property or directly as array
      const alerts = Array.isArray(data)
        ? data
        : data?.msg || data?.alerts || data?.data || [];

      if (Array.isArray(alerts)) {
        setPromoterAlerts(alerts);
      }
    } catch (err) {
      // Error loading alerts - silently fail, show empty state
      setPromoterAlerts([]);
    }
  };

  const handleSendAlert = async () => {
    if (!alertNotificationType.trim() || !alertNotificationMessage.trim()) {
      return;
    }

    setIsSendingAlert(true);
    try {
      await sendPromoterAlert(
        id,
        alertNotificationType.trim(),
        alertNotificationMessage.trim(),
        alertNotificationIcon,
      );
      // Reload alerts
      await loadPromoterAlerts();
      // Reset form
      setAlertNotificationType("");
      setAlertNotificationMessage("");
      setAlertNotificationIcon("1");
      setShowSendAlertModal(false);
    } catch (err) {
      // Error handled silently or could show alert
    } finally {
      setIsSendingAlert(false);
    }
  };

  const toggleSubscription = async () => {
    if (!promoter) return;
    const wasSubscribed = promoter.isSubscribed;

    try {
      // Optimistically update UI - toggle between 0 and 1
      setPromoter((prev) => {
        if (!prev) return promoter;
        return { ...prev, isSubscribed: prev.isSubscribed === 1 ? 0 : 1 };
      });

      // Make API call based on subscription status
      if (wasSubscribed === 1) {
        await unsubscribeFromPromoter(id);
      } else {
        await subscribeToPromoter(id);
      }
    } catch (err) {
      // Revert on error
      setPromoter((prev) => {
        if (!prev) return promoter;
        return { ...prev, isSubscribed: wasSubscribed };
      });
    }
  };

  const handleThemeColorChange = async (color: string) => {
    if (!promoter) return;
    const previousColor = promoter.brandColor;

    // Color picker returns HSL, convert to hex for local storage
    const hexColor = hslToHex(color);

    // Optimistically update UI with hex color
    setPromoter((prev) => {
      if (!prev) return promoter;
      return { ...prev, brandColor: hexColor };
    });

    try {
      // API expects HSL and converts to hex internally
      await setPromoterColor(color);
    } catch (err) {
      // Revert on error
      setPromoter((prev) => {
        if (!prev) return promoter;
        return { ...prev, brandColor: previousColor };
      });
    }
  };

  // Helper to get theme color - handles both hex (#006699) and HSL (0 84% 60%) formats
  const getThemeColor = () => {
    const brandColor = promoter?.brandColor || "#ef4444";
    // If it starts with #, it's already a hex color
    if (brandColor.startsWith("#")) {
      return brandColor;
    }
    // Otherwise assume it's HSL format
    return `hsl(${brandColor})`;
  };

  // Helper to get HSL format for color picker (converts hex to HSL if needed)
  const getThemeColorHsl = () => {
    const brandColor = promoter?.brandColor || "#ef4444";
    // If it starts with #, convert hex to HSL
    if (brandColor.startsWith("#")) {
      return hexToHsl(brandColor);
    }
    // Otherwise it's already HSL format
    return brandColor;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.errorText}>Loading venue...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Only show error if we don't have promoter data AND there's an error
  if (error && !promoter) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

  // If no promoter data at all, show error
  if (!promoter && !isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Venue not found</Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

  // If we have promoter data, show it even if there was an error
  if (!promoter) {
    return null; // Still loading
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#fafafa" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <AdminControls
              themeColor={getThemeColorHsl()}
              onThemeColorChange={handleThemeColorChange}
              notificationTarget={promoter.name}
              promoterId={id}
            />
            <TouchableOpacity style={styles.shareButton}>
              <Share2 size={24} color="#fafafa" />
            </TouchableOpacity>
          </View>
        </View>

        {promoter.coverImage ? (
          <Image
            source={{ uri: promoter.coverImage }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]} />
        )}

        <View style={styles.content}>
          <View style={styles.logoSection}>
            <Image source={{ uri: promoter.logo }} style={[styles.logo, { borderColor: getThemeColor() }]} />
            <View style={styles.titleSection}>
              <Text style={styles.title}>{promoter.name}</Text>
              <Text style={[styles.eventCountText, { color: getThemeColor() }]}>
                {promoter.eventCount} events
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.subscriptionButton,
                styles.roundedFull,
                promoter.isSubscribed === 1
                  ? [styles.subscriptionButtonOutlined, { borderColor: getThemeColor() }]
                  : { backgroundColor: getThemeColor() },
              ]}
              onPress={toggleSubscription}
            >
              <Bell
                size={16}
                color={promoter.isSubscribed === 1 ? getThemeColor() : "#fff"}
              />
              <Text
                style={[
                  styles.subscriptionText,
                  promoter.isSubscribed === 1
                    ? { color: getThemeColor() }
                    : styles.subscriptionTextFilled,
                ]}
              >
                {promoter.isSubscribed === 1 ? "Unsubscribe" : "Subscribe"}
              </Text>
            </TouchableOpacity>
            {promoter.website && (
              <TouchableOpacity
                style={[styles.websiteButton, styles.roundedFull, { borderColor: getThemeColor() }]}
                onPress={() =>
                  promoter.website && Linking.openURL(promoter.website)
                }
              >
                <Globe size={20} color={getThemeColor()} />
              </TouchableOpacity>
            )}
          </View>

          {promoterEvents.length > 0 && (
            <View style={styles.eventsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Events</Text>
                <TouchableOpacity>
                  <Text style={[styles.seeAllText, { color: getThemeColor() }]}>See all {">"}</Text>
                </TouchableOpacity>
              </View>
              {promoterEvents.map((event) => (
                <EventCard
                  key={event.id}
                  {...event}
                  onPress={() => router.push(`/event/${event.id}`)}
                />
              ))}
            </View>
          )}

          <View style={[styles.sectionCard, { borderColor: getThemeColor() + '30' }]}>
            <View style={styles.sectionCardHeader}>
              <View style={styles.sectionCardTitleContainer}>
                <Megaphone size={20} color={getThemeColor()} />
                <Text style={styles.sectionCardTitle}>Recent Alerts</Text>
              </View>
              {isAdmin && (
                <TouchableOpacity
                  onPress={() => setShowSendAlertModal(true)}
                  style={styles.addAlertButton}
                >
                  <Plus size={18} color={getThemeColor()} />
                  <Text style={[styles.addAlertButtonText, { color: getThemeColor() }]}>Send</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.sectionCardDivider, { backgroundColor: getThemeColor() + '20' }]} />
            <View style={styles.sectionCardContent}>
              {promoterAlerts.length > 0 ? (
                promoterAlerts
                  .sort((a: any, b: any) => {
                    // Sort by PushedDate (most recent first)
                    const dateA = new Date(a.PushedDate || 0).getTime();
                    const dateB = new Date(b.PushedDate || 0).getTime();
                    return dateB - dateA;
                  })
                  .slice(0, showAllPromoterAlerts ? promoterAlerts.length : 5)
                  .map((alert: any, index: number) => {
                  // Determine icon based on notification_type
                  const getAlertIcon = () => {
                    const notificationType = (
                      alert.notification_type || ""
                    ).toLowerCase();
                    if (
                      notificationType.includes("urgent") ||
                      notificationType.includes("emergency")
                    ) {
                      return AlertTriangle;
                    }
                    if (
                      notificationType.includes("schedule") ||
                      notificationType.includes("time")
                    ) {
                      return Clock;
                    }
                    return Users;
                  };

                  const AlertIcon = getAlertIcon();

                  // Format time from PushedDate (format: "2026-01-21 07:27:57")
                  const formatTime = (dateStr: string) => {
                    if (!dateStr) return "";
                    try {
                      const date = new Date(dateStr);
                      return date.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      });
                    } catch {
                      // If parsing fails, try to extract time from string format "2026-01-21 07:27:57"
                      const timeMatch = dateStr.match(
                        /(\d{1,2}):(\d{2}):(\d{2})/,
                      );
                      if (timeMatch) {
                        const hour = parseInt(timeMatch[1]);
                        const minute = timeMatch[2];
                        const ampm = hour >= 12 ? "PM" : "AM";
                        const hour12 = hour % 12 || 12;
                        return `${hour12}:${minute} ${ampm}`;
                      }
                      return dateStr;
                    }
                  };

                  // Get notification message, removing trailing newlines
                  const getNotificationMessage = () => {
                    const message =
                      alert.notification || alert.notification_message || "";
                    return message.trim().replace(/\n\n$/, "").replace(/\n$/, "");
                  };

                  return (
                    <View
                      key={alert.NotificationID || index}
                      style={[styles.alertCard, { backgroundColor: getThemeColor() + '10' }]}
                    >
                      <View style={[styles.alertIconContainer, { backgroundColor: getThemeColor() }]}>
                        <AlertIcon size={18} color="#fff" />
                      </View>
                      <View style={styles.alertContent}>
                        <View style={styles.alertHeader}>
                          <View style={[styles.alertBadge, { backgroundColor: getThemeColor() + '30' }]}>
                            <Text style={[styles.alertBadgeText, { color: getThemeColor() }]}>
                              {alert.notification_type || "Alert"}
                            </Text>
                          </View>
                          <Text style={styles.alertTime}>
                            {formatTime(alert.PushedDate || "")}
                          </Text>
                        </View>
                        <Text style={styles.alertMessage}>
                          {getNotificationMessage() || "No message"}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.sectionCardEmpty}>
                  <Megaphone size={32} color="#737373" />
                  <Text style={styles.sectionCardEmptyText}>No alerts available</Text>
                </View>
              )}
              {promoterAlerts.length > 5 && (
                <TouchableOpacity
                  style={[styles.seeMoreButton, { borderColor: getThemeColor() + '30' }]}
                  onPress={() => setShowAllPromoterAlerts(!showAllPromoterAlerts)}
                >
                  <Text style={[styles.seeMoreText, { color: getThemeColor() }]}>
                    {showAllPromoterAlerts ? 'Show Less' : `See More (${promoterAlerts.length - 5} more)`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Send Alert Modal */}
          <Modal
            visible={showSendAlertModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowSendAlertModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Send Alert</Text>
                  <TouchableOpacity
                    onPress={() => setShowSendAlertModal(false)}
                  >
                    <X size={24} color="#fafafa" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Notification Type</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Class Call, Urgent, Schedule"
                      placeholderTextColor="#737373"
                      value={alertNotificationType}
                      onChangeText={setAlertNotificationType}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Message</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Enter alert message"
                      placeholderTextColor="#737373"
                      value={alertNotificationMessage}
                      onChangeText={setAlertNotificationMessage}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Icon Number</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="1"
                      placeholderTextColor="#737373"
                      value={alertNotificationIcon}
                      onChangeText={setAlertNotificationIcon}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setShowSendAlertModal(false)}
                  >
                    <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      { backgroundColor: getThemeColor() },
                      (!alertNotificationType.trim() ||
                        !alertNotificationMessage.trim() ||
                        isSendingAlert) &&
                        styles.modalButtonDisabled,
                    ]}
                    onPress={handleSendAlert}
                    disabled={
                      !alertNotificationType.trim() ||
                      !alertNotificationMessage.trim() ||
                      isSendingAlert
                    }
                  >
                    {isSendingAlert ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.modalButtonTextSave}>Send Alert</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <View style={[styles.sectionCard, { borderColor: getThemeColor() + '30' }]}>
            <View style={styles.sectionCardHeader}>
              <View style={styles.sectionCardTitleContainer}>
                <Info size={20} color={getThemeColor()} />
                <Text style={styles.sectionCardTitle}>Venue Information</Text>
              </View>
            </View>
            <View style={[styles.sectionCardDivider, { backgroundColor: getThemeColor() + '20' }]} />
            <View style={styles.sectionCardContent}>
              {(promoter.address || (promoter.latitude && promoter.longitude) || promoter.phone || promoter.email) ? (
                <>
                  {promoter.address && (
                    <View style={[styles.infoCard, { backgroundColor: getThemeColor() + '10' }]}>
                      <View style={[styles.infoIconContainer, { backgroundColor: getThemeColor() }]}>
                        <MapPin size={18} color="#fff" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoCardTitle}>Address</Text>
                        <Text style={styles.infoCardSubtitle}>
                          {promoter.address}
                        </Text>
                      </View>
                    </View>
                  )}

                  {promoter.latitude && promoter.longitude && (
                    <TouchableOpacity
                      style={[styles.infoCard, { backgroundColor: getThemeColor() + '10' }]}
                      onPress={() => {
                        const url = `https://maps.google.com/?q=${promoter.latitude},${promoter.longitude}`;
                        Linking.openURL(url);
                      }}
                    >
                      <View style={[styles.infoIconContainer, { backgroundColor: getThemeColor() }]}>
                        <Send size={18} color="#fff" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoCardTitle}>Get Directions</Text>
                        <Text style={styles.infoCardSubtitle}>Open in Maps</Text>
                      </View>
                      <ChevronRight size={20} color={getThemeColor()} />
                    </TouchableOpacity>
                  )}

                  {promoter.phone && (
                    <TouchableOpacity
                      style={[styles.infoCard, { backgroundColor: getThemeColor() + '10' }]}
                      onPress={() => Linking.openURL(`tel:${promoter.phone}`)}
                    >
                      <View style={[styles.infoIconContainer, { backgroundColor: getThemeColor() }]}>
                        <Phone size={18} color="#fff" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoCardTitle}>Contact Venue</Text>
                        <Text style={styles.infoCardSubtitle}>
                          {promoter.phone}
                        </Text>
                      </View>
                      <ChevronRight size={20} color={getThemeColor()} />
                    </TouchableOpacity>
                  )}

                  {promoter.email && (
                    <TouchableOpacity
                      style={[styles.infoCard, { backgroundColor: getThemeColor() + '10' }]}
                      onPress={() => Linking.openURL(`mailto:${promoter.email}`)}
                    >
                      <View style={[styles.infoIconContainer, { backgroundColor: getThemeColor() }]}>
                        <Mail size={18} color="#fff" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoCardTitle}>Email</Text>
                        <Text style={styles.infoCardSubtitle}>
                          {promoter.email}
                        </Text>
                      </View>
                      <ChevronRight size={20} color={getThemeColor()} />
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <View style={styles.sectionCardEmpty}>
                  <Info size={32} color="#737373" />
                  <Text style={styles.sectionCardEmptyText}>No venue information available</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#fafafa",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroImage: {
    width: "100%",
    height: 300,
  },
  heroPlaceholder: {
    backgroundColor: "#111827",
  },
  content: {
    padding: 20,
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
  },
  titleSection: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fafafa",
    marginBottom: 4,
  },
  eventCountText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  subscriptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
  },
  subscriptionButtonFilled: {
    borderWidth: 0,
  },
  subscriptionButtonOutlined: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  roundedFull: {
    borderRadius: 9999,
  },
  subscriptionText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "500",
  },
  subscriptionTextFilled: {
    color: "#fff",
  },
  subscriptionTextOutlined: {},
  websiteButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  eventsSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fafafa",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  seeMoreButton: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Section Card Styles (shared between alerts and info sections)
  sectionCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionCardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fafafa",
  },
  sectionCardDivider: {
    height: 1,
    marginBottom: 16,
  },
  sectionCardContent: {
    gap: 12,
  },
  sectionCardEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
  },
  sectionCardEmptyText: {
    fontSize: 14,
    color: "#737373",
  },
  alertCard: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 14,
    alignItems: "flex-start",
  },
  alertIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  alertBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  alertTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  alertMessage: {
    fontSize: 14,
    color: "#fafafa",
    lineHeight: 20,
  },
  // Info Card Styles
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fafafa",
    marginBottom: 2,
  },
  infoCardSubtitle: {
    fontSize: 13,
    color: "#9ca3af",
  },
  addAlertButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
  },
  addAlertButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fafafa",
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#d1d5db",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#fafafa",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#2a2a2a",
  },
  modalButtonSave: {},
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fafafa",
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
  },
});
