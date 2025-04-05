import { sampleScripts } from '@/lib/scripts';
import { notFound } from 'next/navigation';

interface ScriptPageProps {
  params: {
    id: string;
  };
}

export default function ScriptPage({ params }: ScriptPageProps) {
  const script = sampleScripts.find((s) => s.id === params.id);

  if (!script) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">{script.title}</h1>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative h-64 w-full">
            {script.coverImage ? (
              <img
                src={script.coverImage}
                alt={script.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">無封面圖片</span>
              </div>
            )}
            <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-sm">
              {script.difficulty === 'easy' && '簡單'}
              {script.difficulty === 'medium' && '中等'}
              {script.difficulty === 'hard' && '困難'}
            </div>
          </div>

          <div className="p-6">
            <p className="text-gray-600 mb-6">{script.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">遊戲資訊</h3>
                <p>⏱️ 預計時長：{script.duration} 分鐘</p>
                <p>📍 地點數量：{script.locations.length} 個</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">價格</h3>
                <p className="text-2xl font-bold">NT$ {script.price}</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">遊戲地點</h2>
              <div className="space-y-4">
                {script.locations.map((location) => (
                  <div key={location.id} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">{location.name}</h3>
                    <p className="text-gray-600 mb-2">{location.description}</p>
                    <p className="text-sm text-gray-500">{location.address}</p>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
              開始遊戲
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 