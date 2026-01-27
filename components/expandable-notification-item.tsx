import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell, Calendar, AlertTriangle, Info, Clock, Users, ChevronDown, ChevronUp, Fuel, Droplets, Wrench, CheckCircle, Loader2 } from 'lucide-react-native';

export type NotificationType = 'event' | 'alert' | 'info' | 'schedule' | 'call' | 'urgent' | 'service_request';
export type ServiceStatus = 'pending' | 'in_progress' | 'completed';

export interface ExpandableNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: NotificationType;
  eventName?: string;
  eventId?: string;
  venueId?: string;
  userId?: string;
  isRead?: boolean;
  serviceType?: 'fuel' | 'pump_out' | 'repair' | 'other';
  serviceStatus?: ServiceStatus;
  serviceAmount?: number;
  pitNumber?: string;
  details?: string;
}

interface ExpandableNotificationItemProps extends ExpandableNotification {
  onMarkRead?: (id: string) => void;
}

const getTypeConfig = (type: NotificationType, serviceStatus?: ServiceStatus) => {
  switch (type) {
    case 'service_request':
      if (serviceStatus === 'completed') {
        return { 
          icon: CheckCircle, 
          label: 'Service Complete',
          bgColor: 'rgba(16, 185, 129, 0.15)',
          textColor: '#10b981',
        };
      }
      if (serviceStatus === 'in_progress') {
        return { 
          icon: Loader2, 
          label: 'In Progress',
          bgColor: 'rgba(245, 158, 11, 0.15)',
          textColor: '#f59e0b',
        };
      }
      return { 
        icon: Clock, 
        label: 'Service Requested',
        bgColor: 'rgba(59, 130, 246, 0.15)',
        textColor: '#3b82f6',
      };
    case 'call':
      return { 
        icon: Users, 
        label: 'Class Call',
        bgColor: 'rgba(59, 130, 246, 0.15)',
        textColor: '#3b82f6',
      };
    case 'schedule':
      return { 
        icon: Clock, 
        label: 'Schedule Update',
        bgColor: 'rgba(59, 130, 246, 0.15)',
        textColor: '#3b82f6',
      };
    case 'urgent':
    case 'alert':
      return { 
        icon: AlertTriangle, 
        label: 'Urgent',
        bgColor: 'rgba(239, 68, 68, 0.15)',
        textColor: '#ef4444',
      };
    case 'event':
      return { 
        icon: Calendar, 
        label: 'Event',
        bgColor: 'rgba(59, 130, 246, 0.15)',
        textColor: '#3b82f6',
      };
    case 'info':
    default:
      return { 
        icon: Info, 
        label: 'Info',
        bgColor: '#1f2937',
        textColor: '#737373',
      };
  }
};

const getServiceIcon = (serviceType?: string) => {
  switch (serviceType) {
    case 'fuel':
      return Fuel;
    case 'pump_out':
      return Droplets;
    case 'repair':
      return Wrench;
    default:
      return Wrench;
  }
};

export const ExpandableNotificationItem = ({ 
  id,
  title, 
  message, 
  time, 
  type, 
  eventName,
  isRead = false,
  serviceType,
  serviceStatus,
  serviceAmount,
  pitNumber,
  details,
  onMarkRead
}: ExpandableNotificationItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const config = getTypeConfig(type, serviceStatus);
  const Icon = type === 'service_request' ? getServiceIcon(serviceType) : config.icon;
  const hasExpandableContent = type === 'service_request' || details;

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && !isRead && onMarkRead) {
      onMarkRead(id);
    }
  };

  return (
    <View style={[
      styles.container,
      !isRead && styles.containerUnread,
    ]}>
      <TouchableOpacity onPress={handleOpen} style={styles.header}>
        <View style={styles.headerRow}>
          <Icon 
            size={16} 
            color={config.textColor}
            style={{ marginRight: 8 }}
          />
          <View style={[styles.badge, { backgroundColor: config.bgColor, marginRight: 8 }]}>
            <Text style={[styles.badgeText, { color: config.textColor }]}>
              {config.label}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.timeText}>{time}</Text>
            {!isRead && <View style={[styles.unreadDot, { marginLeft: 6 }]} />}
            {hasExpandableContent && (
              <View style={{ marginLeft: 6 }}>
                {isOpen ? <ChevronUp size={16} color="#737373" /> : <ChevronDown size={16} color="#737373" />}
              </View>
            )}
          </View>
        </View>
        
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        
        {eventName && (
          <View style={styles.eventTag}>
            <Text style={styles.eventTagText}>{eventName}</Text>
          </View>
        )}
      </TouchableOpacity>

      {hasExpandableContent && isOpen && (
        <View style={styles.expandedContent}>
          {type === 'service_request' && (
            <View style={styles.serviceDetails}>
              {pitNumber && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pit Location</Text>
                  <Text style={styles.detailValue}>{pitNumber}</Text>
                </View>
              )}
              {serviceAmount !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.detailValue}>${serviceAmount.toFixed(2)}</Text>
                </View>
              )}
              {serviceStatus && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={[
                    styles.statusBadge,
                    serviceStatus === 'completed' && styles.statusBadgeCompleted,
                    serviceStatus === 'in_progress' && styles.statusBadgeInProgress,
                    serviceStatus === 'pending' && styles.statusBadgePending,
                  ]}>
                    <Text style={[
                      styles.statusText,
                      serviceStatus === 'completed' && styles.statusTextCompleted,
                      serviceStatus === 'in_progress' && styles.statusTextInProgress,
                      serviceStatus === 'pending' && styles.statusTextPending,
                    ]}>
                      {serviceStatus === 'completed' ? 'Completed' : 
                       serviceStatus === 'in_progress' ? 'In Progress' : 'Pending'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {details && (
            <Text style={styles.detailsText}>{details}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
  },
  containerUnread: {
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
  },
  header: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  timeText: {
    fontSize: 12,
    color: '#737373',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  message: {
    fontSize: 15,
    color: '#d1d5db',
    lineHeight: 22,
  },
  eventTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#1f2937',
    marginTop: 8,
  },
  eventTagText: {
    fontSize: 12,
    color: '#737373',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    marginTop: 12,
    paddingTop: 12,
  },
  serviceDetails: {
    // gap: 8, - using marginBottom instead
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#737373',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusBadgeInProgress: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusBadgePending: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextCompleted: {
    color: '#10b981',
  },
  statusTextInProgress: {
    color: '#f59e0b',
  },
  statusTextPending: {
    color: '#3b82f6',
  },
  detailsText: {
    fontSize: 14,
    color: '#737373',
    marginTop: 8,
  },
});
