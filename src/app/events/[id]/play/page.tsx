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
    try {
      if (!gameSession?.tasks) {
        console.warn('遊戲會話尚未初始化，無法處理任務點擊');
        setTaskError('遊戲會話尚未初始化，請稍後重試');
        return;
      }

      if (task.status === 'locked') {
        console.log('任務已鎖定，無法點擊');
        setTaskError('此任務尚未解鎖');
        return;
      }

      if (task.status === 'completed') {
        console.log('任務已完成');
        setTaskError('此任務已完成');
        return;
      }

      if (!currentLocation) {
        console.warn('無法獲取當前位置');
        setTaskError('無法獲取當前位置，請確保已開啟位置服務');
        return;
      }

      const distance = calculateDistance(
        currentLocation.coordinates.lat,
        currentLocation.coordinates.lng,
        task.location.coordinates.lat,
        task.location.coordinates.lng
      );

      if (distance > MAX_DISTANCE) {
        console.log(`距離目標地點太遠：${formatDistance(distance)}`);
        setTaskError(`您距離目標地點太遠（${formatDistance(distance)}），請靠近一點`);
        return;
      }

      setSelectedTask(task);
      setShowCamera(true);
      setTaskError(null);
    } catch (error) {
      console.error('處理任務點擊時發生錯誤:', error);
      setTaskError('處理任務時發生錯誤，請稍後重試');
    }
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
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="card text-center">
          <h2 className="text-xl font-semibold text-primary-900 mb-4">發生錯誤</h2>
          <p className="text-primary-600">{error}</p>
          <button
            onClick={() => router.push('/events')}
            className="btn-primary mt-4"
          >
            返回活動列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary-900">{script?.title}</h1>
              <p className="text-primary-600">{script?.description}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-sm text-primary-500">已完成</p>
                <p className="text-xl font-bold text-primary-700">
                  {tasks.filter(t => t.status === 'completed').length} / {tasks.length}
                </p>
              </div>
              {mode === 'multiplayer' && roomCode && (
                <div className="text-center">
                  <p className="text-sm text-primary-500">房間代碼</p>
                  <p className="text-xl font-bold text-primary-700">{roomCode}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card h-[600px]">
              <Map
                currentLocation={currentLocation}
                tasks={tasks}
                onTaskClick={handleTaskClick}
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-primary-900 mb-4">任務列表</h2>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border ${
                      task.status === 'completed'
                        ? 'bg-primary-50 border-primary-200'
                        : task.status === 'unlocked'
                        ? 'bg-white border-primary-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-primary-900">{task.title}</h3>
                        <p className="text-sm text-primary-600">{task.description}</p>
                        {task.distance !== undefined && (
                          <p className="text-xs text-primary-500 mt-1">
                            距離：{formatDistance(task.distance)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {task.status === 'completed' && (
                          <span className="text-green-500">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                        {task.status === 'unlocked' && (
                          <button
                            onClick={() => handleTaskClick(task)}
                            className="btn-primary text-sm"
                          >
                            開始
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {locationError && (
              <div className="card bg-red-50 border-red-200">
                <p className="text-red-600">{locationError}</p>
              </div>
            )}

            {taskError && (
              <div className="card bg-red-50 border-red-200">
                <p className="text-red-600">{taskError}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="card bg-white">
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