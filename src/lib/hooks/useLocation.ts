import { useState, useEffect } from 'react';
import { Location } from '@/types/game';

export const useLocation = () => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // 計算兩點之間的距離（米）
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // 地球半徑（米）
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // 檢查位置權限
  const checkLocationPermission = async () => {
    if (typeof window === 'undefined') return;

    try {
      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permissionStatus.state === 'granted') {
        setPermissionGranted(true);
        return true;
      } else if (permissionStatus.state === 'prompt') {
        return true;
      } else {
        setPermissionGranted(false);
        setError('請在瀏覽器設定中允許使用位置權限');
        return false;
      }
    } catch (error) {
      console.error('檢查位置權限失敗:', error);
      setError('無法檢查位置權限，請確保瀏覽器支援位置服務');
      return false;
    }
  };

  // 獲取當前位置
  const getCurrentLocation = async () => {
    if (typeof window === 'undefined') return;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const location: Location = {
        name: '當前位置',
        address: '',
        coordinates: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
      };

      setCurrentLocation(location);
      setError(null);
      return location;
    } catch (error) {
      console.error('獲取位置失敗:', error);
      setError('無法獲取位置，請確保已開啟位置服務');
      return null;
    }
  };

  // 計算與目標位置的距離
  const getDistanceToTarget = (targetLocation: Location): number | null => {
    if (!currentLocation) return null;

    return calculateDistance(
      currentLocation.coordinates.lat,
      currentLocation.coordinates.lng,
      targetLocation.coordinates.lat,
      targetLocation.coordinates.lng
    );
  };

  // 檢查是否在目標位置範圍內
  const isWithinRange = (targetLocation: Location, maxDistance: number = 1000): boolean => {
    const distance = getDistanceToTarget(targetLocation);
    return distance !== null && distance <= maxDistance;
  };

  // 初始化位置服務
  useEffect(() => {
    const initLocation = async () => {
      setLoading(true);
      try {
        const hasPermission = await checkLocationPermission();
        if (hasPermission) {
          await getCurrentLocation();
        }
      } catch (error) {
        console.error('初始化位置服務失敗:', error);
        setError('初始化位置服務失敗');
      } finally {
        setLoading(false);
      }
    };

    initLocation();
  }, []);

  return {
    currentLocation,
    loading,
    error,
    permissionGranted,
    getCurrentLocation,
    getDistanceToTarget,
    isWithinRange
  };
}; 