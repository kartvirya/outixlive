import React, { useEffect } from "react";
import { Animated, StyleSheet, View } from "react-native";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  colorMode?: "light" | "dark";
}

export const SkeletonLoader = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  colorMode = "light",
}: SkeletonLoaderProps) => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const backgroundColor = colorMode === "light" ? "#E5E7EB" : "#374151";

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor,
        opacity,
      }}
    />
  );
};

// Event Card Skeleton
export const EventCardSkeleton = ({
  colorMode = "light",
}: {
  colorMode?: "light" | "dark";
}) => {
  return (
    <View style={styles.cardSkeleton}>
      {/* Image skeleton */}
      <SkeletonLoader
        width="100%"
        height={200}
        borderRadius={12}
        colorMode={colorMode}
      />

      <View style={styles.cardContent}>
        {/* Logo skeleton */}
        <View style={styles.logoRow}>
          <SkeletonLoader
            width={50}
            height={50}
            borderRadius={25}
            colorMode={colorMode}
          />
          <View style={styles.textContent}>
            {/* Title skeleton */}
            <SkeletonLoader
              width="80%"
              height={20}
              borderRadius={4}
              colorMode={colorMode}
            />
            {/* Subtitle skeleton */}
            <View style={{ marginTop: 8 }}>
              <SkeletonLoader
                width="60%"
                height={16}
                borderRadius={4}
                colorMode={colorMode}
              />
            </View>
          </View>
        </View>

        {/* Date and location skeletons */}
        <View style={styles.infoRow}>
          <SkeletonLoader
            width="45%"
            height={16}
            borderRadius={4}
            colorMode={colorMode}
          />
          <SkeletonLoader
            width="45%"
            height={16}
            borderRadius={4}
            colorMode={colorMode}
          />
        </View>
      </View>
    </View>
  );
};

// Promoter Card Skeleton
export const PromoterCardSkeleton = ({
  colorMode = "light",
}: {
  colorMode?: "light" | "dark";
}) => {
  return (
    <View style={styles.promoterSkeleton}>
      <SkeletonLoader
        width={80}
        height={80}
        borderRadius={40}
        colorMode={colorMode}
      />
      <View style={{ marginTop: 12, alignItems: "center" }}>
        <SkeletonLoader
          width={120}
          height={18}
          borderRadius={4}
          colorMode={colorMode}
        />
        <View style={{ marginTop: 6 }}>
          <SkeletonLoader
            width={90}
            height={14}
            borderRadius={4}
            colorMode={colorMode}
          />
        </View>
      </View>
    </View>
  );
};

// List Item Skeleton
export const ListItemSkeleton = ({
  colorMode = "light",
}: {
  colorMode?: "light" | "dark";
}) => {
  return (
    <View style={styles.listItem}>
      <SkeletonLoader
        width={60}
        height={60}
        borderRadius={12}
        colorMode={colorMode}
      />
      <View style={styles.listContent}>
        <SkeletonLoader
          width="70%"
          height={18}
          borderRadius={4}
          colorMode={colorMode}
        />
        <View style={{ marginTop: 8 }}>
          <SkeletonLoader
            width="50%"
            height={14}
            borderRadius={4}
            colorMode={colorMode}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardSkeleton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  textContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  promoterSkeleton: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 8,
    width: 150,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
  },
});
