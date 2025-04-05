'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { sampleScripts } from '@/lib/scripts';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface RoomMember {
  id: string;
  name: string;
  avatar?: string;
  isReady: boolean;
}

export default function RoomPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const script = sampleScripts.find(s => s.id === id);
  const roomCode = searchParams.get('code');
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    // 模擬房間成員數據
    if (user) {
      setMembers([
        {
          id: user.uid,
          name: user.displayName || '玩家',
          avatar: user.photoURL || undefined,
          isReady: isReady
        },
        {
          id: '2',
          name: '玩家2',
          isReady: false
        },
        {
          id: '3',
          name: '玩家3',
          isReady: false
        }
      ]);
      // 如果是房主
      setIsHost(true);
    }
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
      window.location.href = `/events/${id}/play?mode=team&room=${roomCode}`;
    } else {
      alert('請等待所有玩家準備完成');
    }
  };

  if (!script || !roomCode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900">找不到房間</h1>
            <p className="mt-3 text-lg text-gray-500">房間代碼無效或房間已關閉。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">{script.title}</h1>
              <div className="bg-indigo-100 px-4 py-2 rounded-md">
                <span className="text-indigo-700 font-medium">房間代碼：{roomCode}</span>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">房間成員</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="relative h-12 w-12">
                      {member.avatar ? (
                        <Image
                          src={member.avatar}
                          alt={member.name}
                          fill
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">
                        {member.isReady ? '已準備' : '未準備'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              {!isHost ? (
                <button
                  onClick={handleReady}
                  className={`px-6 py-3 rounded-md text-white font-medium ${
                    isReady
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isReady ? '取消準備' : '準備'}
                </button>
              ) : (
                <button
                  onClick={handleStartGame}
                  className="px-6 py-3 rounded-md text-white font-medium bg-indigo-600 hover:bg-indigo-700"
                >
                  開始遊戲
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 