import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { X, Clock, MapPin } from 'lucide-react-native';
import { ModalComponent } from './ui/modal';
import { Button } from './ui/button';
import { getActionIconComponent, ActionIconType } from '@/lib/icon-utils';

export interface ServiceRequest {
  id: string;
  serviceName: string;
  pitNumber: string;
  icon: ActionIconType;
  timestamp: Date;
  status: 'pending' | 'in-progress' | 'completed';
}

interface ActiveServiceRequestsProps {
  isOpen: boolean;
  onClose: () => void;
  requests: ServiceRequest[];
  onCancelRequest: (requestId: string) => void;
  themeColor?: string;
}

export const ActiveServiceRequests = ({
  isOpen,
  onClose,
  requests,
  onCancelRequest,
  themeColor = '160 84% 39%',
}: ActiveServiceRequestsProps) => {
  const accentColor = '#22c55e';
  const accentColorBg = 'rgba(34, 197, 94, 0.15)';

  const pendingRequests = requests.filter((r) => r.status !== 'completed');

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ModalComponent visible={isOpen} onClose={onClose} title="Active Service Requests">
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {pendingRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No active service requests</Text>
          </View>
        ) : (
          <View style={styles.requestsList}>
            {pendingRequests.map((request) => {
              const IconComponent = getActionIconComponent(request.icon);
              return (
                <View
                  key={request.id}
                  style={[
                    styles.requestItem,
                    { backgroundColor: accentColorBg, borderColor: 'rgba(34, 197, 94, 0.2)' },
                  ]}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
                    ]}
                  >
                    <IconComponent size={24} color={accentColor} />
                  </View>

                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>{request.serviceName}</Text>
                    <View style={styles.requestMeta}>
                      <View style={styles.metaItem}>
                        <MapPin size={14} color="#737373" />
                        <Text style={styles.metaText}>Pit {request.pitNumber}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Clock size={14} color="#737373" />
                        <Text style={styles.metaText}>{formatTime(request.timestamp)}</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        request.status === 'in-progress'
                          ? { backgroundColor: 'rgba(234, 179, 8, 0.2)' }
                          : { backgroundColor: accentColorBg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          request.status === 'in-progress'
                            ? { color: '#facc15' }
                            : { color: accentColor },
                        ]}
                      >
                        {request.status === 'in-progress' ? 'In Progress' : 'Pending'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => onCancelRequest(request.id)}
                  >
                    <X size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Button variant="ghost" onPress={onClose} style={styles.closeButton}>
        Close
      </Button>
    </ModalComponent>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 400,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#737373',
  },
  requestsList: {
    gap: 12,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fafafa',
    marginBottom: 4,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#737373',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 8,
  },
  closeButton: {
    width: '100%',
    marginTop: 16,
  },
});
