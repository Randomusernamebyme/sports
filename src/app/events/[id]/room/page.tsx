'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { sampleEvents } from '@/lib/scripts';
import { RoomMember } from '@/types';
import { useState, useEffect } from 'react';

export default function RoomPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const event = sampleEvents.find(e => e.id === id);
  const roomCode = searchParams.get('code');
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    // 模擬房間成員數據
    setMembers([
      {
        id: user.uid,
        name: user.displayName || '玩家',
        avatar: user.photoURL || undefined,
        isReady: isReady,
        isHost: true
      },
      {
        id: '2',
        name: '玩家2',
        isReady: false,
        isHost: false
      },
      {
        id: '3',
        name: '玩家3',
        isReady: false,
        isHost: false
      }
    ]);
    setIsHost(true);
  }, [user, isReady]);

  const handleReady = () => {
    setIsReady(!isReady);
    setMembers(members.map(member => 
      member.id === user?.uid 
        ? { ...member, isReady: !isReady }
        : member
    ));
  };

  const handleStartGame = () => {
    if (members.every(member => member.isReady)) {
      setIsLoading(true);
      setTimeout(() => {
        window.location.href = `/events/${id}/play?mode=team&room=${roomCode}`;
      }, 1000);
    } else {
      alert('請等待所有玩家準備完成');
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900">找不到劇本</h1>
            <p className="mt-3 text-lg text-gray-500">該劇本可能已被移除或暫時不可用。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                <p className="mt-2 text-gray-600">房間代碼：{roomCode}</p>
              </div>
              {isHost && (
                <button
                  onClick={handleStartGame}
                  disabled={!members.every(member => member.isReady)}
                  className={`px-6 py-3 rounded-lg text-white font-medium ${
                    members.every(member => member.isReady)
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  開始遊戲
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">房間成員</h2>
                <div className="space-y-4">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white">
                              {member.name[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.name}
                            {member.isHost && (
                              <span className="ml-2 text-sm text-indigo-600">(房主)</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {member.isReady ? '已準備' : '未準備'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">遊戲資訊</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <dl className="space-y-4">
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
                      <dd className="mt-1 text-sm text-gray-900">
                        {Math.floor(event.duration / 60)}小時
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">最大人數</dt>
                      <dd className="mt-1 text-sm text-gray-900">{event.maxPlayers}人</dd>
                    </div>
                  </dl>
                </div>

                {!isHost && (
                  <button
                    onClick={handleReady}
                    className={`mt-6 w-full px-6 py-3 rounded-lg text-white font-medium ${
                      isReady
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isReady ? '取消準備' : '準備'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 