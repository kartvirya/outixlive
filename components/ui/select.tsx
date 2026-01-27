import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export const Select = ({ value, onValueChange, children }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const items = React.Children.toArray(children) as React.ReactElement<SelectItemProps>[];
  const selectedItem = items.find(item => item.props.value === value);

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
      >
        <Text style={styles.triggerText}>
          {selectedItem ? selectedItem.props.children : 'Select...'}
        </Text>
        <ChevronDown size={16} color="#737373" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <ScrollView>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.props.value}
                  style={[
                    styles.item,
                    value === item.props.value && styles.itemSelected,
                  ]}
                  onPress={() => {
                    onValueChange(item.props.value);
                    setIsOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.itemText,
                      value === item.props.value && styles.itemTextSelected,
                    ]}
                  >
                    {item.props.children}
                  </Text>
                  {value === item.props.value && (
                    <Check size={16} color="#22c55e" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export const SelectItem = ({ value, children }: SelectItemProps) => {
  return <View>{children}</View>;
};

export const SelectTrigger = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  return <Text>{placeholder}</Text>;
};

export const SelectContent = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const styles = StyleSheet.create({
  trigger: {
    height: 44,
    backgroundColor: '#111827',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '50%',
    paddingBottom: 32,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  itemSelected: {
    backgroundColor: '#1f2937',
  },
  itemText: {
    color: '#fff',
    fontSize: 16,
  },
  itemTextSelected: {
    color: '#22c55e',
    fontWeight: '600',
  },
});
