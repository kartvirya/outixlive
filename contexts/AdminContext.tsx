import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

interface AdminContextType {
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
  toggleAdmin: () => void;
  canAccessPromoter: (promoterId?: string) => boolean;
  canAccessEvent: (eventPromoterId?: string) => boolean;
  userPromoterId: string | null;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = "adminLoggedIn";
const USER_STORAGE_KEY = "outix_user"; // Same key as useAuth

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userPromoterId, setUserPromoterId] = useState<string | null>(null);

  // Load admin state and user promoterId from AsyncStorage on mount and when user data changes
  useEffect(() => {
    const loadAdminState = async () => {
      try {
        const adminValue = await AsyncStorage.getItem(ADMIN_STORAGE_KEY);
        const userValue = await AsyncStorage.getItem(USER_STORAGE_KEY);

        // Extract promoterId from user data
        if (userValue) {
          try {
            const userData = JSON.parse(userValue);
            // Check multiple possible field names
            const promoterId =
              userData.PromoterId || // API uses this!
              userData.promoterId ||
              userData.promoter_id ||
              userData.PromoterID ||
              null;
            setUserPromoterId(promoterId);
          } catch (error) {
            console.log("[ADMIN] ⚠️ Failed to parse user data:", error);
            setUserPromoterId(null);
          }
        } else {
          // Only log once, not on every poll
          if (userPromoterId !== null) {
            console.log("[ADMIN] ⚠️ No user data in storage");
          }
          // Clear promoterId if no user data
          setUserPromoterId(null);
        }

        // If user is logged in, automatically grant admin access
        if (userValue && !adminValue) {
          console.log(
            "[ADMIN] 🔓 User is logged in, granting admin access automatically",
          );
          await AsyncStorage.setItem(ADMIN_STORAGE_KEY, "true");
          setIsAdmin(true);
        } else if (adminValue === "true") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        // Ignore storage errors
      }
    };

    // Load initially
    loadAdminState();

    // Poll for changes every 2 seconds to detect login/logout (reduced frequency for production)
    const interval = setInterval(loadAdminState, 2000);

    return () => clearInterval(interval);
  }, []);

  // Persist admin state to AsyncStorage when it changes
  useEffect(() => {
    const saveAdminState = async () => {
      try {
        if (isAdmin) {
          await AsyncStorage.setItem(ADMIN_STORAGE_KEY, "true");
        } else {
          await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);
        }
      } catch {
        // Ignore storage errors
      }
    };
    saveAdminState();
  }, [isAdmin]);

  const toggleAdmin = () => setIsAdmin((prev) => !prev);

  // Check if user can access a specific promoter
  const canAccessPromoter = (promoterId?: string) => {
    console.log("[ADMIN] 🔍 Checking promoter access:");
    console.log("[ADMIN]   - isAdmin:", isAdmin);
    console.log("[ADMIN]   - userPromoterId:", userPromoterId);
    console.log("[ADMIN]   - target promoterId:", promoterId);

    if (!isAdmin) {
      console.log("[ADMIN] ❌ Access denied: Not admin");
      return false;
    }
    if (!userPromoterId) {
      console.log("[ADMIN] ❌ Access denied: No user promoterId");
      return false;
    }
    if (!promoterId) {
      console.log("[ADMIN] ❌ Access denied: No target promoterId");
      return false;
    }

    // Normalize both IDs to strings and trim whitespace for comparison
    const normalizedUserPromoterId = String(userPromoterId).trim();
    const normalizedTargetPromoterId = String(promoterId).trim();

    console.log(
      "[ADMIN]   - Normalized userPromoterId:",
      normalizedUserPromoterId,
    );
    console.log(
      "[ADMIN]   - Normalized target promoterId:",
      normalizedTargetPromoterId,
    );

    const hasAccess = normalizedUserPromoterId === normalizedTargetPromoterId;
    console.log(
      "[ADMIN]",
      hasAccess ? "✅ Access granted" : "❌ Access denied: IDs do not match",
    );
    return hasAccess;
  };

  // Check if user can access an event (by checking event's promoterId)
  const canAccessEvent = (eventPromoterId?: string) => {
    console.log("[ADMIN] 🔍 Checking event access:");
    console.log("[ADMIN]   - isAdmin:", isAdmin);
    console.log("[ADMIN]   - userPromoterId:", userPromoterId);
    console.log("[ADMIN]   - event promoterId:", eventPromoterId);

    if (!isAdmin) {
      console.log("[ADMIN] ❌ Access denied: Not admin");
      return false;
    }
    if (!userPromoterId) {
      console.log("[ADMIN] ❌ Access denied: No user promoterId");
      return false;
    }
    if (!eventPromoterId) {
      console.log("[ADMIN] ❌ Access denied: No event promoterId");
      return false;
    }

    // Normalize both IDs to strings and trim whitespace for comparison
    const normalizedUserPromoterId = String(userPromoterId).trim();
    const normalizedEventPromoterId = String(eventPromoterId).trim();

    console.log(
      "[ADMIN]   - Normalized userPromoterId:",
      normalizedUserPromoterId,
    );
    console.log(
      "[ADMIN]   - Normalized event promoterId:",
      normalizedEventPromoterId,
    );

    const hasAccess = normalizedUserPromoterId === normalizedEventPromoterId;
    console.log(
      "[ADMIN]",
      hasAccess ? "✅ Access granted" : "❌ Access denied: IDs do not match",
    );
    return hasAccess;
  };

  const contextValue = useMemo(
    () => ({
      isAdmin,
      setIsAdmin,
      toggleAdmin,
      canAccessPromoter,
      canAccessEvent,
      userPromoterId,
    }),
    [isAdmin, userPromoterId],
  );

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};
