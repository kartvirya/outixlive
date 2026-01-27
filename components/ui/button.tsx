import * as Haptics from "expo-haptics";
import React from "react";
import {
    ActivityIndicator,
    Animated,
    Pressable,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
}

export const Button = ({
  children,
  onPress,
  variant = "default",
  disabled = false,
  loading = false,
  style,
  textStyle,
  hapticFeedback = true,
}: ButtonProps) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (hapticFeedback && !disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
    >
      <Animated.View
        style={[
          styles.button,
          styles[variant],
          (disabled || loading) && styles.disabled,
          { transform: [{ scale: scaleAnim }] },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={
              variant === "outline" || variant === "ghost" ? "#22c55e" : "#fff"
            }
          />
        ) : (
          <View style={styles.childrenContainer}>
            {typeof children === "string" ? (
              <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
                {children}
              </Text>
            ) : (
              children
            )}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  childrenContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  default: {
    backgroundColor: "#22c55e", // primary emerald
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#22c55e",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  destructive: {
    backgroundColor: "#ef4444",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
  defaultText: {
    color: "#0a0a0a", // primary-foreground
  },
  outlineText: {
    color: "#22c55e",
  },
  ghostText: {
    color: "#22c55e",
  },
  destructiveText: {
    color: "#fff",
  },
});
