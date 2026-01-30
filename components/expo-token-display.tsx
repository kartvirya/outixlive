import { usePushNotifications } from "@/hooks/usePushNotifications";
import { setStringAsync } from "expo-clipboard";
import { Alert, Text, TouchableOpacity, View } from "react-native";

export function ExpoTokenDisplay() {
  const { expoPushToken, devicePushToken, isLoading, error } =
    usePushNotifications();

  const copyToClipboard = async (token: string, type: string) => {
    try {
      await setStringAsync(token);
      Alert.alert("✅ Copied!", `${type} copied to clipboard`);
    } catch (error) {
      Alert.alert("❌ Error", "Failed to copy token");
    }
  };

  // Add debug logging
  console.log("[TOKEN-DISPLAY] 📊 Debug info:");
  console.log("[TOKEN-DISPLAY] - isLoading:", isLoading);
  console.log("[TOKEN-DISPLAY] - error:", error);
  console.log(
    "[TOKEN-DISPLAY] - expoPushToken:",
    expoPushToken ? "✅ Available" : "❌ Missing",
  );
  console.log(
    "[TOKEN-DISPLAY] - devicePushToken:",
    devicePushToken ? "✅ Available" : "❌ Missing",
  );

  if (isLoading) {
    return (
      <View
        style={{
          padding: 20,
          backgroundColor: "#111827",
          borderRadius: 8,
          margin: 20,
        }}
      >
        <Text style={{ color: "#fafafa", fontWeight: "bold" }}>
          🔄 Loading tokens...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        padding: 20,
        backgroundColor: "#111827",
        borderRadius: 8,
        margin: 20,
      }}
    >
      <Text style={{ color: "#fafafa", fontWeight: "bold", marginBottom: 15 }}>
        📱 Push Notification Tokens
      </Text>

      {/* Debug Info */}
      <View
        style={{
          marginBottom: 15,
          padding: 10,
          backgroundColor: "#0a0a0a",
          borderRadius: 5,
        }}
      >
        <Text style={{ color: "#666", fontSize: 12, fontFamily: "monospace" }}>
          DEBUG: Expo={expoPushToken ? "✅" : "❌"} | Device=
          {devicePushToken ? "✅" : "❌"} | Loading={isLoading ? "Yes" : "No"}
        </Text>
        {error && (
          <Text
            style={{ color: "#ef4444", fontSize: 12, fontFamily: "monospace" }}
          >
            Error: {error.message}
          </Text>
        )}
      </View>

      {/* Expo Push Token */}
      {expoPushToken ? (
        <View style={{ marginBottom: 15 }}>
          <Text
            style={{ color: "#22c55e", fontWeight: "bold", marginBottom: 5 }}
          >
            ✅ Expo Push Token (for expo.dev/notifications):
          </Text>
          <TouchableOpacity
            onPress={() => copyToClipboard(expoPushToken, "Expo Push Token")}
            style={{ backgroundColor: "#0a0a0a", padding: 10, borderRadius: 5 }}
          >
            <Text style={{ color: "#fafafa", fontSize: 12 }} numberOfLines={3}>
              {expoPushToken}
            </Text>
          </TouchableOpacity>
          <Text style={{ color: "#666", fontSize: 12, marginTop: 5 }}>
            ✅ Tap to copy • This is the correct token for Expo Push API
          </Text>
        </View>
      ) : (
        <View style={{ marginBottom: 15 }}>
          <Text
            style={{ color: "#ef4444", fontWeight: "bold", marginBottom: 5 }}
          >
            ❌ Expo Push Token:
          </Text>
          <View
            style={{ backgroundColor: "#0a0a0a", padding: 10, borderRadius: 5 }}
          >
            <Text style={{ color: "#ef4444", fontSize: 12 }}>
              {isLoading ? "Generating..." : "Failed to generate"}
            </Text>
          </View>
        </View>
      )}

      {/* Device Push Token (for AWS SNS) */}
      {devicePushToken && (
        <View style={{ marginBottom: 15 }}>
          <Text
            style={{ color: "#22c55e", fontWeight: "bold", marginBottom: 5 }}
          >
            🔧 Device Token ({devicePushToken.type}) - for AWS SNS:
          </Text>
          <TouchableOpacity
            onPress={() =>
              copyToClipboard(devicePushToken.data, "Device Token")
            }
            style={{ backgroundColor: "#0a0a0a", padding: 10, borderRadius: 5 }}
          >
            <Text style={{ color: "#fafafa", fontSize: 12 }} numberOfLines={3}>
              {devicePushToken.data}
            </Text>
          </TouchableOpacity>
          <Text style={{ color: "#666", fontSize: 12, marginTop: 5 }}>
            Tap to copy • Used by your backend for AWS SNS
          </Text>
        </View>
      )}

      {!expoPushToken && !devicePushToken && !isLoading && (
        <Text style={{ color: "#ef4444", textAlign: "center" }}>
          ⚠️ No tokens available. Check permissions and restart app.
        </Text>
      )}
    </View>
  );
}
