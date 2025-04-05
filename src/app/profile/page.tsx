'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface LinkedAccount {
  type: 'email' | 'phone' | 'google';
  value: string;
  isVerified: boolean;
}

export default function ProfilePage() {
  const { user, updateProfile, linkPhoneNumber, verifyPhoneLinkCode, linkEmail, updatePassword, deleteAccount, unlinkProvider } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEmailPassword, setNewEmailPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setAvatarPreview(user.photoURL || '');
      updateLinkedAccounts();
    }
  }, [user]);

  const updateLinkedAccounts = () => {
    if (!user) return;

    const accounts: LinkedAccount[] = [];
    
    // 添加郵箱帳號
    if (user.email) {
      accounts.push({
        type: 'email',
        value: user.email,
        isVerified: user.emailVerified
      });
    }
    
    // 添加電話號碼
    if (user.phoneNumber) {
      accounts.push({
        type: 'phone',
        value: user.phoneNumber,
        isVerified: true // Firebase 的電話號碼在綁定時已經驗證過
      });
    }
    
    // 添加 Google 帳號
    const googleProvider = user.providerData.find(p => p.providerId === 'google.com');
    if (googleProvider) {
      accounts.push({
        type: 'google',
        value: googleProvider.email || '',
        isVerified: true
      });
    }
    
    setLinkedAccounts(accounts);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('圖片大小不能超過 5MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhoneVerification = async () => {
    try {
      const id = await linkPhoneNumber(newPhone);
      setVerificationId(id);
      setShowVerificationInput(true);
    } catch (error: any) {
      setError(error.message || '發送驗證碼失敗');
    }
  };

  const handleVerifyCode = async () => {
    try {
      await verifyPhoneLinkCode(verificationId, verificationCode);
      setShowVerificationInput(false);
      setNewPhone('');
      setVerificationCode('');
      updateLinkedAccounts();
    } catch (error: any) {
      setError(error.message || '驗證碼錯誤');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setPasswordError('');

    try {
      // 驗證密碼
      if (newPassword) {
        // 檢查密碼長度
        if (newPassword.length < 6) {
          setPasswordError('密碼長度至少為6個字符');
          setIsLoading(false);
          return;
        }

        // 檢查密碼複雜度
        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasNumbers = /\d/.test(newPassword);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
        
        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
          setPasswordError('密碼必須包含大小寫字母、數字和特殊字符');
          setIsLoading(false);
          return;
        }

        // 檢查密碼匹配
        if (newPassword !== confirmPassword) {
          setPasswordError('密碼不匹配');
          setIsLoading(false);
          return;
        }
      }

      // 更新個人資料
      await updateProfile({
        displayName,
        photoURL: avatarPreview
      });
      
      // 如果有新密碼，進行更新
      if (newPassword) {
        await updatePassword(newPassword);
      }
      
      // 如果有新的郵箱，進行連接
      if (newEmail && newEmailPassword && !linkedAccounts.find(acc => acc.value === newEmail)) {
        await linkEmail(newEmail, newEmailPassword);
      }
      
      setIsEditing(false);
      setNewEmailPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      updateLinkedAccounts();
    } catch (error: any) {
      setError(error.message || '更新失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlinkAccount = async (providerId: string) => {
    try {
      await unlinkProvider(providerId);
      updateLinkedAccounts();
    } catch (error: any) {
      setError(error.message || '解除關聯失敗');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      router.push('/auth/login');
    } catch (error: any) {
      setError(error.message || '刪除帳號失敗');
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 頂部導航欄 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">個人資料</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          {/* 個人資料部分 */}
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="頭像"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                      <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 cursor-pointer">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{displayName || '未設置名稱'}</h2>
                <p className="text-sm text-gray-500">ID: {user?.uid}</p>
              </div>
            </div>

            {/* 帳號管理 */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">帳號管理</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  {isEditing ? '完成' : '編輯'}
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">顯示名稱</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">設置新密碼</label>
                    <div className="mt-1 relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="輸入新密碼"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">確認新密碼</label>
                    <div className="mt-1 relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="再次輸入新密碼"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">新增電子郵件</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="添加新的電子郵件"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  {newEmail && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">郵箱密碼</label>
                      <input
                        type="password"
                        value={newEmailPassword}
                        onChange={(e) => setNewEmailPassword(e.target.value)}
                        placeholder="為新郵箱設置密碼"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">新增手機號碼</label>
                    <div className="mt-1 flex space-x-2">
                      <input
                        type="tel"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="添加新的手機號碼"
                        className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      {newPhone && !showVerificationInput && (
                        <button
                          type="button"
                          onClick={handlePhoneVerification}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          發送驗證碼
                        </button>
                      )}
                    </div>
                  </div>

                  {showVerificationInput && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">驗證碼</label>
                      <div className="mt-1 flex space-x-2">
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="輸入驗證碼"
                          className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyCode}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          驗證
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isLoading ? '保存中...' : '保存更改'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  {linkedAccounts.map((account, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div className="flex items-center">
                        {account.type === 'email' && (
                          <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        )}
                        {account.type === 'phone' && (
                          <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        )}
                        {account.type === 'google' && (
                          <svg className="h-5 w-5 text-gray-400 mr-2" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                          </svg>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{account.value}</p>
                          <p className="text-xs text-gray-500">
                            {account.isVerified ? '已驗證' : '未驗證'}
                          </p>
                        </div>
                      </div>
                      {account.isVerified && linkedAccounts.length > 1 && (
                        <button
                          onClick={() => handleUnlinkAccount(account.type)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          解除關聯
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 刪除帳號按鈕 */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  刪除帳號
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 刪除帳號確認對話框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">確認刪除帳號？</h3>
            <p className="text-sm text-gray-500 mb-4">
              此操作無法撤銷，您的所有數據將被永久刪除。
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
              >
                取消
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 