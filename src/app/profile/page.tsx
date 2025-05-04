'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { RecaptchaVerifier, PhoneAuthProvider, linkWithPhoneNumber, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

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
  const [isClearingGames, setIsClearingGames] = useState(false);
  const [gameStats, setGameStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0
  });

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

  // 獲取游戲統計
  useEffect(() => {
    const fetchGameStats = async () => {
      if (!user) return;

      try {
        const sessionsRef = collection(db, 'gameSessions');
        const q = query(sessionsRef, where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        
        const stats = {
          total: 0,
          completed: 0,
          inProgress: 0
        };

        // 用於追蹤已完成的劇本和進行中的游戲
        const completedScripts = new Set<string>();
        const inProgressGames = new Set<string>();
        
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.status === 'completed') {
            // 只計算每個劇本一次
            completedScripts.add(data.scriptId);
          } else if (data.status === 'in_progress') {
            // 記錄進行中的游戲ID
            inProgressGames.add(doc.id);
          }
        });

        stats.completed = completedScripts.size; // 已完成的劇本數
        stats.inProgress = inProgressGames.size; // 進行中的游戲數
        stats.total = stats.completed + stats.inProgress; // 總數為已完成劇本數加上進行中的游戲數

        setGameStats(stats);
      } catch (error) {
        console.error('獲取游戲統計失敗:', error);
      }
    };

    fetchGameStats();
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
    if (!phoneNumber) {
      setError('請輸入手機號碼');
      return;
    }

    // 驗證香港手機號碼格式
    const hkPhoneRegex = /^[5-9]\d{7}$/;
    if (!hkPhoneRegex.test(phoneNumber)) {
      setError('請輸入有效的香港手機號碼');
      return;
    }

    try {
      // 確保手機號碼格式正確（加上香港國際區號）
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+852${phoneNumber}`;

      // 檢查 auth 對象和當前用戶
      if (!auth || !auth.currentUser) {
        throw new Error('用戶未登入');
      }

      console.log('開始初始化 reCAPTCHA...');

      // 清除之前的 reCAPTCHA 實例（如果存在）
      if (window.recaptchaVerifier) {
        try {
          await window.recaptchaVerifier.clear();
          console.log('成功清除舊的 reCAPTCHA');
        } catch (clearErr) {
          console.error('清除 reCAPTCHA 時出錯:', clearErr);
        }
        window.recaptchaVerifier = null;
      }

      // 檢查 recaptcha-container 是否存在
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (!recaptchaContainer) {
        throw new Error('找不到 reCAPTCHA 容器');
      }

      console.log('創建新的 reCAPTCHA 實例');
      
      // 使用更簡單的方式初始化 reCAPTCHA
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA 驗證成功');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA 已過期');
          setError('驗證已過期，請重試');
        }
      });

      window.recaptchaVerifier = recaptchaVerifier;

      console.log('開始發送驗證碼到:', formattedPhone);

      // 使用 linkWithPhoneNumber 而不是 signInWithPhoneNumber
      const confirmationResult = await linkWithPhoneNumber(
        auth.currentUser,
        formattedPhone,
        recaptchaVerifier
      );

      console.log('驗證碼發送成功');

      // 保存 confirmationResult
      window.confirmationResult = confirmationResult;
      
      setSuccessMessage('驗證碼已發送');
      setIsVerifying(true);
      
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
          console.log('清理 reCAPTCHA 成功');
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
      setIsLoading(true);
      console.log('開始驗證驗證碼');

      // 驗證驗證碼
      const result = await window.confirmationResult.confirm(verificationCode);
      
      if (!result.user) {
        throw new Error('驗證失敗');
      }

      console.log('驗證碼驗證成功');

      setSuccessMessage('手機號碼驗證成功');
      setShowPhoneModal(false);
      setPhoneNumber('');
      setVerificationCode('');
      setIsVerifying(false);

      // 清理 reCAPTCHA
      if (window.recaptchaVerifier) {
        try {
          await window.recaptchaVerifier.clear();
          console.log('清理 reCAPTCHA 成功');
        } catch (clearErr) {
          console.error('清除 reCAPTCHA 時出錯:', clearErr);
        }
        window.recaptchaVerifier = null;
      }
    } catch (err: any) {
      console.error('驗證碼驗證錯誤:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('驗證碼無效');
      } else if (err.code === 'auth/code-expired') {
        setError('驗證碼已過期，請重新發送');
      } else {
        setError(err.message || '驗證失敗');
      }
    } finally {
      setIsLoading(false);
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

      // 檢查是否為首次設置密碼
      const isFirstTimePassword = !user.providerData.some(
        provider => provider.providerId === 'password'
      );

      if (isFirstTimePassword) {
        // 首次設置密碼，直接更新
        await updatePassword(user, newPassword);
        setSuccessMessage('密碼設置成功');
      } else {
        // 修改密碼，需要重新驗證
        const credential = EmailAuthProvider.credential(
          user.email!,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        setSuccessMessage('密碼更新成功');
      }

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
      } else if (err.code === 'auth/requires-recent-login') {
        setError('請重新登入後再修改密碼');
      } else {
        setError(err.message || '更新密碼失敗');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 清除所有游戲記錄
  const handleClearGameHistory = async () => {
    if (!user) return;

    if (!window.confirm('確定要清除所有游戲記錄嗎？此操作無法撤銷。')) {
      return;
    }

    setIsClearingGames(true);
    setError('');
    setSuccessMessage('');

    try {
      const sessionsRef = collection(db, 'gameSessions');
      const q = query(sessionsRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      setGameStats({
        total: 0,
        completed: 0,
        inProgress: 0
      });
      setSuccessMessage('已清除所有游戲記錄');
    } catch (error) {
      console.error('清除游戲記錄失敗:', error);
      setError('清除游戲記錄時發生錯誤');
    } finally {
      setIsClearingGames(false);
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
    <div className="min-h-screen bg-primary-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-primary-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-primary-900">個人中心</h1>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary"
              >
                編輯資料
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
              {successMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  顯示名稱
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-primary-900">{displayName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  電子郵件
                </label>
                <p className="text-primary-900">{email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  手機號碼
                </label>
                <p className="text-primary-900">{phone || '未設置'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-primary-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-primary-900 mb-2">
                  游戲統計
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">
                      {gameStats.total}
                    </p>
                    <p className="text-sm text-primary-600">總游戲數</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">
                      {gameStats.completed}
                    </p>
                    <p className="text-sm text-primary-600">已完成</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">
                      {gameStats.inProgress}
                    </p>
                    <p className="text-sm text-primary-600">進行中</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-primary-900 mb-2">
                  關聯賬號
                </h3>
                <div className="space-y-2">
                  {linkedAccounts.map((account, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-primary-100"
                    >
                      <div className="flex items-center">
                        <span className="text-primary-600">
                          {account.type === 'email' && '📧'}
                          {account.type === 'phone' && '📱'}
                          {account.type === 'google' && 'G'}
                        </span>
                        <span className="ml-2 text-primary-900">
                          {account.value}
                        </span>
                      </div>
                      <span
                        className={`text-sm ${
                          account.isVerified
                            ? 'text-green-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {account.isVerified ? '已驗證' : '未驗證'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 