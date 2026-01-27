import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type LatLng = { latitude: number; longitude: number };

export function isValidLatLng(value: Partial<LatLng> | null | undefined): value is LatLng {
  if (!value) return false;
  const { latitude, longitude } = value;
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}

/**
 * Haversine distance in kilometers.
 */
export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * (sinDLon * sinDLon);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Best-effort location getter (works on web; may be unavailable on native without extra deps/permissions).
 */
export async function getBrowserLocation(options?: {
  timeoutMs?: number;
  enableHighAccuracy?: boolean;
  maximumAgeMs?: number;
}): Promise<LatLng> {
  const timeoutMs = options?.timeoutMs ?? 10000;
  const enableHighAccuracy = options?.enableHighAccuracy ?? true;
  const maximumAgeMs = options?.maximumAgeMs ?? 300000;

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not available on this device.');
  }

  return await new Promise<LatLng>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => reject(new Error(err.message || 'Failed to get location.')),
      { timeout: timeoutMs, enableHighAccuracy, maximumAge: maximumAgeMs },
    );
  });
}
