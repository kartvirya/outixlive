/**
 * AWS SNS Token Registration Test Component
 *
 * This component allows you to manually test AWS SNS token registration
 * and push notification sending functionality
 */

import { getDeviceToken } from "@/lib/deviceToken";
import {
    debugPushTokenSetup,
    getDevicePushToken,
    registerPushTokenWithBackend,
    sendPushViaSNS,
} from "@/lib/pushNotifications";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function AWSSNSTestScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>(
    "Ready to test AWS SNS registration",
  );
  const [logs, setLogs] = useState<string[]>([]);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [endpointArn, setEndpointArn] = useState<string | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs((prev) => [...prev, logEntry]);
    setStatus(message);
  };

  const clearLogs = () => {
    setLogs([]);
    setStatus("Logs cleared");
  };

  const getTokens = async () => {
    setIsLoading(true);
    try {
      addLog("Getting device tokens...");

      const nativeToken = await getDevicePushToken();
      const deviceId = await getDeviceToken();

      if (nativeToken?.data) {
        setDeviceToken(nativeToken.data);
        addLog(
          `✅ Native token obtained: ${nativeToken.data.substring(0, 20)}...`,
        );
        addLog(`📱 Platform: ${nativeToken.type}`);
        addLog(`📏 Token length: ${nativeToken.data.length} chars`);
      } else {
        addLog("❌ Failed to get native token");
      }

      if (deviceId) {
        addLog(`🆔 Device ID: ${deviceId.substring(0, 20)}...`);
      }
    } catch (error: any) {
      addLog(`❌ Error getting tokens: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithBackend = async () => {
    if (!deviceToken) {
      Alert.alert("No Token", "Please get device token first");
      return;
    }

    setIsLoading(true);
    try {
      addLog("🔧 Registering token with backend (backend manages SNS)...");

      const result = await registerPushTokenWithBackend();

      if (result?.success || (result && result.error === false)) {
        setEndpointArn("registered"); // Backend manages endpoint
        addLog(`✅ Backend registration successful`);
      } else {
        addLog("❌ Backend registration failed");
      }
    } catch (error: any) {
      addLog(`❌ Registration error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestPush = async () => {
    if (!endpointArn) {
      Alert.alert("No Endpoint", "Please register with SNS first");
      return;
    }

    setIsLoading(true);
    try {
      addLog("📤 Sending test push notification...");

      const success = await sendPushViaSNS("Test notification from AWS SNS!", {
        title: "OutixRacer SNS Test",
        badge: 1,
        data: {
          test: true,
          timestamp: new Date().toISOString(),
        },
      });

      if (success) {
        addLog("✅ Test notification sent successfully!");
      } else {
        addLog("❌ Failed to send test notification");
      }
    } catch (error: any) {
      addLog(`❌ Send error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runFullDebug = async () => {
    setIsLoading(true);
    try {
      addLog("🔍 Running comprehensive debug...");

      const debugResult = await debugPushTokenSetup();

      if (debugResult) {
        addLog("📊 Debug Results:");
        addLog(
          `  Device Type: ${debugResult.deviceType ? "Physical" : "Simulator"}`,
        );
        addLog(`  Platform: ${debugResult.platform}`);
        addLog(`  Permissions: ${debugResult.permissionStatus}`);
        addLog(`  Token Valid: ${debugResult.tokenValid}`);
        addLog(`  Token Length: ${debugResult.tokenLength}`);
        addLog(
          `  Registration: ${debugResult.registrationSuccess ? "Success" : "Failed"}`,
        );

        if (debugResult.warnings && debugResult.warnings.length > 0) {
          addLog(`  Warnings: ${debugResult.warnings.join(", ")}`);
        }
      }
    } catch (error: any) {
      addLog(`❌ Debug error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AWS SNS Registration Test</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={getTokens}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>1. Get Device Tokens</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={registerWithBackend}
          disabled={isLoading || !deviceToken}
        >
          <Text style={styles.buttonText}>2. Register with Backend</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.successButton]}
          onPress={sendTestPush}
          disabled={isLoading || !endpointArn}
        >
          <Text style={styles.buttonText}>3. Send Test Push</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.debugButton]}
          onPress={runFullDebug}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🔍 Full Debug</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearLogs}
        >
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Current Status:</Text>
        <Text style={styles.infoText}>Token: {deviceToken ? "✅" : "❌"}</Text>
        <Text style={styles.infoText}>
          Endpoint: {endpointArn ? "✅" : "❌"}
        </Text>
      </View>

      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Logs:</Text>
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
  statusContainer: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statusText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  secondaryButton: {
    backgroundColor: "#34C759",
  },
  successButton: {
    backgroundColor: "#FF9500",
  },
  debugButton: {
    backgroundColor: "#8E8E93",
  },
  clearButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoContainer: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  logsContainer: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  logsTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  logText: {
    color: "#0F0",
    fontSize: 12,
    fontFamily: "Courier",
    marginBottom: 2,
  },
});
