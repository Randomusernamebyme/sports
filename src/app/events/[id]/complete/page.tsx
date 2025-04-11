'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { GameSession } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function GameCompletePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGameSession = async () => {
      if (!user) {
        setError('請先登入');
        setLoading(false);
        return;
      }

      const sessionId = searchParams.get('id');
      if (!sessionId) {
        setError('找不到遊戲記錄');
        setLoading(false);
        return;
      }

      try {
        const sessionRef = doc(db, 'gameSessions', sessionId);
        const sessionDoc = await getDoc(sessionRef);

        if (!sessionDoc.exists()) {
          setError('找不到遊戲記錄');
          setLoading(false);
          return;
        }

        const session = sessionDoc.data() as GameSession;
        if (session.userId !== user.uid) {
          setError('無權限查看此遊戲記錄');
          setLoading(false);
          return;
        }

        setGameSession(session);
      } catch (err: any) {
        console.error('獲取遊戲記錄失敗:', err);
        setError('獲取遊戲記錄時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    fetchGameSession();
  }, [user, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  if (!gameSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">找不到遊戲記錄</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  const startTime = gameSession.startTime instanceof Date 
    ? gameSession.startTime 
    : new Date(gameSession.startTime);
  const endTime = gameSession.endTime instanceof Date 
    ? gameSession.endTime 
    : new Date(gameSession.endTime!);
  const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60); // 分鐘

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full mx-4 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">恭喜完成遊戲！</h1>
          
          <div className="p-4 bg-green-50 rounded-lg mb-8">
            <p className="text-sm text-green-600">完成時間</p>
            <p className="text-2xl font-bold text-green-700">{duration} 分鐘</p>
          </div>

          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            返回首頁
          </button>
        </div>
      </div>
    </div>
  );
} 