import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import React, { ReactNode, useState } from "react";
import { Pressable, ViewStyle } from "react-native";

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
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  const getAnimationProps = () => {
    switch (animationType) {
      case "scale":
        return {
          animate: {
            scale: isPressed ? 0.96 : 1,
          },
          transition: {
            type: "timing",
            duration: 150,
          },
        };
      case "lift":
        return {
          animate: {
            scale: isPressed ? 0.98 : 1,
            translateY: isPressed ? -2 : 0,
          },
          transition: {
            type: "spring",
            damping: 15,
            stiffness: 200,
          },
        };
      case "spring":
        return {
          animate: {
            scale: isPressed ? 0.94 : 1,
          },
          transition: {
            type: "spring",
            damping: 10,
            stiffness: 400,
          },
        };
      case "slide":
        return {
          animate: {
            translateX: isPressed ? 4 : 0,
          },
          transition: {
            type: "timing",
            duration: 100,
          },
        };
      default:
        return {};
    }
  };

  return (
    <MotiView
      from={{
        opacity: 0,
        scale: 0.9,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        ...getAnimationProps().animate,
      }}
      transition={{
        type: "spring",
        damping: 20,
        stiffness: 200,
        delay,
        ...getAnimationProps().transition,
      }}
      style={style}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress}
      >
        {children}
      </Pressable>
    </MotiView>
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
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        type: "timing",
        duration,
        delay,
      }}
      style={style}
    >
      {children}
    </MotiView>
  );
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
  const getInitialPosition = () => {
    switch (direction) {
      case "left":
        return { translateX: -distance, opacity: 0 };
      case "right":
        return { translateX: distance, opacity: 0 };
      case "top":
        return { translateY: -distance, opacity: 0 };
      case "bottom":
        return { translateY: distance, opacity: 0 };
    }
  };

  return (
    <MotiView
      from={getInitialPosition()}
      animate={{ translateX: 0, translateY: 0, opacity: 1 }}
      transition={{
        type: "spring",
        damping: 20,
        stiffness: 200,
        delay,
      }}
      style={style}
    >
      {children}
    </MotiView>
  );
};
