import { getAlertDetails } from "@/lib/api";
import * as Notifications from "expo-notifications";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

interface NotificationTestSimulatorProps {
  onNotificationTap: (data: any) => void;
}

/**
 * Test component to simulate notification taps
 * This helps verify the notification flow works before testing on real device
 */
export function NotificationTestSimulator({
  onNotificationTap,
}: NotificationTestSimulatorProps) {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = isError ? "❌" : "✅";
    setTestResults((prev) => [`[${timestamp}] ${prefix} ${message}`, ...prev]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Test 1: Simulate notification with NotificationID
  const testWithNotificationID = async () => {
    setIsLoading(true);
    addResult("Test 1: Simulating notification with NotificationID...");

    try {
      // First, get a real notification ID from the API
      const { getMyAlerts } = await import("@/lib/api");
      const alertsResponse = await getMyAlerts();
      const alerts = Array.isArray(alertsResponse)
        ? alertsResponse
        : alertsResponse?.msg || alertsResponse?.alerts || [];

      if (alerts.length === 0) {
        addResult("No alerts found in API. Using test ID.", true);
        // Use a test ID
        const testData = {
          NotificationID: "TEST123",
          notificationId: "TEST123",
        };
        addResult(`Simulating tap with test data: ${JSON.stringify(testData)}`);
        onNotificationTap(testData);
        addResult("Test notification tap simulated!");
        setIsLoading(false);
        return;
      }

      const firstAlert = alerts[0];
      const notificationId = firstAlert.NotificationID || firstAlert.id;

      if (!notificationId) {
        addResult("Alert found but no NotificationID field", true);
        setIsLoading(false);
        return;
      }

      addResult(`Found alert with ID: ${notificationId}`);
      addResult("Verifying alert exists in API...");

      // Verify the alert exists
      try {
        await getAlertDetails(notificationId);
        addResult(`Alert ${notificationId} verified in API`);
      } catch (error) {
        addResult(`Alert ${notificationId} not found in API: ${error}`, true);
        setIsLoading(false);
        return;
      }

      // Simulate notification tap
      const testData = {
        NotificationID: notificationId,
        notificationId: notificationId,
        notification_type: firstAlert.notification_type || "Test",
        notification_message: firstAlert.notification_message || "Test message",
      };

      addResult(
        `Simulating tap with data: ${JSON.stringify(testData, null, 2)}`,
      );
      onNotificationTap(testData);
      addResult("✅ Notification tap simulated! Check if popup appears.");

      // Wait a bit and check if popup opened
      setTimeout(() => {
        addResult("⏱️ 2 seconds passed. Did the popup appear?");
      }, 2000);
    } catch (error) {
      addResult(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Test 2: Simulate notification without NotificationID (fallback matching)
  const testWithoutNotificationID = async () => {
    setIsLoading(true);
    addResult(
      "Test 2: Simulating notification WITHOUT NotificationID (fallback)...",
    );

    try {
      const { getMyAlerts } = await import("@/lib/api");
      const alertsResponse = await getMyAlerts();
      const alerts = Array.isArray(alertsResponse)
        ? alertsResponse
        : alertsResponse?.msg || alertsResponse?.alerts || [];

      if (alerts.length === 0) {
        addResult("No alerts found. Cannot test fallback matching.", true);
        setIsLoading(false);
        return;
      }

      const firstAlert = alerts[0];
      const testData = {
        notification_type: firstAlert.notification_type || "Test",
        notification_message:
          firstAlert.notification_message ||
          firstAlert.notification ||
          "Test message",
        // NO NotificationID - should trigger fallback matching
      };

      addResult(
        `Simulating tap with data (NO NotificationID): ${JSON.stringify(testData, null, 2)}`,
      );
      addResult("This should trigger fallback matching by type + message");
      onNotificationTap(testData);
      addResult("✅ Fallback notification tap simulated!");

      setTimeout(() => {
        addResult("⏱️ 2 seconds passed. Did the popup appear?");
      }, 2000);
    } catch (error) {
      addResult(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Test 3: Send actual local notification
  const testLocalNotification = async () => {
    setIsLoading(true);
    addResult("Test 3: Sending actual local notification...");

    try {
      const { getMyAlerts } = await import("@/lib/api");
      const alertsResponse = await getMyAlerts();
      const alerts = Array.isArray(alertsResponse)
        ? alertsResponse
        : alertsResponse?.msg || alertsResponse?.alerts || [];

      let notificationId = "TEST123";
      let notificationType = "Test Notification";
      let notificationMessage = "This is a test notification";

      if (alerts.length > 0) {
        const firstAlert = alerts[0];
        notificationId =
          firstAlert.NotificationID || firstAlert.id || "TEST123";
        notificationType = firstAlert.notification_type || "Test";
        notificationMessage =
          firstAlert.notification_message ||
          firstAlert.notification ||
          "Test message";
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationType,
          body: notificationMessage,
          data: {
            NotificationID: notificationId,
            notificationId: notificationId,
            notification_type: notificationType,
            notification_message: notificationMessage,
          },
          sound: true,
        },
        trigger: null, // Show immediately
      });

      addResult(`✅ Local notification sent with ID: ${notificationId}`);
      addResult("📱 Check your notification tray and tap it!");
      addResult("This will test the REAL notification tap flow");
    } catch (error) {
      addResult(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Test 4: Simulate app-closed scenario
  const testAppClosedScenario = async () => {
    setIsLoading(true);
    addResult("Test 4: Simulating app-closed scenario...");
    addResult("This simulates getLastNotificationResponseAsync()");

    try {
      // Check if there's a last notification response
      const lastResponse =
        await Notifications.getLastNotificationResponseAsync();
      if (lastResponse) {
        addResult("Found last notification response!");
        const data = lastResponse.notification.request.content.data;
        addResult(`Data: ${JSON.stringify(data, null, 2)}`);
        onNotificationTap(data);
        addResult("✅ Simulated app-closed scenario!");
      } else {
        addResult("No last notification response found");
        addResult("💡 Send a notification first, then close app and reopen");
      }
    } catch (error) {
      addResult(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔬 Notification Test Simulator</Text>
      <Text style={styles.subtitle}>
        Test notification flow before using real device
      </Text>

      <ScrollView style={styles.resultsContainer}>
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>No test results yet. Run a test!</Text>
        ) : (
          testResults.map((result, index) => (
            <Text key={index} style={styles.result}>
              {result}
            </Text>
          ))
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={testWithNotificationID}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test 1: With NotificationID</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={testWithoutNotificationID}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test 2: Fallback Matching</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonTertiary]}
          onPress={testLocalNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test 3: Real Local Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonQuaternary]}
          onPress={testAppClosedScenario}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test 4: App-Closed Scenario</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonClear]}
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Running test...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#0a0a0a",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fafafa",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#737373",
    marginBottom: 16,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    maxHeight: 300,
  },
  noResults: {
    color: "#737373",
    fontStyle: "italic",
  },
  result: {
    color: "#fafafa",
    fontSize: 12,
    fontFamily: "monospace",
    marginBottom: 4,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonPrimary: {
    backgroundColor: "#22c55e",
  },
  buttonSecondary: {
    backgroundColor: "#3b82f6",
  },
  buttonTertiary: {
    backgroundColor: "#8b5cf6",
  },
  buttonQuaternary: {
    backgroundColor: "#f59e0b",
  },
  buttonClear: {
    backgroundColor: "#737373",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  loading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
});
