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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-indigo-800">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-bg.jpg"
            alt="城市尋寶背景"
            fill
            className="object-cover opacity-20"
            priority
          />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            探索城市，解開謎題
          </h1>
          <p className="mt-6 text-xl text-indigo-100 max-w-3xl">
            加入城市尋寶遊戲，探索香港的每個角落，解開精心設計的謎題，尋找隱藏的寶藏！
          </p>
          <div className="mt-10">
            <Link
              href="/events"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50"
            >
              開始尋寶
            </Link>
          </div>
        </div>
      </div>

      {/* 進行中的遊戲 */}
      {activeGame && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">進行中的遊戲</h3>
                <p className="text-sm text-gray-500">
                  {sampleScripts.find(s => s.id === activeGame.scriptId)?.title} - 
                  {activeGame.mode === 'solo' ? '單人模式' : '組隊模式'}
                </p>
              </div>
              <button
                onClick={handleReturnToGame}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                返回遊戲
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">遊戲特色</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              為什麼選擇城市尋寶？
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">即時解謎</h3>
                  <p className="mt-2 text-base text-gray-500">
                    使用手機即時解開謎題，獲得線索，一步步接近寶藏。
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">探索城市</h3>
                  <p className="mt-2 text-base text-gray-500">
                    走訪香港各區，發現隱藏的景點和歷史建築。
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">靈活時間</h3>
                  <p className="mt-2 text-base text-gray-500">
                    自由選擇開始時間，按照自己的節奏完成遊戲。
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">排行榜</h3>
                  <p className="mt-2 text-base text-gray-500">
                    與其他玩家競爭，登上排行榜，贏取獎勵。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 熱門劇本 */}
      <div className="bg-indigo-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">熱門劇本</h2>
            <p className="mt-4 text-lg text-gray-500">探索我們最受歡迎的劇本</p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {sampleScripts.slice(0, 3).map((script) => (
              <Link
                key={script.id}
                href={`/events/${script.id}`}
                className="group"
              >
                <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-200 hover:scale-105">
                  <div className="relative h-48">
                    <Image
                      src={script.coverImage || '/images/scripts/default.jpg'}
                      alt={script.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900">{script.title}</h3>
                    <p className="mt-2 text-gray-500">{script.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-500">{script.duration} 分鐘</span>
                      <span className="text-sm text-gray-500">{script.difficulty}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/events"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              查看更多劇本
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            <span className="block">準備好開始冒險了嗎？</span>
            <span className="block text-indigo-600">立即加入城市尋寶！</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              {user ? (
                <Link
                  href="/events"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  開始遊戲
                </Link>
              ) : (
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  立即註冊
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 