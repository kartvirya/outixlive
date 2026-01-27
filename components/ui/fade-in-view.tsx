/**
 * FadeInView - Animated view that fades in on mount
 */

import React, { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from "react-native-reanimated";

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  from?: "bottom" | "top" | "left" | "right" | "none";
  distance?: number;
}

export const FadeInView = ({
  children,
  delay = 0,
  duration = 400,
  style,
  from = "bottom",
  distance = 20,
}: FadeInViewProps) => {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(
    from === "left" ? -distance : from === "right" ? distance : 0,
  );
  const translateY = useSharedValue(
    from === "top" ? -distance : from === "bottom" ? distance : 0,
  );

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration,
        easing: Easing.out(Easing.ease),
      }),
    );

    if (from !== "none") {
      translateX.value = withDelay(
        delay,
        withSpring(0, {
          damping: 20,
          stiffness: 90,
        }),
      );
      translateY.value = withDelay(
        delay,
        withSpring(0, {
          damping: 20,
          stiffness: 90,
        }),
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
};

export default FadeInView;
