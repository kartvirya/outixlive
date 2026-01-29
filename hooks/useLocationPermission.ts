import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export function useLocationPermission() {
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      return status === Location.PermissionStatus.GRANTED;
    } catch (error) {
      return false;
    }
  };

  return {
    permissionStatus,
    isLoading,
    isGranted: permissionStatus === Location.PermissionStatus.GRANTED,
    requestPermission,
    checkPermission,
  };
}
