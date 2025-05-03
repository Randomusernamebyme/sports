import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameSession } from './useGameSession';
import { useLocation } from './useLocation';
import { Task, TaskStatus } from '@/types/game';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { generateId } from '@/utils/generateId';
import { useUser } from '@/contexts/UserContext';
import { db } from '@/firebase/firebaseConfig';

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

  const createGameSession = async () => {
    try {
      const now = new Date();
      const gameSession: GameSession = {
        id: generateId(),
        scriptId,
        userId: user?.uid || '',
        status: 'in_progress',
        startTime: now,
        lastUpdated: now,
        currentTaskIndex: 0,
        tasks: {
          'task-1': {
            id: 'task-1',
            title: '任務 1',
            description: '前往第一個地點完成任務',
            location: {
              name: '第一個地點',
              address: '',
              coordinates: {
                lat: 0,
                lng: 0
              }
            },
            status: 'unlocked',
            photo: undefined,
            distance: undefined
          }
        },
        playCount: 1
      };

      await setDoc(doc(db, 'gameSessions', gameSession.id), gameSession);
      setGameSession(gameSession);
      return gameSession;
    } catch (error) {
      console.error('創建遊戲會話失敗:', error);
      throw error;
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus, photo?: string) => {
    if (!gameSession?.tasks) {
      console.warn('遊戲會話或任務未初始化，無法更新任務狀態');
      return;
    }

    try {
      const sessionRef = doc(db, 'gameSessions', gameSession.id);
      const updatedTasks = {
        ...gameSession.tasks,
        [taskId]: {
          ...gameSession.tasks[taskId],
          status,
          completedAt: status === 'completed' ? new Date() : undefined,
          photo
        }
      };

      await updateDoc(sessionRef, {
        tasks: updatedTasks,
        lastUpdated: Timestamp.now()
      });

      setGameSession({
        ...gameSession,
        tasks: updatedTasks
      });
    } catch (error) {
      console.error('更新任務狀態失敗:', error);
      throw error;
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
    createGameSession,
    updateTaskStatus,
    handleGameComplete,
    playCount
  };
}; 