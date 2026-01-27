import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin, DollarSign } from 'lucide-react-native';
import { ModalComponent } from './ui/modal';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectItem } from './ui/select';
import { getActionIconComponent, ActionIconType, PriceType } from '@/lib/icon-utils';

interface Registration {
  pitNumber: string;
  category: string;
}

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount?: number) => void;
  serviceName: string;
  pitNumber: string;
  icon: ActionIconType;
  themeColor?: string;
  registrations?: Registration[];
  onPitNumberChange?: (pitNumber: string) => void;
  priceType?: PriceType;
  fixedPrice?: number;
}

export const ServiceRequestModal = ({
  isOpen,
  onClose,
  onConfirm,
  serviceName,
  pitNumber,
  icon,
  themeColor = '160 84% 39%',
  registrations = [],
  onPitNumberChange,
  priceType = 'none',
  fixedPrice,
}: ServiceRequestModalProps) => {
  const IconComponent = getActionIconComponent(icon);
  const accentColor = '#22c55e'; // emerald
  const accentColorBg = 'rgba(34, 197, 94, 0.15)';
  const hasMultipleRegistrations = registrations.length > 1;

  const [userAmount, setUserAmount] = useState('');
  const [selectedPit, setSelectedPit] = useState(pitNumber);

  useEffect(() => {
    if (isOpen) {
      setUserAmount('');
      setSelectedPit(pitNumber);
    }
  }, [isOpen, pitNumber]);

  const selectedRegistration = registrations.find((r) => r.pitNumber === selectedPit);

  const handleConfirm = () => {
    if (onPitNumberChange && selectedPit !== pitNumber) {
      onPitNumberChange(selectedPit);
    }

    if (priceType === 'user-input') {
      const amount = Number.parseFloat(userAmount);
      if (!amount || amount <= 0) {
        return;
      }
      onConfirm(amount);
    } else if (priceType === 'fixed') {
      onConfirm(fixedPrice);
    } else {
      onConfirm();
    }
  };

  const isConfirmDisabled = priceType === 'user-input' && (!userAmount || Number.parseFloat(userAmount) <= 0);

  return (
    <ModalComponent visible={isOpen} onClose={onClose}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: accentColorBg }]}>
          <IconComponent size={40} color={accentColor} />
        </View>

        {/* Request Info */}
        <View style={styles.infoSection}>
          <Text style={styles.serviceName}>{serviceName}</Text>
          <Text style={styles.requestedText}>requested to</Text>

          {hasMultipleRegistrations && onPitNumberChange ? (
            <View style={styles.pitSelector}>
              <Select value={selectedPit} onValueChange={setSelectedPit}>
                {registrations.map((reg) => (
                  <SelectItem key={reg.pitNumber} value={reg.pitNumber}>
                    Pit {reg.pitNumber} ({reg.category})
                  </SelectItem>
                ))}
              </Select>
            </View>
          ) : (
            <View style={styles.pitDisplay}>
              <MapPin size={20} color={accentColor} />
              <Text style={[styles.pitText, { color: accentColor }]}>
                Pit {pitNumber}
              </Text>
              {selectedRegistration && (
                <Text style={styles.categoryText}>({selectedRegistration.category})</Text>
              )}
            </View>
          )}

          {/* Price Display / Input */}
          {priceType === 'fixed' && fixedPrice && (
            <View style={[styles.priceDisplay, { backgroundColor: accentColorBg }]}>
              <DollarSign size={20} color={accentColor} />
              <Text style={[styles.priceText, { color: accentColor }]}>
                {fixedPrice.toFixed(2)}
              </Text>
            </View>
          )}

          {priceType === 'user-input' && (
            <View style={styles.amountInput}>
              <Text style={styles.amountLabel}>Enter Amount</Text>
              <View style={styles.amountInputContainer}>
                <DollarSign size={20} color="#737373" style={styles.dollarIcon} />
                <Input
                  value={userAmount}
                  onChangeText={setUserAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
                  style={styles.amountInputField}
                />
              </View>
            </View>
          )}
        </View>

        {/* Confirmation Text */}
        <Text style={styles.confirmationText}>
          Please confirm this service request
        </Text>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Button variant="ghost" onPress={onClose} style={styles.button}>
            Cancel
          </Button>
          <Button
            variant="default"
            onPress={handleConfirm}
            disabled={isConfirmDisabled}
            style={[styles.button, { backgroundColor: accentColor }]}
          >
            Confirm
          </Button>
        </View>
      </View>
    </ModalComponent>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fafafa',
  },
  requestedText: {
    fontSize: 14,
    color: '#737373',
  },
  pitSelector: {
    width: '100%',
  },
  pitDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pitText: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoryText: {
    fontSize: 14,
    color: '#737373',
  },
  priceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  amountInput: {
    width: '100%',
    gap: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#737373',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  dollarIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  amountInputField: {
    paddingLeft: 40,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  confirmationText: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
