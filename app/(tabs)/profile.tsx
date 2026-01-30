import { Header } from "@/components/header";
import { LoginModal } from "@/components/login-modal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
    LogOut,
    Mail,
    Palette,
    Phone,
    User as UserIcon,
} from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, error, login, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header />
        <View style={styles.content}>
          <View style={styles.loginPrompt}>
            <View style={styles.avatarPlaceholder}>
              <UserIcon size={40} color="#737373" />
            </View>
            <Text style={styles.loginTitle}>Welcome to Outix</Text>
            <Text style={styles.loginSubtitle}>
              Sign in to manage your venue subscriptions and get personalized
              alerts
            </Text>
            <Button
              onPress={() => setShowLoginModal(true)}
              style={styles.loginButton}
            >
              Sign In
            </Button>

            {/* Temporarily hidden for production
            <Button
              variant="outline"
              onPress={() => router.push("/ui-examples")}
              style={[
                styles.loginButton,
                {
                  marginTop: 12,
                  backgroundColor: "transparent",
                  borderColor: "#22c55e",
                },
              ]}
            >
              <Palette size={16} color="#22c55e" style={{ marginRight: 8 }} />
              <Text style={{ color: "#22c55e", fontWeight: "500" }}>
                UI Examples & Tests
              </Text>
            </Button>
            */}
          </View>
        </View>
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={login}
          isLoading={isLoading}
          error={error}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
        </View>

        <View style={styles.avatarSection}>
          {user.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={styles.avatarImage}
              placeholder={require("@/assets/images/icon.png")}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatar}>
              <UserIcon size={40} color="#737373" />
            </View>
          )}
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.phone && (
            <View style={styles.phoneRow}>
              <Phone size={14} color="#737373" style={{ marginRight: 6 }} />
              <Text style={styles.phone}>{user.phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.value}>{user.name}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.valueContainer}>
              <Mail size={16} color="#737373" style={styles.icon} />
              <Text style={styles.value}>{user.email}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <View style={styles.valueContainer}>
              <Phone size={16} color="#737373" style={styles.icon} />
              <Text style={styles.value}>{user.phone || "Not set"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          {user.email === "test@outix.co" && (
            <Button
              variant="outline"
              onPress={() => router.push("/ui-examples")}
              style={[styles.logoutButton, { marginBottom: 12 }]}
            >
              <Palette size={16} color="#22c55e" style={{ marginRight: 8 }} />
              <Text style={[styles.logoutText, { color: "#22c55e" }]}>
                UI Examples & Tests
              </Text>
            </Button>
          )}

          <Button
            variant="outline"
            onPress={logout}
            style={styles.logoutButton}
          >
            <LogOut size={16} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loginPrompt: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 32,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fafafa",
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: "#737373",
    textAlign: "center",
    marginBottom: 24,
    maxWidth: 300,
  },
  loginButton: {
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fafafa",
  },
  editButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    color: "#22c55e",
    fontSize: 16,
    fontWeight: "600",
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    backgroundColor: "#111827",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#737373",
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  phone: {
    fontSize: 14,
    color: "#737373",
  },
  section: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 8,
  },
  input: {
    height: 44,
    backgroundColor: "#1f2937",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 12,
    color: "#fff",
    fontSize: 16,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    backgroundColor: "#1f2937",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 8,
  },
  value: {
    fontSize: 16,
    color: "#fff",
  },
  idText: {
    fontSize: 14,
    color: "#737373",
    fontFamily: "monospace",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#ef4444",
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
  },
});
