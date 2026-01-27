/**
 * AnimatedPressable - Enhanced touchable component with smooth animations
 * Uses react-native-reanimated for better performance
 */

import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

type AnimationType = "scale" | "lift" | "shrink" | "bounce" | "fade" | "press";

interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  animationType?: AnimationType;
  hapticFeedback?: boolean;
  hapticStyle?: "light" | "medium" | "heavy";
  scaleValue?: number;
  hitSlop?:
    | number
    | { top?: number; bottom?: number; left?: number; right?: number };
}

const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

export const AnimatedPressable = ({
  children,
  onPress,
  onLongPress,
  disabled = false,
  style,
  animationType = "scale",
  hapticFeedback = true,
  hapticStyle = "light",
  scaleValue = 0.96,
  hitSlop = 8,
}: AnimatedPressableProps) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  const getHapticStyle = () => {
    switch (hapticStyle) {
      case "light":
        return Haptics.ImpactFeedbackStyle.Light;
      case "medium":
        return Haptics.ImpactFeedbackStyle.Medium;
      case "heavy":
        return Haptics.ImpactFeedbackStyle.Heavy;
      default:
        return Haptics.ImpactFeedbackStyle.Light;
    }
  };

  const handlePressIn = () => {
    if (disabled) return;

    if (hapticFeedback) {
      Haptics.impactAsync(getHapticStyle());
    }

    switch (animationType) {
      case "scale":
        scale.value = withSpring(scaleValue, {
          damping: 15,
          stiffness: 150,
        });
        break;
      case "lift":
        scale.value = withSpring(1.02, {
          damping: 15,
          stiffness: 150,
        });
        translateY.value = withSpring(-4, {
          damping: 15,
          stiffness: 150,
        });
        break;
      case "shrink":
        scale.value = withSpring(0.92, {
          damping: 15,
          stiffness: 150,
        });
        opacity.value = withTiming(0.7, {
          duration: 100,
        });
        break;
      case "bounce":
        scale.value = withSpring(0.9, {
          damping: 10,
          stiffness: 200,
        });
        break;
      case "fade":
        opacity.value = withTiming(0.6, {
          duration: 100,
          easing: Easing.ease,
        });
        break;
      case "press":
        scale.value = withSpring(0.98, {
          damping: 20,
          stiffness: 200,
        });
        opacity.value = withTiming(0.8, {
          duration: 100,
        });
        break;
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
    opacity.value = withTiming(1, {
      duration: 150,
    });
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
    });
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  const handleLongPress = () => {
    if (!disabled && onLongPress) {
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onLongPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  const hitSlopValue =
    typeof hitSlop === "number"
      ? { top: hitSlop, bottom: hitSlop, left: hitSlop, right: hitSlop }
      : hitSlop;

  return (
    <AnimatedPressableComponent
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlopValue}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressableComponent>
  );
};

export default AnimatedPressable;
