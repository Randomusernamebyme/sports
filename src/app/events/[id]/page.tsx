'use client';

import { useParams } from 'next/navigation';
import { sampleEvents } from '@/lib/scripts';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const event = sampleEvents.find(e => e.id === id);
  const [showRoomOptions, setShowRoomOptions] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [selectedMode, setSelectedMode] = useState<'solo' | 'team'>('solo');
  const router = useRouter();

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900">找不到劇本</h1>
            <p className="mt-3 text-lg text-gray-500">該劇本可能已被移除或暫時不可用。</p>
            <div className="mt-6">
              <Link
                href="/events"
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                返回劇本列表
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleModeSelect = (mode: 'solo' | 'team') => {
    setSelectedMode(mode);
    if (mode === 'solo') {
      // 單人模式直接開始
      localStorage.setItem('activeGame', JSON.stringify({
        scriptId: id,
        mode: 'solo',
        timestamp: Date.now()
      }));
      router.push(`/events/${id}/play?mode=solo`);
    } else {
      // 組隊模式顯示房間選項
      setShowRoomOptions(true);
      setRoomCode('');
    }
  };

  const handleCreateRoom = () => {
    if (selectedMode === 'team') {
      const code = generateRoomCode();
      setRoomCode(code);
      // 保存遊戲狀態
      localStorage.setItem('activeGame', JSON.stringify({
        scriptId: id,
        mode: 'team',
        roomCode: code,
        timestamp: Date.now()
      }));
      // 跳轉到遊戲頁面
      router.push(`/events/${id}/play?mode=team&room=${code}`);
    }
  };

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      // 保存遊戲狀態
      localStorage.setItem('activeGame', JSON.stringify({
        scriptId: id,
        mode: 'team',
        roomCode: roomCode.trim(),
        timestamp: Date.now()
      }));
      // 跳轉到遊戲頁面
      router.push(`/events/${id}/play?mode=team&room=${roomCode.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative h-96">
            <Image
              src={event.imageUrl || '/images/scripts/default.jpg'}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="p-8">
            <h1 className="text-4xl font-extrabold text-gray-900">{event.title}</h1>
            <p className="mt-4 text-lg text-gray-500">{event.description}</p>
            
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">遊戲資訊</h2>
                <dl className="mt-4 space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">難度</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {event.difficulty === 'easy' && '簡單'}
                      {event.difficulty === 'medium' && '中等'}
                      {event.difficulty === 'hard' && '困難'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">預計時間</dt>
                    <dd className="mt-1 text-sm text-gray-900">{Math.floor(event.duration / 60)}小時</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">最大人數</dt>
                    <dd className="mt-1 text-sm text-gray-900">{event.maxPlayers}人</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">價格</dt>
                    <dd className="mt-1 text-sm text-gray-900">${event.price}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-900">地點資訊</h2>
                <dl className="mt-4 space-y-4">
                  {event.locations.map((location) => (
                    <div key={location.id}>
                      <dt className="text-sm font-medium text-gray-500">{location.name}</dt>
                      <dd className="mt-1 text-sm text-gray-900">{location.address}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* 遊戲模式選擇 */}
            {!showRoomOptions && (
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-medium text-gray-900">選擇遊戲模式</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleModeSelect('solo')}
                    className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <h4 className="text-lg font-medium text-gray-900">單人模式</h4>
                    <p className="mt-1 text-sm text-gray-500">獨自完成所有任務</p>
                  </button>
                  <button
                    onClick={() => handleModeSelect('team')}
                    className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <h4 className="text-lg font-medium text-gray-900">組隊模式</h4>
                    <p className="mt-1 text-sm text-gray-500">與朋友一起完成任務</p>
                  </button>
                </div>
              </div>
            )}

            {/* 房間選項 */}
            {showRoomOptions && (
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-medium text-gray-900">選擇或創建房間</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg shadow">
                    <h4 className="text-lg font-medium text-gray-900">創建新房間</h4>
                    <button
                      onClick={() => {
                        const code = generateRoomCode();
                        setRoomCode(code);
                        router.push(`/events/${id}/room?code=${code}`);
                      }}
                      className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      創建房間
                    </button>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow">
                    <h4 className="text-lg font-medium text-gray-900">加入房間</h4>
                    <div className="mt-4">
                      <input
                        type="text"
                        placeholder="輸入房間代碼"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                      <button
                        onClick={() => {
                          if (roomCode) {
                            router.push(`/events/${id}/room?code=${roomCode}`);
                          }
                        }}
                        className="mt-2 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        disabled={!roomCode}
                      >
                        加入房間
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 