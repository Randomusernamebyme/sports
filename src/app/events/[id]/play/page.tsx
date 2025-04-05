'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { sampleScripts } from '@/lib/scripts';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Map from '@/components/Map';
import Camera from '@/components/Camera';

interface Task {
  id: string;
  title: string;
  description: string;
  location: {
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  isCompleted: boolean;
  isUnlocked: boolean;
  photo?: string;
}

export default function PlayPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const script = sampleScripts.find(s => s.id === id);
  const mode = searchParams.get('mode');
  const roomCode = searchParams.get('room');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    if (script) {
      // 初始化任務
      const initialTasks = script.locations.map((location, index) => ({
        id: `task-${index + 1}`,
        title: `任務 ${index + 1}`,
        description: `前往 ${location.name} 完成任務`,
        location: {
          name: location.name,
          address: location.address,
          coordinates: {
            lat: location.coordinates?.latitude || 22.2783, // 使用預設值
            lng: location.coordinates?.longitude || 114.1747
          }
        },
        isCompleted: false,
        isUnlocked: index === 0 // 第一個任務預設解鎖
      }));
      setTasks(initialTasks);
    }

    // 獲取當前位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (isValidCoordinates(latitude, longitude)) {
            setCurrentLocation({
              lat: latitude,
              lng: longitude
            });
          } else {
            console.error('無效的座標值');
            alert('無法獲取有效的位置信息');
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('無法獲取位置信息，請確保已開啟位置權限');
        }
      );

      // 持續追蹤位置
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (isValidCoordinates(latitude, longitude)) {
            setCurrentLocation({
              lat: latitude,
              lng: longitude
            });
          }
        },
        (error) => {
          console.error('Error watching location:', error);
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [script]);

  const isValidCoordinates = (lat: number, lng: number): boolean => {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  };

  const handleTaskClick = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
    }
  };

  const handleTakePhoto = () => {
    setShowCamera(true);
  };

  const handlePhotoCapture = (photo: string) => {
    if (selectedTask) {
      setTasks(tasks.map(task =>
        task.id === selectedTask.id
          ? { ...task, photo, isCompleted: true }
          : task
      ));
      setSelectedTask(null);
      setShowCamera(false);
    }
  };

  const handleCancelPhoto = () => {
    setShowCamera(false);
  };

  if (!script) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900">找不到劇本</h1>
            <p className="mt-3 text-lg text-gray-500">該劇本可能已被移除或暫時不可用。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 地圖區域 */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-[600px]">
              <Map
                currentLocation={currentLocation}
                tasks={tasks}
                onTaskClick={handleTaskClick}
              />
            </div>
          </div>

          {/* 任務列表 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">任務列表</h2>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      task.isUnlocked
                        ? 'bg-indigo-50 hover:bg-indigo-100'
                        : 'bg-gray-50 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      {task.isCompleted && (
                        <span className="text-green-600">✓</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                    <p className="mt-2 text-sm text-gray-500">{task.location.address}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 任務詳情對話框 */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900">{selectedTask.title}</h3>
                <p className="mt-2 text-gray-500">{selectedTask.description}</p>
                <p className="mt-2 text-sm text-gray-500">{selectedTask.location.address}</p>
                
                {selectedTask.isUnlocked && !selectedTask.isCompleted && (
                  <div className="mt-6 space-y-4">
                    <button
                      onClick={handleTakePhoto}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      拍照上傳
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setSelectedTask(null)}
                  className="mt-6 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 相機對話框 */}
        {showCamera && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">拍照上傳</h3>
                <div className="h-64">
                  <Camera
                    onCapture={handlePhotoCapture}
                    onCancel={handleCancelPhoto}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 