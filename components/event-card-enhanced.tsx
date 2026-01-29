import { Bell, Calendar, ChevronRight, MapPin } from "lucide-react-native";
import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { AnimatedCard } from "./ui/animated-card";
import { BlurViewWrapper } from "./ui/blur-view-wrapper";
import { EventCardSkeleton } from "./ui/skeleton-loader";

interface EventCardEnhancedProps {
  id: string;
  name: string;
  image?: string;
  coverImage?: string;
  date: string;
  location: string;
  logo?: string;
  venuelogo?: string;
  isSubscribed?: number; // 0 or 1
  onPress?: () => void;
  isLoading?: boolean;
  delay?: number;
}

export const EventCardEnhanced = ({
  id,
  name,
  image,
  coverImage,
  date,
  location,
  logo,
  venuelogo,
  isSubscribed = 0,
  onPress,
  isLoading = false,
  delay = 0,
}: EventCardEnhancedProps) => {
  const [imageLoading, setImageLoading] = useState(true);
  const eventLogo = logo || venuelogo || "";
  const eventImage = coverImage || image || "";

  // Normalize isSubscribed to handle string "1", number 1, or boolean true
  const isEventSubscribed =
    isSubscribed === 1 || isSubscribed === "1" || isSubscribed === true;

  if (isLoading) {
    return <EventCardSkeleton colorMode="light" />;
  }

  return (
    <AnimatedCard
      style={styles.card}
      onPress={onPress}
      animationType="lift"
      hapticFeedback={true}
      delay={delay}
    >
      {eventImage ? (
        <>
          {imageLoading && (
            <View style={styles.imagePlaceholder}>
              <EventCardSkeleton colorMode="light" />
            </View>
          )}
          <Image
            source={{ uri: eventImage }}
            style={styles.backgroundImage}
            onLoadEnd={() => setImageLoading(false)}
          />
        </>
      ) : (
        <View style={styles.gradientBackground} />
      )}

      {/* Blur overlay with glassmorphism effect */}
      <View style={styles.overlay} />

      {isEventSubscribed && (
        <BlurViewWrapper
          intensity={40}
          tint="dark"
          style={styles.subscribedBadge}
        >
          <Bell size={16} color="#22c55e" fill="#22c55e" />
        </BlurViewWrapper>
      )}

      <BlurViewWrapper intensity={30} tint="dark" style={styles.content}>
        {eventLogo ? (
          <View style={[styles.logoContainer, { marginRight: 16 }]}>
            <Image
              source={{ uri: eventLogo }}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>
        ) : null}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.locationRow}>
            <Calendar
              size={14}
              color="rgba(255, 255, 255, 0.9)"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.location} numberOfLines={1}>
              {date}
            </Text>
          </View>
          {location && (
            <View style={styles.locationRow}>
              <MapPin
                size={14}
                color="rgba(255, 255, 255, 0.9)"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.location} numberOfLines={1}>
                {location}
              </Text>
            </View>
          )}
        </View>

        <ChevronRight size={20} color="rgba(255, 255, 255, 0.8)" />
      </BlurViewWrapper>
    </AnimatedCard>
  );
};

const styles = StyleSheet.create({
  card: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#111827",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  gradientBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#18181b",
  },
  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  content: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    flex: 1,
  },
  subscribedBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
});
