'use client';

import { useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';

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

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '250px',
  maxHeight: '40vh'
};

const defaultCenter = {
  lat: 22.2783,
  lng: 114.1827
};

export default function Map({ currentLocation, tasks, onTaskClick }: MapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    language: 'zh-TW',
    region: 'HK'
  });

  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // 處理地圖載入錯誤
  useEffect(() => {
    if (loadError) {
      console.error('Failed to load Google Maps:', loadError);
      let errorMessage = '無法載入地圖，請檢查網絡連接或重新整理頁面';
      
      if (loadError instanceof Error) {
        if (loadError.message.includes('InvalidKeyMapError')) {
          errorMessage = 'Google Maps API密鑰無效，請聯繫管理員';
        } else if (loadError.message.includes('MissingKeyMapError')) {
          errorMessage = 'Google Maps API密鑰未設置，請聯繫管理員';
        }
      }
      
      setMapError(errorMessage);
    }
  }, [loadError]);

  // 驗證座標是否有效
  const isValidCoordinate = (lat: number, lng: number) => {
    return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  };

  // 獲取當前中心點
  const getCenter = () => {
    if (currentLocation && 
        isValidCoordinate(Number(currentLocation.lat), Number(currentLocation.lng))) {
      return { 
        lat: Number(currentLocation.lat), 
        lng: Number(currentLocation.lng) 
      };
    }
    return defaultCenter;
  };

  // 處理地圖載入
  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

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

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={getCenter()}
      zoom={15}
      onLoad={onMapLoad}
      options={{
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        gestureHandling: 'greedy',
        disableDefaultUI: false,
        zoomControl: true,
      }}
    >
      {/* 當前位置標記 */}
      {currentLocation && isValidCoordinate(Number(currentLocation.lat), Number(currentLocation.lng)) && (
        <Marker
          position={{
            lat: Number(currentLocation.lat),
            lng: Number(currentLocation.lng)
          }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          }}
          title="您的位置"
        />
      )}

      {/* 任務標記 */}
      {tasks.map(task => {
        if (!task.location?.coordinates) {
          console.warn(`任務 ${task.id} 缺少座標資訊`);
          return null;
        }

        const lat = Number(task.location.coordinates.lat || task.location.coordinates.latitude);
        const lng = Number(task.location.coordinates.lng || task.location.coordinates.longitude);

        if (!isValidCoordinate(lat, lng)) {
          console.warn(`任務 ${task.id} 的座標無效:`, task.location.coordinates);
          return null;
        }

        return (
          <Marker
            key={task.id}
            position={{ lat, lng }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: task.isCompleted ? '#10B981' : '#6366F1',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }}
            title={task.title}
            onClick={() => onTaskClick(task.id)}
          />
        );
      })}
    </GoogleMap>
  );
} 