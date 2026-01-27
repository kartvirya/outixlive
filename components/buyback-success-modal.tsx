import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle, CreditCard } from 'lucide-react-native';
import { ModalComponent } from './ui/modal';
import { Button } from './ui/button';
import { useBuyback } from '@/contexts/BuybackContext';

export const BuybackSuccessModal = () => {
  const { showSuccessModal, successInfo, setShowSuccessModal } = useBuyback();

  if (!showSuccessModal || !successInfo) {
    return null;
  }

  return (
    <ModalComponent
      visible={showSuccessModal}
      onClose={() => setShowSuccessModal(false)}
      showCloseButton={true}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle size={48} color="#10b981" />
        </View>
        <Text style={styles.title}>Buyback Confirmed!</Text>
        <Text style={styles.message}>
          You've successfully bought back into {successInfo.raceName}
        </Text>
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Charged</Text>
            <Text style={styles.detailValue}>${successInfo.amount.toFixed(2)}</Text>
          </View>
          <View style={styles.detailRow}>
            <CreditCard size={16} color="#737373" style={{ marginRight: 8 }} />
            <Text style={styles.detailLabel}>Card ending in</Text>
            <Text style={styles.detailValue}>{successInfo.cardLast4}</Text>
          </View>
        </View>
        <Button
          onPress={() => setShowSuccessModal(false)}
          style={styles.button}
        >
          Continue Racing
        </Button>
      </View>
    </ModalComponent>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fafafa',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
    marginBottom: 24,
  },
  details: {
    width: '100%',
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#737373',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fafafa',
  },
  button: {
    width: '100%',
  },
});
