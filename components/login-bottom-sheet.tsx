import BottomSheetLib from "@gorhom/bottom-sheet";
import { Lock, Mail } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { FadeInView, SlideInView } from "./ui/animated-card";
import { BlurViewWrapper } from "./ui/blur-view-wrapper";
import { BottomSheet } from "./ui/bottom-sheet";
import { Button } from "./ui/button";

interface LoginBottomSheetProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export const LoginBottomSheet = ({
  onLogin,
  isLoading,
  error,
}: LoginBottomSheetProps) => {
  const bottomSheetRef = useRef<BottomSheetLib>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleOpen = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const handleSubmit = async () => {
    const success = await onLogin(email, password);
    if (success) {
      setEmail("");
      setPassword("");
      handleClose();
    }
  };

  return (
    <>
      {/* Trigger button - you can place this wherever needed */}
      <Button onPress={handleOpen}>Open Login</Button>

      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={["50%", "75%"]}
        enablePanDownToClose={true}
        index={-1}
      >
        <View style={styles.container}>
          <FadeInView delay={100}>
            <View style={styles.header}>
              <BlurViewWrapper
                intensity={30}
                tint="light"
                style={styles.logoContainer}
              >
                <Text style={styles.logoText}>O</Text>
              </BlurViewWrapper>
              <Text style={styles.title}>Sign in to Outix</Text>
              <Text style={styles.subtitle}>
                Access your venues and subscriptions
              </Text>
            </View>
          </FadeInView>

          <View style={styles.form}>
            <SlideInView direction="left" delay={200}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <Mail size={20} color="#737373" style={styles.inputIcon} />
                  <TextInput
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                    style={styles.input}
                    placeholderTextColor="#a3a3a3"
                  />
                </View>
              </View>
            </SlideInView>

            <SlideInView direction="right" delay={300}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <Lock size={20} color="#737373" style={styles.inputIcon} />
                  <TextInput
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!isLoading}
                    style={styles.input}
                    placeholderTextColor="#a3a3a3"
                  />
                </View>
              </View>
            </SlideInView>

            {error && (
              <FadeInView>
                <Text style={styles.error}>{error}</Text>
              </FadeInView>
            )}

            <FadeInView delay={400}>
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
            </FadeInView>
          </View>
        </View>
      </BottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#737373",
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#171717",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: "#000",
  },
  error: {
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  submitButton: {
    marginTop: 8,
  },
  footer: {
    fontSize: 12,
    color: "#a3a3a3",
    textAlign: "center",
    marginTop: 16,
  },
});

// Export hook for easy usage
export const useLoginBottomSheet = () => {
  const bottomSheetRef = useRef<BottomSheetLib>(null);

  const open = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  const close = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  return { bottomSheetRef, open, close };
};
