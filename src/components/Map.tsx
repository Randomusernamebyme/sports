'use client';

import { useEffect, useRef, useState } from 'react';

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
  }
}

export default function Map({ currentLocation, tasks, onTaskClick }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    // 檢查是否已經載入 Google Maps API
    if (window.google) {
      setIsMapLoaded(true);
      return;
    }

    // 載入 Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      setIsMapLoaded(true);
    };

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      // 清除所有標記
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !currentLocation) return;

    // 初始化地圖
    const map = new window.google.maps.Map(mapRef.current, {
      center: currentLocation,
      zoom: 15,
    });

    mapInstanceRef.current = map;

    // 添加當前位置標記
    const currentMarker = new window.google.maps.marker.AdvancedMarkerElement({
      position: currentLocation,
      map,
      content: createMarkerContent('#4F46E5'),
    });

    markersRef.current.push(currentMarker);

    return () => {
      currentMarker.map = null;
    };
  }, [isMapLoaded, currentLocation]);

  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current) return;

    // 清除現有標記
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    // 添加任務標記
    tasks.forEach(task => {
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        position: task.location.coordinates,
        map: mapInstanceRef.current,
        title: task.title,
        content: createMarkerContent(
          task.isCompleted
            ? '#10B981' // 綠色
            : task.isUnlocked
            ? '#4F46E5' // 靛藍色
            : '#9CA3AF' // 灰色
        ),
      });

      // 添加點擊事件
      marker.addListener('click', () => {
        onTaskClick(task.id);
      });

      markersRef.current.push(marker);
    });
  }, [isMapLoaded, tasks]);

  const createMarkerContent = (color: string) => {
    const div = document.createElement('div');
    div.className = 'marker';
    div.style.width = '20px';
    div.style.height = '20px';
    div.style.backgroundColor = color;
    div.style.borderRadius = '50%';
    div.style.border = '2px solid white';
    return div;
  };

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
    />
  );
} 