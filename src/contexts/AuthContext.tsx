'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthCredential,
  linkWithCredential,
  unlink,
  updatePassword as firebaseUpdatePassword,
  deleteUser,
  EmailAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phoneNumber: string) => Promise<string>;
  verifyPhoneCode: (verificationId: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (displayName: string) => Promise<void>;
  linkPhoneNumber: (phoneNumber: string) => Promise<string>;
  verifyPhoneLinkCode: (verificationId: string, code: string) => Promise<void>;
  linkEmail: (email: string, password: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  unlinkProvider: (providerId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await firebaseUpdateProfile(userCredential.user, { displayName: email.split('@')[0] });
      router.push('/events');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await firebaseSignInWithEmailAndPassword(auth, email, password);
      router.push('/events');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/events');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const signInWithPhone = async (phoneNumber: string) => {
    try {
      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) throw new Error('reCAPTCHA not initialized');
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      return confirmationResult.verificationId;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const verifyPhoneCode = async (verificationId: string, code: string) => {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
      router.push('/events');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/auth/login');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const updateProfile = async (displayName: string) => {
    if (!auth.currentUser) throw new Error('No user logged in');
    try {
      await firebaseUpdateProfile(auth.currentUser, { displayName });
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const linkPhoneNumber = async (phoneNumber: string) => {
    if (!auth.currentUser) throw new Error('No user logged in');
    try {
      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) throw new Error('reCAPTCHA not initialized');
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      return confirmationResult.verificationId;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const verifyPhoneLinkCode = async (verificationId: string, code: string) => {
    if (!auth.currentUser) throw new Error('No user logged in');
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await linkWithCredential(auth.currentUser, credential);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const linkEmail = async (email: string, password: string) => {
    if (!auth.currentUser) throw new Error('No user logged in');
    try {
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(auth.currentUser, credential);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!auth.currentUser) throw new Error('No user logged in');
    try {
      await firebaseUpdatePassword(auth.currentUser, newPassword);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) throw new Error('No user logged in');
    try {
      await deleteUser(auth.currentUser);
      router.push('/auth/login');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const unlinkProvider = async (providerId: string) => {
    if (!auth.currentUser) throw new Error('No user logged in');
    try {
      await unlink(auth.currentUser, providerId);
    } catch (error: any) {
      throw new Error(error.message);
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
    signOut,
    updateProfile,
    linkPhoneNumber,
    verifyPhoneLinkCode,
    linkEmail,
    updatePassword,
    deleteAccount,
    unlinkProvider,
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