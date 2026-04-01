import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerToken } from "@/lib/api";
import { getDeviceToken } from "@/lib/deviceToken";

const REGISTERED_DEVICE_TOKEN_KEY = "outix_registered_device_token_v1";

const normalizeToken = (token: string): string => {
  const t = token.trim();
  // iOS APNs tokens are 64-hex chars; normalize to lowercase for stable equality.
  if (/^[0-9a-f]{64}$/i.test(t)) {
    return t.toLowerCase();
  }
  return t;
};

// Prevent concurrent registration attempts.
let registrationInFlight:
  | Promise<{ skipped: boolean; token?: string; error?: string }>
  | null = null;

export async function ensureDeviceTokenRegistered(
  tokenOverride?: string,
): Promise<{ skipped: boolean; token?: string; error?: string }> {
  if (registrationInFlight) {
    console.log(
      "[TOKEN-REG] ensureDeviceTokenRegistered called while in-flight; returning existing promise",
    );
    return registrationInFlight;
  }

  registrationInFlight = (async () => {
    try {
      const truncate = (t?: string | null) =>
        t ? `${t.substring(0, 10)}...(${t.length})` : "null";

      console.log(
        "[TOKEN-REG] ensureDeviceTokenRegistered: start",
        JSON.stringify({ hasOverride: !!tokenOverride }),
      );

      const rawToken = tokenOverride ?? (await getDeviceToken());
      const token = rawToken ? normalizeToken(rawToken) : null;
      if (!token) {
        console.log("[TOKEN-REG] ensureDeviceTokenRegistered: no token");
        return { skipped: true };
      }

      console.log(
        "[TOKEN-REG] ensureDeviceTokenRegistered: token",
        truncate(token),
      );

      const lastRegistered = await AsyncStorage.getItem(
        REGISTERED_DEVICE_TOKEN_KEY,
      );

      if (lastRegistered && lastRegistered === token) {
        console.log(
          "[TOKEN-REG] ensureDeviceTokenRegistered: token already registered; skipping",
        );
        return { skipped: true, token };
      }

      if (lastRegistered) {
        console.log(
          "[TOKEN-REG] ensureDeviceTokenRegistered: token changed; re-registering",
          JSON.stringify({
            previous: truncate(lastRegistered),
          }),
        );
      }

      await registerToken(token);

      await AsyncStorage.setItem(REGISTERED_DEVICE_TOKEN_KEY, token);

      console.log(
        "[TOKEN-REG] ensureDeviceTokenRegistered: registration success",
      );
      return { skipped: false, token };
    } catch (error) {
      console.error("[TOKEN-REG] ensureDeviceTokenRegistered failed:", error);
      return {
        skipped: true,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  })();

  const result = await registrationInFlight;
  registrationInFlight = null;
  return result;
}

