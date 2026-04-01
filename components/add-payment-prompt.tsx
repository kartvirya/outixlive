import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CreditCard } from 'lucide-react-native';
import { ModalComponent } from './ui/modal';
import { Button } from './ui/button';
import { useBuyback } from '@/contexts/BuybackContext';

export const AddPaymentPrompt = () => {
  const { showPaymentPrompt, setShowPaymentPrompt, addCard } = useBuyback();
  const [isAdding, setIsAdding] = React.useState(false);

  const handleAddCard = async () => {
    setIsAdding(true);
    // Simulate adding a card
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    addCard({
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2027,
    });
    
    setIsAdding(false);
    setShowPaymentPrompt(false);
  };

  return (
    <ModalComponent
      visible={showPaymentPrompt}
      onClose={() => setShowPaymentPrompt(false)}
      showCloseButton={true}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CreditCard size={48} color="#f59e0b" />
        </View>
        <Text style={styles.title}>Payment Method Required</Text>
        <Text style={styles.message}>
          You need to add a payment method to complete the buyback. We will securely save your card for future purchases.
        </Text>
        <View style={styles.actions}>
          <Button
            variant="outline"
            onPress={() => setShowPaymentPrompt(false)}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button
            onPress={handleAddCard}
            loading={isAdding}
            style={styles.addButton}
          >
            Add Card
          </Button>
        </View>
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
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fafafa',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    marginRight: 6,
  },
  addButton: {
    flex: 1,
    marginLeft: 6,
  },
});
