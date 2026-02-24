import { AdminControls } from "@/components/admin-controls";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { useAdmin } from "@/contexts/AdminContext";
import type { Event, Promoter } from "@/data/mockData";
import {
  getPromoterAlerts,
  getPromoterDetails,
  hexToHsl,
  hslToHex,
  NotificationImageUpload,
  sendPromoterAlert,
  setPromoterColor,
  subscribeToPromoter,
  unsubscribeFromPromoter,
} from "@/lib/api";
import { formatTime } from "@/lib/dateUtils";
import { getNotificationIcon, NOTIFICATION_ICONS } from "@/lib/icon-utils";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
    ArrowLeft,
    Bell,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Globe,
    Info,
    Mail,
    MapPin,
    Megaphone,
    Phone,
    Plus,
    Send,
    X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { FullScreenImageModal } from "@/components/full-screen-image-modal";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PromoterDetailScreen() {
  const params = useLocalSearchParams<{ id: string; subscribed?: string }>();
  const rawId = params.id;
  const id = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : undefined;
  const subscribedParam =
    typeof params.subscribed === "string"
      ? params.subscribed
      : Array.isArray(params.subscribed)
        ? params.subscribed[0]
        : undefined;
  const router = useRouter();

  const [promoter, setPromoter] = useState<Promoter | undefined>();
  const [promoterEvents, setPromoterEvents] = useState<Event[]>([]);
  const [promoterAlerts, setPromoterAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin, canAccessEvent, canAccessPromoter } = useAdmin();
  const [showSendAlertModal, setShowSendAlertModal] = useState(false);
  const [alertNotificationType, setAlertNotificationType] = useState("");
  const [alertNotificationMessage, setAlertNotificationMessage] = useState("");
  const [alertNotificationIcon, setAlertNotificationIcon] = useState("1");
  const [alertNotificationImage, setAlertNotificationImage] =
    useState<NotificationImageUpload | null>(null);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [showAllPromoterAlerts, setShowAllPromoterAlerts] = useState(false);
  const [showAdminActionMenu, setShowAdminActionMenu] = useState(false);
  const [expandedPromoterAlertId, setExpandedPromoterAlertId] = useState<
    string | null
  >(null);
  const [fullScreenAlertImageUri, setFullScreenAlertImageUri] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!id) return;
    loadPromoterDetailsAndEvents();
    loadPromoterAlerts();
  }, [id]);

  const loadPromoterDetailsAndEvents = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await getPromoterDetails(id);

      // API now returns: { info: {...promoter details}, msg: [...events] }
      const promoterInfo = data?.info;
      const events = data?.msg || [];

      if (!promoterInfo) {
        throw new Error("No promoter info received from API");
      }

      // Transform promoter info to match Promoter interface
      let p = promoterInfo;

      // If data is an object with promoter fields directly, use it
      if (promoterInfo && typeof promoterInfo === "object") {
        // Check if data has promoter-like fields
        if (
          promoterInfo.name ||
          promoterInfo.promoterName ||
          promoterInfo.venuename
        ) {
          p = promoterInfo;
        }
      }

      // More lenient validation - just check if we have some data
      if (!p || typeof p !== "object") {
        throw new Error("No promoter data received from API");
      }

      // Handle isSubscribed - from API or from route param (when opened from Subscribed list)
      const isSubscribedValue = p.isSubscribed ?? p.is_subscribed ?? p.subscribed;
      const apiSubscribed =
        typeof isSubscribedValue === "string"
          ? isSubscribedValue === "1" || isSubscribedValue === "true"
          : Boolean(isSubscribedValue);
      // When user opened from "Subscribed" venues list, pass subscribed=1; use it if API didn't return subscribed
      const isSubscribed =
        subscribedParam === "1" ? true : apiSubscribed;

      // Use the route id as fallback if no ID found in response
      const promoterId = p.id || p._id || p.promoterId || p.venueid || id;

      const transformed: Promoter = {
        id: String(promoterId || id),
        name: p.name || p.promoterName || p.venuename || p.venue_name || "",
        logo:
          p.logo ||
          p.logoUrl ||
          p.venuelogo ||
          p.venue_logo ||
          p.venueLogo ||
          "",
        coverImage:
          p.coverImage ||
          p.coverImageUrl ||
          p.venuecover ||
          p.venue_cover ||
          p.venueCover ||
          "",
        eventCount: p.eventCount || p.eventsCount || p.event_count || 0,
        isSubscribed: isSubscribed ? 1 : 0,
        brandColor: p.brandColor || p.brand_color || "#ef4444",
        website: p.website || p.websiteUrl || p.website_url || "",
        latitude: parseFloat(
          String(
            p.latitude || p.lat || p.venue_latitude || p.venueLatitude || "0",
          ),
        ),
        longitude: parseFloat(
          String(
            p.longitude ||
              p.lng ||
              p.venue_longitude ||
              p.venueLongitude ||
              "0",
          ),
        ),
        address:
          p.address ||
          p.location ||
          p.venue_address ||
          p.venueaddress ||
          p.venueAddress ||
          "",
        phone:
          p.phone ||
          p.phoneNumber ||
          p.venue_phone ||
          p.venuePhone ||
          p.Phone ||
          "",
        email: p.email || p.emailAddress || p.venue_email || p.venueEmail || "",
      };

      setPromoter(transformed);

      // Transform and set events from the same API call
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

      // Sort by original date (upcoming first) and set events
      const sortedEvents = transformedEvents.sort((a: any, b: any) => {
        const dateA = a.originalDate ? new Date(a.originalDate).getTime() : 0;
        const dateB = b.originalDate ? new Date(b.originalDate).getTime() : 0;
        return dateA - dateB; // Upcoming events first
      });

      // Remove originalDate before setting state and limit to 3 events
      const limitedEvents = sortedEvents
        .slice(0, 3)
        .map(({ originalDate, ...rest }: any) => rest);
      setPromoterEvents(limitedEvents);

      // Update event count based on all events (not limited)
      const updatedTransformed = {
        ...transformed,
        eventCount: transformedEvents.length,
      };
      setPromoter(updatedTransformed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load promoter details",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadPromoterAlerts = async () => {
    if (!id) return;
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
        alertNotificationImage,
      );
      // Reload alerts
      await loadPromoterAlerts();
      // Reset form
      setAlertNotificationType("");
      setAlertNotificationMessage("");
      setAlertNotificationIcon("1");
      setAlertNotificationImage(null);
      setShowSendAlertModal(false);
    } catch (err) {
      // Error handled silently or could show alert
    } finally {
      setIsSendingAlert(false);
    }
  };

  const handlePickAlertImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    const uri = asset.uri;
    const name =
      asset.fileName || uri.split("/").pop() || `alert-${Date.now()}.jpg`;
    const type = asset.mimeType || "image/jpeg";

    setAlertNotificationImage({ uri, name, type });
  };

  const handleRemoveAlertImage = () => {
    setAlertNotificationImage(null);
  };

  const toggleSubscription = async () => {
    if (!promoter) return;
    const wasSubscribed = promoter.isSubscribed;

    console.log("[PROMOTER SUBSCRIBE] 🔄 Starting subscription toggle");
    console.log("[PROMOTER SUBSCRIBE] 📊 Current state:", {
      promoterId: id,
      promoterName: promoter.name,
      wasSubscribed: wasSubscribed,
      action: wasSubscribed === 1 ? "UNSUBSCRIBE" : "SUBSCRIBE",
    });

    try {
      // Optimistically update UI - toggle between 0 and 1
      setPromoter((prev) => {
        if (!prev) return promoter;
        return { ...prev, isSubscribed: prev.isSubscribed === 1 ? 0 : 1 };
      });

      console.log("[PROMOTER SUBSCRIBE] 🔄 UI updated optimistically");

      // Make API call based on subscription status
      if (wasSubscribed === 1) {
        console.log(
          "[PROMOTER SUBSCRIBE] 📤 Calling unsubscribeFromPromoter API",
        );
        await unsubscribeFromPromoter(id);
        console.log("[PROMOTER SUBSCRIBE] ✅ Successfully unsubscribed");
      } else {
        console.log("[PROMOTER SUBSCRIBE] 📤 Calling subscribeToPromoter API");
        await subscribeToPromoter(id);
        console.log("[PROMOTER SUBSCRIBE] ✅ Successfully subscribed");
      }

      console.log(
        "[PROMOTER SUBSCRIBE] 🎉 Subscription toggle completed successfully",
      );
    } catch (err) {
      console.error(
        "[PROMOTER SUBSCRIBE] ❌ Error during subscription toggle:",
        err,
      );
      // Revert on error
      setPromoter((prev) => {
        if (!prev) return promoter;
        return { ...prev, isSubscribed: wasSubscribed };
      });
      console.log("[PROMOTER SUBSCRIBE] 🔄 Reverted UI to previous state");
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

  if (!id) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Invalid promoter</Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

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
              promoterId={id}
            />
            {isAdmin && canAccessPromoter(id) && (
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => setShowAdminActionMenu(true)}
              >
                <Plus size={24} color="#fafafa" />
              </TouchableOpacity>
            )}
            {/* <TouchableOpacity style={styles.shareButton}>
              <Share2 size={24} color="#fafafa" />
            </TouchableOpacity> */}
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
            <Image
              source={{ uri: promoter.logo }}
              style={[styles.logo, { borderColor: getThemeColor() }]}
            />
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
                  ? [
                      styles.subscriptionButtonOutlined,
                      { borderColor: getThemeColor() },
                    ]
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
                style={[
                  styles.websiteButton,
                  styles.roundedFull,
                  { borderColor: getThemeColor() },
                ]}
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
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/events",
                      params: id ? { promoterId: id } : undefined,
                    })
                  }
                >
                  <Text style={[styles.seeAllText, { color: getThemeColor() }]}>
                    See all {">"}
                  </Text>
                </TouchableOpacity>
              </View>
              {promoterEvents.map((event) => (
                <EventCard
                  key={event.id}
                  {...event}
                  promoterId={event.promoterId}
                  isAdminOwned={canAccessEvent(event.promoterId)}
                  onPress={() => router.push(`/(tabs)/event/${event.id}`)}
                />
              ))}
            </View>
          )}

          <View
            style={[
              styles.sectionCard,
              { borderColor: getThemeColor() + "30" },
            ]}
          >
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
                  <Text
                    style={[
                      styles.addAlertButtonText,
                      { color: getThemeColor() },
                    ]}
                  >
                    Send
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View
              style={[
                styles.sectionCardDivider,
                { backgroundColor: getThemeColor() + "20" },
              ]}
            />
            <View style={styles.sectionCardContent}>
              {promoterAlerts.length > 0 ? (
                <>
                  <FullScreenImageModal
                    visible={!!fullScreenAlertImageUri}
                    imageUri={fullScreenAlertImageUri}
                    onClose={() => setFullScreenAlertImageUri(null)}
                  />
                  {promoterAlerts
                  .sort((a: any, b: any) => {
                    // Sort by PushedDate (most recent first)
                    const dateA = new Date(a.PushedDate || 0).getTime();
                    const dateB = new Date(b.PushedDate || 0).getTime();
                    return dateB - dateA;
                  })
                  .slice(0, showAllPromoterAlerts ? promoterAlerts.length : 5)
                  .map((alert: any, index: number) => {
                    // Determine icon based on notification_icon number
                    const iconNumber = String(
                      alert.notification_icon || alert.icon || "1",
                    );
                    const AlertIcon = getNotificationIcon(iconNumber);

                    // Format time from PushedDate using timezone-aware utility
                    // Server sends UTC time, formatTime converts to user's local timezone
                    const timeStr = formatTime(alert.PushedDate || "");

                    // Get notification message, removing trailing newlines
                    const getNotificationMessage = () => {
                      const message =
                        alert.notification || alert.notification_message || "";
                      return message
                        .trim()
                        .replace(/\n\n$/, "")
                        .replace(/\n$/, "");
                    };

                    const alertId =
                      alert.NotificationID ||
                      alert.id ||
                      `promoter-alert-${index}`;
                    const alertImageUrl =
                      alert.image ||
                      alert.notification_image ||
                      alert.image_url ||
                      null;
                    const hasImage = !!alertImageUrl;
                    const isExpanded = expandedPromoterAlertId === alertId;

                    const cardContent = (
                      <>
                        <View
                          style={[
                            styles.alertIconContainer,
                            { backgroundColor: getThemeColor() },
                          ]}
                        >
                          <AlertIcon size={18} color="#fff" />
                        </View>
                        <View style={styles.alertContent}>
                          <View style={styles.alertHeader}>
                            <View
                              style={[
                                styles.alertBadge,
                                { backgroundColor: getThemeColor() + "30" },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.alertBadgeText,
                                  { color: getThemeColor() },
                                ]}
                              >
                                {alert.notification_type || "Alert"}
                              </Text>
                            </View>
                            <View style={styles.alertHeaderRight}>
                              <Text style={styles.alertTime}>{timeStr}</Text>
                              {hasImage &&
                                (isExpanded ? (
                                  <ChevronUp
                                    size={18}
                                    color={getThemeColor()}
                                    style={styles.alertChevron}
                                  />
                                ) : (
                                  <ChevronDown
                                    size={18}
                                    color={getThemeColor()}
                                    style={styles.alertChevron}
                                  />
                                ))}
                            </View>
                          </View>
                          <Text style={styles.alertMessage}>
                            {getNotificationMessage() || "No message"}
                          </Text>
                          {hasImage && isExpanded && (
                            <View style={styles.recentAlertImageWrap}>
                              <Pressable
                                onPress={() =>
                                  setFullScreenAlertImageUri(alertImageUrl)
                                }
                              >
                                <Image
                                  source={{ uri: alertImageUrl }}
                                  style={styles.recentAlertImage}
                                />
                              </Pressable>
                            </View>
                          )}
                        </View>
                      </>
                    );

                    return (
                      <View
                        key={alertId}
                        style={[
                          styles.alertCard,
                          { backgroundColor: getThemeColor() + "10" },
                        ]}
                      >
                        {hasImage ? (
                          <TouchableOpacity
                            style={styles.alertCardTouchable}
                            onPress={() =>
                              setExpandedPromoterAlertId(
                                isExpanded ? null : alertId,
                              )
                            }
                            activeOpacity={0.8}
                          >
                            {cardContent}
                          </TouchableOpacity>
                        ) : (
                          cardContent
                        )}
                      </View>
                    );
                  })}
                </>
              ) : (
                <View style={styles.sectionCardEmpty}>
                  <Megaphone size={32} color="#737373" />
                  <Text style={styles.sectionCardEmptyText}>
                    No alerts available
                  </Text>
                </View>
              )}
              {promoterAlerts.length > 5 && (
                <TouchableOpacity
                  style={[
                    styles.seeMoreButton,
                    { borderColor: getThemeColor() + "30" },
                  ]}
                  onPress={() =>
                    setShowAllPromoterAlerts(!showAllPromoterAlerts)
                  }
                >
                  <Text
                    style={[styles.seeMoreText, { color: getThemeColor() }]}
                  >
                    {showAllPromoterAlerts
                      ? "Show Less"
                      : `See More (${promoterAlerts.length - 5} more)`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Admin Action Menu */}
          <Modal
            visible={showAdminActionMenu}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowAdminActionMenu(false)}
          >
            <TouchableOpacity
              style={styles.actionMenuOverlay}
              activeOpacity={1}
              onPress={() => setShowAdminActionMenu(false)}
            >
              <View
                style={[
                  styles.actionMenuContent,
                  { borderColor: getThemeColor() + "30" },
                ]}
              >
                <Text style={styles.actionMenuTitle}>Admin Actions</Text>
                <View style={styles.actionMenuDivider} />
                <TouchableOpacity
                  style={styles.actionMenuItem}
                  onPress={() => {
                    setShowAdminActionMenu(false);
                    setShowSendAlertModal(true);
                  }}
                >
                  <View
                    style={[
                      styles.actionMenuIcon,
                      { backgroundColor: getThemeColor() },
                    ]}
                  >
                    <Megaphone size={20} color="#fff" />
                  </View>
                  <View style={styles.actionMenuTextContainer}>
                    <Text style={styles.actionMenuItemTitle}>Send Alert</Text>
                    <Text style={styles.actionMenuItemSubtitle}>
                      Notify subscribers about updates
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#737373" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionMenuCancelButton}
                  onPress={() => setShowAdminActionMenu(false)}
                >
                  <Text style={styles.actionMenuCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

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
                    <Text style={styles.inputLabel}>Image (optional)</Text>
                    <View style={styles.imageActionsRow}>
                      <TouchableOpacity
                        style={styles.imageButton}
                        onPress={handlePickAlertImage}
                      >
                        <Text style={styles.imageButtonText}>
                          {alertNotificationImage
                            ? "Change Image"
                            : "Upload Image"}
                        </Text>
                      </TouchableOpacity>
                      {alertNotificationImage ? (
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={handleRemoveAlertImage}
                        >
                          <Text style={styles.removeImageText}>Remove</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    {alertNotificationImage ? (
                      <Image
                        source={{ uri: alertNotificationImage.uri }}
                        style={styles.alertImagePreview}
                      />
                    ) : null}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Notification Icon</Text>
                    <Select
                      value={alertNotificationIcon}
                      onValueChange={setAlertNotificationIcon}
                    >
                      {NOTIFICATION_ICONS.map((iconOption) => {
                        const IconComponent = iconOption.icon;
                        return (
                          <SelectItem
                            key={iconOption.number}
                            value={iconOption.number}
                          >
                            <View style={styles.iconSelectRow}>
                              <IconComponent size={18} color="#e5e7eb" />
                              <Text style={styles.iconSelectLabel}>
                                {iconOption.label}
                              </Text>
                            </View>
                          </SelectItem>
                        );
                      })}
                    </Select>
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

          <View
            style={[
              styles.sectionCard,
              { borderColor: getThemeColor() + "30" },
            ]}
          >
            <View style={styles.sectionCardHeader}>
              <View style={styles.sectionCardTitleContainer}>
                <Info size={20} color={getThemeColor()} />
                <Text style={styles.sectionCardTitle}>Venue Information</Text>
              </View>
            </View>
            <View
              style={[
                styles.sectionCardDivider,
                { backgroundColor: getThemeColor() + "20" },
              ]}
            />
            <View style={styles.sectionCardContent}>
              {promoter.address ||
              (promoter.latitude && promoter.longitude) ||
              promoter.phone ||
              promoter.email ? (
                <>
                  {promoter.address && (
                    <View
                      style={[
                        styles.infoCard,
                        { backgroundColor: getThemeColor() + "10" },
                      ]}
                    >
                      <View
                        style={[
                          styles.infoIconContainer,
                          { backgroundColor: getThemeColor() },
                        ]}
                      >
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
                      style={[
                        styles.infoCard,
                        { backgroundColor: getThemeColor() + "10" },
                      ]}
                      onPress={() => {
                        const url = `https://maps.google.com/?q=${promoter.latitude},${promoter.longitude}`;
                        Linking.openURL(url);
                      }}
                    >
                      <View
                        style={[
                          styles.infoIconContainer,
                          { backgroundColor: getThemeColor() },
                        ]}
                      >
                        <Send size={18} color="#fff" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoCardTitle}>Get Directions</Text>
                        <Text style={styles.infoCardSubtitle}>
                          Open in Maps
                        </Text>
                      </View>
                      <ChevronRight size={20} color={getThemeColor()} />
                    </TouchableOpacity>
                  )}

                  {promoter.phone && (
                    <TouchableOpacity
                      style={[
                        styles.infoCard,
                        { backgroundColor: getThemeColor() + "10" },
                      ]}
                      onPress={() => Linking.openURL(`tel:${promoter.phone}`)}
                    >
                      <View
                        style={[
                          styles.infoIconContainer,
                          { backgroundColor: getThemeColor() },
                        ]}
                      >
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
                      style={[
                        styles.infoCard,
                        { backgroundColor: getThemeColor() + "10" },
                      ]}
                      onPress={() =>
                        Linking.openURL(`mailto:${promoter.email}`)
                      }
                    >
                      <View
                        style={[
                          styles.infoIconContainer,
                          { backgroundColor: getThemeColor() },
                        ]}
                      >
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
                  <Text style={styles.sectionCardEmptyText}>
                    No venue information available
                  </Text>
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
    alignItems: "center",
    backgroundColor: "transparent",
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
  alertHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  alertChevron: {
    marginLeft: 4,
  },
  alertCardTouchable: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },
  recentAlertImageWrap: {
    marginTop: 12,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  recentAlertImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#0b0f19",
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
  imageActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  imageButton: {
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  imageButtonText: {
    color: "#fafafa",
    fontSize: 14,
    fontWeight: "500",
  },
  removeImageButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  removeImageText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "500",
  },
  alertImagePreview: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#0a0a0a",
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
  iconPickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  iconPickerButton: {
    width: "31%",
    aspectRatio: 1.5,
    backgroundColor: "#111827",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  iconPickerLabel: {
    fontSize: 10,
    color: "#737373",
    marginTop: 4,
  },
  iconSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconSelectLabel: {
    color: "#e5e7eb",
    fontSize: 14,
  },
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
    padding: 16,
  },
  actionMenuContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
  },
  actionMenuTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#737373",
    textAlign: "center",
    paddingVertical: 16,
  },
  actionMenuDivider: {
    height: 1,
    backgroundColor: "#2a2a2a",
  },
  actionMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  actionMenuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  actionMenuTextContainer: {
    flex: 1,
  },
  actionMenuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fafafa",
    marginBottom: 2,
  },
  actionMenuItemSubtitle: {
    fontSize: 13,
    color: "#737373",
  },
  actionMenuCancelButton: {
    padding: 16,
    alignItems: "center",
  },
  actionMenuCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
});
