/**
 * AWS SNS Token Debug Component
 * 
 * Use this component to test and debug your push token setup
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  debugPushTokenSetup, 
  requestNotificationPermissions,
  getDevicePushToken,
  registerPushTokenWithBackend,
  sendTestNotification 
} from '@/lib/pushNotifications';
import { getDeviceToken } from '@/lib/deviceToken';
import { testTokenFormatting } from '@/lib/awsSnsTokenUtils';

interface DebugInfo {
  deviceType?: boolean;
  platform?: string;
  permissionStatus?: string;
  tokenValid?: boolean;
  tokenLength?: number;
  originalTokenLength?: number;
  warnings?: string[];
  registrationSuccess?: boolean;
  error?: string;
}

export function TokenDebugScreen() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentToken, setCurrentToken] = useState<string>('');

  const runFullDebug = async () => {
    setIsLoading(true);
    try {
      const result = await debugPushTokenSetup();
      setDebugInfo(result);
    } catch (error) {
      Alert.alert('Debug Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const success = await requestNotificationPermissions();
      Alert.alert(
        'Permissions', 
        success ? 'Permissions granted' : 'Permissions denied'
      );
    } catch (error) {
      Alert.alert('Permission Error', error.message);
    }
  };

  const getCurrentToken = async () => {
    try {
      const token = await getDevicePushToken();
      if (token) {
        setCurrentToken(token.data);
        Alert.alert('Token Retrieved', `Length: ${token.data.length} chars`);
      } else {
        Alert.alert('Error', 'No token available');
      }
    } catch (error) {
      Alert.alert('Token Error', error.message);
    }
  };

  const testTokenValidation = () => {
    testTokenFormatting();
    Alert.alert('Test Complete', 'Check console for validation results');
  };

  const testRegistration = async () => {
    try {
      const result = await registerPushTokenWithBackend();
      Alert.alert(
        'Registration Test', 
        result ? 'Success' : 'Failed (check logs)'
      );
    } catch (error) {
      Alert.alert('Registration Error', error.message);
    }
  };

  const sendTest = async () => {
    try {
      await sendTestNotification();
      Alert.alert('Test Sent', 'Check for notification');
    } catch (error) {
      Alert.alert('Test Error', error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>AWS SNS Token Debug</Text>
        <Text style={styles.subtitle}>
          Debug your push notification token setup
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button 
            onPress={runFullDebug} 
            disabled={isLoading}
            style={styles.button}
          >
            {isLoading ? 'Running Debug...' : 'Run Full Debug'}
          </Button>
          
          <Button onPress={requestPermissions} style={styles.button}>
            Request Permissions
          </Button>
          
          <Button onPress={getCurrentToken} style={styles.button}>
            Get Current Token
          </Button>
          
          <Button onPress={testTokenValidation} style={styles.button}>
            Test Token Validation
          </Button>
          
          <Button onPress={testRegistration} style={styles.button}>
            Test Registration
          </Button>
          
          <Button onPress={sendTest} style={styles.button}>
            Send Test Notification
          </Button>
        </View>

        {debugInfo && (
          <Card style={styles.resultCard}>
            <Text style={styles.resultTitle}>Debug Results:</Text>
            
            <View style={styles.resultRow}>
              <Text style={styles.label}>Device Type:</Text>
              <Text style={styles.value}>
                {debugInfo.deviceType ? '📱 Physical' : '🖥️ Simulator'}
              </Text>
            </View>
            
            <View style={styles.resultRow}>
              <Text style={styles.label}>Platform:</Text>
              <Text style={styles.value}>{debugInfo.platform}</Text>
            </View>
            
            <View style={styles.resultRow}>
              <Text style={styles.label}>Permissions:</Text>
              <Text style={[
                styles.value, 
                debugInfo.permissionStatus === 'granted' ? styles.success : styles.error
              ]}>
                {debugInfo.permissionStatus}
              </Text>
            </View>
            
            {debugInfo.tokenValid !== undefined && (
              <>
                <View style={styles.resultRow}>
                  <Text style={styles.label}>Token Valid:</Text>
                  <Text style={[
                    styles.value, 
                    debugInfo.tokenValid ? styles.success : styles.error
                  ]}>
                    {debugInfo.tokenValid ? '✅ Valid' : '❌ Invalid'}
                  </Text>
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.label}>Token Length:</Text>
                  <Text style={styles.value}>{debugInfo.tokenLength} chars</Text>
                </View>
                
                {debugInfo.originalTokenLength && (
                  <View style={styles.resultRow}>
                    <Text style={styles.label}>Original Length:</Text>
                    <Text style={styles.value}>{debugInfo.originalTokenLength} chars</Text>
                  </View>
                )}
                
                {debugInfo.warnings && debugInfo.warnings.length > 0 && (
                  <View style={styles.resultRow}>
                    <Text style={styles.label}>Warnings:</Text>
                    <Text style={styles.warning}>
                      {debugInfo.warnings.join(', ')}
                    </Text>
                  </View>
                )}
              </>
            )}
            
            {debugInfo.registrationSuccess !== undefined && (
              <View style={styles.resultRow}>
                <Text style={styles.label}>Registration:</Text>
                <Text style={[
                  styles.value, 
                  debugInfo.registrationSuccess ? styles.success : styles.error
                ]}>
                  {debugInfo.registrationSuccess ? '✅ Success' : '❌ Failed'}
                </Text>
              </View>
            )}
            
            {debugInfo.error && (
              <View style={styles.resultRow}>
                <Text style={styles.label}>Error:</Text>
                <Text style={styles.error}>{debugInfo.error}</Text>
              </View>
            )}
          </Card>
        )}

        {currentToken && (
          <Card style={styles.tokenCard}>
            <Text style={styles.resultTitle}>Current Token:</Text>
            <Text style={styles.tokenText}>
              {currentToken.substring(0, 40)}...
            </Text>
            <Text style={styles.tokenLength}>
              Length: {currentToken.length} characters
            </Text>
          </Card>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    marginBottom: 8,
  },
  resultCard: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  label: {
    fontWeight: 'bold',
    flex: 1,
  },
  value: {
    flex: 2,
    textAlign: 'right',
  },
  success: {
    color: '#22c55e',
  },
  error: {
    color: '#ef4444',
  },
  warning: {
    color: '#f59e0b',
    flex: 2,
    textAlign: 'right',
    fontSize: 12,
  },
  tokenCard: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#eff6ff',
  },
  tokenText: {
    fontFamily: 'monospace',
    fontSize: 12,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  tokenLength: {
    fontSize: 12,
    color: '#666',
  },
});