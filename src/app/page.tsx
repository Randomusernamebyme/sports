'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { sampleScripts } from '@/lib/scripts';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { GameSession } from '@/types';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [completedGames, setCompletedGames] = useState(0);
  const [latestSession, setLatestSession] = useState<GameSession | null>(null);

  useEffect(() => {
    const fetchGameProgress = async () => {
      if (!user) return;

      try {
        const sessionsRef = collection(db, 'gameSessions');
        
        // 獲取已完成的遊戲數量
        const completedQuery = query(
          sessionsRef,
          where('userId', '==', user.uid),
          where('status', '==', 'completed')
        );
        const completedSnapshot = await getDocs(completedQuery);
        setCompletedGames(completedSnapshot.size);

        // 獲取最新的進行中遊戲
        const inProgressQuery = query(
          sessionsRef,
          where('userId', '==', user.uid),
          where('status', '==', 'in_progress')
        );
        const inProgressSnapshot = await getDocs(inProgressQuery);
        if (!inProgressSnapshot.empty) {
          const latestGame = inProgressSnapshot.docs[0].data() as GameSession;
          setLatestSession(latestGame);
        }
      } catch (error) {
        console.error('獲取遊戲進度失敗:', error);
      }
    };

    fetchGameProgress();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || '用戶'}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="text-xl font-medium text-indigo-600">
                      {(user.displayName || '用戶')[0]}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {user.displayName || '用戶'}
                  </p>
                  <p className="text-sm text-gray-500">
                    已完成 {completedGames} 個遊戲
                  </p>
                </div>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="text-indigo-600 font-medium"
              >
                登入/註冊
              </Link>
            )}
          </div>

          {latestSession && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900">繼續遊戲</h3>
              <div className="mt-4 bg-indigo-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">進行中的遊戲</p>
                    <p className="mt-1 text-sm text-gray-500">
                      已完成 {latestSession.completedLocations.length} 個地點
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      目前得分：{latestSession.score}
                    </p>
                  </div>
                  <Link
                    href={`/events/${latestSession.scriptId}/play`}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    繼續
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 