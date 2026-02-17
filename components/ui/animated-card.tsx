import * as Haptics from "expo-haptics";
import React, { ReactNode } from "react";
import { Pressable, View, ViewStyle } from "react-native";

interface AnimatedCardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  animationType?: "scale" | "lift" | "spring" | "slide";
  hapticFeedback?: boolean;
  delay?: number;
}

export const AnimatedCard = ({
  children,
  onPress,
  style,
  animationType = "scale",
  hapticFeedback = true,
  delay = 0,
}: AnimatedCardProps) => {
  const handlePressIn = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={style}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        disabled={!onPress}
      >
        {children}
      </Pressable>
    </View>
  );
};

// Fade In Animation
interface FadeInViewProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

export const FadeInView = ({
  children,
  delay = 0,
  duration = 500,
  style,
}: FadeInViewProps) => {
  return <View style={style}>{children}</View>;
};

// Slide In Animation
interface SlideInViewProps {
  children: ReactNode;
  direction?: "left" | "right" | "top" | "bottom";
  delay?: number;
  distance?: number;
  style?: ViewStyle;
}

export const SlideInView = ({
  children,
  direction = "bottom",
  delay = 0,
  distance = 50,
  style,
}: SlideInViewProps) => {
  return <View style={style}>{children}</View>;
};
