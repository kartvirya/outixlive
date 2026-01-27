/**
 * Example component demonstrating SNS endpoint registration
 * This shows how to use the new registerDeviceTokenWithSNSEndpoint function
 */

import {
    getDevicePushToken,
    registerDeviceTokenWithSNSEndpoint,
    requestNotificationPermissions,
    setupPushNotificationsWithSNS,
} from "@/lib/pushNotifications";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function SNSEndpointExample() {
  const [isLoading, setIsLoading] = useState(false);
  const [endpointArn, setEndpointArn] = useState<string | null>(null);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Add initial log
    addLog(`🌐 Platform: ${Platform.OS}`);
    addLog(
      `📱 Device support: ${Platform.OS !== "web" ? "Supported" : "Limited (Web)"}`,
    );
    if (Platform.OS === "web") {
      addLog(`⚠️ Push notifications have limited support on web`);
      addLog(`📱 For full testing, use a physical device or simulator`);
    }
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs((prev) => [...prev.slice(-10), logMessage]); // Keep last 10 logs
  };

  const handleTestPermissions = async () => {
    setIsLoading(true);
    addLog("🔔 Testing notification permissions...");
    try {
      const hasPermission = await requestNotificationPermissions();
      addLog(`✅ Permissions result: ${hasPermission ? "Granted" : "Denied"}`);
      if (hasPermission) {
        Alert.alert("Success!", "Notification permissions granted!");
      } else {
        Alert.alert(
          "Permission Denied",
          "Notification permissions were denied",
        );
      }
    } catch (error) {
      addLog(`❌ Permission error: ${error.message}`);
      Alert.alert("Error", "Failed to request permissions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSetup = async () => {
    setIsLoading(true);
    addLog("🚀 Starting complete push notification setup...");
    try {
      const result = await setupPushNotificationsWithSNS();

      if (result.success) {
        setDeviceToken(result.deviceToken || null);
        setEndpointArn(result.endpointArn || null);
        addLog(`✅ Setup complete! Platform: ${result.platform}`);
        addLog(`🎯 Endpoint: ${result.endpointArn ? "Created" : "N/A"}`);
        Alert.alert(
          "Success!",
          `Push notifications setup complete!\n\nPlatform: ${result.platform}\nEndpoint ARN: ${result.endpointArn ? "Created" : "N/A"}`,
        );
      } else {
        addLog(`❌ Setup failed: ${result.error}`);
        Alert.alert("Error", result.error || "Setup failed");
      }
    } catch (error) {
      addLog(`❌ Setup exception: ${error.message}`);
      console.error("Setup error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterWithSNS = async () => {
    setIsLoading(true);
    addLog("☁️ Registering with SNS endpoint...");
    try {
      const result = await registerDeviceTokenWithSNSEndpoint();

      if (result && result.success) {
        setEndpointArn(result.endpointArn || null);
        addLog(`✅ SNS registration successful!`);
        addLog(`🎯 Endpoint ARN: ${result.endpointArn || "Created"}`);
        Alert.alert(
          "Success!",
          `Device registered with SNS endpoint!\n\nEndpoint ARN: ${result.endpointArn || "Created"}`,
        );
      } else {
        addLog(
          `❌ SNS registration failed: ${result?.error || "Unknown error"}`,
        );
        Alert.alert("Error", result?.error || "Registration failed");
      }
    } catch (error) {
      addLog(`❌ SNS registration exception: ${error.message}`);
      console.error("Registration error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetDeviceToken = async () => {
    setIsLoading(true);
    addLog("📱 Getting device push token...");
    try {
      const token = await getDevicePushToken();

      if (token && token.data) {
        setDeviceToken(token.data);
        addLog(`✅ Token obtained: ${token.data.substring(0, 20)}...`);
        addLog(
          `📊 Length: ${token.data.length} chars, Platform: ${token.type}`,
        );
        Alert.alert(
          "Device Token",
          `Platform: ${token.type}\nToken: ${token.data.substring(0, 50)}...\n\nLength: ${token.data.length} characters`,
        );
      } else {
        addLog("❌ Failed to get device token");
        Alert.alert("Error", "Failed to get device token");
      }
    } catch (error) {
      addLog(`❌ Token error: ${error.message}`);
      console.error("Token error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    addLog("🧹 Logs cleared");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SNS Endpoint Registration</Text>

      {Platform.OS === "web" && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>⚠️ Limited Web Support</Text>
          <Text style={styles.warningSubtext}>
            Push notifications work best on physical devices
          </Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        {deviceToken && (
          <Text style={styles.infoText}>
            Device Token: {deviceToken.substring(0, 20)}...
          </Text>
        )}
        {endpointArn && (
          <Text style={styles.infoText}>
            Endpoint ARN: {endpointArn.substring(0, 40)}...
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleTestPermissions}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Testing..." : "Test Permissions"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleCompleteSetup}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Setting up..." : "Complete Setup with SNS"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          styles.buttonSecondary,
          isLoading && styles.buttonDisabled,
        ]}
        onPress={handleGetDeviceToken}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Getting..." : "Get Device Token"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          styles.buttonSecondary,
          isLoading && styles.buttonDisabled,
        ]}
        onPress={handleRegisterWithSNS}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Registering..." : "Register with SNS"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonClear]}
        onPress={handleClearLogs}
      >
        <Text style={styles.buttonText}>Clear Logs</Text>
      </TouchableOpacity>

      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Recent Logs:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </View>

      <Text style={styles.helpText}>
        1. Test Permissions: Check notification permissions{"\n"}
        2. Complete Setup: Full flow with SNS registration{"\n"}
        3. Get Token: Just retrieve device token{"\n"}
        4. Register SNS: Register current token with SNS
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  warningContainer: {
    backgroundColor: "#fff3cd",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  warningText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#856404",
    marginBottom: 5,
  },
  warningSubtext: {
    fontSize: 14,
    color: "#856404",
  },
  infoContainer: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  infoText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonSecondary: {
    backgroundColor: "#34C759",
  },
  buttonClear: {
    backgroundColor: "#FF9500",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  logsContainer: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 10,
    marginVertical: 15,
    maxHeight: 200,
  },
  logsTitle: {
    color: "#00ff00",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  logText: {
    color: "#e0e0e0",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginBottom: 2,
  },
  helpText: {
    fontSize: 14,
    color: "#666",
    marginTop: 15,
    textAlign: "center",
    lineHeight: 20,
  },
});
