import { useState, useEffect } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User as UserType } from '@/types';

interface AuthState {
  user: UserType | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 從Firestore獲取用戶資料
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setState({
            user: userDoc.data() as UserType,
            loading: false,
            error: null,
          });
        } else {
          // 如果用戶資料不存在，創建新用戶資料
          const userData = {
            id: user.uid,
            email: user.email || '',
            displayName: user.displayName,
            photoURL: user.photoURL || null,
            phoneNumber: user.phoneNumber || null,
            createdAt: new Date(),
            lastLoginAt: new Date(),
          };
          await setDoc(doc(db, 'users', user.uid), userData);
          setState({
            user: userData as UserType,
            loading: false,
            error: null,
          });
        }
      } else {
        setState({
          user: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      const userData = {
        id: user.uid,
        email: user.email || '',
        displayName,
        photoURL: user.photoURL || null,
        phoneNumber: user.phoneNumber || null,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
      await setDoc(doc(db, 'users', user.uid), userData);
      return userData;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await signOut(auth);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword,
  };
}; 