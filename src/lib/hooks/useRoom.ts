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
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Room, User } from '@/types';
import { useAuth } from './useAuth';

interface RoomState {
  currentRoom: Room | null;
  rooms: Room[];
  loading: boolean;
  error: string | null;
}

export const useRoom = () => {
  const { user } = useAuth();
  const [state, setState] = useState<RoomState>({
    currentRoom: null,
    rooms: [],
    loading: true,
    error: null,
  });

  // 監聽用戶的房間列表
  useEffect(() => {
    if (!user) return;

    const roomsRef = collection(db, 'rooms');
    const q = query(
      roomsRef,
      where('members', 'array-contains', user.id)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rooms: Room[] = [];
      for (const doc of snapshot.docs) {
        rooms.push(doc.data() as Room);
      }
      setState((prev) => ({
        ...prev,
        rooms,
        loading: false,
      }));
    });

    return () => unsubscribe();
  }, [user]);

  // 監聽當前房間的變化
  useEffect(() => {
    if (!state.currentRoom?.id) return;

    const unsubscribe = onSnapshot(
      doc(db, 'rooms', state.currentRoom.id),
      (doc) => {
        if (doc.exists()) {
          setState((prev) => ({
            ...prev,
            currentRoom: doc.data() as Room,
            loading: false,
          }));
        }
      }
    );

    return () => unsubscribe();
  }, [state.currentRoom?.id]);

  const createRoom = async (name: string, description?: string) => {
    if (!user) throw new Error('用戶未登入');

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const newRoom: Room = {
        id: '',
        name,
        description,
        ownerId: user.id,
        members: [user.id],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = doc(collection(db, 'rooms'));
      await setDoc(docRef, newRoom);
      newRoom.id = docRef.id;
      return newRoom;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!user) throw new Error('用戶未登入');

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const roomRef = doc(db, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);

      if (!roomDoc.exists()) {
        throw new Error('房間不存在');
      }

      const room = roomDoc.data() as Room;
      if (room.members.includes(user.id)) {
        throw new Error('你已經是房間成員');
      }

      await updateDoc(roomRef, {
        members: [...room.members, user.id],
        updatedAt: new Date(),
      });

      return room;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  const leaveRoom = async (roomId: string) => {
    if (!user) throw new Error('用戶未登入');

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const roomRef = doc(db, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);

      if (!roomDoc.exists()) {
        throw new Error('房間不存在');
      }

      const room = roomDoc.data() as Room;
      if (room.ownerId === user.id) {
        throw new Error('房主不能離開房間');
      }

      await updateDoc(roomRef, {
        members: room.members.filter((id) => id !== user.id),
        updatedAt: new Date(),
      });

      if (state.currentRoom?.id === roomId) {
        setState((prev) => ({
          ...prev,
          currentRoom: null,
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

  const deleteRoom = async (roomId: string) => {
    if (!user) throw new Error('用戶未登入');

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const roomRef = doc(db, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);

      if (!roomDoc.exists()) {
        throw new Error('房間不存在');
      }

      const room = roomDoc.data() as Room;
      if (room.ownerId !== user.id) {
        throw new Error('只有房主可以刪除房間');
      }

      await deleteDoc(roomRef);

      if (state.currentRoom?.id === roomId) {
        setState((prev) => ({
          ...prev,
          currentRoom: null,
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

  const setCurrentRoom = (room: Room | null) => {
    setState((prev) => ({
      ...prev,
      currentRoom: room,
    }));
  };

  return {
    currentRoom: state.currentRoom,
    rooms: state.rooms,
    loading: state.loading,
    error: state.error,
    createRoom,
    joinRoom,
    leaveRoom,
    deleteRoom,
    setCurrentRoom,
  };
}; 