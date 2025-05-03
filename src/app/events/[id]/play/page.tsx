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
          if (gameSession && gameSession.tasks) {
            const initialTasks = script.locations.map((location, index) => {
              const taskId = `task-${index + 1}`;
              const taskStatus = gameSession.tasks[taskId]?.status || 'locked';
              const isCompleted = taskStatus === 'completed';
              const isUnlocked = taskStatus === 'unlocked' || index <= gameSession.currentTaskIndex;
              
              return createTaskFromLocation(location, index, isCompleted, isUnlocked);
            });
            setTasks(initialTasks);
          } else {
            const initialTasks = script.locations.map((location, index) => 
              createTaskFromLocation(location, index, false, index === 0)
            );
            setTasks(initialTasks);
          }
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
    if (task.status === 'locked') {
      return;
    }

    if (task.status === 'unlocked') {
      if (!userLocation) {
        setTaskError('無法獲取當前位置，請確保已開啟位置服務');
        return;
      }

      const distance = calculateDistance(
        userLocation.coordinates.lat,
        userLocation.coordinates.lng,
        task.location.coordinates.lat,
        task.location.coordinates.lng
      );

      if (distance > MAX_DISTANCE) {
        setTaskError(`您距離目標地點太遠（當前距離：${formatDistance(distance)}）`);
        return;
      }

      setSelectedTask(task);
      setShowCamera(true);
    }
  };

  const handlePhotoCapture = async (photo: string) => {
    if (!selectedTask) return;

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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col h-[100dvh]">
          {/* 頂部導航欄 */}
          <div className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">{script.title || '任務進度'}</h1>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  已完成 {tasks.filter(t => t.status === 'completed').length}/{tasks.length}
                </span>
                {playCount > 0 && (
                  <span className="text-sm text-indigo-500 bg-indigo-100 px-2 py-1 rounded-full">
                    第 {playCount + 1} 次遊玩
                  </span>
                )}
              </div>
            </div>
            {locationError && (
              <span className="text-sm text-red-500">{locationError}</span>
            )}
          </div>

          {/* 主要內容區域 */}
          <div className="flex-1 flex flex-col md:grid md:grid-cols-2 gap-4 overflow-hidden">
            {/* 地圖區域 */}
            <div className="h-[40vh] md:h-[calc(100dvh-5rem)] relative">
              <div className="relative h-[500px] rounded-lg overflow-hidden">
                <Map
                  currentLocation={currentLocation}
                  tasks={tasks}
                  onTaskClick={handleTaskClick}
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
                />
              </div>
              {!locationPermissionGranted && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="bg-white p-4 rounded-lg text-center">
                    <p className="text-gray-600 mb-2">需要位置權限才能進行遊戲</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      重新授權
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 任務列表區域 */}
            <div className="flex-1 bg-white overflow-y-auto rounded-lg shadow-sm">
              <div className="p-4 space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      task.status === 'completed'
                        ? 'bg-green-50 border-green-200'
                        : task.status === 'unlocked'
                        ? 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md cursor-pointer'
                        : 'bg-gray-50 border-gray-200 opacity-50'
                    }`}
                    onClick={() => task.status === 'unlocked' && handleTaskClick(task)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{task.title}</h3>
                      <div className="flex items-center space-x-2">
                        {task.status === 'completed' ? (
                          <span className="text-green-600 flex items-center">
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            已完成
                          </span>
                        ) : task.status === 'unlocked' ? (
                          <span className="text-indigo-600 flex items-center">
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                            可進行
                          </span>
                        ) : (
                          <span className="text-gray-500 flex items-center">
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            未解鎖
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{task.description}</p>
                    {task.distance && (
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        距離：{formatDistance(task.distance)}
                        {task.distance > MAX_DISTANCE && task.status === 'unlocked' && (
                          <span className="text-red-500 ml-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            需要更靠近（至少在1公里內）
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 任務詳情模態框 */}
          {selectedTask && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-4">{selectedTask.title}</h2>
                  <p className="text-gray-600 mb-6">{selectedTask.description}</p>
                  
                  {/* 相機預覽區域 */}
                  {showCamera ? (
                    <div className="relative aspect-[4/3] mb-4 bg-black rounded-lg overflow-hidden">
                      <Camera
                        onCapture={handlePhotoCapture}
                        onCancel={handleCancelPhoto}
                        onError={handleCameraError}
                      />
                    </div>
                  ) : capturedPhoto ? (
                    <div className="relative aspect-[4/3] mb-4">
                      <img
                        src={capturedPhoto}
                        alt="已拍照片"
                        className="rounded-lg w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setCapturedPhoto(null)}
                        className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg"
                      >
                        重拍
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCamera(true)}
                      className="w-full py-3 px-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-300 hover:text-indigo-600 mb-4"
                    >
                      <span className="flex items-center justify-center">
                        <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        拍照上傳
                      </span>
                    </button>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setSelectedTask(null);
                        setCapturedPhoto(null);
                      }}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      取消
                    </button>
                    {capturedPhoto && (
                      <button
                        onClick={() => handlePhotoCapture(capturedPhoto)}
                        disabled={isSubmitting}
                        className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isSubmitting ? '提交中...' : '提交'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {taskError && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
              {taskError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 