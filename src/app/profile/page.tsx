'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { RecaptchaVerifier, PhoneAuthProvider, linkWithPhoneNumber, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface LinkedAccount {
  type: 'email' | 'phone' | 'google';
  value: string;
  isVerified: boolean;
}

export default function ProfilePage() {
  const { user, linkWithGoogle } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneToVerify, setPhoneToVerify] = useState('');
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setPhone(user.phoneNumber || '');
      
      // 獲取關聯賬號
      const accounts: LinkedAccount[] = [];
      if (user.email) {
        accounts.push({
          type: 'email',
          value: user.email,
          isVerified: user.emailVerified
        });
      }
      if (user.phoneNumber) {
        accounts.push({
          type: 'phone',
          value: user.phoneNumber,
          isVerified: true
        });
      }
      if (user.providerData.some(p => p.providerId === 'google.com')) {
        accounts.push({
          type: 'google',
          value: user.email || '',
          isVerified: true
        });
      }
      setLinkedAccounts(accounts);
    }
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // 這裡應該調用後端 API 更新用戶信息
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模擬 API 調用
      setSuccessMessage('更新成功');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || '更新失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAccount = async (type: 'email' | 'phone') => {
    setError('');
    setSuccessMessage('');

    try {
      if (type === 'email') {
        // 發送郵箱驗證郵件
        setSuccessMessage('已發送驗證郵件');
      } else {
        // 顯示手機號碼輸入框
        setShowPhoneInput(true);
      }
    } catch (err: any) {
      setError(err.message || '操作失敗');
    }
  };

  const handleSendPhoneVerification = async () => {
    if (!phoneToVerify) {
      setError('請輸入手機號碼');
      return;
    }

    // 驗證香港手機號碼格式
    const hkPhoneRegex = /^[5-9]\d{7}$/;
    if (!hkPhoneRegex.test(phoneToVerify)) {
      setError('請輸入有效的香港手機號碼');
      return;
    }

    try {
      // 確保手機號碼格式正確（加上香港國際區號）
      const formattedPhone = phoneToVerify.startsWith('+') ? phoneToVerify : `+852${phoneToVerify}`;

      // 檢查 auth 對象和當前用戶
      if (!auth || !auth.currentUser) {
        throw new Error('用戶未登入');
      }

      console.log('開始初始化 reCAPTCHA...');

      // 清除之前的 reCAPTCHA 實例（如果存在）
      if (window.recaptchaVerifier) {
        try {
          await window.recaptchaVerifier.clear();
        } catch (clearErr) {
          console.error('清除 reCAPTCHA 時出錯:', clearErr);
        }
        window.recaptchaVerifier = null;
      }

      // 使用更簡單的方式初始化 reCAPTCHA
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });

      // 使用 linkWithPhoneNumber 而不是 signInWithPhoneNumber
      const confirmationResult = await linkWithPhoneNumber(
        auth.currentUser,
        formattedPhone,
        window.recaptchaVerifier
      );

      console.log('驗證碼發送成功');

      // 保存 confirmationResult
      window.confirmationResult = confirmationResult;
      
      setSuccessMessage('驗證碼已發送');
      setShowVerificationCode(true);
      setCountdown(60);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('手機驗證錯誤:', err);
      
      if (err.code === 'auth/invalid-phone-number') {
        setError('無效的手機號碼格式');
      } else if (err.code === 'auth/quota-exceeded') {
        setError('發送次數過多，請稍後再試');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('手機驗證功能未啟用，請聯繫管理員');
      } else if (err.code === 'auth/invalid-app-credential') {
        setError('驗證失敗，請重新整理頁面後再試');
      } else if (err.code === 'auth/captcha-check-failed') {
        setError('驗證碼驗證失敗，請重試');
      } else if (err.code === 'auth/provider-already-linked') {
        setError('此手機號碼已被關聯到其他賬號');
      } else if (err.code === 'auth/credential-already-in-use') {
        setError('此手機號碼已被其他賬號使用');
      } else {
        setError('發送驗證碼失敗，請稍後再試');
      }
      
      // 清理 reCAPTCHA
      if (window.recaptchaVerifier) {
        try {
          await window.recaptchaVerifier.clear();
        } catch (clearErr) {
          console.error('清除 reCAPTCHA 時出錯:', clearErr);
        }
        window.recaptchaVerifier = null;
      }
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('請輸入驗證碼');
      return;
    }

    if (!window.confirmationResult) {
      setError('驗證會話已過期，請重新發送驗證碼');
      return;
    }

    try {
      // 驗證驗證碼
      const result = await window.confirmationResult.confirm(verificationCode);
      
      if (!result.user) {
        throw new Error('驗證失敗');
      }

      // 驗證成功後更新賬號列表
      const formattedPhone = phoneToVerify.startsWith('+') ? phoneToVerify : `+852${phoneToVerify}`;
      setLinkedAccounts(prev => [
        ...prev,
        {
          type: 'phone',
          value: formattedPhone,
          isVerified: true
        }
      ]);
      
      setSuccessMessage('手機號碼驗證成功');
      setShowPhoneInput(false);
      setShowVerificationCode(false);
      setPhoneToVerify('');
      setVerificationCode('');

      // 清理 reCAPTCHA
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } catch (err: any) {
      console.error('Code verification error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('驗證碼無效');
      } else if (err.code === 'auth/code-expired') {
        setError('驗證碼已過期，請重新發送');
      } else {
        setError(err.message || '驗證失敗');
      }
    }
  };

  const handleResendCode = () => {
    if (countdown > 0) return;
    handleSendPhoneVerification();
  };

  const handleGoogleLink = async () => {
    setError('');
    setSuccessMessage('');

    try {
      await linkWithGoogle();
      setSuccessMessage('Google 賬號關聯成功');
      
      // 更新關聯賬號列表
      if (user?.email) {
        setLinkedAccounts(prev => [
          ...prev,
          {
            type: 'google',
            value: user.email || '',
            isVerified: true
          }
        ]);
      }
    } catch (err: any) {
      if (err.code === 'auth/credential-already-in-use') {
        setError('此 Google 賬號已被其他賬號使用');
      } else {
        setError(err.message || '關聯失敗');
      }
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // 驗證新密碼
      if (newPassword !== confirmPassword) {
        throw new Error('新密碼與確認密碼不匹配');
      }

      if (newPassword.length < 6) {
        throw new Error('新密碼長度至少為6個字符');
      }

      // 重新驗證用戶
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // 更新密碼
      await updatePassword(user, newPassword);

      setSuccessMessage('密碼更新成功');
      setShowPasswordInput(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('更新密碼失敗:', err);
      if (err.code === 'auth/wrong-password') {
        setError('當前密碼錯誤');
      } else if (err.code === 'auth/weak-password') {
        setError('新密碼強度不足');
      } else {
        setError(err.message || '更新密碼失敗');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">請先登入</p>
          <Link
            href="/auth/login"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            前往登入
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">個人中心</h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                編輯資料
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                顯示名稱
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="text-gray-900">{displayName || '未設置'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                電子郵件
              </label>
              <p className="text-gray-900">{user?.email || '未設置'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                手機號碼
              </label>
              {user?.phoneNumber ? (
                <p className="text-gray-900">{user.phoneNumber}</p>
              ) : (
                <button
                  onClick={() => setShowPhoneModal(true)}
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  添加手機號碼
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密碼
              </label>
              {showPasswordInput ? (
                <div className="space-y-4">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="當前密碼"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="新密碼"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="確認新密碼"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowPasswordInput(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={handlePasswordChange}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isLoading ? '更新中...' : '更新密碼'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowPasswordInput(true)}
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  修改密碼
                </button>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading ? '保存中...' : '保存'}
              </button>
            </div>
          )}
        </div>

        {/* 手機號碼驗證模態框 */}
        {showPhoneModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">添加手機號碼</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    手機號碼
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 rounded-l-md bg-gray-50 text-gray-500">
                      +852
                    </span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="輸入8位數字"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:ring-indigo-500 focus:border-indigo-500"
                      maxLength={8}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    請輸入8位數字的手機號碼
                  </p>
                </div>

                {isVerifying && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      驗證碼
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="輸入驗證碼"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowPhoneModal(false);
                      setPhoneNumber('');
                      setVerificationCode('');
                      setIsVerifying(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={isVerifying ? handleVerifyCode : handleSendPhoneVerification}
                    disabled={isLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isLoading ? '處理中...' : isVerifying ? '驗證' : '發送驗證碼'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* reCAPTCHA 容器 */}
        <div id="recaptcha-container" className="hidden"></div>
      </div>
    </div>
  );
} 