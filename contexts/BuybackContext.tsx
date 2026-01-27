import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

export interface BuybackOffer {
  id: string;
  raceId: string;
  raceName: string;
  driverName: string;
  eliminationRound: string;
  buybackPrice: number;
  expiresAt: Date;
  status: "pending" | "accepted" | "declined" | "expired";
  createdAt: Date;
}

export interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

interface SuccessInfo {
  raceName: string;
  amount: number;
  cardLast4: string;
}

interface BuybackContextType {
  offers: BuybackOffer[];
  savedCards: SavedCard[];
  pendingOffer: BuybackOffer | null;
  showPaymentPrompt: boolean;
  showSuccessModal: boolean;
  successInfo: SuccessInfo | null;
  addOffer: (offer: Omit<BuybackOffer, "id" | "status" | "createdAt">) => void;
  acceptOffer: (
    offerId: string,
  ) => Promise<{ success: boolean; message: string }>;
  declineOffer: (offerId: string) => void;
  undeclineOffer: (offerId: string) => void;
  addCard: (card: Omit<SavedCard, "id" | "isDefault">) => void;
  removeCard: (cardId: string) => void;
  setShowPaymentPrompt: (show: boolean) => void;
  setShowSuccessModal: (show: boolean) => void;
  simulateEliminationLoss: () => void;
  simulateWithSavedCard: () => void;
}

const BuybackContext = createContext<BuybackContextType | undefined>(undefined);

export const useBuyback = () => {
  const context = useContext(BuybackContext);
  if (!context) {
    throw new Error("useBuyback must be used within BuybackProvider");
  }
  return context;
};

const CARDS_STORAGE_KEY = "outix_saved_cards";

export const BuybackProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [offers, setOffers] = useState<BuybackOffer[]>([]);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [pendingOffer, setPendingOffer] = useState<BuybackOffer | null>(null);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);

  // Load cards from AsyncStorage on mount
  useEffect(() => {
    const loadCards = async () => {
      try {
        const saved = await AsyncStorage.getItem(CARDS_STORAGE_KEY);
        if (saved) {
          const cards = JSON.parse(saved);
          setSavedCards(cards);
        }
      } catch (error) {
        console.error("Failed to load saved cards:", error);
      }
    };
    loadCards();
  }, []);

  // Save cards to AsyncStorage
  useEffect(() => {
    const saveCards = async () => {
      try {
        await AsyncStorage.setItem(
          CARDS_STORAGE_KEY,
          JSON.stringify(savedCards),
        );
      } catch (error) {
        console.error("Failed to save cards:", error);
      }
    };
    if (savedCards.length > 0) {
      saveCards();
    }
  }, [savedCards]);

  const addOffer = useCallback(
    (offerData: Omit<BuybackOffer, "id" | "status" | "createdAt">) => {
      const newOffer: BuybackOffer = {
        ...offerData,
        id: Date.now().toString(),
        status: "pending",
        createdAt: new Date(),
      };
      setOffers((prev) => [...prev, newOffer]);
      setPendingOffer(newOffer);
    },
    [],
  );

  const acceptOffer = useCallback(
    async (offerId: string): Promise<{ success: boolean; message: string }> => {
      const offer = offers.find((o) => o.id === offerId);
      if (!offer) {
        return { success: false, message: "Offer not found" };
      }

      if (offer.status === "expired") {
        return {
          success: false,
          message:
            "This offer has expired. The next round has already started.",
        };
      }

      if (savedCards.length === 0) {
        setShowPaymentPrompt(true);
        return { success: false, message: "No payment method on file" };
      }

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const defaultCard = savedCards.find((c) => c.isDefault) || savedCards[0];

      setOffers((prev) =>
        prev.map((o) => (o.id === offerId ? { ...o, status: "accepted" } : o)),
      );
      setPendingOffer(null);

      // Show success modal
      setSuccessInfo({
        raceName: offer.raceName,
        amount: offer.buybackPrice,
        cardLast4: defaultCard.last4,
      });
      setShowSuccessModal(true);

      return {
        success: true,
        message: `Buyback confirmed! $${offer.buybackPrice.toFixed(2)} charged to card ending in ${defaultCard.last4}`,
      };
    },
    [offers, savedCards],
  );

  const declineOffer = useCallback((offerId: string) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: "declined" } : o)),
    );
    setPendingOffer(null);
  }, []);

  const undeclineOffer = useCallback((offerId: string) => {
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId && o.status === "declined"
          ? { ...o, status: "pending" }
          : o,
      ),
    );
  }, []);

  const addCard = useCallback(
    (cardData: Omit<SavedCard, "id" | "isDefault">) => {
      const newCard: SavedCard = {
        ...cardData,
        id: Date.now().toString(),
        isDefault: savedCards.length === 0,
      };
      setSavedCards((prev) => [...prev, newCard]);
    },
    [savedCards.length],
  );

  const removeCard = useCallback((cardId: string) => {
    setSavedCards((prev) => {
      const remaining = prev.filter((c) => c.id !== cardId);
      if (remaining.length > 0 && !remaining.some((c) => c.isDefault)) {
        remaining[0].isDefault = true;
      }
      return remaining;
    });
  }, []);

  const simulateEliminationLoss = useCallback(() => {
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    addOffer({
      raceId: "race-" + Date.now(),
      raceName: "Hangover Nationals - E1",
      driverName: "Blake Mitchell",
      eliminationRound: "Round 1",
      buybackPrice: 50,
      expiresAt,
    });
  }, [addOffer]);

  const simulateWithSavedCard = useCallback(() => {
    if (savedCards.length === 0) {
      const mockCard: SavedCard = {
        id: "mock-card-1",
        last4: "4242",
        brand: "Visa",
        expiryMonth: 12,
        expiryYear: 2027,
        isDefault: true,
      };
      setSavedCards([mockCard]);
    }

    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    addOffer({
      raceId: "race-" + Date.now(),
      raceName: "Hangover Nationals - E1",
      driverName: "Blake Mitchell",
      eliminationRound: "Round 1",
      buybackPrice: 50,
      expiresAt,
    });
  }, [addOffer, savedCards.length]);

  const contextValue = useMemo(
    () => ({
      offers,
      savedCards,
      pendingOffer,
      showPaymentPrompt,
      showSuccessModal,
      successInfo,
      addOffer,
      acceptOffer,
      declineOffer,
      undeclineOffer,
      addCard,
      removeCard,
      setShowPaymentPrompt,
      setShowSuccessModal,
      simulateEliminationLoss,
      simulateWithSavedCard,
    }),
    [
      offers,
      savedCards,
      pendingOffer,
      showPaymentPrompt,
      showSuccessModal,
      successInfo,
      addOffer,
      acceptOffer,
      declineOffer,
      undeclineOffer,
      addCard,
      removeCard,
      simulateEliminationLoss,
      simulateWithSavedCard,
    ],
  );

  return (
    <BuybackContext.Provider value={contextValue}>
      {children}
    </BuybackContext.Provider>
  );
};
