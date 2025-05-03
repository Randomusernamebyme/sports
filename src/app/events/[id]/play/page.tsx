'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { sampleScripts } from '@/lib/scripts';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Map from '@/components/Map';
import Camera from '@/components/Camera';
import { useGameProgress } from '@/lib/hooks/useGameProgress';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { GameSession, Task, TaskStatus, Location } from '@/types/game';
import { useLocation } from '@/lib/hooks/useLocation';

export default function PlayPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const script = sampleScripts.find(s => s.id === id);
  const mode = searchParams.get('mode');
  const roomCode = searchParams.get('room');
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const MAX_DISTANCE = 1000; // 最大允許距離（米）
  const { 
    gameSession, 
    loading, 
    error, 
    createGameSession, 
    handleGameComplete,
    updateTaskStatus,
    playCount 
  } = useGameProgress(id as string);
  const router = useRouter();
  const { currentLocation: userLocation, error: userLocationError } = useLocation();

  useEffect(() => {
    if (userLocation) {
      setCurrentLocation({
        name: '當前位置',
        address: '',
        coordinates: {
          lat: userLocation.coordinates.lat,
          lng: userLocation.coordinates.lng
        }
      });
    }
  }, [userLocation]);

  useEffect(() => {
    if (script) {
      const initializeTasks = async () => {
        const createTaskFromLocation = (location: any, index: number, isCompleted: boolean, isUnlocked: boolean): Task => ({
          id: `task-${index + 1}`,
          title: `任務 ${index + 1}`,
          description: `前往 ${location.name} 完成任務`,
          location: {
            name: location.name,
            address: location.address,
            coordinates: {
              lat: Number(location.coordinates.latitude),
              lng: Number(location.coordinates.longitude)
            }
          },
          status: isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked' as TaskStatus,
          photo: undefined,
          distance: undefined
        });

        try {
          console.log('gameSession:', gameSession);
          console.log('gameSession?.tasks:', gameSession?.tasks);

          const initialTasks = script.locations.map((location, index) => {
            const taskId = `task-${index + 1}`;
            
            if (!gameSession?.tasks) {
              console.log(`任務 ${taskId} 尚未初始化，使用默認狀態`);
              return createTaskFromLocation(location, index, false, index === 0);
            }

            const taskStatus = gameSession.tasks[taskId]?.status || 'locked';
            const isCompleted = taskStatus === 'completed';
            const isUnlocked = taskStatus === 'unlocked' || index <= (gameSession.currentTaskIndex || 0);
            
            return createTaskFromLocation(location, index, isCompleted, isUnlocked);
          });
          
          setTasks(initialTasks);
        } catch (error) {
          console.error('初始化任務失敗:', error);
          setTaskError('初始化任務失敗，請重試');
        }
      };

      initializeTasks();
    }

    if (typeof window !== 'undefined') {
      navigator.permissions.query({ name: 'geolocation' })
        .then(permissionStatus => {
          if (permissionStatus.state === 'granted') {
            setLocationPermissionGranted(true);
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setCurrentLocation({
                  name: '當前位置',
                  address: '',
                  coordinates: {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                  }
                });
                setLocationError(null);
              },
              (error) => {
                console.error('獲取位置失敗:', error);
                setLocationError('無法獲取位置，請確保已開啟位置服務');
              },
              {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
              }
            );
          } else if (permissionStatus.state === 'prompt') {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setLocationPermissionGranted(true);
                setCurrentLocation({
                  name: '當前位置',
                  address: '',
                  coordinates: {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                  }
                });
                setLocationError(null);
              },
              (error) => {
                console.error('位置權限被拒絕:', error);
                setLocationPermissionGranted(false);
                setLocationError('請允許使用位置權限以繼續遊戲');
              },
              {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
              }
            );
          } else {
            setLocationPermissionGranted(false);
            setLocationError('請在瀏覽器設定中允許使用位置權限');
          }
        })
        .catch(error => {
          console.error('檢查位置權限失敗:', error);
          setLocationError('無法檢查位置權限，請確保瀏覽器支援位置服務');
        });
    }
  }, [script, gameSession]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // 地球半徑（米）
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} 米`;
    } else {
      return `${(meters / 1000).toFixed(1)} 公里`;
    }
  };

  const handleTaskClick = async (task: Task) => {
    if (!gameSession?.tasks) {
      console.warn('遊戲會話尚未初始化，無法處理任務點擊');
      return;
    }

    const taskStatus = gameSession.tasks[task.id]?.status || 'locked';
    if (taskStatus === 'locked') {
      console.log('任務已鎖定，無法點擊');
      return;
    }

    if (currentLocation && task.location) {
      const distance = calculateDistance(
        currentLocation.coordinates.lat,
        currentLocation.coordinates.lng,
        task.location.coordinates.lat,
        task.location.coordinates.lng
      );

      if (distance > MAX_DISTANCE) {
        setTaskError(`您距離目標地點太遠（${formatDistance(distance)}）`);
        return;
      }
    }

    setSelectedTask(task);
    setShowCamera(true);
  };

  const handlePhotoCapture = async (photo: string) => {
    if (!selectedTask || !gameSession?.tasks) {
      console.warn('無法處理照片：任務或遊戲會話未初始化');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateTaskStatus(selectedTask.id, 'completed', photo);
      setCapturedPhoto(photo);
      setShowCamera(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('更新任務狀態失敗:', error);
      setTaskError('更新任務狀態失敗，請重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCameraError = (error: string) => {
    setTaskError(error);
    setShowCamera(false);
  };

  const handleCancelPhoto = () => {
    setShowCamera(false);
    setSelectedTask(null);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側：地圖 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[600px]">
              <Map
                currentLocation={currentLocation}
                tasks={tasks}
                onTaskClick={handleTaskClick}
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
              />
            </div>
          </div>

          {/* 右側：任務列表 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">任務列表</h2>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border ${
                      task.status === 'completed'
                        ? 'bg-green-50 border-green-200'
                        : task.status === 'unlocked'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <h3 className="font-semibold mb-2">{task.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {task.location.name}
                      </span>
                      <button
                        onClick={() => handleTaskClick(task)}
                        disabled={task.status === 'locked'}
                        className={`px-3 py-1 rounded text-sm ${
                          task.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : task.status === 'unlocked'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {task.status === 'completed'
                          ? '已完成'
                          : task.status === 'unlocked'
                          ? '開始任務'
                          : '已鎖定'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 相機彈出層 */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-lg w-full mx-4">
            <Camera
              onCapture={handlePhotoCapture}
              onError={handleCameraError}
              onCancel={handleCancelPhoto}
            />
          </div>
        </div>
      )}
    </div>
  );
} 