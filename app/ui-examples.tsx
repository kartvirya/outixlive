import { Bell } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { EventCardEnhanced } from "../components/event-card-enhanced";
import { NotificationDeepLinkTest } from "../components/notification-deep-link-test";
import {
    AnimatedCard,
    FadeInView,
    SlideInView,
} from "../components/ui/animated-card";
import { BlurViewWrapper, GlassCard } from "../components/ui/blur-view-wrapper";
import {
    EventCardSkeleton,
    ListItemSkeleton,
    PromoterCardSkeleton,
} from "../components/ui/skeleton-loader";

/**
 * UI Enhancement Examples
 *
 * This file demonstrates how to use the new UI components:
 * 1. Bottom Sheets for modals
 * 2. Skeleton loaders for loading states
 * 3. Enhanced animations with Moti
 * 4. Blur effects for glassmorphism
 */

export default function UIExamplesScreen() {
  const [isLoading] = useState(false);

  // Mock event data
  const events = [
    {
      id: "1",
      name: "Summer Music Festival",
      date: "July 15, 2026",
      location: "Central Park",
      image: "https://picsum.photos/400/300",
      logo: "https://picsum.photos/100/100",
      isSubscribed: 1,
    },
    {
      id: "2",
      name: "Tech Conference 2026",
      date: "Aug 20, 2026",
      location: "Convention Center",
      image: "https://picsum.photos/400/301",
      logo: "https://picsum.photos/100/101",
      isSubscribed: 0,
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with blur effect */}
      <FadeInView delay={0}>
        <BlurViewWrapper intensity={80} tint="light" style={styles.header}>
          <Text style={styles.headerTitle}>UI Enhancements</Text>
          <Text style={styles.headerSubtitle}>
            New components with animations, blur, and skeletons
          </Text>
        </BlurViewWrapper>
      </FadeInView>

      {/* Section 1: Enhanced Event Cards with Animations */}
      <SlideInView direction="bottom" delay={100}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enhanced Event Cards</Text>
          <Text style={styles.sectionDescription}>
            Cards with blur effects, animations, and skeleton loading
          </Text>

          {isLoading ? (
            <>
              <EventCardSkeleton colorMode="light" />
              <EventCardSkeleton colorMode="light" />
            </>
          ) : (
            events.map((event, index) => (
              <EventCardEnhanced
                key={event.id}
                {...event}
                delay={index * 100}
                onPress={() => console.log("Event pressed:", event.id)}
              />
            ))
          )}
        </View>
      </SlideInView>

      {/* Section 2: Glassmorphism Cards */}
      <SlideInView direction="bottom" delay={200}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Glassmorphism Cards</Text>
          <Text style={styles.sectionDescription}>
            Cards with blur and transparency effects
          </Text>

          <GlassCard intensity={30} tint="light" style={styles.glassExample}>
            <View style={styles.glassContent}>
              <Bell size={32} color="#000" />
              <Text style={styles.glassTitle}>Notifications</Text>
              <Text style={styles.glassDescription}>
                You have 3 new notifications
              </Text>
            </View>
          </GlassCard>

          <GlassCard intensity={40} tint="dark" style={styles.glassExample}>
            <View style={styles.glassContent}>
              <Text style={styles.glassTitle}>Dark Mode</Text>
              <Text style={styles.glassDescription}>
                Glassmorphism with dark tint
              </Text>
            </View>
          </GlassCard>
        </View>
      </SlideInView>

      {/* Section 3: Animated Cards */}
      <SlideInView direction="bottom" delay={300}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Animation Types</Text>
          <Text style={styles.sectionDescription}>
            Different animation styles on press
          </Text>

          <AnimatedCard
            animationType="scale"
            onPress={() => console.log("Scale animation")}
            style={styles.animatedCard}
          >
            <Text style={styles.animatedCardText}>Scale Animation</Text>
          </AnimatedCard>

          <AnimatedCard
            animationType="lift"
            onPress={() => console.log("Lift animation")}
            style={styles.animatedCard}
          >
            <Text style={styles.animatedCardText}>Lift Animation</Text>
          </AnimatedCard>

          <AnimatedCard
            animationType="spring"
            onPress={() => console.log("Spring animation")}
            style={styles.animatedCard}
          >
            <Text style={styles.animatedCardText}>Spring Animation</Text>
          </AnimatedCard>

          <AnimatedCard
            animationType="slide"
            onPress={() => console.log("Slide animation")}
            style={styles.animatedCard}
          >
            <Text style={styles.animatedCardText}>Slide Animation</Text>
          </AnimatedCard>
        </View>
      </SlideInView>

      {/* Section 3.5: Notification Deep Link Test */}
      <SlideInView direction="bottom" delay={350}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Deep Link Test</Text>
          <Text style={styles.sectionDescription}>
            Test notification tapping and deep linking
          </Text>
          <NotificationDeepLinkTest />
        </View>
      </SlideInView>

      {/* Section 4: Skeleton Loaders */}
      <SlideInView direction="bottom" delay={400}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skeleton Loaders</Text>
          <Text style={styles.sectionDescription}>
            Loading states for different components
          </Text>

          <View style={styles.skeletonExample}>
            <Text style={styles.skeletonLabel}>Event Card Skeleton:</Text>
            <EventCardSkeleton colorMode="light" />
          </View>

          <View style={styles.skeletonExample}>
            <Text style={styles.skeletonLabel}>Promoter Card Skeleton:</Text>
            <PromoterCardSkeleton colorMode="light" />
          </View>

          <View style={styles.skeletonExample}>
            <Text style={styles.skeletonLabel}>List Item Skeleton:</Text>
            <ListItemSkeleton colorMode="light" />
            <ListItemSkeleton colorMode="light" />
          </View>
        </View>
      </SlideInView>

      {/* Section 5: Usage Guide */}
      <FadeInView delay={500}>
        <View style={[styles.section, styles.guideSection]}>
          <Text style={styles.sectionTitle}>How to Use</Text>

          <View style={styles.guideItem}>
            <Text style={styles.guideNumber}>1</Text>
            <View style={styles.guideContent}>
              <Text style={styles.guideTitle}>Bottom Sheets</Text>
              <Text style={styles.guideText}>
                Import LoginBottomSheet or EventDetailsBottomSheet for modal
                replacements
              </Text>
            </View>
          </View>

          <View style={styles.guideItem}>
            <Text style={styles.guideNumber}>2</Text>
            <View style={styles.guideContent}>
              <Text style={styles.guideTitle}>Skeleton Loaders</Text>
              <Text style={styles.guideText}>
                Use EventCardSkeleton during data fetching
              </Text>
            </View>
          </View>

          <View style={styles.guideItem}>
            <Text style={styles.guideNumber}>3</Text>
            <View style={styles.guideContent}>
              <Text style={styles.guideTitle}>Enhanced Animations</Text>
              <Text style={styles.guideText}>
                Replace EventCard with EventCardEnhanced for better UX
              </Text>
            </View>
          </View>

          <View style={styles.guideItem}>
            <Text style={styles.guideNumber}>4</Text>
            <View style={styles.guideContent}>
              <Text style={styles.guideTitle}>Blur Effects</Text>
              <Text style={styles.guideText}>
                Use GlassCard for modern glassmorphism effects
              </Text>
            </View>
          </View>
        </View>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 24,
    paddingTop: 60,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#737373",
  },
  section: {
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#737373",
    marginBottom: 16,
  },
  glassExample: {
    marginBottom: 16,
  },
  glassContent: {
    alignItems: "center",
    padding: 24,
  },
  glassTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginTop: 12,
    marginBottom: 4,
  },
  glassDescription: {
    fontSize: 14,
    color: "#404040",
    textAlign: "center",
  },
  animatedCard: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  animatedCardText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },
  skeletonExample: {
    marginBottom: 24,
  },
  skeletonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#404040",
    marginBottom: 12,
  },
  guideSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 40,
  },
  guideItem: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  guideNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#000",
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 32,
    marginRight: 12,
  },
  guideContent: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  guideText: {
    fontSize: 14,
    color: "#737373",
    lineHeight: 20,
  },
});
