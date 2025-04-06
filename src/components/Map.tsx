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

  // 更新地圖中心點
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || !currentLocation || mapError) return;

    try {
      mapInstanceRef.current.setCenter(currentLocation);
    } catch (error) {
      console.error('Error updating map center:', error);
      setMapError('更新地圖中心點時發生錯誤');
    }
  }, [isMapLoaded, currentLocation, mapError]);

  // 更新當前位置標記
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || !currentLocation || mapError) return;

    try {
      // 清除舊的當前位置標記
      if (markersRef.current[0]) {
        markersRef.current[0].setMap(null);
        markersRef.current.shift();
      }

      // 添加新的當前位置標記
      const currentMarker = new window.google.maps.Marker({
        position: currentLocation,
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4F46E5',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        }
      });

      markersRef.current.unshift(currentMarker);
    } catch (error) {
      console.error('Error updating current location marker:', error);
      setMapError('更新當前位置標記時發生錯誤');
    }
  }, [isMapLoaded, currentLocation, mapError]);

  // 更新任務標記
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || mapError) return;

    try {
      // 清除任務標記
      markersRef.current.slice(1).forEach(marker => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(null);
        }
      });
      markersRef.current = [markersRef.current[0]]; // 保留當前位置標記

      // 添加任務標記
      tasks.forEach(task => {
        // 驗證座標
        const lat = Number(task.location.coordinates.lat || task.location.coordinates.latitude);
        const lng = Number(task.location.coordinates.lng || task.location.coordinates.longitude);
        
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          console.error('無效的座標:', task.location.coordinates);
          return;
        }

        const marker = new window.google.maps.Marker({
          position: {
            lat,
            lng
          },
          map: mapInstanceRef.current,
          title: task.title,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: task.isCompleted ? '#10B981' : task.isUnlocked ? '#4F46E5' : '#9CA3AF',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          }
        });

        marker.addListener('click', () => {
          onTaskClick(task.id);
        });

        markersRef.current.push(marker);
      });
    } catch (error) {
      console.error('Error updating task markers:', error);
      setMapError('更新任務標記時發生錯誤');
    }
  }, [isMapLoaded, tasks, mapError, onTaskClick]);

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