import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export function QuickPushTest() {
  const [isScheduling, setIsScheduling] = useState(false);

  const sendTestNotification = async () => {
    setIsScheduling(true);
    try {
      const Notifications = await import("expo-notifications");
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Class Call",
          body: "Testing AWS SNS payload structure",
          data: {
            NotificationID: "MTc4OTEwNDkzNDQ=",
            notificationId: "MTc4OTEwNDkzNDQ=",
            notification_type: "Class Call",
          },
          sound: "default",
        },
        trigger: { seconds: 2 },
      });
      console.log("✅ Test notification scheduled for 2 seconds");
    } catch (error) {
      console.error("❌ Failed to schedule notification:", error);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TouchableOpacity
        onPress={sendTestNotification}
        disabled={isScheduling}
        style={{
          backgroundColor: isScheduling ? "#666" : "#22c55e",
          padding: 15,
          borderRadius: 8,
        }}
      >
        <Text
          style={{ color: "white", textAlign: "center", fontWeight: "bold" }}
        >
          {isScheduling ? "Scheduling..." : "🧪 Send Test Push (2s delay)"}
        </Text>
      </TouchableOpacity>
      <Text style={{ color: "#666", marginTop: 10, textAlign: "center" }}>
        This simulates your exact AWS SNS payload structure
      </Text>
    </View>
  );
}
