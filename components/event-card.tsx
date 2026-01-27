import { Bell, Calendar, ChevronRight, MapPin } from "lucide-react-native";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "./ui/animated-pressable";

interface EventCardProps {
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
}

export const EventCard = ({
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
}: EventCardProps) => {
  const eventLogo = logo || venuelogo || "";
  const eventImage = coverImage || image || "";

  // Normalize isSubscribed to handle string "1", number 1, or boolean true
  const isEventSubscribed =
    isSubscribed === 1 || isSubscribed === "1" || isSubscribed === true;

  return (
    <AnimatedPressable
      style={styles.card}
      onPress={onPress}
      animationType="lift"
      hapticStyle="medium"
    >
      {eventImage ? (
        <Image source={{ uri: eventImage }} style={styles.backgroundImage} />
      ) : (
        <View style={styles.gradientBackground} />
      )}
      <View style={styles.overlay} />

      {isEventSubscribed && (
        <View style={styles.subscribedBadge}>
          <Bell size={16} color="#fff" fill="#fff" />
        </View>
      )}

      <View style={styles.content}>
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
              color="rgba(255, 255, 255, 0.7)"
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
                color="rgba(255, 255, 255, 0.7)"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.location} numberOfLines={1}>
                {location}
              </Text>
            </View>
          )}
        </View>

        <ChevronRight size={20} color="rgba(255, 255, 255, 0.5)" />
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#111827",
  },
  backgroundImage: {
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  content: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
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
    color: "rgba(255, 255, 255, 0.7)",
    flex: 1,
  },
  subscribedBadge: {
    position: "absolute",
    top: 30,
    right: 50,
    borderRadius: 20,
    backgroundColor: "#22c55e",
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
});
