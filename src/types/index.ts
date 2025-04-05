export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  tasks: Task[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // 預計完成時間（分鐘）
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    radius: number; // 打卡範圍（公尺）
  };
  requiredImage: boolean;
  completed: boolean;
  assignedTo: string | null;
  imageUrl?: string;
  hints?: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface Room {
  id: string;
  storyId: string;
  hostId: string;
  members: string[];
  status: 'waiting' | 'playing' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  settings: {
    maxMembers: number;
    timeLimit?: number; // 時間限制（分鐘）
    allowHints: boolean;
  };
} 