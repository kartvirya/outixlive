import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ModalComponent } from './ui/modal';
import { Button } from './ui/button';
import { sendEventAlert, sendPromoterAlert } from '@/lib/api';

interface CreateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoterName?: string;
  eventName?: string;
  eventId?: string;
  promoterId?: string;
}

export const CreateNotificationModal = ({
  isOpen,
  onClose,
  promoterName,
  eventName,
  eventId,
  promoterId,
}: CreateNotificationModalProps) => {
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState('');
  const [notificationIcon, setNotificationIcon] = useState('1');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || !notificationType.trim()) {
      return;
    }

    setIsSending(true);
    try {
      if (eventId && promoterId) {
        // Send event alert
        await sendEventAlert(
          promoterId,
          eventId,
          notificationType.trim(),
          message.trim(),
          notificationIcon
        );
      } else if (promoterId) {
        // Send promoter alert
        await sendPromoterAlert(
          promoterId,
          notificationType.trim(),
          message.trim(),
          notificationIcon
        );
      } else {
        throw new Error('Missing event or promoter ID');
      }

      Alert.alert('Success', 'Notification sent successfully');
      setMessage('');
      setNotificationType('');
      setNotificationIcon('1');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const targetName = eventName || promoterName || 'Target';
  const isEvent = !!eventName;

  return (
    <ModalComponent
      visible={isOpen}
      onClose={onClose}
      title="Create Notification"
    >
      <View style={styles.content}>
        <View>
          <Text style={styles.label}>From: {targetName}</Text>
          <Text style={styles.inputLabel}>Notification Type</Text>
          <TextInput
            style={styles.input}
            value={notificationType}
            onChangeText={setNotificationType}
            placeholder="e.g., Class Call, Urgent, Schedule"
            placeholderTextColor="#737373"
          />
          <TextInput
            style={styles.textarea}
            value={message}
            onChangeText={setMessage}
            placeholder="Enter your notification message..."
            placeholderTextColor="#737373"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <Text style={styles.hint}>
          {isEvent 
            ? 'This notification will be sent to all subscribers of this event.'
            : 'This notification will be sent to all subscribers of this promoter.'}
        </Text>

        <View style={styles.buttons}>
          <Button
            variant="ghost"
            onPress={onClose}
            style={styles.button}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onPress={handleSubmit}
            disabled={!message.trim() || !notificationType.trim() || isSending}
            style={styles.button}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              'Send Notification'
            )}
          </Button>
        </View>
      </View>
    </ModalComponent>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    color: '#737373',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    height: 44,
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  textarea: {
    height: 100,
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
    paddingTop: 12,
    color: '#fff',
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: '#737373',
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});
