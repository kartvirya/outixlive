import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/header';
import { User as UserIcon, Mail, Phone, LogOut, Check, Edit2, Bug } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { LoginModal } from '@/components/login-modal';
import { useAuth } from '@/hooks/useAuth';
import { debugPushTokenSetup } from '@/lib/pushNotifications';

export default function ProfileScreen() {
  const { user, isAuthenticated, isLoading, error, login, logout, updateProfile } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const success = await updateProfile({ name, phone });
    if (success) {
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const debugTokens = async () => {
    try {
      Alert.alert('Debug Started', 'Check console for detailed output...');
      console.log('\n🔍 STARTING AWS SNS TOKEN DEBUG...');
      const result = await debugPushTokenSetup();
      
      const summary = result.error 
        ? `❌ Error: ${result.error}`
        : `✅ Token Valid: ${result.tokenValid}\n📱 Platform: ${result.platform}\n📏 Length: ${result.tokenLength} chars\n🔐 Permissions: ${result.permissionStatus}`;
      
      Alert.alert('Debug Complete', summary);
    } catch (error) {
      Alert.alert('Debug Error', error.message);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.content}>
          <View style={styles.loginPrompt}>
            <View style={styles.avatarPlaceholder}>
              <UserIcon size={40} color="#737373" />
            </View>
            <Text style={styles.loginTitle}>Welcome to Outix</Text>
            <Text style={styles.loginSubtitle}>
              Sign in to manage your venue subscriptions and get personalized alerts
            </Text>
            <Button onPress={() => setShowLoginModal(true)} style={styles.loginButton}>
              Sign In
            </Button>
          </View>
        </View>
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={login}
          isLoading={isLoading}
          error={error}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <TouchableOpacity
            onPress={() => isEditing ? handleSave() : setIsEditing(true)}
            style={styles.editButton}
          >
            {(() => {
              if (isEditing) {
                return saveSuccess ? (
                  <Check size={20} color="#22c55e" />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                );
              }
              return <Edit2 size={20} color="#737373" />;
            })()}
          </TouchableOpacity>
        </View>

        <View style={styles.avatarSection}>
          {user.avatar ? (
            <Image 
              source={{ uri: user.avatar }} 
              style={styles.avatarImage}
              placeholder={require('@/assets/images/icon.png')}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatar}>
              <UserIcon size={40} color="#737373" />
            </View>
          )}
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.phone && (
            <View style={styles.phoneRow}>
              <Phone size={14} color="#737373" style={{ marginRight: 6 }} />
              <Text style={styles.phone}>{user.phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="#737373"
              />
            ) : (
              <View style={styles.valueContainer}>
                <Text style={styles.value}>{user.name}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>User ID</Text>
            <View style={styles.valueContainer}>
              <Text style={[styles.value, styles.idText]}>{user.id}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.valueContainer}>
              <Mail size={16} color="#737373" style={styles.icon} />
              <Text style={styles.value}>{user.email}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Your phone"
                placeholderTextColor="#737373"
                keyboardType="phone-pad"
              />
            ) : (
              <View style={styles.valueContainer}>
                <Phone size={16} color="#737373" style={styles.icon} />
                <Text style={styles.value}>{user.phone || 'Not set'}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Button
            variant="outline"
            onPress={logout}
            style={styles.logoutButton}
          >
            <LogOut size={16} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Button>
          
          <Button
            variant="outline"
            onPress={debugTokens}
            style={[styles.logoutButton, { marginTop: 12, borderColor: '#3b82f6' }]}
          >
            <Bug size={16} color="#3b82f6" style={{ marginRight: 8 }} />
            <Text style={[styles.logoutText, { color: '#3b82f6' }]}>Debug Push Tokens</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loginPrompt: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 32,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fafafa',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  loginButton: {
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fafafa',
  },
  editButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '600',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    backgroundColor: '#111827',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#737373',
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  phone: {
    fontSize: 14,
    color: '#737373',
  },
  section: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    height: 44,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
    color: '#fff',
    fontSize: 16,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 8,
  },
  value: {
    fontSize: 16,
    color: '#fff',
  },
  idText: {
    fontSize: 14,
    color: '#737373',
    fontFamily: 'monospace',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#ef4444',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
