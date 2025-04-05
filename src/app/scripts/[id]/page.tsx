'use client';

import { sampleScripts } from '@/lib/scripts';
import { notFound } from 'next/navigation';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

interface ScriptPageProps {
  params: {
    id: string;
  };
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const center = {
  lat: 22.2783,
  lng: 114.1827
};

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
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2">遊戲資訊</h3>
              <p>⏱️ 預計時長：{script.duration} 分鐘</p>
              <p>📍 地點數量：{script.locations.length} 個</p>
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

            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">地圖</h2>
              <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={14}
                >
                  {script.locations.map((location) => (
                    <Marker
                      key={location.id}
                      position={{
                        lat: location.coordinates.latitude,
                        lng: location.coordinates.longitude
                      }}
                      title={location.name}
                      label={location.name}
                    />
                  ))}
                </GoogleMap>
              </LoadScript>
            </div>

            <button className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors">
              開始遊戲
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 