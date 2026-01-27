/**
 * ScaleInView - Component that scales in with a spring animation
 */

import React, { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
} from "react-native-reanimated";

interface ScaleInViewProps {
  children: React.ReactNode;
  delay?: number;
  initialScale?: number;
  style?: StyleProp<ViewStyle>;
}

export const ScaleInView = ({
  children,
  delay = 0,
  initialScale = 0.8,
  style,
}: ScaleInViewProps) => {
  const scale = useSharedValue(initialScale);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 15,
        stiffness: 100,
      }),
    );
    opacity.value = withDelay(
      delay,
      withSpring(1, {
        damping: 15,
        stiffness: 100,
      }),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
};

export default ScaleInView;
