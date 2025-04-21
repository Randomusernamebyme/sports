'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Location, Task } from '@/types/game';

interface MapProps {
  currentLocation: Location | null;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  apiKey: string;
}

export default function Map({ currentLocation, tasks, onTaskClick, apiKey }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<{ [key: string]: google.maps.Marker }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化地圖
  useEffect(() => {
    if (!mapRef.current || !apiKey) return;

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places']
    });

    loader.load().then(() => {
      if (!mapRef.current) return;

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 22.2783, lng: 114.1747 }, // 銅鑼灣中心點
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setMap(mapInstance);
      setLoading(false);
    }).catch((error) => {
      console.error('載入 Google Maps 失敗:', error);
      setError('載入地圖失敗，請稍後重試');
      setLoading(false);
    });
  }, [apiKey]);

  // 更新當前位置標記
  useEffect(() => {
    if (!map || !currentLocation) return;

    const currentLocationMarker = new google.maps.Marker({
      position: currentLocation.coordinates,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
      },
      title: '當前位置'
    });

    return () => {
      currentLocationMarker.setMap(null);
    };
  }, [map, currentLocation]);

  // 更新任務標記
  useEffect(() => {
    if (!map) return;

    // 清除舊的標記
    Object.values(markers).forEach(marker => marker.setMap(null));
    const newMarkers: { [key: string]: google.maps.Marker } = {};

    // 創建新的標記
    tasks.forEach(task => {
      const marker = new google.maps.Marker({
        position: task.location.coordinates,
        map,
        title: task.location.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: task.status === 'completed' ? '#10B981' : 
                    task.status === 'unlocked' ? '#3B82F6' : '#9CA3AF',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });

      if (onTaskClick) {
        marker.addListener('click', () => onTaskClick(task));
      }

      newMarkers[task.id] = marker;
    });

    setMarkers(newMarkers);

    return () => {
      Object.values(newMarkers).forEach(marker => marker.setMap(null));
    };
  }, [map, tasks, onTaskClick]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入地圖中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            重試
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden shadow-lg" />
  );
} 