'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithCredential,
  UserCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithPhone: (phoneNumber: string) => Promise<any>;
  verifyPhoneCode: (verificationId: string, code: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      // 清理 reCAPTCHA
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      unsubscribe();
    };
  }, []);

  const setupRecaptcha = () => {
    // 如果已存在，先清理
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }

    // 確保容器存在
    const container = document.getElementById('recaptcha-container');
    if (!container) {
      throw new Error('reCAPTCHA container not found');
    }

    // 創建新的 reCAPTCHA
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        }
      }
    });

    // 立即渲染 reCAPTCHA
    window.recaptchaVerifier.render().then((widgetId) => {
      console.log('reCAPTCHA rendered with widget ID:', widgetId);
    }).catch((error) => {
      console.error('reCAPTCHA render error:', error);
    });

    return window.recaptchaVerifier;
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    // 移除所有非數字字符
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // 驗證號碼長度
    if (cleaned.length !== 8) {
      throw new Error('手機號碼必須為8位數字');
    }
    
    // 返回格式化的號碼，確保使用國際格式
    return `+852${cleaned}`;
  };

  const signUp = async (email: string, password: string) => {
    try {
      // 創建用戶
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // 確保用戶被正確設置
      if (result.user) {
        setUser(result.user);
      }
      
      return result;
    } catch (error: any) {
      console.error('註冊錯誤:', error.message);
      
      // 處理特定錯誤
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('此電子郵件已被使用');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('無效的電子郵件格式');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('密碼強度不足');
      } else {
        throw new Error('註冊失敗，請稍後再試');
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // 確保用戶被正確設置
      if (result.user) {
        setUser(result.user);
      }
      
      return result;
    } catch (error: any) {
      console.error('登入錯誤:', error.message);
      
      // 處理特定錯誤
      if (error.code === 'auth/user-not-found') {
        throw new Error('找不到此用戶');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('密碼錯誤');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('無效的電子郵件格式');
      } else {
        throw new Error('登入失敗，請稍後再試');
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // 確保用戶被正確設置
      if (result.user) {
        setUser(result.user);
      }
      
      return result;
    } catch (error: any) {
      console.error('Google 登入錯誤:', error.message);
      throw error;
    }
  };

  const signInWithPhone = async (phoneNumber: string) => {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      console.log('Formatted phone number:', formattedPhone);
      
      // 確保 reCAPTCHA 已經設置
      const recaptchaVerifier = setupRecaptcha();
      
      // 等待一小段時間確保 reCAPTCHA 完全初始化
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 檢查 reCAPTCHA 是否已經解決
      if (!window.recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized');
      }

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      return confirmationResult;
    } catch (error: any) {
      console.error('電話登入錯誤:', error.message);
      
      // 處理特定錯誤
      if (error.code === 'auth/too-many-requests') {
        throw new Error('請求次數過多，請稍後再試');
      } else if (error.code === 'auth/invalid-phone-number') {
        throw new Error('無效的手機號碼格式');
      } else if (error.code === 'auth/quota-exceeded') {
        throw new Error('已超過每日驗證碼配額，請稍後再試');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('此帳號已被停用');
      } else {
        throw new Error('發送驗證碼失敗，請稍後再試');
      }
    } finally {
      // 如果發生錯誤，清除 reCAPTCHA
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
  };

  const verifyPhoneCode = async (verificationId: string, code: string) => {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const result = await signInWithCredential(auth, credential);
      
      // 確保用戶被正確設置
      if (result.user) {
        setUser(result.user);
      }
      
      return result;
    } catch (error: any) {
      console.error('驗證碼錯誤:', error.message);
      
      // 處理特定錯誤
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('無效的驗證碼');
      } else if (error.code === 'auth/code-expired') {
        throw new Error('驗證碼已過期，請重新發送');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('請求次數過多，請稍後再試');
      } else {
        throw new Error('驗證失敗，請稍後再試');
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error: any) {
      console.error('登出錯誤:', error.message);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithPhone,
    verifyPhoneCode,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
  }
} 