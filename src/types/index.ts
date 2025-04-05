export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Script {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number; // 預計完成時間（分鐘）
  price: number;
  coverImage?: string;
  locations: Location[];
  createdAt: Date;
  updatedAt: Date;
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
  clues: Clue[];
  order: number; // 地點的順序
}

export interface Clue {
  id: string;
  content: string;
  type: 'text' | 'image' | 'riddle' | 'puzzle';
  hint?: string;
  answer: string;
  points: number; // 解開線索可獲得的積分
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
  updatedAt?: Date;
} 