import { scheduleLocalNotification } from "@/lib/pushNotifications";
import { Bell, Send } from "lucide-react-native";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

/**
 * Test component for verifying push notification deep linking
 * This allows you to send test notifications with custom notification IDs
 */
export function NotificationDeepLinkTest() {
  const [notificationId, setNotificationId] = useState("12345");
  const [title, setTitle] = useState("Test Notification");
  const [body, setBody] = useState("Tap to open notification details");

  const sendTestNotification = async () => {
    try {
      await scheduleLocalNotification({
        title,
        body,
        data: {
          notificationId: notificationId,
          NotificationID: notificationId, // Include both formats
          type: "test",
        },
        badge: 1,
        sound: "default",
      });

      Alert.alert(
        "Test Notification Sent!",
        `Notification sent with ID: ${notificationId}\n\n` +
          "Steps to test:\n" +
          "1. Close the app completely\n" +
          "2. Wait for the notification to appear\n" +
          "3. Tap the notification\n" +
          "4. App should open with notification details\n\n" +
          "Note: The notification will try to fetch details from /myalerts/" +
          notificationId,
      );
    } catch (error) {
      Alert.alert("Error", "Failed to send test notification: " + error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Bell size={32} color="#22c55e" />
        <Text style={styles.title}>Notification Deep Link Tester</Text>
        <Text style={styles.subtitle}>
          Test notification tapping and deep linking
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notification ID</Text>
          <TextInput
            style={styles.input}
            value={notificationId}
            onChangeText={setNotificationId}
            placeholder="Enter notification ID"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
          <Text style={styles.hint}>
            This ID will be used to fetch details from /myalerts/
            {notificationId}
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Notification title"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Body</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={body}
            onChangeText={setBody}
            placeholder="Notification body"
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendTestNotification}
        >
          <Send size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.sendButtonText}>Send Test Notification</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>
          1. Enter a notification ID that exists in your backend{"\n"}
          2. Tap &quot;Send Test Notification&quot;{"\n"}
          3. Close the app completely{"\n"}
          4. Tap the notification when it appears{"\n"}
          5. App opens and fetches details from /myalerts/{"{notificationId}"}
          {"\n"}
          6. Notification details appear in a bottom sheet
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Supported Field Names:</Text>
        <Text style={styles.infoText}>
          The app checks for notification ID in:{"\n"}• notificationId{"\n"}•
          NotificationID{"\n"}• notification_id{"\n"}• id{"\n"}• alertId{"\n"}•
          AlertID{"\n"}• orderId{"\n"}• OrderID
        </Text>
      </View>

      <View style={[styles.infoBox, styles.warningBox]}>
        <Text style={styles.infoTitle}>⚠️ Important:</Text>
        <Text style={styles.infoText}>
          The notification ID must exist in your backend&apos;s database.{"\n"}
          The app will call: POST /myalerts/{notificationId}
          {"\n\n"}
          If the ID doesn&apos;t exist, you&apos;ll see an error.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  sendButton: {
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoBox: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  warningBox: {
    borderColor: "rgba(234, 179, 8, 0.3)",
    backgroundColor: "rgba(234, 179, 8, 0.05)",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#999",
    lineHeight: 20,
  },
});
