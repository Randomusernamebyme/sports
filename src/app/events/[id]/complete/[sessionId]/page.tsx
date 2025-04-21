'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { GameSession } from '@/types';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface CompletePageProps {}

const CompletePage: React.FC<CompletePageProps> = () => {
  const { id: scriptId, sessionId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);

  useEffect(() => {
    const fetchGameSession = async () => {
      if (!user) {
        setError('請先登錄');
        return;
      }

      try {
        const sessionRef = doc(db, 'gameSessions', sessionId as string);
        const sessionDoc = await getDoc(sessionRef);

        if (!sessionDoc.exists()) {
          setError('找不到游戲記錄');
          return;
        }

        const sessionData = sessionDoc.data() as GameSession;
        if (sessionData.userId !== user.uid) {
          setError('您沒有權限查看此游戲記錄');
          return;
        }

        setGameSession(sessionData);
      } catch (error) {
        console.error('獲取游戲記錄失敗:', error);
        setError('獲取游戲記錄失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchGameSession();
  }, [user, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
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
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            恭喜完成游戲！
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            您已完成所有任務，總得分：{gameSession.score} 分
          </p>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">任務回顧</h2>
          <div className="space-y-6">
            {Object.entries(gameSession.taskStatus).map(([taskId, status]) => (
              <div
                key={taskId}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <div className="flex items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      任務 {taskId}
                    </h3>
                    <p className="mt-1 text-gray-600">
                      狀態：{status === 'completed' ? '已完成' : status === 'in_progress' ? '進行中' : '待完成'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex justify-center space-x-4">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            返回首頁
          </button>
          <button
            onClick={() => router.push(`/events/${scriptId}/play`)}
            className="px-6 py-3 bg-white text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50"
          >
            再玩一次
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletePage; 