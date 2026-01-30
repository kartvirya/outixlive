import { Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ModalComponent } from "./ui/modal";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export const LoginModal = ({
  isOpen,
  onClose,
  onLogin,
  isLoading,
  error,
}: LoginModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    const success = await onLogin(email, password);
    if (success) {
      setEmail("");
      setPassword("");
      onClose();
    }
  };

  return (
    <ModalComponent visible={isOpen} onClose={onClose} showCloseButton={true}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>O</Text>
        </View>
        <Text style={styles.title}>Sign in to Outix</Text>
        <Text style={styles.subtitle}>
          Access your venues and subscriptions
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { marginBottom: 8 }]}>Email</Text>
          <View style={styles.inputContainer}>
            <Mail size={16} color="#737373" style={styles.inputIcon} />
            <Input
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { marginBottom: 8 }]}>Password</Text>
          <View style={styles.inputContainer}>
            <Lock size={16} color="#737373" style={styles.inputIcon} />
            <Input
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
              style={styles.input}
            />
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          onPress={handleSubmit}
          disabled={isLoading}
          loading={isLoading}
          style={styles.submitButton}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>

        <Text style={styles.footer}>
          By signing in, you agree to our Terms of Service
        </Text>
      </View>
    </ModalComponent>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#737373",
  },
  form: {
    // gap: 16, - using marginBottom instead for compatibility
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f2937",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  error: {
    fontSize: 14,
    color: "#ef4444",
    textAlign: "center",
  },
  submitButton: {
    width: "100%",
    marginTop: 8,
  },
  footer: {
    fontSize: 12,
    color: "#737373",
    textAlign: "center",
    marginTop: 8,
  },
});
