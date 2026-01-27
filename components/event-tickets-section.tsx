import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ticket as TicketIcon, QrCode, Download, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible-new';

interface Ticket {
  id: string;
  ticketType: string;
  status: 'active' | 'used' | 'expired';
  qrCode?: string;
}

interface EventTicketsSectionProps {
  tickets: Ticket[];
  accentColor: string;
  accentColorBg: string;
}

export const EventTicketsSection = ({
  tickets,
  accentColor,
  accentColorBg,
}: EventTicketsSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  const getStatusColor = (status: Ticket['status']) => {
    switch (status) {
      case 'active':
        return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' };
      case 'used':
        return { bg: '#1f2937', text: '#737373', border: '#374151' };
      case 'expired':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
    }
  };

  const handleViewQR = (ticket: Ticket) => {
    setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id);
  };

  const handleDownload = (ticket: Ticket) => {
    // In a real app, this would trigger a PDF download
  };

  if (tickets.length === 0) {
    return null;
  }

  const activeTickets = tickets.filter((t) => t.status === 'active');

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <View style={styles.container}>
        <CollapsibleTrigger asChild>
          <TouchableOpacity style={styles.trigger}>
            <View style={styles.triggerContent}>
              <View style={styles.triggerLeft}>
                <TicketIcon size={20} color={accentColor} />
                <Text style={styles.triggerTitle}>Your Tickets</Text>
              </View>
              <View style={styles.triggerRight}>
                <View style={[styles.badge, { backgroundColor: accentColorBg }]}>
                  <Text style={[styles.badgeText, { color: accentColor }]}>
                    {activeTickets.length} active
                  </Text>
                </View>
                {isOpen ? (
                  <ChevronUp size={16} color="#737373" />
                ) : (
                  <ChevronDown size={16} color="#737373" />
                )}
              </View>
            </View>
          </TouchableOpacity>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <View style={styles.content}>
            {tickets.map((ticket) => {
              const statusColors = getStatusColor(ticket.status);
              return (
                <View key={ticket.id} style={styles.ticketItem}>
                  <View style={styles.ticketHeader}>
                    <View style={styles.ticketLeft}>
                      <View
                        style={[
                          styles.ticketIconContainer,
                          { backgroundColor: accentColorBg },
                        ]}
                      >
                        <TicketIcon size={20} color={accentColor} />
                      </View>
                      <View>
                        <Text style={styles.ticketType}>{ticket.ticketType}</Text>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor: statusColors.bg,
                              borderColor: statusColors.border,
                            },
                          ]}
                        >
                          <Text style={[styles.statusText, { color: statusColors.text }]}>
                            {ticket.status}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {ticket.status === 'active' && (
                      <View style={styles.ticketActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDownload(ticket)}
                        >
                          <Download size={16} color={accentColor} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleViewQR(ticket)}
                        >
                          <QrCode size={16} color={accentColor} />
                          {expandedTicket === ticket.id ? (
                            <ChevronUp size={12} color={accentColor} style={{ marginLeft: 4 }} />
                          ) : (
                            <ChevronDown size={12} color={accentColor} style={{ marginLeft: 4 }} />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* QR Code Section */}
                  {expandedTicket === ticket.id && ticket.status === 'active' && (
                    <View style={styles.qrSection}>
                      <View style={[styles.qrContainer, { backgroundColor: accentColorBg }]}>
                        {/* Placeholder QR Code */}
                        <View style={styles.qrPlaceholder}>
                          <View style={styles.qrGrid}>
                            {Array.from({ length: 25 }).map((_, i) => (
                              <View
                                key={i}
                                style={[
                                  styles.qrCell,
                                  { backgroundColor: i % 3 === 0 || i % 7 === 0 ? '#000' : '#fff' },
                                ]}
                              />
                            ))}
                          </View>
                        </View>
                        <Text style={styles.qrHint}>
                          Present this QR code at entry
                        </Text>
                        <Button
                          variant="outline"
                          onPress={() => handleDownload(ticket)}
                          style={styles.downloadButton}
                        >
                          <Download size={16} color={accentColor} style={{ marginRight: 8 }} />
                          <Text style={[styles.downloadText, { color: accentColor }]}>
                            Download Ticket
                          </Text>
                        </Button>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </CollapsibleContent>
      </View>
    </Collapsible>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    overflow: 'hidden',
  },
  trigger: {
    width: '100%',
    padding: 16,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  triggerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fafafa',
  },
  triggerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  ticketItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  ticketIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fafafa',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  ticketActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  qrSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  qrContainer: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 192,
    height: 192,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  qrGrid: {
    width: 160,
    height: 160,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  qrCell: {
    width: 30,
    height: 30,
    borderRadius: 2,
  },
  qrHint: {
    fontSize: 12,
    color: '#737373',
    textAlign: 'center',
    marginBottom: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#22c55e',
  },
  downloadText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
