'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-indigo-600">
                {user.email?.[0].toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">個人資料</h2>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">帳號資訊</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">電子郵件</label>
                  <div className="mt-1 text-sm text-gray-900">{user.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">帳號類型</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {user.providerData[0]?.providerId === 'password' ? '電子郵件' : 
                     user.providerData[0]?.providerId === 'google.com' ? 'Google' :
                     user.providerData[0]?.providerId === 'phone' ? '手機號碼' : '其他'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">註冊時間</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleString() : '未知'}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">安全設定</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">電子郵件驗證</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {user.emailVerified ? '已驗證' : '未驗證'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">最後登入時間</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : '未知'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 