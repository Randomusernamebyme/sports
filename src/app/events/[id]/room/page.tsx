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
  isHost: boolean;
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 模擬房間成員數據
    if (user) {
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
      setIsLoading(true);
      setTimeout(() => {
        window.location.href = `/events/${id}/play?mode=team&room=${roomCode}`;
      }, 1000);
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

  const allMembersReady = members.every(member => member.isReady);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 房間信息 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">房間：{roomCode}</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {/* 實現分享功能 */}}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                分享房間碼
              </button>
            </div>
          </div>
          
          {/* 遊戲說明 */}
          <div className="bg-indigo-50 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-indigo-900 mb-2">遊戲說明</h2>
            <ul className="text-sm text-indigo-800 space-y-2">
              <li>• 所有玩家準備就緒後，房主可以開始遊戲</li>
              <li>• 遊戲開始後，每位玩家需要到達指定地點完成任務</li>
              <li>• 拍照上傳作為完成任務的證明</li>
              <li>• 團隊模式下，玩家可以互相溝通協作</li>
            </ul>
          </div>

          {/* 成員列表 */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">房間成員</h2>
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <span className="text-xl font-medium text-indigo-600">
                          {member.name[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.name} {member.isHost && <span className="text-xs text-indigo-600 ml-1">房主</span>}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.isReady ? '已準備' : '未準備'}
                      </p>
                    </div>
                  </div>
                  {user?.uid === member.id && !member.isReady && (
                    <button
                      onClick={handleReady}
                      disabled={isLoading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isLoading ? '處理中...' : '準備'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 開始遊戲按鈕 */}
          {isHost && allMembersReady && (
            <div className="mt-6">
              <button
                onClick={handleStartGame}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-lg font-medium"
              >
                {isLoading ? '開始中...' : '開始遊戲'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 