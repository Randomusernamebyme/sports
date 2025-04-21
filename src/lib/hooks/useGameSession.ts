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
          startTime: data.startTime.toDate(),
          lastUpdated: data.lastUpdated.toDate(),
          endTime: data.endTime?.toDate(),
        } as GameSession;
      }
      return null;
    } catch (error) {
      console.error('檢查進行中游戲失敗:', error);
      return null;
    }
  };

  // 創建新的游戲會話
  const createGameSession = async () => {
    if (!user) {
      throw new Error('用戶未登入');
    }

    try {
      const sessionRef = doc(collection(db, 'gameSessions'));
      const now = new Date();

      const newSession: Omit<GameSession, 'id'> = {
        userId: user.uid,
        scriptId,
        status: 'in_progress',
        startTime: now,
        lastUpdated: now,
        currentTaskIndex: 0,
        tasks: {
          'task-1': { status: 'unlocked' }
        },
        playCount: 1
      };

      await setDoc(sessionRef, {
        ...newSession,
        startTime: Timestamp.fromDate(now),
        lastUpdated: Timestamp.fromDate(now)
      });

      return {
        ...newSession,
        id: sessionRef.id
      } as GameSession;
    } catch (error) {
      console.error('創建游戲會話失敗:', error);
      throw new Error('創建游戲會話失敗');
    }
  };

  // 更新任務狀態
  const updateTaskStatus = async (taskId: string, status: TaskStatus, photo?: string) => {
    if (!user || !gameSession) {
      throw new Error('無效的游戲會話');
    }

    try {
      const sessionRef = doc(db, 'gameSessions', gameSession.id);
      const taskIndex = parseInt(taskId.split('-')[1]) - 1;

      await runTransaction(db, async (transaction) => {
        const sessionDoc = await transaction.get(sessionRef);
        if (!sessionDoc.exists()) {
          throw new Error('找不到游戲會話');
        }

        const sessionData = sessionDoc.data() as GameSession;
        if (sessionData.userId !== user.uid) {
          throw new Error('無權限更新此游戲會話');
        }

        // 更新任務狀態
        const updatedTasks = {
          ...sessionData.tasks,
          [taskId]: {
            status,
            completedAt: status === 'completed' ? serverTimestamp() : undefined,
            photo
          }
        };

        // 如果任務完成，解鎖下一個任務
        if (status === 'completed' && taskIndex < sessionData.currentTaskIndex) {
          const nextTaskId = `task-${taskIndex + 2}`;
          updatedTasks[nextTaskId] = { status: 'unlocked' };
        }

        // 檢查是否所有任務都已完成
        const allTasksCompleted = Object.values(updatedTasks).every(
          task => task.status === 'completed'
        );

        transaction.update(sessionRef, {
          tasks: updatedTasks,
          currentTaskIndex: Math.max(sessionData.currentTaskIndex, taskIndex + 1),
          status: allTasksCompleted ? 'completed' : 'in_progress',
          endTime: allTasksCompleted ? serverTimestamp() : undefined,
          lastUpdated: serverTimestamp()
        });
      });

      // 更新本地狀態
      const updatedSession = await getDoc(sessionRef);
      const sessionData = updatedSession.data() as GameSession;
      setGameSession({
        ...sessionData,
        id: updatedSession.id,
        startTime: sessionData.startTime.toDate(),
        lastUpdated: sessionData.lastUpdated.toDate(),
        endTime: sessionData.endTime?.toDate()
      });

      return true;
    } catch (error) {
      console.error('更新任務狀態失敗:', error);
      throw error;
    }
  };

  // 初始化游戲會話
  useEffect(() => {
    const initGameSession = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 檢查是否有進行中的游戲
        const inProgressSession = await checkInProgressGame();
        if (inProgressSession) {
          setGameSession(inProgressSession);
        }
      } catch (error) {
        console.error('初始化游戲會話失敗:', error);
        setError('初始化游戲會話失敗');
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