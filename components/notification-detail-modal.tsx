import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ModalComponent } from './ui/modal';
import { getAlertDetails, markAlertAsRead } from '@/lib/api';

interface NotificationData {
  NotificationID: string;
  EventID: string;
  PushedDate: string;
  opened: string;
  OpenDate: string | null;
  notification_type: string;
  notification: string;
  notification_message: string;
  alertinfo: string;
}

interface NotificationDetailModalProps {
  visible: boolean;
  onClose: () => void;
  notificationId: string;
}

export const NotificationDetailModal = ({
  visible,
  onClose,
  notificationId,
}: NotificationDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null);

  useEffect(() => {
    if (visible && notificationId) {
      loadNotificationDetails();
    }
  }, [visible, notificationId]);

  const loadNotificationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[NOTIFICATION-MODAL] 📥 Fetching details for:', notificationId);
      
      // Fetch notification details
      const response = await getAlertDetails(notificationId);
      
      if (response.error) {
        throw new Error(response.msg || 'Failed to load notification details');
      }

      setNotificationData(response.msg);
      
      // Mark as read if not already opened
      if (response.msg.opened === '0') {
        console.log('[NOTIFICATION-MODAL] 📖 Marking as read...');
        await markAlertAsRead(notificationId);
      }
      
      console.log('[NOTIFICATION-MODAL] ✅ Details loaded successfully');
    } catch (err) {
      console.error('[NOTIFICATION-MODAL] ❌ Error loading details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notification');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNotificationData(null);
    setError(null);
    onClose();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <ModalComponent
      visible={visible}
      onClose={handleClose}
      title="Notification Details"
    >
      <ScrollView style={styles.container}>
        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Loading notification...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ {error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadNotificationDetails}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && notificationData && (
          <View style={styles.content}>
            {/* Notification Type */}
            {notificationData.notification_type && (
              <View style={styles.section}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notificationData.notification_type}</Text>
                </View>
              </View>
            )}

            {/* Title */}
            {notificationData.notification && (
              <View style={styles.section}>
                <Text style={styles.label}>Title</Text>
                <Text style={styles.value}>{notificationData.notification}</Text>
              </View>
            )}

            {/* Message */}
            {notificationData.notification_message && (
              <View style={styles.section}>
                <Text style={styles.label}>Message</Text>
                <Text style={styles.message}>{notificationData.notification_message}</Text>
              </View>
            )}

            {/* Alert Info */}
            {notificationData.alertinfo && (
              <View style={styles.section}>
                <Text style={styles.label}>Additional Info</Text>
                <Text style={styles.value}>{notificationData.alertinfo}</Text>
              </View>
            )}

            {/* Date */}
            <View style={styles.section}>
              <Text style={styles.label}>Received</Text>
              <Text style={styles.date}>{formatDate(notificationData.PushedDate)}</Text>
            </View>

            {/* Status */}
            <View style={styles.section}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.value}>
                {notificationData.opened === '0' ? '📬 New' : '✅ Read'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {!loading && !error && notificationData && (
        <TouchableOpacity style={styles.closeActionButton} onPress={handleClose}>
          <Text style={styles.closeActionButtonText}>Close</Text>
        </TouchableOpacity>
      )}
    </ModalComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 500,
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 16,
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fafafa',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    gap: 20,
  },
  section: {
    gap: 8,
  },
  label: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    color: '#fafafa',
    fontSize: 16,
  },
  message: {
    color: '#e5e7eb',
    fontSize: 16,
    lineHeight: 24,
  },
  date: {
    color: '#d1d5db',
    fontSize: 14,
  },
  badge: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  closeActionButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  closeActionButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
});
