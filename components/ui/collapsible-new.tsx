import React, { useState, ReactNode } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

interface CollapsibleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

interface CollapsibleTriggerProps {
  asChild?: boolean;
  children: ReactNode;
}

interface CollapsibleContentProps {
  children: ReactNode;
}

export const Collapsible = ({ open, onOpenChange, children }: CollapsibleProps) => {
  return (
    <View>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === CollapsibleTrigger) {
            return React.cloneElement(child, { open, onOpenChange } as any);
          }
          if (child.type === CollapsibleContent) {
            return React.cloneElement(child, { open } as any);
          }
        }
        return child;
      })}
    </View>
  );
};

export const CollapsibleTrigger = ({
  asChild,
  children,
  open,
  onOpenChange,
}: CollapsibleTriggerProps & { open?: boolean; onOpenChange?: (open: boolean) => void }) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onPress: () => onOpenChange?.(!open),
    } as any);
  }

  return (
    <TouchableOpacity
      style={styles.trigger}
      onPress={() => onOpenChange?.(!open)}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
};

export const CollapsibleContent = ({
  children,
  open,
}: CollapsibleContentProps & { open?: boolean }) => {
  if (!open) return null;
  return <View style={styles.content}>{children}</View>;
};

const styles = StyleSheet.create({
  trigger: {
    width: '100%',
  },
  content: {
    width: '100%',
  },
});
