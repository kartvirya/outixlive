import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export const Card = ({ children, className, style }: CardProps) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export const CardHeader = ({ children, className, style }: CardHeaderProps) => (
  <View style={[styles.header, style]}>
    {children}
  </View>
);

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  style?: TextStyle;
}

export const CardTitle = ({ children, className, style }: CardTitleProps) => (
  <Text style={[styles.title, style]}>
    {children}
  </Text>
);

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
  style?: TextStyle;
}

export const CardDescription = ({ children, className, style }: CardDescriptionProps) => (
  <Text style={[styles.description, style]}>
    {children}
  </Text>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export const CardContent = ({ children, className, style }: CardContentProps) => (
  <View style={[styles.content, style]}>
    {children}
  </View>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export const CardFooter = ({ children, className, style }: CardFooterProps) => (
  <View style={[styles.footer, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(17, 24, 39, 0.5)', // card background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'column',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fafafa', // card-foreground
  },
  description: {
    fontSize: 14,
    color: '#737373', // muted-foreground
  },
  content: {
    padding: 24,
    paddingTop: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 0,
  },
});
