import { Bell, ChevronRight, MapPin } from "lucide-react-native";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "./ui/animated-pressable";

interface PromoterCardProps {
  id: string;
  name: string;
  logo: string;
  eventCount?: number;
  isSubscribed?: number; // 0 or 1
  address?: string;
  distance?: string;
  coverImage?: string;
  onPress?: () => void;
  isAdminOwned?: boolean;
}

export const PromoterCard = ({
  id,
  name,
  logo,
  eventCount,
  isSubscribed = 0,
  address,
  distance,
  coverImage,
  onPress,
  isAdminOwned = false,
}: PromoterCardProps) => {
  // Normalize isSubscribed to handle string "1", number 1, or boolean true
  const isPromoterSubscribed =
    isSubscribed === 1 || isSubscribed === "1" || isSubscribed === true;

  return (
    <AnimatedPressable
      style={[styles.card, isAdminOwned && styles.adminOwnedCard]}
      onPress={onPress}
      animationType="lift"
      hapticStyle="medium"
    >
      {coverImage ? (
        <Image source={{ uri: coverImage }} style={styles.backgroundImage} />
      ) : (
        <View style={styles.gradientBackground} />
      )}
      <View style={styles.overlay} />

      {isPromoterSubscribed && (
        <View style={styles.subscribedBadge}>
          <Bell size={16} color="#fff" fill="#fff" />
        </View>
      )}

      <View style={styles.content}>
        <View style={[styles.logoContainer, { marginRight: 16 }]}>
          <Image
            source={{ uri: logo }}
            style={styles.logo}
            resizeMode="cover"
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.locationRow}>
            <MapPin
              size={14}
              color="rgba(255, 255, 255, 0.7)"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.location} numberOfLines={1}>
              {distance || address}
            </Text>
          </View>
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
  adminOwnedCard: {
    borderWidth: 2,
    borderColor: "#22c55e",
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
    zIndex: 1,
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
    marginRight: 8,
    flexShrink: 1,
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
  },
  location: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    flex: 1,
  },
  subscribedBadge: {
    position: "absolute",
    top: 25,
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
