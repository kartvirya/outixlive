/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Using emerald accent color from design system: hsl(142 70% 50%)
const primaryColor = '#22c55e'; // hsl(142 70% 50%)
const tintColorDark = primaryColor;

export const Colors = {
  light: {
    text: '#fafafa', // foreground
    background: '#0a0a0a', // background
    tint: primaryColor,
    icon: '#737373', // muted-foreground
    tabIconDefault: '#737373',
    tabIconSelected: primaryColor,
  },
  dark: {
    text: '#fafafa', // foreground
    background: '#0a0a0a', // background
    tint: primaryColor,
    icon: '#737373', // muted-foreground
    tabIconDefault: '#737373',
    tabIconSelected: primaryColor,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
