import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle, MessageSquare, Send } from 'lucide-react-native';
import { ModalComponent } from './ui/modal';
import { Button } from './ui/button';

interface CompleteServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (sendNotification: boolean) => void;
  serviceName: string;
  requesterName: string;
  themeColor?: string;
}

export const CompleteServiceModal = ({
  isOpen,
  onClose,
  onComplete,
  serviceName,
  requesterName,
  themeColor = '160 84% 39%',
}: CompleteServiceModalProps) => {
  const accentColor = '#22c55e';
  const accentColorBg = 'rgba(16, 185, 129, 0.15)';

  return (
    <ModalComponent visible={isOpen} onClose={onClose}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: accentColorBg }]}>
          <CheckCircle size={32} color="#10b981" />
        </View>

        {/* Text */}
        <View style={styles.textSection}>
          <Text style={styles.title}>Mark as Complete?</Text>
          <Text style={styles.description}>
            {serviceName} for {requesterName}
          </Text>
        </View>

        {/* Question */}
        <View style={styles.questionBox}>
          <View style={styles.questionHeader}>
            <MessageSquare size={20} color="#737373" />
            <Text style={styles.questionText}>Notify the racer?</Text>
          </View>
          <Text style={styles.questionHint}>
            Send a notification to let them know the service is complete
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Button
            variant="default"
            onPress={() => onComplete(true)}
            style={[styles.button, { backgroundColor: accentColor }]}
          >
            <Send size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Complete & Notify Racer</Text>
          </Button>
          <Button variant="outline" onPress={() => onComplete(false)} style={styles.button}>
            <Text style={styles.outlineButtonText}>Complete Without Notification</Text>
          </Button>
          <Button variant="ghost" onPress={onClose} style={styles.button}>
            <Text style={styles.ghostButtonText}>Cancel</Text>
          </Button>
        </View>
      </View>
    </ModalComponent>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fafafa',
  },
  description: {
    fontSize: 14,
    color: '#737373',
  },
  questionBox: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    alignItems: 'center',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fafafa',
  },
  questionHint: {
    fontSize: 12,
    color: '#737373',
    textAlign: 'center',
  },
  buttons: {
    width: '100%',
    gap: 8,
  },
  button: {
    width: '100%',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButtonText: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '600',
  },
  ghostButtonText: {
    color: '#737373',
    fontSize: 16,
  },
});
