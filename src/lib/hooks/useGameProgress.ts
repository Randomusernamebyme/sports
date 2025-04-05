import { useState, useEffect } from 'react';
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
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { GameSession } from '@/types';

export const useGameProgress = (scriptId?: string) => {
  const { user } = useAuth();
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 獲取遊戲進度
  useEffect(() => {
    const fetchGameProgress = async () => {
      if (!user || !scriptId) return;

      try {
        setLoading(true);
        const sessionsRef = collection(db, 'gameSessions');
        const q = query(
          sessionsRef,
          where('userId', '==', user.uid),
          where('scriptId', '==', scriptId),
          orderBy('startTime', 'desc')
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const latestSession = snapshot.docs[0].data() as GameSession;
          setGameSession(latestSession);
        }
      } catch (err: any) {
        console.error('獲取遊戲進度失敗:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGameProgress();
  }, [user, scriptId]);

  // 創建新的遊戲進度
  const createGameSession = async () => {
    if (!user || !scriptId) throw new Error('用戶未登入或劇本ID未提供');

    try {
      setLoading(true);
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
      };

      const docRef = doc(collection(db, 'gameSessions'));
      await setDoc(docRef, { ...newSession, id: docRef.id });
      newSession.id = docRef.id;
      setGameSession(newSession);
      return newSession;
    } catch (err: any) {
      console.error('創建遊戲進度失敗:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 更新遊戲進度
  const updateGameProgress = async (
    sessionId: string,
    updates: Partial<GameSession>
  ) => {
    if (!user) throw new Error('用戶未登入');

    try {
      setLoading(true);
      const sessionRef = doc(db, 'gameSessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        throw new Error('遊戲進度不存在');
      }

      const session = sessionDoc.data() as GameSession;
      if (session.userId !== user.uid) {
        throw new Error('無權限更新此遊戲進度');
      }

      await updateDoc(sessionRef, {
        ...updates,
        updatedAt: new Date(),
      });

      setGameSession(prev => prev ? { ...prev, ...updates } : null);
    } catch (err: any) {
      console.error('更新遊戲進度失敗:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 完成遊戲
  const completeGameSession = async (sessionId: string, finalScore: number) => {
    if (!user) throw new Error('用戶未登入');

    try {
      setLoading(true);
      await updateGameProgress(sessionId, {
        status: 'completed',
        score: finalScore,
        endTime: new Date(),
      });
    } catch (err: any) {
      console.error('完成遊戲失敗:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    gameSession,
    loading,
    error,
    createGameSession,
    updateGameProgress,
    completeGameSession,
  };
}; 