'use client';

import { useParams } from 'next/navigation';
import { sampleScripts } from '@/lib/scripts';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

export default function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const script = sampleScripts.find(s => s.id === id);

  if (!script) {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative h-96">
            <Image
              src={script.coverImage || '/images/scripts/default.jpg'}
              alt={script.title}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="p-8">
            <h1 className="text-4xl font-extrabold text-gray-900">{script.title}</h1>
            <p className="mt-4 text-lg text-gray-500">{script.description}</p>
            
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">遊戲資訊</h2>
                <dl className="mt-4 space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">難度</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {script.difficulty === 'easy' && '簡單'}
                      {script.difficulty === 'medium' && '中等'}
                      {script.difficulty === 'hard' && '困難'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">預計時間</dt>
                    <dd className="mt-1 text-sm text-gray-900">{Math.floor(script.duration / 60)}小時</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-900">地點資訊</h2>
                <dl className="mt-4 space-y-4">
                  {script.locations.map((location) => (
                    <div key={location.id}>
                      <dt className="text-sm font-medium text-gray-500">{location.name}</dt>
                      <dd className="mt-1 text-sm text-gray-900">{location.address}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="mt-8">
              {user ? (
                <Link
                  href={`/events/${script.id}/play`}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  開始遊戲
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  登入後開始
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 