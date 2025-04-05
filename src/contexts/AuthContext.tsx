'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthCredential,
  linkWithCredential,
  unlink,
  updatePassword as firebaseUpdatePassword,
  deleteUser
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithPhone: (phoneNumber: string) => Promise<string>;
  verifyPhoneCode: (verificationId: string, code: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  updateProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  linkPhoneNumber: (phoneNumber: string) => Promise<string>;
  verifyPhoneLinkCode: (verificationId: string, code: string) => Promise<void>;
  unlinkProvider: (providerId: string) => Promise<void>;
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

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // 獲取用戶的自定義令牌
      const idTokenResult = await user.getIdTokenResult();
      const isAdmin = idTokenResult.claims.admin === true;
      const isModerator = idTokenResult.claims.moderator === true;
      
      // 更新用戶資料
      if (!user.displayName) {
        await firebaseUpdateProfile(user, {
          displayName: email.split('@')[0]
        });
      }

      setUser(user);
      return result;
    } catch (error: any) {
      console.error('註冊失敗:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const result = await firebaseSignInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // 獲取用戶的自定義令牌
      const idTokenResult = await user.getIdTokenResult();
      const isAdmin = idTokenResult.claims.admin === true;
      const isModerator = idTokenResult.claims.moderator === true;
      
      setUser(user);
      return result;
    } catch (error: any) {
      console.error('登入失敗:', error);
      throw error;
    }
  };

  const signInWithGoogle = async (): Promise<UserCredential> => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // 獲取用戶的自定義令牌
      const idTokenResult = await user.getIdTokenResult();
      const isAdmin = idTokenResult.claims.admin === true;
      const isModerator = idTokenResult.claims.moderator === true;
      
      setUser(user);
      return result;
    } catch (error: any) {
      console.error('Google 登入失敗:', error);
      throw error;
    }
  };

  const signInWithPhone = async (phoneNumber: string): Promise<string> => {
    try {
      const appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
      });

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      return confirmationResult.verificationId;
    } catch (error: any) {
      console.error('手機號碼驗證失敗:', error);
      throw error;
    }
  };

  const verifyPhoneCode = async (verificationId: string, code: string): Promise<UserCredential> => {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const result = await linkWithCredential(auth.currentUser!, credential);
      setUser(result.user);
      return result;
    } catch (error: any) {
      console.error('驗證碼驗證失敗:', error);
      throw error;
    }
  };

  const signOutUser = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error: any) {
      console.error('登出失敗:', error);
      throw error;
    }
  };

  const updateProfile = async (data: { displayName?: string; photoURL?: string }): Promise<void> => {
    if (!auth.currentUser) throw new Error('No user logged in');
    await firebaseUpdateProfile(auth.currentUser, data);
    setUser(auth.currentUser);
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    if (!auth.currentUser) throw new Error('No user logged in');
    await firebaseUpdatePassword(auth.currentUser, newPassword);
  };

  const deleteAccount = async (): Promise<void> => {
    if (!auth.currentUser) throw new Error('No user logged in');
    await deleteUser(auth.currentUser);
    setUser(null);
  };

  const linkPhoneNumber = async (phoneNumber: string): Promise<string> => {
    if (!auth.currentUser) throw new Error('No user logged in');
    try {
      const appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
      });

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      return confirmationResult.verificationId;
    } catch (error: any) {
      console.error('手機號碼驗證失敗:', error);
      throw error;
    }
  };

  const verifyPhoneLinkCode = async (verificationId: string, code: string): Promise<void> => {
    if (!auth.currentUser) throw new Error('No user logged in');
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const result = await linkWithCredential(auth.currentUser, credential);
      setUser(result.user);
    } catch (error: any) {
      console.error('驗證碼驗證失敗:', error);
      throw error;
    }
  };

  const unlinkProvider = async (providerId: string): Promise<void> => {
    if (!auth.currentUser) throw new Error('No user logged in');
    try {
      await unlink(auth.currentUser, providerId);
      setUser(auth.currentUser);
    } catch (error: any) {
      console.error('解除綁定失敗:', error);
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
    signOut: signOutUser,
    updateProfile,
    updatePassword,
    deleteAccount,
    linkPhoneNumber,
    verifyPhoneLinkCode,
    unlinkProvider
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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