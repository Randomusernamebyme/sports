import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Story, User } from '@/types';
import { useAuth } from './useAuth';

interface StoryState {
  currentStory: Story | null;
  stories: Story[];
  loading: boolean;
  error: string | null;
}

export const useStory = () => {
  const { user } = useAuth();
  const [state, setState] = useState<StoryState>({
    currentStory: null,
    stories: [],
    loading: true,
    error: null,
  });

  // 監聽用戶的腳本列表
  useEffect(() => {
    if (!user) return;

    const storiesRef = collection(db, 'stories');
    const q = query(
      storiesRef,
      where('authorId', '==', user.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const stories: Story[] = [];
      for (const doc of snapshot.docs) {
        stories.push(doc.data() as Story);
      }
      setState((prev) => ({
        ...prev,
        stories,
        loading: false,
      }));
    });

    return () => unsubscribe();
  }, [user]);

  // 監聽當前腳本的變化
  useEffect(() => {
    if (!state.currentStory?.id) return;

    const unsubscribe = onSnapshot(
      doc(db, 'stories', state.currentStory.id),
      (doc) => {
        if (doc.exists()) {
          setState((prev) => ({
            ...prev,
            currentStory: doc.data() as Story,
            loading: false,
          }));
        }
      }
    );

    return () => unsubscribe();
  }, [state.currentStory?.id]);

  const createStory = async (title: string, content: string) => {
    if (!user) throw new Error('用戶未登入');

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const newStory: Story = {
        id: '',
        title,
        content,
        authorId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await setDoc(doc(collection(db, 'stories')), newStory);
      newStory.id = docRef.id;
      return newStory;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  const updateStory = async (storyId: string, title: string, content: string) => {
    if (!user) throw new Error('用戶未登入');

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const storyRef = doc(db, 'stories', storyId);
      const storyDoc = await getDoc(storyRef);

      if (!storyDoc.exists()) {
        throw new Error('腳本不存在');
      }

      const story = storyDoc.data() as Story;
      if (story.authorId !== user.id) {
        throw new Error('只有作者可以編輯腳本');
      }

      await updateDoc(storyRef, {
        title,
        content,
        updatedAt: new Date(),
      });

      return story;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!user) throw new Error('用戶未登入');

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const storyRef = doc(db, 'stories', storyId);
      const storyDoc = await getDoc(storyRef);

      if (!storyDoc.exists()) {
        throw new Error('腳本不存在');
      }

      const story = storyDoc.data() as Story;
      if (story.authorId !== user.id) {
        throw new Error('只有作者可以刪除腳本');
      }

      await deleteDoc(storyRef);

      if (state.currentStory?.id === storyId) {
        setState((prev) => ({
          ...prev,
          currentStory: null,
        }));
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  const setCurrentStory = (story: Story | null) => {
    setState((prev) => ({
      ...prev,
      currentStory: story,
    }));
  };

  return {
    currentStory: state.currentStory,
    stories: state.stories,
    loading: state.loading,
    error: state.error,
    createStory,
    updateStory,
    deleteStory,
    setCurrentStory,
  };
}; 