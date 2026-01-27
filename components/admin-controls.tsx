import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Lock, LockOpen, Palette, Bell } from 'lucide-react-native';
import { useAdmin } from '@/contexts/AdminContext';
import { AdminAccessModal } from './admin-access-modal';
import { ColorPickerPopover } from './color-picker-popover';
import { CreateNotificationModal } from './create-notification-modal';

interface AdminControlsProps {
  onAddClick?: () => void;
  variant?: 'header' | 'floating' | 'glass';
  themeColor?: string;
  onThemeColorChange?: (color: string) => void;
  notificationTarget?: string;
  eventId?: string;
  promoterId?: string;
}

export const AdminControls = ({
  onAddClick,
  variant = 'header',
  themeColor,
  onThemeColorChange,
  notificationTarget,
  eventId,
  promoterId,
}: AdminControlsProps) => {
  const { isAdmin, setIsAdmin } = useAdmin();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const handleLockClick = () => {
    if (isAdmin) {
      // Show message that admin is already logged in
      Alert.alert(
        'Admin Access',
        'You are already logged in as admin.',
        [{ text: 'OK' }]
      );
    } else {
      // Only open modal if admin is NOT logged in
      setShowAdminModal(true);
    }
  };

  const handleAdminSuccess = () => {
    setShowAdminModal(false);
    setIsAdmin(true);
  };

  const handleColorChange = (color: string) => {
    if (onThemeColorChange) {
      onThemeColorChange(color);
    }
  };

  const getButtonStyle = () => {
    const base = {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (isAdmin) {
      return { ...base, backgroundColor: '#22c55e' };
    }
    return base;
  };

  return (
    <>
      <View style={styles.container}>
        {/* Push Notification button - only shows when admin is unlocked */}
        {isAdmin && notificationTarget && (
          <TouchableOpacity
            style={getButtonStyle()}
            onPress={() => setShowNotificationModal(true)}
          >
            <Bell size={16} color={isAdmin ? '#0a0a0a' : '#fafafa'} />
          </TouchableOpacity>
        )}

        {/* Color picker button - only shows when admin is unlocked */}
        {isAdmin && onThemeColorChange && (
          <ColorPickerPopover
            isOpen={showColorPicker}
            onOpenChange={setShowColorPicker}
            currentColor={themeColor || '160 84% 39%'}
            onColorChange={handleColorChange}
          >
            <TouchableOpacity 
              style={getButtonStyle()}
              onPress={() => setShowColorPicker(true)}
            >
              <Palette size={16} color={isAdmin ? '#0a0a0a' : '#fafafa'} />
            </TouchableOpacity>
          </ColorPickerPopover>
        )}

        {/* Lock button */}
        <TouchableOpacity style={getButtonStyle()} onPress={handleLockClick}>
          {isAdmin ? (
            <LockOpen size={16} color="#0a0a0a" />
          ) : (
            <Lock size={16} color="#fafafa" />
          )}
        </TouchableOpacity>
      </View>

      {/* Only show modal if admin is NOT logged in */}
      {!isAdmin && (
        <AdminAccessModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          onSuccess={handleAdminSuccess}
          actionType="manage"
        />
      )}

      {notificationTarget && (
        <CreateNotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          promoterName={promoterId ? notificationTarget : undefined}
          eventName={eventId ? notificationTarget : undefined}
          eventId={eventId}
          promoterId={promoterId}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
