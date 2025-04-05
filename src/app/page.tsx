'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { sampleScripts } from '@/lib/scripts';

interface GameSession {
  scriptId: string;
  mode: 'solo' | 'team';
  roomCode?: string;
  timestamp: number;
}

export default function HomePage() {
  const { user } = useAuth();
  const [activeGame, setActiveGame] = useState<GameSession | null>(null);

  useEffect(() => {
    // 從 localStorage 獲取當前遊戲狀態
    const savedGame = localStorage.getItem('activeGame');
    if (savedGame) {
      setActiveGame(JSON.parse(savedGame));
    }
  }, []);

  const handleReturnToGame = () => {
    if (activeGame) {
      const { scriptId, mode, roomCode } = activeGame;
      const url = `/events/${scriptId}/play?mode=${mode}${roomCode ? `&room=${roomCode}` : ''}`;
      window.location.href = url;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部用戶信息 */}
      <div className="bg-white p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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
                    已完成 {0} 個任務
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 進行中的遊戲 */}
        {activeGame && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">進行中的遊戲</h3>
                <p className="text-sm text-gray-500">
                  {sampleScripts.find(s => s.id === activeGame.scriptId)?.title} - 
                  {activeGame.mode === 'solo' ? '單人模式' : '組隊模式'}
                </p>
              </div>
              <button
                onClick={handleReturnToGame}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                繼續遊戲
              </button>
            </div>
          </div>
        )}

        {/* 快速操作 */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/events"
            className="bg-white p-4 rounded-lg shadow text-center hover:shadow-md transition-shadow"
          >
            <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="font-medium text-gray-900">開始新遊戲</p>
          </Link>
          <Link
            href="/profile"
            className="bg-white p-4 rounded-lg shadow text-center hover:shadow-md transition-shadow"
          >
            <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="font-medium text-gray-900">個人中心</p>
          </Link>
        </div>

        {/* 最近劇本 */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">最近劇本</h2>
          <div className="grid gap-4">
            {sampleScripts.slice(0, 3).map((script) => (
              <Link
                key={script.id}
                href={`/events/${script.id}`}
                className="bg-white rounded-lg shadow overflow-hidden flex items-center"
              >
                <div className="relative h-24 w-24 flex-shrink-0">
                  <Image
                    src={script.coverImage || '/images/scripts/default.jpg'}
                    alt={script.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4 flex-1">
                  <h3 className="font-medium text-gray-900">{script.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{script.description}</p>
                  <div className="mt-2 flex items-center text-xs text-gray-500 space-x-2">
                    <span>{script.duration} 分鐘</span>
                    <span>•</span>
                    <span>{script.difficulty}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 