/**
 * AnimatedList - Component for rendering lists with staggered fade-in animations
 */

import React from "react";
import {
    ScrollView,
    ScrollViewProps,
    StyleProp,
    ViewStyle
} from "react-native";
import { FadeInView } from "./fade-in-view";

interface AnimatedListProps extends ScrollViewProps {
  children: React.ReactNode;
  staggerDelay?: number;
  itemDelay?: number;
  containerStyle?: StyleProp<ViewStyle>;
}

export const AnimatedList = ({
  children,
  staggerDelay = 50,
  itemDelay = 100,
  containerStyle,
  ...scrollViewProps
}: AnimatedListProps) => {
  const childArray = React.Children.toArray(children);

  return (
    <ScrollView {...scrollViewProps} style={containerStyle}>
      {childArray.map((child, index) => (
        <FadeInView
          key={index}
          delay={itemDelay + index * staggerDelay}
          from="bottom"
          distance={15}
        >
          {child}
        </FadeInView>
      ))}
    </ScrollView>
  );
};

export default AnimatedList;
