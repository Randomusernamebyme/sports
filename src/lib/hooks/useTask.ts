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
import { Task, User } from '@/types';
import { useAuth } from './useAuth';

interface TaskState {
  currentTask: Task | null;
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

export const useTask = () => {
  const { user } = useAuth();
  const [state, setState] = useState<TaskState>({
    currentTask: null,
    tasks: [],
    loading: true,
    error: null,
  });

  // 監聽用戶的任務列表
  useEffect(() => {
    if (!user) return;

    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('assignedTo', '==', user.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const tasks: Task[] = [];
      for (const doc of snapshot.docs) {
        tasks.push(doc.data() as Task);
      }
      setState((prev) => ({
        ...prev,
        tasks,
        loading: false,
      }));
    });

    return () => unsubscribe();
  }, [user]);

  // 監聽當前任務的變化
  useEffect(() => {
    if (!state.currentTask?.id) return;

    const unsubscribe = onSnapshot(
      doc(db, 'tasks', state.currentTask.id),
      (doc) => {
        if (doc.exists()) {
          setState((prev) => ({
            ...prev,
            currentTask: doc.data() as Task,
            loading: false,
          }));
        }
      }
    );

    return () => unsubscribe();
  }, [state.currentTask?.id]);

  const createTask = async (
    title: string,
    description?: string,
    assignedTo?: string
  ) => {
    if (!user) throw new Error('用戶未登入');

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const newTask: Task = {
        id: '',
        title,
        description,
        status: 'pending',
        assignedTo: assignedTo || user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await setDoc(doc(collection(db, 'tasks')), newTask);
      newTask.id = docRef.id;
      return newTask;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  const updateTask = async (
    taskId: string,
    title: string,
    description?: string,
    status?: Task['status'],
    assignedTo?: string
  ) => {
    if (!user) throw new Error('用戶未登入');

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const taskRef = doc(db, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);

      if (!taskDoc.exists()) {
        throw new Error('任務不存在');
      }

      const task = taskDoc.data() as Task;
      if (task.assignedTo !== user.id) {
        throw new Error('只有被指派者可以編輯任務');
      }

      await updateDoc(taskRef, {
        title,
        description,
        status: status || task.status,
        assignedTo: assignedTo || task.assignedTo,
        updatedAt: new Date(),
      });

      return task;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) throw new Error('用戶未登入');

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const taskRef = doc(db, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);

      if (!taskDoc.exists()) {
        throw new Error('任務不存在');
      }

      const task = taskDoc.data() as Task;
      if (task.assignedTo !== user.id) {
        throw new Error('只有被指派者可以刪除任務');
      }

      await deleteDoc(taskRef);

      if (state.currentTask?.id === taskId) {
        setState((prev) => ({
          ...prev,
          currentTask: null,
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

  const setCurrentTask = (task: Task | null) => {
    setState((prev) => ({
      ...prev,
      currentTask: task,
    }));
  };

  return {
    currentTask: state.currentTask,
    tasks: state.tasks,
    loading: state.loading,
    error: state.error,
    createTask,
    updateTask,
    deleteTask,
    setCurrentTask,
  };
}; 