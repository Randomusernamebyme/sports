import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  runTransaction,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { GameSession } from '@/types';

export const useGameProgress = (
  scriptId?: string,
  onGameComplete?: (sessionId: string, score: number) => void
) => {
  const router = useRouter();
  const { user } = useAuth();
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 計算遊戲分數
  const calculateScore = (session: GameSession) => {
    const baseScore = 1000;
    const startTime = session.startTime instanceof Date ? session.startTime : new Date();
    const endTime = session.endTime instanceof Date ? session.endTime : new Date();
    const timeBonus = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // 每分鐘加1分
    const hintPenalty = (session.hintsUsed || 0) * 50; // 每個提示扣50分
    return Math.max(0, baseScore + timeBonus - hintPenalty);
  };

  // 獲取遊戲進度
  useEffect(() => {
    const fetchGameProgress = async () => {
      if (!user) {
        setLoading(false);
        setError('請先登入以繼續遊戲');
        return;
      }

      if (!scriptId) {
        setLoading(false);
        setError('劇本ID未提供');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const sessionsRef = collection(db, 'gameSessions');
        
        // 只獲取進行中的游戲
        const q = query(
          sessionsRef,
          where('userId', '==', user.uid),
          where('scriptId', '==', scriptId),
          where('status', '==', 'in_progress')
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const session = {
            ...snapshot.docs[0].data(),
            id: snapshot.docs[0].id
          } as GameSession;
          setGameSession(session);
        } else {
          setGameSession(null);
        }
      } catch (err: any) {
        console.error('獲取遊戲進度失敗:', err);
        setError('獲取遊戲進度時發生錯誤，請稍後重試');
      } finally {
        setLoading(false);
      }
    };

    fetchGameProgress();
  }, [user, scriptId]);

  // 創建新的遊戲進度
  const createGameSession = async () => {
    if (!user) {
      setError('請先登入以開始遊戲');
      return null;
    }

    if (!scriptId) {
      setError('劇本ID未提供');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      // 創建新的遊戲進度
      const newSession: GameSession = {
        id: '',
        scriptId,
        userId: user.uid,
        status: 'in_progress',
        currentLocationIndex: 0,
        score: 0,
        startTime: new Date(),
        completedLocations: [],
        hintsUsed: 0,
        taskStatus: {},
        lastUpdated: new Date(),
      };

      const docRef = doc(collection(db, 'gameSessions'));
      await setDoc(docRef, { ...newSession, id: docRef.id });
      newSession.id = docRef.id;
      setGameSession(newSession);
      return newSession;
    } catch (err: any) {
      console.error('創建遊戲進度失敗:', err);
      setError('創建遊戲進度時發生錯誤，請稍後重試');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 更新遊戲進度
  const updateGameProgress = async (
    sessionId: string,
    updates: Partial<GameSession>
  ) => {
    if (!user) {
      setError('請先登入以更新遊戲進度');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const sessionRef = doc(db, 'gameSessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        setError('遊戲進度不存在');
        return;
      }

      const session = sessionDoc.data() as GameSession;
      if (session.userId !== user.uid) {
        setError('無權限更新此遊戲進度');
        return;
      }

      // 更新任務狀態
      const updatedTaskStatus = {
        ...session.taskStatus,
        ...(updates.taskStatus || {}),
      };

      // 檢查是否所有任務都已完成
      const allTasksCompleted = Object.values(updatedTaskStatus).every(
        status => status === 'completed'
      );

      // 準備更新數據
      const updateData: Partial<GameSession> = {
        ...updates,
        taskStatus: updatedTaskStatus,
        lastUpdated: new Date(),
      };

      // 如果所有任務完成，更新遊戲狀態
      if (allTasksCompleted) {
        updateData.status = 'completed';
        updateData.endTime = new Date();
      }

      // 使用事務來確保原子性更新
      await runTransaction(db, async (transaction) => {
        const currentDoc = await transaction.get(sessionRef);
        if (!currentDoc.exists()) {
          throw new Error('遊戲進度不存在');
        }
        transaction.update(sessionRef, updateData);
      });

      // 更新本地狀態
      setGameSession(prev => prev ? {
        ...prev,
        ...updateData,
      } : null);

      // 如果所有任務完成，觸發完成回調
      if (allTasksCompleted) {
        onGameComplete?.(sessionId, session.score);
      }
    } catch (err: any) {
      console.error('更新遊戲進度失敗:', err);
      setError('更新遊戲進度時發生錯誤，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  // 處理遊戲完成
  const handleGameComplete = async (sessionId: string, score: number) => {
    if (!scriptId) return;

    try {
      // 先更新游戲狀態
      const sessionRef = doc(db, 'gameSessions', sessionId);
      await runTransaction(db, async (transaction) => {
        const sessionDoc = await transaction.get(sessionRef);
        if (!sessionDoc.exists()) {
          throw new Error('找不到遊戲進度');
        }

        const sessionData = sessionDoc.data() as GameSession;
        if (sessionData.userId !== user?.uid) {
          throw new Error('無權限更新此遊戲進度');
        }

        // 更新遊戲狀態
        transaction.update(sessionRef, {
          status: 'completed',
          score: score,
          endTime: new Date(),
          lastUpdated: new Date()
        });
      });

      // 更新本地狀態
      setGameSession(prev => prev ? {
        ...prev,
        status: 'completed',
        score: score,
        endTime: new Date(),
        lastUpdated: new Date()
      } : null);

      // 觸發完成回調
      onGameComplete?.(sessionId, score);

      // 確保數據已保存後再跳轉
      await new Promise(resolve => setTimeout(resolve, 500));

      // 使用正確的路徑格式
      router.push(`/events/${scriptId}/complete/${sessionId}`);
    } catch (error) {
      console.error('完成遊戲時發生錯誤:', error);
      setError('完成遊戲時發生錯誤，請稍後重試');
    }
  };

  // 更新任務狀態
  const updateTaskStatus = async (taskId: string, status: 'pending' | 'in_progress' | 'completed') => {
    if (!user) {
      throw new Error('用戶未登入');
    }

    if (!gameSession) {
      throw new Error('找不到遊戲進度');
    }

    try {
      const sessionRef = doc(db, 'gameSessions', gameSession.id);
      const taskIndex = parseInt(taskId.split('-')[1]) - 1;

      // 檢查是否可以更新任務狀態
      if (status === 'completed' && taskIndex > gameSession.currentLocationIndex) {
        throw new Error('需要先完成前面的任務');
      }

      // 準備更新數據
      const updateData: any = {
        [`taskStatus.${taskId}`]: status,
        lastUpdated: new Date()
      };

      // 如果任務完成，更新完成狀態和當前位置索引
      if (status === 'completed') {
        updateData.completedLocations = arrayUnion(taskId);
        updateData.currentLocationIndex = Math.max(gameSession.currentLocationIndex, taskIndex + 1);
      }

      // 使用事務確保數據一致性
      await runTransaction(db, async (transaction) => {
        const sessionDoc = await transaction.get(sessionRef);
        if (!sessionDoc.exists()) {
          throw new Error('找不到遊戲進度');
        }

        const sessionData = sessionDoc.data() as GameSession;
        const updatedTaskStatus = {
          ...sessionData.taskStatus,
          [taskId]: status
        };

        // 檢查是否所有任務都已完成
        const scriptTasks = Object.keys(updatedTaskStatus).filter(key => key.startsWith('task-'));
        const allTasksCompleted = scriptTasks.length > 0 && scriptTasks.every(
          taskId => updatedTaskStatus[taskId] === 'completed'
        );

        // 如果所有任務都已完成，更新遊戲狀態
        if (allTasksCompleted) {
          updateData.status = 'completed';
          updateData.endTime = new Date();
          updateData.score = calculateScore(sessionData);
        }

        transaction.update(sessionRef, updateData);
      });

      // 更新本地狀態
      setGameSession(prev => {
        if (!prev) return null;
        const updatedTaskStatus = {
          ...prev.taskStatus,
          [taskId]: status
        };
        
        // 檢查是否所有任務都已完成
        const scriptTasks = Object.keys(updatedTaskStatus).filter(key => key.startsWith('task-'));
        const allTasksCompleted = scriptTasks.length > 0 && scriptTasks.every(
          taskId => updatedTaskStatus[taskId] === 'completed'
        );

        return {
          ...prev,
          taskStatus: updatedTaskStatus,
          completedLocations: status === 'completed' 
            ? [...prev.completedLocations, taskId]
            : prev.completedLocations,
          currentLocationIndex: status === 'completed'
            ? Math.max(prev.currentLocationIndex, taskIndex + 1)
            : prev.currentLocationIndex,
          status: allTasksCompleted ? 'completed' : 'in_progress',
          endTime: allTasksCompleted ? new Date() : prev.endTime,
          score: allTasksCompleted ? calculateScore(prev) : prev.score
        };
      });

      // 如果所有任務都已完成，觸發完成回調
      const updatedSession = await getDoc(sessionRef);
      const sessionData = updatedSession.data() as GameSession;
      const scriptTasks = Object.keys(sessionData.taskStatus).filter(key => key.startsWith('task-'));
      const allTasksCompleted = scriptTasks.length > 0 && scriptTasks.every(
        taskId => sessionData.taskStatus[taskId] === 'completed'
      );

      if (allTasksCompleted) {
        await handleGameComplete(gameSession.id, calculateScore(sessionData));
      }

      return true;
    } catch (error: any) {
      console.error('更新任務狀態失敗:', error);
      if (error.message === '用戶未登入') {
        throw new Error('請先登入後再提交任務');
      } else if (error.message === '找不到遊戲進度') {
        throw new Error('遊戲進度已丟失，請重新開始遊戲');
      } else if (error.message === '需要先完成前面的任務') {
        throw new Error('請按順序完成任務');
      } else {
        throw new Error('提交任務時發生錯誤，請稍後重試');
      }
    }
  };

  return {
    gameSession,
    loading,
    error,
    createGameSession,
    updateGameProgress,
    updateTaskStatus,
    handleGameComplete,
  };
}; 