import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAdmin } from "@/contexts/AdminContext";

export const AdminDebug = () => {
  const { isAdmin, userPromoterId } = useAdmin();
  const [userData, setUserData] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    loadUserData();
    const interval = setInterval(loadUserData, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadUserData = async () => {
    try {
      const userValue = await AsyncStorage.getItem("outix_user");
      if (userValue) {
        setUserData(JSON.parse(userValue));
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  if (!showDebug) {
    return (
      <TouchableOpacity
        style={styles.debugButton}
        onPress={() => setShowDebug(true)}
      >
        <Text style={styles.debugButtonText}>🐛 Debug</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Debug Info</Text>
        <TouchableOpacity onPress={() => setShowDebug(false)}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Context</Text>
          <Text style={styles.text}>isAdmin: {String(isAdmin)}</Text>
          <Text style={styles.text}>userPromoterId: {userPromoterId || "null"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Data from Storage</Text>
          <Text style={styles.code}>{JSON.stringify(userData, null, 2)}</Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadUserData}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  debugButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#22c55e",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  debugButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    color: "#fff",
    fontSize: 24,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#22c55e",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  text: {
    color: "#d4d4d4",
    fontSize: 14,
    marginBottom: 4,
    fontFamily: "monospace",
  },
  code: {
    color: "#d4d4d4",
    fontSize: 12,
    fontFamily: "monospace",
    backgroundColor: "#2a2a2a",
    padding: 12,
    borderRadius: 8,
  },
  refreshButton: {
    backgroundColor: "#22c55e",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
