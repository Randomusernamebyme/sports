'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { RecaptchaVerifier, PhoneAuthProvider, linkWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface LinkedAccount {
  type: 'email' | 'phone' | 'google';
  value: string;
  isVerified: boolean;
}

export default function ProfilePage() {
  const { user, linkWithGoogle } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* reCAPTCHA container */}
        <div id="recaptcha-container"></div>
        
        {/* 用戶基本信息 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative h-20 w-20">
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={displayName}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-3xl font-medium text-indigo-600">
                      {displayName[0]}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{displayName || '用戶'}</h1>
                <p className="text-gray-500">ID: {user.uid}</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {isEditing ? '取消' : '編輯資料'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-600">
              {successMessage}
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

        {/* 賬號管理 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">賬號管理</h2>
          <div className="space-y-4">
            {linkedAccounts.map((account) => (
              <div
                key={account.type + account.value}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    {account.type === 'email' && (
                      <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {account.type === 'phone' && (
                      <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    )}
                    {account.type === 'google' && (
                      <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {account.type === 'email' && '電子郵箱'}
                      {account.type === 'phone' && '手機號碼'}
                      {account.type === 'google' && 'Google 賬號'}
                    </p>
                    <p className="text-sm text-gray-500">{account.value}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!account.isVerified && account.type !== 'google' && (
                    <button
                      onClick={() => handleAddAccount(account.type as 'email' | 'phone')}
                      className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      驗證
                    </button>
                  )}
                  <span className={`text-sm ${account.isVerified ? 'text-green-600' : 'text-gray-500'}`}>
                    {account.isVerified ? '已驗證' : '未驗證'}
                  </span>
                </div>
              </div>
            ))}

            {/* 添加新賬號 */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              {!linkedAccounts.some(a => a.type === 'email') && (
                <button
                  onClick={() => handleAddAccount('email')}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  添加郵箱
                </button>
              )}
              {!linkedAccounts.some(a => a.type === 'phone') && (
                <>
                  <button
                    onClick={() => handleAddAccount('phone')}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    添加手機
                  </button>
                  {showPhoneInput && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                      <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium mb-4">添加手機號碼</h3>
                        <div className="mb-4">
                          <input
                            type="tel"
                            value={phoneToVerify}
                            onChange={(e) => setPhoneToVerify(e.target.value)}
                            placeholder="請輸入手機號碼（例如：51234567）"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                          <p className="mt-1 text-sm text-gray-500">
                            請輸入香港手機號碼（8位數字，以5-9開頭），無需輸入國際區號
                          </p>
                        </div>
                        {!showVerificationCode ? (
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => {
                                setShowPhoneInput(false);
                                setPhoneToVerify('');
                                setError('');
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                              取消
                            </button>
                            <button
                              id="send-code-button"
                              onClick={handleSendPhoneVerification}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                              發送驗證碼
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="mb-4">
                              <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="請輸入驗證碼"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <button
                                onClick={handleResendCode}
                                disabled={countdown > 0}
                                className={`text-sm ${countdown > 0 ? 'text-gray-400' : 'text-indigo-600 hover:text-indigo-700'}`}
                              >
                                {countdown > 0 ? `${countdown}秒後可重新發送` : '重新發送驗證碼'}
                              </button>
                              <div className="space-x-3">
                                <button
                                  onClick={() => {
                                    setShowPhoneInput(false);
                                    setPhoneToVerify('');
                                    setVerificationCode('');
                                    setError('');
                                  }}
                                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                  取消
                                </button>
                                <button
                                  onClick={handleVerifyCode}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                  驗證
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
              {!linkedAccounts.some(a => a.type === 'google') && (
                <button
                  onClick={handleGoogleLink}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-2 text-gray-400" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                  </svg>
                  關聯 Google
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 