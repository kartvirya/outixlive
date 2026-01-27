import { BuybackOffer, useBuyback } from "@/contexts/BuybackContext";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "expo-router";
import { AlertTriangle, X } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "./ui/animated-pressable";
import { Button } from "./ui/button";

interface BuybackAlertItemProps {
  offer: BuybackOffer;
}

export const BuybackAlertItem = ({ offer }: BuybackAlertItemProps) => {
  const { acceptOffer, declineOffer, savedCards, setShowPaymentPrompt } =
    useBuyback();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const isExpired = new Date() > offer.expiresAt;

  const handleAccept = async () => {
    if (!isAuthenticated) {
      router.push("/(tabs)/profile");
      return;
    }

    if (savedCards.length === 0) {
      setShowPaymentPrompt(true);
      return;
    }

    setIsProcessing(true);
    await acceptOffer(offer.id);
    setIsProcessing(false);
  };

  const handleDecline = () => {
    declineOffer(offer.id);
  };

  if (offer.status !== "pending") {
    return null;
  }

  return (
    <View style={[styles.container, isExpired && styles.containerExpired]}>
      <AnimatedPressable
        onPress={handleDecline}
        style={styles.closeButton}
        animationType="scale"
        scaleValue={0.8}
      >
        <X size={16} color="#737373" />
      </AnimatedPressable>

      <View style={styles.content}>
        <View style={styles.header}>
          <AlertTriangle
            size={20}
            color={isExpired ? "#737373" : "#f59e0b"}
            style={{ marginRight: 8 }}
          />
          <View style={[styles.badge, isExpired && styles.badgeExpired]}>
            <Text
              style={[styles.badgeText, isExpired && styles.badgeTextExpired]}
            >
              {isExpired ? "EXPIRED" : "Buyback Offer"}
            </Text>
          </View>
        </View>

        <Text style={[styles.title, isExpired && styles.titleExpired]}>
          Unlucky! 😔
        </Text>
        <Text style={[styles.message, isExpired && styles.messageExpired]}>
          You've been eliminated in {offer.eliminationRound}. Would you like to
          buy back for{" "}
          <Text style={styles.price}>${offer.buybackPrice.toFixed(2)}</Text>?
        </Text>

        {!isExpired && (
          <View style={styles.actions}>
            <Button
              variant="outline"
              onPress={handleDecline}
              disabled={isProcessing}
              style={styles.declineButton}
            >
              No Thanks
            </Button>
            <Button
              onPress={handleAccept}
              disabled={isProcessing}
              loading={isProcessing}
              style={styles.acceptButton}
            >
              Buy Back
            </Button>
          </View>
        )}

        {isExpired && (
          <Text style={styles.expiredText}>
            This offer has expired. The next round has already started.
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    marginBottom: 12,
    padding: 16,
  },
  containerExpired: {
    backgroundColor: "rgba(115, 115, 115, 0.15)",
    borderColor: "rgba(115, 115, 115, 0.3)",
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
    zIndex: 1,
  },
  content: {
    paddingRight: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
  },
  badgeExpired: {
    backgroundColor: "rgba(115, 115, 115, 0.2)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f59e0b",
  },
  badgeTextExpired: {
    color: "#737373",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  titleExpired: {
    color: "#737373",
  },
  message: {
    fontSize: 14,
    color: "#d1d5db",
    marginBottom: 12,
  },
  messageExpired: {
    color: "#737373",
  },
  price: {
    fontWeight: "bold",
    color: "#fff",
  },
  actions: {
    flexDirection: "row",
  },
  declineButton: {
    flex: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginRight: 4,
  },
  acceptButton: {
    flex: 1,
    marginLeft: 4,
  },
  expiredText: {
    fontSize: 12,
    color: "#737373",
    textAlign: "center",
    marginTop: 8,
  },
});
