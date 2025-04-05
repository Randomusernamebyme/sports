import Image from 'next/image';
import { Card } from './Card';
import { Script } from '@/types';

interface ScriptCardProps {
  script: Script;
  onClick?: () => void;
}

export function ScriptCard({ script, onClick }: ScriptCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <div className="relative h-48 w-full">
        {script.coverImage ? (
          <div className="relative w-full h-full">
            <Image
              src={script.coverImage}
              alt={script.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">無封面圖片</span>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-full text-sm">
          {script.difficulty === 'easy' && '簡單'}
          {script.difficulty === 'medium' && '中等'}
          {script.difficulty === 'hard' && '困難'}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{script.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{script.description}</p>
        
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span>⏱️ {script.duration} 分鐘</span>
            <span>📍 {script.locations.length} 個地點</span>
          </div>
          <span className="font-semibold">NT$ {script.price}</span>
        </div>
      </div>
    </Card>
  );
} 