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
        
        const q = query(
          sessionsRef,
          where('userId', '==', user.uid),
          where('scriptId', '==', scriptId)
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const sessions = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          })) as GameSession[];
          
          const sortedSessions = sessions.sort((a, b) => {
            const timeA = a.startTime instanceof Date ? a.startTime : new Date(a.startTime);
            const timeB = b.startTime instanceof Date ? b.startTime : new Date(b.startTime);
            return timeB.getTime() - timeA.getTime();
          });
          
          setGameSession(sortedSessions[0]);
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

      // 檢查是否已有進行中的遊戲
      const sessionsRef = collection(db, 'gameSessions');
      const q = query(
        sessionsRef,
        where('userId', '==', user.uid),
        where('scriptId', '==', scriptId),
        where('status', '==', 'in_progress')
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const existingSession = snapshot.docs[0].data() as GameSession;
        setGameSession(existingSession);
        return existingSession;
      }

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
        taskStatus: {}, // 新增任務狀態追蹤
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

  // 更新任務狀態
  const updateTaskStatus = async (sessionId: string, taskId: string, status: 'pending' | 'in_progress' | 'completed') => {
    if (!user) {
      setError('請先登入以更新任務狀態');
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
        [taskId]: status,
      };

      // 檢查是否所有任務都已完成
      const allTasksCompleted = Object.values(updatedTaskStatus).every(
        status => status === 'completed'
      );

      // 準備更新數據
      const updateData: Partial<GameSession> = {
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
      console.error('更新任務狀態失敗:', err);
      setError('更新任務狀態時發生錯誤，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  // 完成遊戲
  const completeGameSession = async (sessionId: string, finalScore: number) => {
    if (!user) {
      setError('請先登入以完成遊戲');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await updateGameProgress(sessionId, {
        status: 'completed',
        score: finalScore,
        endTime: new Date(),
      });
    } catch (err: any) {
      console.error('完成遊戲失敗:', err);
      setError('完成遊戲時發生錯誤，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  // 處理遊戲完成
  const handleGameComplete = (sessionId: string, score: number) => {
    onGameComplete?.(sessionId, score);
    router.push(`/events/${scriptId}/complete?id=${sessionId}`);
  };

  return {
    gameSession,
    loading,
    error,
    createGameSession,
    updateGameProgress,
    updateTaskStatus,
    completeGameSession,
    handleGameComplete,
  };
}; 