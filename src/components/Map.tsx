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
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [currentLocationMarker, setCurrentLocationMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [taskMarkers, setTaskMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  // 載入 Google Maps API
  useEffect(() => {
    let isMounted = true;

    const loadGoogleMapsApi = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          if (isMounted) {
            setMapError('Google Maps API密鑰未設置，請聯繫管理員');
          }
          return;
        }

        if (window.google?.maps) {
          if (isMounted) {
            setIsApiLoaded(true);
          }
          return;
        }

        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['places', 'marker'],
          retries: 3,
          language: 'zh-TW',
          region: 'HK'
        });

        await loader.load();
        
        if (isMounted) {
          setIsApiLoaded(true);
          setMapError(null);
        }
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
        let errorMessage = '無法載入地圖，請檢查網絡連接或重新整理頁面';
        
        if (error instanceof Error) {
          if (error.message.includes('InvalidKeyMapError')) {
            errorMessage = 'Google Maps API密鑰無效，請聯繫管理員';
          } else if (error.message.includes('MissingKeyMapError')) {
            errorMessage = 'Google Maps API密鑰未設置，請聯繫管理員';
          }
        }
        
        if (isMounted) {
          setMapError(errorMessage);
        }
      }
    };

    loadGoogleMapsApi();

    return () => {
      isMounted = false;
    };
  }, []);

  // 初始化地圖
  useEffect(() => {
    if (!isApiLoaded || !mapRef.current || !window.google?.maps?.marker) return;

    let isMounted = true;

    try {
      const defaultCenter = { lat: 22.2783, lng: 114.1827 }; // 香港中心點
      const center = currentLocation && 
        !isNaN(Number(currentLocation.lat)) && 
        !isNaN(Number(currentLocation.lng)) && 
        Number(currentLocation.lat) !== 0 && 
        Number(currentLocation.lng) !== 0
        ? { 
            lat: Number(currentLocation.lat), 
            lng: Number(currentLocation.lng) 
          }
        : defaultCenter;

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 15,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        gestureHandling: 'greedy'
      });

      if (isMounted) {
        setIsMapLoaded(true);
      }
    } catch (error) {
      console.error('Error initializing map instance:', error);
      if (isMounted) {
        setMapError('初始化地圖時發生錯誤');
      }
    }

    return () => {
      isMounted = false;
    };
  }, [isApiLoaded, currentLocation]);

  // 更新標記
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || !window.google?.maps?.marker) return;

    let isMounted = true;

    try {
      // 更新當前位置標記
      const position = currentLocation && 
        !isNaN(Number(currentLocation.lat)) && 
        !isNaN(Number(currentLocation.lng)) && 
        Number(currentLocation.lat) !== 0 && 
        Number(currentLocation.lng) !== 0
        ? { 
            lat: Number(currentLocation.lat), 
            lng: Number(currentLocation.lng) 
          }
        : { lat: 22.2783, lng: 114.1827 };

      // 安全地移除舊的當前位置標記
      if (currentLocationMarker) {
        try {
          currentLocationMarker.map = null;
          if (currentLocationMarker.content) {
            (currentLocationMarker.content as HTMLElement).remove();
          }
        } catch (error) {
          console.error('Error removing old current location marker:', error);
        }
      }

      // 創建新的當前位置標記
      const currentLocationContent = document.createElement('div');
      currentLocationContent.className = 'w-4 h-4 bg-blue-500 rounded-full border-2 border-white';
      
      const newCurrentLocationMarker = new window.google.maps.marker.AdvancedMarkerElement({
        position,
        map: mapInstanceRef.current,
        title: '您的位置',
        content: currentLocationContent
      });

      if (isMounted) {
        setCurrentLocationMarker(newCurrentLocationMarker);
      }

      // 安全地移除所有舊的任務標記
      taskMarkers.forEach(marker => {
        try {
          marker.map = null;
          if (marker.content) {
            (marker.content as HTMLElement).remove();
          }
        } catch (error) {
          console.error('Error removing old task marker:', error);
        }
      });
      
      // 先清空 taskMarkers 狀態
      setTaskMarkers([]);
      
      // 使用 setTimeout 推遲創建新標記，避免 race condition
      setTimeout(() => {
        if (!isMounted) return;
        
        // 創建新的任務標記
        const newTaskMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
        tasks.forEach(task => {
          if (!task.location?.coordinates) return;

          const lat = Number(task.location.coordinates.lat || task.location.coordinates.latitude);
          const lng = Number(task.location.coordinates.lng || task.location.coordinates.longitude);

          if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
            console.error('無效的座標:', task.location.coordinates);
            return;
          }

          const taskPosition = { lat, lng };
          
          // 為每個標記創建獨立的 content div
          const taskContent = document.createElement('div');
          taskContent.className = `w-3 h-3 rounded-full border-2 border-white ${
            task.isCompleted ? 'bg-green-500' : 'bg-indigo-500'
          }`;
          
          const marker = new window.google.maps.marker.AdvancedMarkerElement({
            position: taskPosition,
            map: mapInstanceRef.current,
            title: task.title,
            content: taskContent
          });

          marker.addEventListener('gmp-click', () => {
            if (onTaskClick) {
              onTaskClick(task.id);
            }
          });

          newTaskMarkers.push(marker);
        });

        if (isMounted) {
          setTaskMarkers(newTaskMarkers);
        }
      }, 0);
    } catch (error) {
      console.error('Error updating markers:', error);
      if (isMounted) {
        setMapError('更新標記時發生錯誤');
      }
    }

    return () => {
      isMounted = false;
    };
  }, [isMapLoaded, currentLocation, tasks, onTaskClick]);

  // 清理函數
  useEffect(() => {
    return () => {
      // 安全地清除所有標記
      if (currentLocationMarker) {
        try {
          currentLocationMarker.map = null;
          if (currentLocationMarker.content) {
            (currentLocationMarker.content as HTMLElement).remove();
          }
        } catch (error) {
          console.error('Error removing current location marker:', error);
        }
      }
      
      taskMarkers.forEach(marker => {
        try {
          marker.map = null;
          if (marker.content) {
            (marker.content as HTMLElement).remove();
          }
        } catch (error) {
          console.error('Error removing task marker:', error);
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
      style={{ minHeight: '400px' }}
    >
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
    </div>
  );
} 