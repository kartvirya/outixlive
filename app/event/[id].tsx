import { AdminControls } from "@/components/admin-controls";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { useAdmin } from "@/contexts/AdminContext";
import type { Event } from "@/data/mockData";
import {
    addEventQuickLink,
    deleteEventQuickLink,
    getEventAlerts,
    getEventQuickLinks,
    getEvents,
    hexToHsl,
    hslToHex,
  NotificationImageUpload,
    sendEventAlert,
    setEventColor,
    subscribeToEvent,
    unsubscribeFromEvent,
} from "@/lib/api";
import { formatTime } from "@/lib/dateUtils";
import { getNotificationIcon, NOTIFICATION_ICONS } from "@/lib/icon-utils";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
    AlertTriangle,
    ArrowLeft,
    Bell,
    Calendar,
    Camera,
    Car,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Clock,
    CreditCard,
    ExternalLink,
    Facebook,
    FileText,
    Flag,
    Gift,
    Globe,
    Heart,
    HelpCircle,
    Home,
    Image as ImageIcon,
    Info,
    Instagram,
    Link,
    Link2,
    List,
    Mail,
    Map,
    MapPin,
    Megaphone,
    MessageCircle,
    Music,
    Newspaper,
    Phone,
    Play,
    Plus,
    Radio,
    Send,
    Settings,
    Share2,
    ShoppingBag,
    ShoppingCart,
    Star,
    Ticket,
    Trash2,
    Trophy,
    Tv,
    Twitter,
    Users,
    Video,
    Wifi,
    X,
    Youtube,
    Zap,
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

interface ExtendedEvent extends Event {
  logo?: string;
  coverImage?: string;
  endDate?: string;
  promoterName?: string;
  venuelogo?: string;
  brandColor?: string;
  latitude?: string | number;
  longitude?: string | number;
  address?: string;
  phone?: string;
  email?: string;
}

export default function EventDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    eventData?: string;
  }>();
  const rawId = params.id;
  const id = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : undefined;
  const eventData = params.eventData;
  const router = useRouter();

  // Canonicalize duplicate route structure to expo-router's `(tabs)` routes.
  // Keep hooks unconditionally executed (no early returns) to satisfy `rules-of-hooks`.
  const shouldRedirect = !!id;

  // Initialize with data passed from list page if available (safe parse to avoid crash)
  let initialEvent: ExtendedEvent | undefined;
  try {
    initialEvent =
      typeof eventData === "string" && eventData.trim()
        ? (JSON.parse(eventData) as ExtendedEvent)
        : undefined;
  } catch {
    initialEvent = undefined;
  }

  const [event, setEvent] = useState<ExtendedEvent | undefined>(initialEvent);
  const [isLoading, setIsLoading] = useState(!initialEvent);
  const [error, setError] = useState<string | null>(null);
  const [quickLinks, setQuickLinks] = useState<
    {
      id?: string;
      type: string;
      icon: number;
      link: string;
      deleteable?: string | boolean;
    }[]
  >([]);
  const [eventAlerts, setEventAlerts] = useState<any[]>([]);
  const { isAdmin, canAccessEvent } = useAdmin();
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkIcon, setNewLinkIcon] = useState("1");
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [showSendAlertModal, setShowSendAlertModal] = useState(false);
  const [alertNotificationType, setAlertNotificationType] = useState("");
  const [alertNotificationMessage, setAlertNotificationMessage] = useState("");
  const [alertNotificationIcon, setAlertNotificationIcon] = useState("1");
  const [alertNotificationImage, setAlertNotificationImage] =
    useState<NotificationImageUpload | null>(null);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [showAdminActionMenu, setShowAdminActionMenu] = useState(false);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [expandedEventAlertId, setExpandedEventAlertId] = useState<
    string | null
  >(null);
  const [fullScreenAlertImageUri, setFullScreenAlertImageUri] = useState<
    string | null
  >(null);

  // Prefill URL with https:// when modal opens
  useEffect(() => {
    if (showAddLinkModal && !newLinkUrl) {
      setNewLinkUrl("https://");
    }
  }, [showAddLinkModal]);

  useEffect(() => {
    // This file exists only to redirect to the canonical `(tabs)` route.
    // Prevent any network calls before we redirect.
    if (!id || shouldRedirect) return;
    loadEventDetails();
    loadQuickLinks();
    loadEventAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadQuickLinks = async () => {
    if (!id) return;
    try {
      const data = await getEventQuickLinks(id);

      // Extract quick links from API response
      // API returns array in 'msg' property
      const links = data?.msg || data?.data || [];

      if (Array.isArray(links)) {
        setQuickLinks(
          links.map((link: any) => ({
            id:
              link.linkid ??
              link.linkId ??
              link.id ??
              link._id ??
              link.button_id ??
              link.quicklink_id ??
              link.quick_link_id ??
              link.link_id,
            type: link.type || link.name || link.button_label || "Link",
            icon: link.icon || link.button_icon || 1,
            link: link.link || link.url || link.button_link || "",
            deleteable: link.deleteable,
          })),
        );
      }
    } catch {
      // Don't show error to user
    }
  };

  const handleAddQuickLink = async () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) {
      return;
    }

    setIsAddingLink(true);
    try {
      await addEventQuickLink(
        id,
        newLinkLabel.trim(),
        newLinkUrl.trim(),
        newLinkIcon,
      );
      // Reload quick links
      await loadQuickLinks();
      // Reset form
      setNewLinkLabel("");
      setNewLinkUrl("");
      setNewLinkIcon("1");
      setShowAddLinkModal(false);
    } catch {
      // Error handled silently or could show alert
    } finally {
      setIsAddingLink(false);
    }
  };

  const handleDeleteQuickLink = async (linkId: string) => {
    try {
      if (!linkId || linkId === "0") return;
      await deleteEventQuickLink(linkId);
      // Reload quick links
      await loadQuickLinks();
    } catch {
      // Error handled silently or could show alert
    }
  };

  const handleSendAlert = async () => {
    if (!alertNotificationType.trim() || !alertNotificationMessage.trim()) {
      return;
    }

    if (!event?.promoterId) {
      // Can't send alert without promoter ID
      return;
    }

    setIsSendingAlert(true);
    try {
      await sendEventAlert(
        event.promoterId,
        id,
        alertNotificationType.trim(),
        alertNotificationMessage.trim(),
        alertNotificationIcon,
        alertNotificationImage,
      );
      // Reload alerts
      await loadEventAlerts();
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
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const uri = asset.uri;
      if (!uri || typeof uri !== "string") {
        return;
      }
      const name =
        asset.fileName || uri.split("/").pop() || `alert-${Date.now()}.jpg`;
      const type = asset.mimeType || "image/jpeg";

      setAlertNotificationImage({ uri, name, type });
    } catch (err) {
      console.warn("[SendAlert] Image picker error:", err);
    }
  };

  const handleRemoveAlertImage = () => {
    setAlertNotificationImage(null);
  };

  const loadEventAlerts = async () => {
    if (!id) return;
    try {
      const data = await getEventAlerts(id);

      // Extract alerts from API response
      // API might return data in 'msg' property or directly as array
      const alerts = Array.isArray(data)
        ? data
        : data?.msg || data?.alerts || data?.data || [];

      if (Array.isArray(alerts)) {
        setEventAlerts(alerts);
      }
    } catch {
      // Error loading alerts - silently fail, show empty state
      setEventAlerts([]);
    }
  };

  const loadEventDetails = async () => {
    if (!id) return;
    try {
      if (!event) {
        setIsLoading(true);
      }
      setError(null);
      const data = await getEvents();

      // API returns data in 'msg' property
      const events = Array.isArray(data)
        ? data
        : data?.msg || data?.events || data?.data || [];

      const transformedEvents = events
        .filter((e: any) => e)
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

          const formatDate = (dateStr: string) => {
            if (!dateStr) return "Date TBA";
            try {
              const date = new Date(dateStr);
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              });
            } catch {
              return dateStr;
            }
          };

          return {
            id: e.id || e._id || String(e.eventId || ""),
            name: e.name || e.eventName || "",
            image: e.image || e.coverImage || e.imageUrl || "",
            date: formatDate(e.date || e.eventDate || ""),
            location: e.address || e.location || e.venue || "",
            isSubscribed: isSubscribed,
            promoterId: e.promoterId || e.promoter?.id || "",
            logo: e.logo || e.venuelogo || "",
            coverImage: e.coverImage || e.image || "",
            endDate: e.endDate ? formatDate(e.endDate) : undefined,
            promoterName: e.promoterName || "",
            venuelogo: e.venuelogo || "",
            brandColor: e.brandColor || "#ef4444",
            latitude: e.latitude ? parseFloat(String(e.latitude)) : undefined,
            longitude: e.longitude
              ? parseFloat(String(e.longitude))
              : undefined,
            address: e.address || "",
          };
        });

      const foundEvent = transformedEvents.find(
        (e: ExtendedEvent) => e.id === id,
      );
      if (foundEvent) {
        // Merge with existing event data
        const currentEvent = event || ({} as ExtendedEvent);
        setEvent({
          ...currentEvent,
          ...foundEvent,
          // Preserve initial isSubscribed state if it was passed from list page
          isSubscribed:
            currentEvent.isSubscribed !== undefined
              ? currentEvent.isSubscribed
              : foundEvent.isSubscribed,
          // Preserve initial data for fields that might not be in API response
          name: foundEvent.name || currentEvent.name || "",
          image:
            foundEvent.image ||
            foundEvent.coverImage ||
            currentEvent.image ||
            "",
        });
      } else if (!event) {
        throw new Error("Event not found");
      }
    } catch (err) {
      if (!event) {
        setError(
          err instanceof Error ? err.message : "Failed to load event details",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubscription = async () => {
    if (!event) return;
    const wasSubscribed = event.isSubscribed;

    try {
      setEvent((prev) => {
        if (!prev) return event;
        return { ...prev, isSubscribed: prev.isSubscribed === 1 ? 0 : 1 };
      });

      if (wasSubscribed === 1) {
        await unsubscribeFromEvent(id);
      } else {
        await subscribeToEvent(id);
      }
    } catch {
      setEvent((prev) => {
        if (!prev) return event;
        return { ...prev, isSubscribed: wasSubscribed };
      });
    }
  };

  const handleThemeColorChange = async (color: string) => {
    if (!event) return;
    const previousColor = event.brandColor;

    // Color picker returns HSL, convert to hex for local storage
    const hexColor = hslToHex(color);

    // Optimistically update UI with hex color
    setEvent((prev) => {
      if (!prev) return event;
      return { ...prev, brandColor: hexColor };
    });

    try {
      // API expects HSL and converts to hex internally
      await setEventColor(color, id);
    } catch (err) {
      // Revert on error
      setEvent((prev) => {
        if (!prev) return event;
        return { ...prev, brandColor: previousColor };
      });
    }
  };

  // Helper to get theme color - handles both hex (#006699) and HSL (0 84% 60%) formats
  const getThemeColor = () => {
    const brandColor = event?.brandColor || "#ef4444";
    // If it starts with #, it's already a hex color
    if (brandColor.startsWith("#")) {
      return brandColor;
    }
    // Otherwise assume it's HSL format
    return `hsl(${brandColor})`;
  };

  // Helper to get HSL format for color picker (converts hex to HSL if needed)
  const getThemeColorHsl = () => {
    const brandColor = event?.brandColor || "#ef4444";
    // If it starts with #, convert hex to HSL
    if (brandColor.startsWith("#")) {
      return hexToHsl(brandColor);
    }
    // Otherwise it's already HSL format
    return brandColor;
  };

  // Icon mapping for quick links - matches type/name to lucide icons
  const getQuickLinkIcon = (type: string) => {
    const typeLower = type.toLowerCase().trim();

    // Map common keywords to icons
    const iconMap: Record<string, any> = {
      // Tickets & Registration
      ticket: Ticket,
      tickets: Ticket,
      register: FileText,
      registration: FileText,
      signup: FileText,
      "sign up": FileText,
      entry: FileText,
      entries: FileText,

      // Schedule & Time
      schedule: Calendar,
      timetable: Calendar,
      calendar: Calendar,
      time: Clock,
      times: Clock,
      timing: Clock,

      // Location & Maps
      map: Map,
      maps: Map,
      location: MapPin,
      directions: MapPin,
      parking: Car,
      venue: Home,

      // Media & Social
      video: Video,
      videos: Video,
      youtube: Youtube,
      live: Radio,
      livestream: Radio,
      "live stream": Radio,
      stream: Play,
      tv: Tv,
      watch: Play,
      photo: Camera,
      photos: ImageIcon,
      gallery: ImageIcon,
      facebook: Facebook,
      instagram: Instagram,
      twitter: Twitter,
      social: Share2,

      // Results & Standings
      results: Trophy,
      result: Trophy,
      standings: List,
      leaderboard: Trophy,
      points: Star,
      winners: Trophy,

      // Information & Help
      info: Info,
      information: Info,
      about: Info,
      faq: HelpCircle,
      help: HelpCircle,
      rules: FileText,
      regulations: FileText,

      // Shopping & Payment
      shop: ShoppingBag,
      store: ShoppingCart,
      merch: ShoppingBag,
      merchandise: ShoppingBag,
      buy: CreditCard,
      pay: CreditCard,
      payment: CreditCard,

      // Communication
      contact: Phone,
      call: Phone,
      phone: Phone,
      email: Mail,
      message: MessageCircle,
      chat: MessageCircle,

      // News & Updates
      news: Newspaper,
      updates: Bell,
      announcements: Megaphone,
      alert: AlertTriangle,

      // Racing specific
      race: Flag,
      racing: Flag,
      track: Map,
      pit: Settings,
      class: Users,
      classes: Users,
      racer: Users,
      racers: Users,
      driver: Users,
      drivers: Users,
      sponsor: Heart,
      sponsors: Heart,

      // Other
      website: Globe,
      web: Globe,
      link: Link,
      external: ExternalLink,
      music: Music,
      wifi: Wifi,
      internet: Wifi,
      prize: Gift,
      prizes: Gift,
      promo: Zap,
      special: Star,
    };

    // Try to find a matching icon
    for (const [keyword, IconComponent] of Object.entries(iconMap)) {
      if (typeLower.includes(keyword)) {
        return IconComponent;
      }
    }

    // Fallback icon
    return Link2;
  };

  if (shouldRedirect && id) {
    return <Redirect href={`/(tabs)/event/${id}`} />;
  }

  if (!id) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Invalid event</Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.errorText}>Loading event...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !event) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!event && !isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Event not found</Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return null;
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
              promoterId={event.promoterId}
            />
            {isAdmin && canAccessEvent(event.promoterId) && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowAdminActionMenu(true)}
              >
                <Plus size={24} color="#fafafa" />
              </TouchableOpacity>
            )}
            {/* <TouchableOpacity style={styles.headerButton}>
              <Share2 size={24} color="#fafafa" />
            </TouchableOpacity> */}
          </View>
        </View>

        {event.coverImage || event.image ? (
          <Image
            source={{ uri: event.coverImage || event.image }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]} />
        )}

        <View style={styles.content}>
          <View style={styles.logoSection}>
            {event.logo && (
              <Image
                source={{ uri: event.logo }}
                style={[styles.logo, { borderColor: getThemeColor() }]}
              />
            )}
            <View style={styles.titleSection}>
              <Text style={styles.title}>{event.name}</Text>
              {event.endDate && (
                <Text style={styles.dateText}>
                  {event.date} - {event.endDate}
                </Text>
              )}
              {!event.endDate && (
                <Text style={styles.dateText}>{event.date}</Text>
              )}
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.subscriptionButton,
                styles.roundedFull,
                event.isSubscribed === 1
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
                color={event.isSubscribed === 1 ? getThemeColor() : "#fff"}
              />
              <Text
                style={[
                  styles.subscriptionText,
                  event.isSubscribed === 1
                    ? { color: getThemeColor() }
                    : styles.subscriptionTextFilled,
                ]}
              >
                {event.isSubscribed === 1 ? "Unsubscribe" : "Subscribe"}
              </Text>
            </TouchableOpacity>
            {event.promoterName && (
              <TouchableOpacity
                style={[
                  styles.venueButton,
                  styles.roundedFull,
                  { borderColor: getThemeColor() },
                ]}
                onPress={() =>
                  event.promoterId &&
                  router.push(`/promoter/${event.promoterId}`)
                }
              >
                <Globe size={20} color={getThemeColor()} />
              </TouchableOpacity>
            )}
          </View>

          <View
            style={[
              styles.quickLinksSection,
              { borderColor: getThemeColor() + "30" },
            ]}
          >
            <View style={styles.quickLinksHeader}>
              <View style={styles.quickLinksTitleContainer}>
                <Link2 size={20} color={getThemeColor()} />
                <Text style={styles.quickLinksTitle}>Quick Links</Text>
              </View>
            </View>
            <View
              style={[
                styles.quickLinksDivider,
                { backgroundColor: getThemeColor() + "20" },
              ]}
            />
            <View style={styles.quickLinksButtons}>
              {quickLinks.length > 0 ? (
                quickLinks.map((quickLink, index) => {
                  const QuickLinkIcon = getQuickLinkIcon(quickLink.type);
                  return (
                    <View
                      key={`${quickLink.id || quickLink.type}-${quickLink.icon}-${index}`}
                      style={styles.quickLinkWrapper}
                    >
                      <TouchableOpacity
                        style={[
                          styles.quickLinkButton,
                          { backgroundColor: getThemeColor() + "15" },
                          !quickLink.link && styles.quickLinkButtonDisabled,
                        ]}
                        onPress={() => {
                          if (quickLink.link) {
                            Linking.openURL(quickLink.link);
                          }
                        }}
                        disabled={!quickLink.link}
                      >
                        <View
                          style={[
                            styles.quickLinkIconContainer,
                            { backgroundColor: getThemeColor() },
                          ]}
                        >
                          <QuickLinkIcon size={24} color="#fff" />
                        </View>
                        <Text style={styles.quickLinkText} numberOfLines={2}>
                          {quickLink.type}
                        </Text>
                        <ExternalLink
                          size={14}
                          color="rgba(255,255,255,0.5)"
                          style={styles.quickLinkArrow}
                        />
                      </TouchableOpacity>
                      {isAdmin &&
                        canAccessEvent(event.promoterId) &&
                        String(quickLink.deleteable) === "1" && (
                          <TouchableOpacity
                            onPress={() => {
                              if (quickLink.id && quickLink.id !== "0") {
                                handleDeleteQuickLink(quickLink.id);
                              }
                            }}
                            style={styles.deleteLinkButton}
                          >
                            <Trash2 size={12} color="#fff" />
                          </TouchableOpacity>
                        )}
                    </View>
                  );
                })
              ) : (
                // Show empty state
                <View style={styles.quickLinksEmpty}>
                  <Link2 size={32} color="#737373" />
                  <Text style={styles.quickLinksEmptyText}>
                    No quick links available
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Add Quick Link Modal */}
          <Modal
            visible={showAddLinkModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowAddLinkModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Quick Link</Text>
                  <TouchableOpacity onPress={() => setShowAddLinkModal(false)}>
                    <X size={24} color="#fafafa" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  {/* Icon Preview */}
                  {newLinkLabel.trim() && (
                    <View style={styles.iconPreviewContainer}>
                      <View
                        style={[
                          styles.iconPreviewCircle,
                          { backgroundColor: getThemeColor() },
                        ]}
                      >
                        {(() => {
                          const PreviewIcon = getQuickLinkIcon(newLinkLabel);
                          return <PreviewIcon size={28} color="#fff" />;
                        })()}
                      </View>
                      <Text style={styles.iconPreviewText}>Icon Preview</Text>
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Label</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Tickets, Schedule, Results"
                      placeholderTextColor="#737373"
                      value={newLinkLabel}
                      onChangeText={setNewLinkLabel}
                      autoCapitalize="words"
                    />
                    <Text style={styles.inputHint}>
                      Icon is auto-selected based on label
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>URL</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="https://example.com"
                      placeholderTextColor="#737373"
                      value={newLinkUrl}
                      onChangeText={setNewLinkUrl}
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setShowAddLinkModal(false)}
                  >
                    <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      { backgroundColor: getThemeColor() },
                      (!newLinkLabel.trim() ||
                        !newLinkUrl.trim() ||
                        isAddingLink) &&
                        styles.modalButtonDisabled,
                    ]}
                    onPress={handleAddQuickLink}
                    disabled={
                      !newLinkLabel.trim() || !newLinkUrl.trim() || isAddingLink
                    }
                  >
                    {isAddingLink ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.modalButtonTextSave}>Add Link</Text>
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
                <Megaphone size={20} color={getThemeColor()} />
                <Text style={styles.sectionCardTitle}>Recent Alerts</Text>
              </View>
            </View>
            <View
              style={[
                styles.sectionCardDivider,
                { backgroundColor: getThemeColor() + "20" },
              ]}
            />
            <View style={styles.sectionCardContent}>
              {eventAlerts.length > 0 ? (
                <>
                  <FullScreenImageModal
                    visible={!!fullScreenAlertImageUri}
                    imageUri={fullScreenAlertImageUri}
                    onClose={() => setFullScreenAlertImageUri(null)}
                  />
                  {eventAlerts
                  .sort((a: any, b: any) => {
                    // Sort by PushedDate (most recent first)
                    const dateA = new Date(a.PushedDate || 0).getTime();
                    const dateB = new Date(b.PushedDate || 0).getTime();
                    return dateB - dateA;
                  })
                  .slice(0, showAllAlerts ? eventAlerts.length : 5)
                  .map((alert: any, index: number) => {
                    // Map icon number to actual icon component using centralized function
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
                      alert.NotificationID || alert.id || `event-alert-${index}`;
                    const alertImageUrl =
                      alert.image ||
                      alert.notification_image ||
                      alert.image_url ||
                      null;
                    const hasImage = !!alertImageUrl;
                    const isExpanded = expandedEventAlertId === alertId;

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
                              setExpandedEventAlertId(isExpanded ? null : alertId)
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
              {eventAlerts.length > 5 && (
                <TouchableOpacity
                  style={[
                    styles.seeMoreButton,
                    { borderColor: getThemeColor() + "30" },
                  ]}
                  onPress={() => setShowAllAlerts(!showAllAlerts)}
                >
                  <Text
                    style={[styles.seeMoreText, { color: getThemeColor() }]}
                  >
                    {showAllAlerts
                      ? "Show Less"
                      : `See More (${eventAlerts.length - 5} more)`}
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
                    {alertNotificationImage?.uri ? (
                      <Image
                        source={{ uri: alertNotificationImage.uri }}
                        style={styles.alertImagePreview}
                        resizeMode="cover"
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
                    setShowAddLinkModal(true);
                  }}
                >
                  <View
                    style={[
                      styles.actionMenuIcon,
                      { backgroundColor: getThemeColor() },
                    ]}
                  >
                    <Link2 size={20} color="#fff" />
                  </View>
                  <View style={styles.actionMenuTextContainer}>
                    <Text style={styles.actionMenuItemTitle}>
                      Add Quick Link
                    </Text>
                    <Text style={styles.actionMenuItemSubtitle}>
                      Add a new link to quick access
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#737373" />
                </TouchableOpacity>
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

          <View
            style={[
              styles.sectionCard,
              { borderColor: getThemeColor() + "30" },
            ]}
          >
            <View style={styles.sectionCardHeader}>
              <View style={styles.sectionCardTitleContainer}>
                <Info size={20} color={getThemeColor()} />
                <Text style={styles.sectionCardTitle}>Event Information</Text>
              </View>
            </View>
            <View
              style={[
                styles.sectionCardDivider,
                { backgroundColor: getThemeColor() + "20" },
              ]}
            />
            <View style={styles.sectionCardContent}>
              {event.address ||
              (event.latitude && event.longitude) ||
              event.phone ||
              event.email ? (
                <>
                  {event.address && (
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
                          {event.address}
                        </Text>
                      </View>
                    </View>
                  )}

                  {event.latitude && event.longitude && (
                    <TouchableOpacity
                      style={[
                        styles.infoCard,
                        { backgroundColor: getThemeColor() + "10" },
                      ]}
                      onPress={() => {
                        const url = `https://maps.google.com/?q=${event.latitude},${event.longitude}`;
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

                  {event.phone && (
                    <TouchableOpacity
                      style={[
                        styles.infoCard,
                        { backgroundColor: getThemeColor() + "10" },
                      ]}
                      onPress={() => Linking.openURL(`tel:${event.phone}`)}
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
                          {event.phone}
                        </Text>
                      </View>
                      <ChevronRight size={20} color={getThemeColor()} />
                    </TouchableOpacity>
                  )}

                  {event.email && (
                    <TouchableOpacity
                      style={[
                        styles.infoCard,
                        { backgroundColor: getThemeColor() + "10" },
                      ]}
                      onPress={() => Linking.openURL(`mailto:${event.email}`)}
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
                          {event.email}
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
                    No event information available
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
  headerButton: {
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
  // Admin Action Menu Styles
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
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
    padding: 18,
    alignItems: "center",
  },
  actionMenuCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
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
  dateText: {
    fontSize: 14,
    color: "#9ca3af",
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
  venueButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLinksSection: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  quickLinksHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  quickLinksTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quickLinksTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fafafa",
  },
  quickLinksDivider: {
    height: 1,
    marginBottom: 16,
  },
  quickLinksButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
  },
  quickLinkButton: {
    width: "95%",
    borderRadius: 14,
    padding: 14,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    minHeight: 130,
  },
  quickLinkButtonDisabled: {
    opacity: 0.4,
  },
  quickLinkIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  quickLinkIconText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  quickLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  quickLinkArrow: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  quickLinksEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
  },
  quickLinksEmptyText: {
    fontSize: 14,
    color: "#737373",
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
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
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
  textArea: {
    minHeight: 100,
    paddingTop: 12,
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
  quickLinkWrapper: {
    position: "relative",
    width: "48%",
    marginBottom: 0,
  },
  deleteLinkButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#dc2626",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  deleteLinkButtonDisabled: {
    opacity: 0.35,
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
  inputHint: {
    fontSize: 12,
    color: "#737373",
    marginTop: 6,
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
  iconPreviewContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: "#0a0a0a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  iconPreviewCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  iconPreviewText: {
    fontSize: 12,
    color: "#737373",
    fontWeight: "500",
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
});
