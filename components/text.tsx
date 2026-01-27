import { Text as RNText, TextProps as RNTextProps } from 'react-native';

interface TextProps extends RNTextProps {
  children: React.ReactNode;
}

export const Text = ({ children, ...props }: TextProps) => {
  return <RNText {...props}>{children}</RNText>;
};