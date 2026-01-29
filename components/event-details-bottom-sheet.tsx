import BottomSheetLib from "@gorhom/bottom-sheet";
import { Bell, Calendar, DollarSign, MapPin, Users } from "lucide-react-native";
import React, { useCallback, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { FadeInView, SlideInView } from "./ui/animated-card";
import { GlassCard } from "./ui/blur-view-wrapper";
import { BottomSheet } from "./ui/bottom-sheet";
import { Button } from "./ui/button";

interface EventDetailsBottomSheetProps {
  event: {
    id: string;
    name: string;
    date: string;
    location: string;
    description: string;
    price?: string;
    capacity?: number;
    image?: string;
  };
  onSubscribe?: () => void;
  onBuyTicket?: () => void;
}

export const EventDetailsBottomSheet = ({
  event,
  onSubscribe,
  onBuyTicket,
}: EventDetailsBottomSheetProps) => {
  const bottomSheetRef = useRef<BottomSheetLib>(null);

  const handleOpen = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(2);
  }, []);

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  return (
    <>
      {/* Trigger - replace with your actual trigger */}
      <Button onPress={handleOpen}>View Details</Button>

      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={["25%", "50%", "90%"]}
        enablePanDownToClose={true}
        index={-1}
        enableBlur={true}
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <FadeInView delay={100}>
            <Text style={styles.title}>{event.name}</Text>
          </FadeInView>

          <View style={styles.infoSection}>
            <SlideInView direction="left" delay={200}>
              <GlassCard intensity={20} tint="light" style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Calendar size={20} color="#000" />
                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>Date</Text>
                    <Text style={styles.infoValue}>{event.date}</Text>
                  </View>
                </View>
              </GlassCard>
            </SlideInView>

            <SlideInView direction="right" delay={300}>
              <GlassCard intensity={20} tint="light" style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <MapPin size={20} color="#000" />
                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={styles.infoValue}>{event.location}</Text>
                  </View>
                </View>
              </GlassCard>
            </SlideInView>

            {event.price && (
              <SlideInView direction="left" delay={400}>
                <GlassCard intensity={20} tint="light" style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <DollarSign size={20} color="#000" />
                    <View style={styles.infoText}>
                      <Text style={styles.infoLabel}>Price</Text>
                      <Text style={styles.infoValue}>{event.price}</Text>
                    </View>
                  </View>
                </GlassCard>
              </SlideInView>
            )}

            {event.capacity && (
              <SlideInView direction="right" delay={500}>
                <GlassCard intensity={20} tint="light" style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Users size={20} color="#000" />
                    <View style={styles.infoText}>
                      <Text style={styles.infoLabel}>Capacity</Text>
                      <Text style={styles.infoValue}>
                        {event.capacity} people
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </SlideInView>
            )}
          </View>

          <FadeInView delay={600}>
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>About Event</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          </FadeInView>

          <FadeInView delay={700}>
            <View style={styles.actions}>
              {onSubscribe && (
                <Button
                  onPress={onSubscribe}
                  variant="outline"
                  style={styles.actionButton}
                >
                  <Bell size={18} color="#000" />
                  <Text style={styles.buttonText}>Subscribe</Text>
                </Button>
              )}
              {onBuyTicket && (
                <Button
                  onPress={onBuyTicket}
                  style={[styles.actionButton, styles.primaryButton]}
                >
                  <Text style={styles.primaryButtonText}>Buy Tickets</Text>
                </Button>
              )}
            </View>
          </FadeInView>
        </ScrollView>
      </BottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 24,
  },
  infoSection: {
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#737373",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#404040",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  primaryButton: {
    backgroundColor: "#000",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export const useEventDetailsBottomSheet = () => {
  const bottomSheetRef = useRef<BottomSheetLib>(null);

  const open = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(2);
  }, []);

  const close = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  return { bottomSheetRef, open, close };
};
