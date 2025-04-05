'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { sampleScripts } from '@/lib/scripts';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Map from '@/components/Map';
import Camera from '@/components/Camera';
import { useGameProgress } from '@/lib/hooks/useGameProgress';

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
  distance?: number;
  status?: 'success' | 'failed' | 'in_progress';
  errorMessage?: string;
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
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const MAX_DISTANCE = 1000; // 最大允許距離（米）
  const { gameSession, loading: gameLoading, createGameSession, updateGameProgress, completeGameSession } = useGameProgress(id as string);

  useEffect(() => {
    if (script) {
      const initializeTasks = async () => {
        // 如果有遊戲進度，從進度中讀取任務狀態
        if (gameSession) {
          const initialTasks = script.locations.map((location, index) => ({
            id: `task-${index + 1}`,
            title: `任務 ${index + 1}`,
            description: `前往 ${location.name} 完成任務`,
            location: {
              name: location.name,
              address: location.address,
              coordinates: {
                lat: location.coordinates?.latitude || 22.2783,
                lng: location.coordinates?.longitude || 114.1747
              }
            },
            isCompleted: gameSession.completedLocations.includes(`task-${index + 1}`),
            isUnlocked: index <= gameSession.currentLocationIndex
          }));
          setTasks(initialTasks);
        } else {
          // 如果沒有遊戲進度，創建新的遊戲進度
          try {
            await createGameSession();
            const initialTasks = script.locations.map((location, index) => ({
              id: `task-${index + 1}`,
              title: `任務 ${index + 1}`,
              description: `前往 ${location.name} 完成任務`,
              location: {
                name: location.name,
                address: location.address,
                coordinates: {
                  lat: location.coordinates?.latitude || 22.2783,
                  lng: location.coordinates?.longitude || 114.1747
                }
              },
              isCompleted: false,
              isUnlocked: index === 0
            }));
            setTasks(initialTasks);
          } catch (error) {
            console.error('創建遊戲進度失敗:', error);
            setTaskError('無法創建遊戲進度');
          }
        }
      };

      initializeTasks();
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
  }, [script, gameSession]);

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

  // 計算兩點之間的距離（米）
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // 地球半徑（米）
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // 更新任務距離
  useEffect(() => {
    if (currentLocation) {
      const updatedTasks = tasks.map(task => {
        const distance = calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          task.location.coordinates.lat,
          task.location.coordinates.lng
        );
        return {
          ...task,
          distance
        };
      });
      setTasks(updatedTasks);
    }
  }, [currentLocation]);

  // 格式化距離顯示
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}公里`;
    }
    return `${Math.round(meters)}米`;
  };

  const handleTaskClick = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      if (!task.isUnlocked) {
        setTaskError('此任務尚未解鎖');
        return;
      }

      if (!currentLocation) {
        setTaskError('無法獲取當前位置');
        return;
      }

      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        task.location.coordinates.lat,
        task.location.coordinates.lng
      );

      if (distance > MAX_DISTANCE) {
        setTaskError(`您需要更靠近任務地點（當前距離：${formatDistance(distance)}）`);
        return;
      }

      setSelectedTask(task);
      setTaskError(null);
    }
  };

  const handleTakePhoto = () => {
    setShowCamera(true);
  };

  const handlePhotoCapture = (photo: string) => {
    if (selectedTask) {
      // 只設置照片，不立即標記為完成
      setTasks(tasks.map(task =>
        task.id === selectedTask.id
          ? { ...task, photo }
          : task
      ));
      setCapturedPhoto(photo);
      setShowCamera(false);
    }
  };

  const handleCancelPhoto = () => {
    setShowCamera(false);
  };

  const handleTaskSubmit = async () => {
    if (selectedTask && capturedPhoto && gameSession) {
      setIsSubmitting(true);
      try {
        // 更新任務狀態
        const updatedTasks = tasks.map(task =>
          task.id === selectedTask.id
            ? {
                ...task,
                isCompleted: true,
                status: 'success' as const,
                photo: capturedPhoto
              }
            : task
        );

        // 找到當前任務的索引
        const currentIndex = tasks.findIndex(t => t.id === selectedTask.id);
        
        // 如果不是最後一個任務，解鎖下一個任務
        if (currentIndex < tasks.length - 1) {
          updatedTasks[currentIndex + 1] = {
            ...updatedTasks[currentIndex + 1],
            isUnlocked: true
          };
        }

        setTasks(updatedTasks);

        // 更新遊戲進度
        await updateGameProgress(gameSession.id, {
          currentLocationIndex: Math.max(currentIndex + 1, gameSession.currentLocationIndex),
          completedLocations: [
            ...gameSession.completedLocations,
            selectedTask.id
          ],
          score: (gameSession.score || 0) + 100 // 每完成一個任務加100分
        });

        // 如果所有任務都完成了，標記遊戲為完成狀態
        const allTasksCompleted = updatedTasks.every(task => task.isCompleted);
        if (allTasksCompleted) {
          await completeGameSession(gameSession.id, (gameSession.score || 0) + 100);
        }

        setSelectedTask(null);
        setCapturedPhoto(null);
      } catch (error) {
        console.error('提交失敗:', error);
        setTaskError('提交失敗，請重試');
      } finally {
        setIsSubmitting(false);
      }
    }
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
        <div className="flex flex-col h-screen">
          {/* 頂部導航欄 */}
          <div className="bg-white shadow-sm p-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">任務進度</h1>
            <span className="text-sm text-gray-500">已完成 {tasks.filter(t => t.isCompleted).length}/{tasks.length}</span>
          </div>

          {/* 主要內容區域 - 使用 grid 佈局 */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
            {/* 地圖區域 */}
            <div className="relative h-[50vh] md:h-full">
              <Map
                currentLocation={currentLocation}
                tasks={tasks}
                onTaskClick={handleTaskClick}
              />
            </div>

            {/* 任務列表區域 - 可滾動 */}
            <div className="bg-white overflow-y-auto h-[50vh] md:h-full">
              <div className="p-4 space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border ${
                      task.status === 'success'
                        ? 'bg-green-50 border-green-200'
                        : task.status === 'failed'
                        ? 'bg-red-50 border-red-200'
                        : task.isUnlocked
                        ? 'bg-white border-gray-200 hover:border-indigo-300 cursor-pointer'
                        : 'bg-gray-50 border-gray-200 opacity-50'
                    }`}
                    onClick={() => task.isUnlocked && handleTaskClick(task.id)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{task.title}</h3>
                      {task.status === 'success' ? (
                        <span className="text-green-600">✓ 已完成</span>
                      ) : task.status === 'failed' ? (
                        <span className="text-red-600">✗ 失敗</span>
                      ) : task.isUnlocked ? (
                        <span className="text-indigo-600">可進行</span>
                      ) : (
                        <span className="text-gray-500">未解鎖</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{task.description}</p>
                    {task.distance && (
                      <p className="mt-1 text-xs text-gray-500">
                        距離：{formatDistance(task.distance)}
                        {task.distance > MAX_DISTANCE && task.isUnlocked && (
                          <span className="text-red-500 ml-2">
                            （需要更靠近，至少在1公里內）
                          </span>
                        )}
                      </p>
                    )}
                    {task.errorMessage && (
                      <p className="mt-1 text-xs text-red-500">{task.errorMessage}</p>
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
                        onCancel={() => setShowCamera(false)}
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
                        onClick={handleTaskSubmit}
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