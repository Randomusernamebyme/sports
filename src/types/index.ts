export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastLoginAt: Date;
  phoneNumber: string | null;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  location: {
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  isCompleted: boolean;
  isUnlocked: boolean;
  photo?: string;
  distance?: number;
  status: 'pending' | 'success' | 'failed' | 'in_progress';
  errorMessage?: string;
  assignedTo: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Room {
  id: string;
  eventId: string;
  code: string;
  description: string;
  ownerId: string;
  members: RoomMember[];
  status: 'waiting' | 'playing' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomMember {
  id: string;
  name: string;
  avatar?: string;
  isReady: boolean;
  isHost: boolean;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  clues: string[];
  order: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number;
  maxPlayers: number;
  price: number;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isPopular?: boolean;
  tags?: string[];
  locations: Location[];
  tasks?: Task[];
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameSession {
  id: string;
  scriptId: string;
  userId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  currentLocationIndex: number;
  score: number;
  startTime: Date;
  endTime?: Date;
  completedLocations: string[]; // 已完成的地點 ID
  hintsUsed: number;
} 