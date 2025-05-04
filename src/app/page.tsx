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
  const [inProgressGames, setInProgressGames] = useState<GameSession[]>([]);
  const [latestSession, setLatestSession] = useState<GameSession | null>(null);

  useEffect(() => {
    const fetchGameProgress = async () => {
      if (!user) return;

      try {
        const sessionsRef = collection(db, 'gameSessions');
        
        // 獲取已完成的游戲數量（每個劇本只計算一次）
        const completedQuery = query(
          sessionsRef,
          where('userId', '==', user.uid),
          where('status', '==', 'completed')
        );
        const completedSnapshot = await getDocs(completedQuery);
        const completedScripts = new Set();
        completedSnapshot.forEach(doc => {
          const data = doc.data();
          completedScripts.add(data.scriptId);
        });
        setCompletedGames(completedScripts.size);

        // 獲取進行中的游戲
        const inProgressQuery = query(
          sessionsRef,
          where('userId', '==', user.uid),
          where('status', '==', 'in_progress')
        );
        const inProgressSnapshot = await getDocs(inProgressQuery);
        const inProgressGames = inProgressSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          startTime: doc.data().startTime.toDate(),
          lastUpdated: doc.data().lastUpdated.toDate()
        })) as GameSession[];

        // 按最後更新時間排序
        inProgressGames.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
        setInProgressGames(inProgressGames);

        // 設置最新的進行中游戲
        if (inProgressGames.length > 0) {
          setLatestSession(inProgressGames[0]);
        }
      } catch (error) {
        console.error('獲取遊戲進度失敗:', error);
      }
    };

    fetchGameProgress();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card">
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || '用戶'}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="text-xl font-medium text-primary-600">
                      {(user.displayName || '用戶')[0]}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-primary-900">
                    {user.displayName || '用戶'}
                  </p>
                  <p className="text-sm text-primary-600">
                    已完成 {completedGames} 個劇本
                  </p>
                </div>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="nav-link"
              >
                登入/註冊
              </Link>
            )}
          </div>

          {inProgressGames.length > 0 && (
            <div className="mt-6 border-t border-primary-100 pt-6">
              <h3 className="heading">進行中的游戲</h3>
              <div className="space-y-4">
                {inProgressGames.map((session) => {
                  const script = sampleScripts.find(s => s.id === session.scriptId);
                  if (!script) return null;

                  return (
                    <div key={session.id} className="bg-primary-50 rounded-lg p-4 border border-primary-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-primary-900">{script.title}</p>
                          <p className="mt-1 text-sm text-primary-600">
                            已完成 {session.completedLocations.length} / {script.locations.length} 個地點
                          </p>
                          <p className="mt-1 text-xs text-primary-400">
                            上次更新：{new Date(session.lastUpdated).toLocaleString()}
                          </p>
                        </div>
                        <Link
                          href={`/events/${session.scriptId}/play`}
                          className="btn-primary"
                        >
                          繼續
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 