import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  runTransaction,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { GameSession, GameStatus, TaskStatus } from '@/types/game';
import { sampleScripts } from '@/lib/scripts';

export const useGameSession = (scriptId: string) => {
  const { user } = useAuth();
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 檢查是否有進行中的游戲
  const checkInProgressGame = async () => {
    if (!user) return null;

    try {
      const sessionsRef = collection(db, 'gameSessions');
      const q = query(
        sessionsRef,
        where('userId', '==', user.uid),
        where('scriptId', '==', scriptId),
        where('status', '==', 'in_progress')
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          startTime: data.startTime instanceof Timestamp ? data.startTime.toDate() : new Date(data.startTime),
          lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : new Date(data.lastUpdated),
          endTime: data.endTime ? (data.endTime instanceof Timestamp ? data.endTime.toDate() : new Date(data.endTime)) : undefined,
        } as GameSession;
      }
      return null;
    } catch (error) {
      console.error('檢查進行中游戲失敗:', error);
      return null;
    }
  };

  const generateId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  // 創建新的游戲會話
  const createGameSession = async (scriptId: string) => {
    try {
      const now = new Date();
      const sampleScript = sampleScripts.find(s => s.id === scriptId);
      
      if (!sampleScript) {
        throw new Error('找不到對應的劇本');
      }

      // 初始化 tasks 對象
      const tasks: Record<string, { status: TaskStatus; completedAt?: Date; photo?: string }> = {};
      sampleScript.locations.forEach((_, index) => {
        const taskId = `task-${index + 1}`;
        tasks[taskId] = {
          status: index === 0 ? 'unlocked' : 'locked',
          completedAt: undefined,
          photo: undefined
        };
      });

      const gameSession: GameSession = {
        id: generateId(),
        scriptId,
        userId: user?.uid || '',
        status: 'in_progress',
        startTime: now,
        lastUpdated: now,
        currentTaskIndex: 0,
        tasks,
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

  // 更新任務狀態
  const updateTaskStatus = async (taskId: string, status: TaskStatus, photo?: string) => {
    if (!gameSession) {
      throw new Error('遊戲會話不存在');
    }

    try {
      const sessionRef = doc(db, 'gameSessions', gameSession.id);
      const updatedTasks = {
        ...gameSession.tasks,
        [taskId]: {
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

  // 初始化遊戲會話
  useEffect(() => {
    const initGameSession = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const sessionsRef = collection(db, 'gameSessions');
        const q = query(
          sessionsRef,
          where('userId', '==', user.uid),
          where('scriptId', '==', scriptId),
          where('status', '==', 'in_progress')
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data();
          
          // 確保 tasks 屬性存在
          const tasks = data.tasks || {};
          const sampleScript = sampleScripts.find(s => s.id === scriptId);
          
          // 如果 tasks 為空，初始化所有任務
          if (Object.keys(tasks).length === 0 && sampleScript) {
            sampleScript.locations.forEach((_, index) => {
              const taskId = `task-${index + 1}`;
              tasks[taskId] = {
                status: index === 0 ? 'unlocked' : 'locked',
                completedAt: undefined,
                photo: undefined
              };
            });
          }

          setGameSession({
            ...data,
            id: doc.id,
            startTime: data.startTime instanceof Timestamp ? data.startTime.toDate() : new Date(data.startTime),
            lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : new Date(data.lastUpdated),
            endTime: data.endTime ? (data.endTime instanceof Timestamp ? data.endTime.toDate() : new Date(data.endTime)) : undefined,
            tasks
          } as GameSession);
        }
      } catch (error) {
        console.error('初始化遊戲會話失敗:', error);
        setError('初始化遊戲會話失敗');
      } finally {
        setLoading(false);
      }
    };

    initGameSession();
  }, [user, scriptId]);

  return {
    gameSession,
    loading,
    error,
    createGameSession,
    updateTaskStatus
  };
}; 