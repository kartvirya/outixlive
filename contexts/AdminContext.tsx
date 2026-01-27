import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdminContextType {
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
  toggleAdmin: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = 'adminLoggedIn';

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  // Load admin state from AsyncStorage on mount
  useEffect(() => {
    const loadAdminState = async () => {
      try {
        const value = await AsyncStorage.getItem(ADMIN_STORAGE_KEY);
        if (value === 'true') {
          setIsAdmin(true);
        }
      } catch {
        // Ignore storage errors
      }
    };
    loadAdminState();
  }, []);

  // Persist admin state to AsyncStorage when it changes
  useEffect(() => {
    const saveAdminState = async () => {
      try {
        if (isAdmin) {
          await AsyncStorage.setItem(ADMIN_STORAGE_KEY, 'true');
        } else {
          await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);
        }
      } catch {
        // Ignore storage errors
      }
    };
    saveAdminState();
  }, [isAdmin]);

  const toggleAdmin = () => setIsAdmin(prev => !prev);

  const contextValue = useMemo(
    () => ({ isAdmin, setIsAdmin, toggleAdmin }),
    [isAdmin]
  );

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
