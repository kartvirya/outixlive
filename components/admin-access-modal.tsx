import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ModalComponent } from './ui/modal';
import { Input } from './ui/input';
import { Button } from './ui/button';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdminAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionType: 'manage' | 'create';
}

export const AdminAccessModal = ({
  isOpen,
  onClose,
  onSuccess,
  actionType,
}: AdminAccessModalProps) => {
  const [username, setUsername] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    // Demo: accept any key with 4+ characters
    if (username.trim() && accessKey.length >= 4) {
      setError('');
      // Save admin login state to AsyncStorage
      await AsyncStorage.setItem('adminLoggedIn', 'true');
      setUsername('');
      setAccessKey('');
      onSuccess();
    } else {
      setError('Please enter both username and password');
    }
  };

  const handleClose = () => {
    setUsername('');
    setAccessKey('');
    setError('');
    onClose();
  };
  return (
    <ModalComponent
      visible={isOpen}
      onClose={handleClose}
      title="Admin Access"
    >
      <View style={styles.content}>
        <Text style={styles.description}>
          Enter the admin access key to {actionType === 'create' ? 'create a notification' : 'manage events'}
        </Text>

        <Input
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            setError('');
          }}
          placeholder="Username"
          style={styles.input}
        />

        <Input
          value={accessKey}
          onChangeText={(text) => {
            setAccessKey(text);
            setError('');
          }}
          placeholder="Password"
          secureTextEntry
          style={styles.input}
        />

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        <View style={styles.buttons}>
          <Button
            variant="ghost"
            onPress={handleClose}
            style={styles.button}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onPress={handleSubmit}
            style={styles.button}
          >
            Enter
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
  description: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'center',
  },
  input: {
    marginTop: 8,
  },
  error: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
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
