import {
    getDevicePushToken,
    registerTokenDirectlyWithSNS,
} from "@/lib/pushNotifications";
import * as Notifications from "expo-notifications";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function AWSDebugScreen() {
  const [logs, setLogs] = useState<string[]>([]);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const testFullFlow = async () => {
    setLogs([]);
    addLog("🚀 Starting AWS notification debug...");

    try {
      // 1. Check permissions
      const { status } = await Notifications.getPermissionsAsync();
      addLog(`📋 Permission status: ${status}`);

      if (status !== "granted") {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        addLog(`📋 New permission status: ${newStatus}`);
      }

      // 2. Get device token
      addLog("📱 Getting device push token...");
      const tokenResult = await getDevicePushToken();
      if (tokenResult?.data) {
        setDeviceToken(tokenResult.data);
        addLog(`✅ Device token: ${tokenResult.data.substring(0, 20)}...`);
        addLog(`📊 Token length: ${tokenResult.data.length} chars`);
        addLog(`📊 Platform: ${tokenResult.type}`);
      } else {
        addLog("❌ Failed to get device token");
        return;
      }

      // 3. Test AWS registration
      addLog("☁️ Testing AWS SNS registration...");
      const awsResult = await registerTokenDirectlyWithSNS();
      if (awsResult?.success) {
        addLog(`✅ AWS registration successful`);
        addLog(`🎯 Endpoint ARN: ${awsResult.endpointArn}`);
      } else {
        addLog(
          `❌ AWS registration failed: ${awsResult?.error || "Unknown error"}`,
        );
      }

      // 4. Test backend registration
      addLog("🏢 Testing backend registration...");
      try {
        const response = await fetch(
          `https://outix.co/apis/registertoken/${tokenResult.data}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              devicetoken: tokenResult.data,
            },
            body: JSON.stringify({
              deviceToken: tokenResult.data,
              platform: "ios",
              timestamp: new Date().toISOString(),
            }),
          },
        );

        if (response.ok) {
          const result = await response.json();
          addLog(`✅ Backend registration: ${result.msg}`);
        } else {
          addLog(`❌ Backend registration failed: ${response.status}`);
        }
      } catch (backendError) {
        addLog(
          `❌ Backend error: ${backendError instanceof Error ? backendError.message : "Unknown"}`,
        );
      }

      addLog("🎉 Debug complete!");
    } catch (error) {
      addLog(
        `❌ Debug error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const sendTestNotification = async () => {
    if (!deviceToken) {
      Alert.alert("Error", "Please run debug first to get device token");
      return;
    }

    try {
      addLog("📤 Sending test notification via backend...");

      // Call your backend's test notification endpoint
      const response = await fetch(
        "https://outix.co/apis/send-test-notification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deviceToken: deviceToken,
            title: "AWS Test",
            body: "Test notification from AWS SNS",
            data: {
              NotificationID: "test123",
              notification_type: "test",
              notification_message: "This is a test message",
            },
          }),
        },
      );

      if (response.ok) {
        addLog("✅ Test notification sent successfully");
      } else {
        addLog(`❌ Failed to send test notification: ${response.status}`);
      }
    } catch (error) {
      addLog(
        `❌ Send error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AWS Push Debug</Text>

      <TouchableOpacity style={styles.button} onPress={testFullFlow}>
        <Text style={styles.buttonText}>🔍 Run Full Debug</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={sendTestNotification}
        disabled={!deviceToken}
      >
        <Text style={styles.buttonText}>📤 Send Test Notification</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.clearButton]}
        onPress={() => setLogs([])}
      >
        <Text style={styles.buttonText}>🧹 Clear Logs</Text>
      </TouchableOpacity>

      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Debug Logs:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  secondaryButton: {
    backgroundColor: "#34C759",
  },
  clearButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  logsContainer: {
    marginTop: 20,
    backgroundColor: "#000",
    borderRadius: 10,
    padding: 15,
  },
  logsTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  logText: {
    color: "#00ff00",
    fontSize: 12,
    fontFamily: "monospace",
    marginVertical: 1,
  },
});
