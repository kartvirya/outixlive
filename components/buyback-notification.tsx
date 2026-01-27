import { useBuyback } from "@/contexts/BuybackContext";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "expo-router";
import { AlertTriangle, CheckCircle, CreditCard, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button } from "./ui/button";

export const BuybackNotification = () => {
  const {
    pendingOffer,
    acceptOffer,
    declineOffer,
    savedCards,
    setShowPaymentPrompt,
  } = useBuyback();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // Update countdown timer
  useEffect(() => {
    if (!pendingOffer || pendingOffer.status !== "pending") return;

    const updateTimer = () => {
      const now = new Date();
      const diff = pendingOffer.expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Expired");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [pendingOffer]);

  const handleAccept = async () => {
    if (!pendingOffer) return;

    if (!isAuthenticated) {
      router.push("/(tabs)/profile");
      return;
    }

    if (savedCards.length === 0) {
      setShowPaymentPrompt(true);
      return;
    }

    setIsProcessing(true);
    const response = await acceptOffer(pendingOffer.id);
    setResult(response);
    setIsProcessing(false);

    if (response.success) {
      setTimeout(() => {
        setResult(null);
      }, 3000);
    }
  };

  const handleDecline = () => {
    if (!pendingOffer) return;
    declineOffer(pendingOffer.id);
    setResult(null);
  };

  const isExpired = pendingOffer ? new Date() > pendingOffer.expiresAt : false;

  if (!pendingOffer || pendingOffer.status !== "pending") {
    if (result?.success) {
      return (
        <View style={styles.successContainer}>
          <View style={styles.successContent}>
            <CheckCircle
              size={24}
              color="#10b981"
              style={{ marginRight: 12 }}
            />
            <Text style={styles.successText}>{result.message}</Text>
          </View>
        </View>
      );
    }
    return null;
  }

  return (
    <View style={[styles.container, isExpired && styles.containerExpired]}>
      <TouchableOpacity onPress={handleDecline} style={styles.closeButton}>
        <X size={16} color="#737373" />
      </TouchableOpacity>

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
              {isExpired ? "EXPIRED" : `Expires in ${timeRemaining}`}
            </Text>
          </View>
        </View>

        <Text style={[styles.title, isExpired && styles.titleExpired]}>
          Unlucky! 😔
        </Text>
        <Text style={[styles.message, isExpired && styles.messageExpired]}>
          You've been eliminated in {pendingOffer.eliminationRound}. Would you
          like to buy back for{" "}
          <Text style={styles.price}>
            ${pendingOffer.buybackPrice.toFixed(2)}
          </Text>
          ?
        </Text>

        {result && !result.success && (
          <View style={styles.errorMessage}>
            <CreditCard size={16} color="#f59e0b" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{result.message}</Text>
          </View>
        )}

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
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: "rgba(239, 68, 68, 0.95)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    padding: 16,
    zIndex: 1000,
  },
  containerExpired: {
    backgroundColor: "rgba(115, 115, 115, 0.95)",
    borderColor: "rgba(115, 115, 115, 0.3)",
  },
  successContainer: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  successContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.95)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  successText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
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
    color: "#fff",
    marginBottom: 12,
  },
  messageExpired: {
    color: "#737373",
  },
  price: {
    fontWeight: "bold",
  },
  errorMessage: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#f59e0b",
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
    backgroundColor: "#fff",
    marginLeft: 4,
  },
  expiredText: {
    fontSize: 12,
    color: "#737373",
    textAlign: "center",
  },
});
