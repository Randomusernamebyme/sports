export type GameStatus = 'pending' | 'in_progress' | 'completed';
export type TaskStatus = 'locked' | 'unlocked' | 'completed';

export interface Location {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  location: Location;
  status: TaskStatus;
  photo?: string;
  distance?: number;
}

export interface GameSession {
  id: string;
  userId: string;
  scriptId: string;
  status: GameStatus;
  startTime: Date;
  endTime?: Date;
  lastUpdated: Date;
  currentTaskIndex: number;
  tasks: {
    [key: string]: {
      status: TaskStatus;
      completedAt?: Date;
      photo?: string;
    };
  };
  playCount: number;
}

export interface Script {
  id: string;
  title: string;
  description: string;
  locations: Location[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GameProgress {
  currentTaskIndex: number;
  tasks: Task[];
  isCompleted: boolean;
  startTime: Date;
  endTime?: Date;
} 