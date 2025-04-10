'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface MapProps {
  currentLocation: {
    lat: number;
    lng: number;
  } | null;
  tasks: Array<{
    id: string;
    title: string;
    location: {
      coordinates: {
        lat: number;
        lng: number;
        latitude?: number;
        longitude?: number;
      };
    };
    isUnlocked: boolean;
    isCompleted: boolean;
  }>;
  onTaskClick: (taskId: string) => void;
}

declare global {
  interface Window {
    google: any;
    initMap?: () => void;
  }
}

export default function Map({ currentLocation, tasks, onTaskClick }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [currentLocationMarker, setCurrentLocationMarker] = useState<google.maps.Marker | null>(null);
  const [taskMarkers, setTaskMarkers] = useState<google.maps.Marker[]>([]);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        // 檢查API密鑰
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          setMapError('Google Maps API密鑰未設置，請聯繫管理員');
          return;
        }

        // 如果已經載入，直接返回
        if (window.google?.maps) {
          setIsMapLoaded(true);
          return;
        }

        // 使用 Loader 載入 Google Maps API
        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['places'],
          retries: 3,
          language: 'zh-TW',
          region: 'HK'
        });

        await loader.load();
        setIsMapLoaded(true);
        setMapError(null);

        // 初始化地圖
        if (mapRef.current) {
          const defaultCenter = currentLocation || { lat: 22.2783, lng: 114.1827 }; // 香港中心點
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center: defaultCenter,
            zoom: 15,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            gestureHandling: 'greedy'
          });
        }
      } catch (error: any) {
        console.error('Failed to load Google Maps:', error);
        let errorMessage = '無法載入地圖，請檢查網絡連接或重新整理頁面';
        
        if (error.message?.includes('InvalidKeyMapError')) {
          errorMessage = 'Google Maps API密鑰無效，請聯繫管理員';
        } else if (error.message?.includes('MissingKeyMapError')) {
          errorMessage = 'Google Maps API密鑰未設置，請聯繫管理員';
        }
        
        setMapError(errorMessage);
      }
    };

    initializeMap();

    return () => {
      // 清除所有標記
      if (markersRef.current) {
        markersRef.current.forEach(marker => {
          if (marker && typeof marker.setMap === 'function') {
            marker.setMap(null);
          }
        });
        markersRef.current = [];
      }
    };
  }, []); // 只在組件掛載時初始化一次

  // 初始化地圖
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || !currentLocation) return;

    try {
      const lat = Number(currentLocation.lat);
      const lng = Number(currentLocation.lng);

      // 確保座標是有效的數字
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
        console.error('無效的當前位置座標:', currentLocation);
        return;
      }

      const position = { lat, lng };
      mapInstanceRef.current.setCenter(position);
    } catch (error) {
      console.error('Error updating map center:', error);
      setMapError('更新地圖中心點時發生錯誤');
    }
  }, [isMapLoaded, currentLocation, mapError]);

  // 更新當前位置標記
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || !currentLocation) return;

    try {
      const lat = Number(currentLocation.lat);
      const lng = Number(currentLocation.lng);

      // 確保座標是有效的數字
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
        console.error('無效的當前位置座標:', currentLocation);
        return;
      }

      const position = { lat, lng };

      // 更新或創建當前位置標記
      if (currentLocationMarker) {
        currentLocationMarker.setPosition(position);
      } else {
        const marker = new window.google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          title: '您的位置',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          }
        });
        setCurrentLocationMarker(marker);
      }
    } catch (error) {
      console.error('Error updating current location marker:', error);
      setMapError('更新當前位置標記時發生錯誤');
    }
  }, [isMapLoaded, currentLocation, mapError, currentLocationMarker]);

  // 更新任務標記
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || !currentLocation) return;

    try {
      // 清除舊的標記
      taskMarkers.forEach(marker => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(null);
        }
      });
      setTaskMarkers([]);

      // 添加新的標記
      const newTaskMarkers: google.maps.Marker[] = [];
      tasks.forEach(task => {
        if (!task.location?.coordinates) return;

        const lat = Number(task.location.coordinates.lat || task.location.coordinates.latitude);
        const lng = Number(task.location.coordinates.lng || task.location.coordinates.longitude);

        // 確保座標是有效的數字
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
          console.error('無效的座標:', task.location.coordinates);
          return;
        }

        const position = { lat, lng };
        const marker = new window.google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          title: task.title,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: task.isCompleted ? '#10B981' : '#6366F1',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          }
        });

        marker.addListener('click', () => {
          if (onTaskClick) {
            onTaskClick(task.id);
          }
        });

        newTaskMarkers.push(marker);
      });

      setTaskMarkers(newTaskMarkers);
    } catch (error) {
      console.error('Error updating task markers:', error);
      setMapError('更新任務標記時發生錯誤');
    }
  }, [isMapLoaded, tasks, currentLocation, onTaskClick]);

  // 清理函數
  useEffect(() => {
    return () => {
      // 安全地清理標記
      if (currentLocationMarker) {
        try {
          currentLocationMarker.setMap(null);
        } catch (error) {
          console.error('Error cleaning up current location marker:', error);
        }
      }
      
      taskMarkers.forEach(marker => {
        try {
          if (marker && typeof marker.setMap === 'function') {
            marker.setMap(null);
          }
        } catch (error) {
          console.error('Error cleaning up task marker:', error);
        }
      });
    };
  }, [currentLocationMarker, taskMarkers]);

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-4">
          <p className="text-red-600 mb-2">{mapError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-full relative"
    >
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
    </div>
  );
} 