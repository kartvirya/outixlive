import { BASE_URL } from "@/constants/config";
import { getDeviceToken } from "@/lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";
import { useCallback, useEffect, useState } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  promoterId?: string;
  PromoterId?: string; // API uses this field name
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const USER_STORAGE_KEY = "outix_user";
const TOKEN_STORAGE_KEY = "outix_token";
const REFRESH_TOKEN_STORAGE_KEY = "outix_refresh_token";

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    return { user: null, isAuthenticated: false, isLoading: true, error: null };
  });

  // Load user from storage on mount and register iOS native token
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Get iOS native APNs device token (same token used everywhere)
        try {
          const { getDeviceToken } = await import("@/lib/deviceToken");
          const deviceToken = await getDeviceToken();

          // Register token with server (works without auth)
          try {
            const { registerToken } = await import("@/lib/api");
            await registerToken(deviceToken);
          } catch (error) {
            // Don't block app initialization if token registration fails
          }
        } catch (error) {
          // Device token not available yet - will be registered when iOS provides it
        }

        const savedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        const savedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

        if (savedUser && savedToken) {
          const user = JSON.parse(savedUser);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          // Clear invalid data
          await AsyncStorage.multiRemove([
            USER_STORAGE_KEY,
            TOKEN_STORAGE_KEY,
            REFRESH_TOKEN_STORAGE_KEY,
          ]);
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch {
        await AsyncStorage.multiRemove([
          USER_STORAGE_KEY,
          TOKEN_STORAGE_KEY,
          REFRESH_TOKEN_STORAGE_KEY,
        ]);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };
    loadUser();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check for hardcoded test user
      if (email === "test@outix.co" && password === "Password$1234") {
        const testUser: User = {
          id: "test-user-1",
          email: "test@outix.co",
          name: "Test User",
          phone: "+1234567890",
          avatar: undefined,
          PromoterId: "test-promoter-1",
          promoterId: "test-promoter-1",
        };

        // Save test user data
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(testUser));
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, "test-token-123");
        await AsyncStorage.setItem(
          REFRESH_TOKEN_STORAGE_KEY,
          "test-refresh-token-123",
        );

        setAuthState({
          user: testUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return;
      }

      // Create FormData (not JSON)
      const formdata = new FormData();
      formdata.append("email", email);
      formdata.append("password", password);

      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
        body: formdata,
        redirect: "follow",
      });

      // Get response as text first
      const result = await response.text();

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(result);
      } catch {
        // If not JSON, check if response was successful
        if (!response.ok) {
          throw new Error(result || "Login failed");
        }
        // If successful but not JSON, might be a different format
        throw new Error("Invalid response format");
      }

      // Check if response indicates success
      // API response structure: { success: true, data: { user, token, refreshToken }, error: false, status: 200 }
      if (!data.success || data.error || !data.data?.user) {
        throw new Error(data.message || "Login failed");
      }

      // Log the full API response for debugging

      // Extract user data and tokens from response
      // Structure: data.data.user, data.data.token, data.data.refreshToken
      // Try multiple possible field names for promoterId
      const promoterId =
        data.data.user.PromoterId || // API uses this!
        data.data.user.promoterId ||
        data.data.user.promoter_id ||
        data.data.user.PromoterID ||
        data.data.user.promoter_ID ||
        data.data.user.venue_id ||
        data.data.user.venueId ||
        data.data.user.VenueID ||
        undefined;

      const user: User = {
        id: data.data.user.id,
        email: data.data.user.email,
        name: data.data.user.name,
        phone: data.data.user.phone || undefined,
        avatar: data.data.user.avatar || undefined,
        PromoterId: data.data.user.PromoterId || undefined, // Save original field
        promoterId: promoterId, // Save normalized field
      };

      const token = data.data.token;
      const refreshToken = data.data.refreshToken;

      // Store user and tokens
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      if (token) {
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      }
      if (refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
      }

      // Update state with user data
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Register device token with server after successful login
      try {
        const deviceToken = await getDeviceToken();
        if (deviceToken) {
          const { registerToken } = await import("@/lib/api");
          await registerToken(deviceToken);
        }
      } catch (error) {
        // Don't block login if token registration fails
      }

      // Reload the app to refresh admin controls and all data
      try {
        await Updates.reloadAsync();
      } catch (error) {
        // In development, Updates.reloadAsync() is not available
        // The app state will still update normally
      }

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";

      // Update state with error
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Optionally call logout API endpoint
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        try {
          await fetch(`${BASE_URL}/auth/logout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        } catch {
          // Ignore API errors on logout
        }
      }
    } catch {
      // Ignore errors
    } finally {
      // Clear all stored data
      await AsyncStorage.multiRemove([
        USER_STORAGE_KEY,
        TOKEN_STORAGE_KEY,
        REFRESH_TOKEN_STORAGE_KEY,
      ]);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<User>) => {
      if (!authState.user) return false;

      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (!token) {
          throw new Error("Not authenticated");
        }

        // Create FormData for the update
        const formdata = new FormData();
        if (updates.name) formdata.append("name", updates.name);
        if (updates.phone !== undefined)
          formdata.append("phone", updates.phone || "");
        if (updates.avatar) formdata.append("avatar", updates.avatar);

        const response = await fetch(`${BASE_URL}/apis/users/me`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formdata,
          redirect: "follow",
        });

        const result = await response.text();
        let data;
        try {
          data = JSON.parse(result);
        } catch {
          if (!response.ok) {
            throw new Error(result || "Failed to update profile");
          }
          throw new Error("Invalid response format");
        }

        // Check if response indicates success
        if (!data.success || data.error || !data.data) {
          throw new Error(data.message || "Failed to update profile");
        }

        // Update user from response
        const updatedUser: User = {
          id: authState.user.id, // Keep existing ID
          email: authState.user.email, // Email usually can't be changed
          name: data.data.name || updates.name || authState.user.name,
          phone: data.data.phone || updates.phone || authState.user.phone,
          avatar: data.data.avatar || updates.avatar || authState.user.avatar,
        };

        await AsyncStorage.setItem(
          USER_STORAGE_KEY,
          JSON.stringify(updatedUser),
        );
        setAuthState({
          user: updatedUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update profile.";

        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return false;
      }
    },
    [authState.user],
  );

  return {
    ...authState,
    login,
    logout,
    updateProfile,
  };
};
