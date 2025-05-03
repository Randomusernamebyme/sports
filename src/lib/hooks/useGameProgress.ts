import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameSession } from './useGameSession';
import { useLocation } from './useLocation';
import { Task, TaskStatus } from '@/types/game';
import { useUser } from '@/contexts/UserContext';

export const useGameProgress = (scriptId: string) => {
  const router = useRouter();
  const { gameSession, loading: sessionLoading, error: sessionError, createGameSession, updateTaskStatus } = useGameSession(scriptId);
  const { currentLocation, loading: locationLoading, error: locationError, isWithinRange } = useLocation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [playCount, setPlayCount] = useState(0);
  const { user } = useUser();

  // 初始化任務列表
  useEffect(() => {
    if (!gameSession) return;

    const taskList: Task[] = [
      {
        id: 'task-1',
        title: '銅鑼灣地標',
        description: '找到銅鑼灣最著名的地標建築',
        location: {
          name: '時代廣場',
          address: '香港銅鑼灣勿地臣街1號',
          coordinates: {
            lat: 22.2783,
            lng: 114.1827
          }
        },
        status: gameSession?.tasks?.['task-1']?.status ?? 'locked'
      },
      {
        id: 'task-2',
        title: '美食天堂',
        description: '探索銅鑼灣的美食街',
        location: {
          name: '登龍街',
          address: '香港銅鑼灣登龍街',
          coordinates: {
            lat: 22.2778,
            lng: 114.1839
          }
        },
        status: gameSession?.tasks?.['task-2']?.status ?? 'locked'
      }
    ];

    setTasks(taskList);
    setLoading(false);
  }, [gameSession]);

  // 處理任務點擊
  const handleTaskClick = async (task: Task) => {
    if (!gameSession?.tasks) {
      console.warn('遊戲會話未初始化，無法處理任務點擊');
      return;
    }

    const taskStatus = gameSession.tasks[task.id]?.status ?? 'locked';
    if (taskStatus === 'locked') {
      return;
    }

    if (taskStatus === 'unlocked') {
      if (!currentLocation) {
        setError('無法獲取當前位置，請確保已開啟位置服務');
        return;
      }

      if (!isWithinRange(task.location)) {
        setError('您距離目標地點太遠，請靠近目標地點');
        return;
      }

      setSelectedTask(task);
      setShowCamera(true);
    }
  };

  // 處理照片拍攝
  const handlePhotoCapture = async (photoUrl: string) => {
    if (!selectedTask || !gameSession?.tasks) {
      console.warn('無法處理照片：任務或遊戲會話未初始化');
      return;
    }

    try {
      setLoading(true);
      await updateTaskStatus(selectedTask.id, 'completed', photoUrl);
      setShowCamera(false);
      setSelectedTask(null);

      // 檢查是否所有任務都已完成
      const updatedTasks = tasks.map(task => 
        task.id === selectedTask.id 
          ? { ...task, status: 'completed' as TaskStatus, photo: photoUrl }
          : task
      );
      setTasks(updatedTasks);

      const allCompleted = updatedTasks.every(task => task.status === 'completed');
      if (allCompleted) {
        router.push(`/events/${scriptId}/complete/${gameSession?.id}`);
      }
    } catch (error) {
      console.error('更新任務狀態失敗:', error);
      setError('更新任務狀態失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  // 開始新游戲
  const startNewGame = async () => {
    try {
      setLoading(true);
      await createGameSession(scriptId);
      router.push(`/events/${scriptId}/play`);
    } catch (error) {
      console.error('創建新游戲失敗:', error);
      setError('創建新游戲失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  // 處理游戲完成
  const handleGameComplete = async () => {
    if (!gameSession) return;
    
    try {
      await updateTaskStatus('complete', 'completed');
      setPlayCount(prev => prev + 1);
      router.push(`/events/${scriptId}/complete/${gameSession.id}`);
    } catch (error) {
      setError('完成游戲時發生錯誤');
    }
  };

  return {
    tasks,
    loading: loading || sessionLoading || locationLoading,
    error: error || sessionError || locationError,
    showCamera,
    selectedTask,
    handleTaskClick,
    handlePhotoCapture,
    startNewGame,
    setShowCamera,
    gameSession,
    handleGameComplete,
    playCount
  };
}; 