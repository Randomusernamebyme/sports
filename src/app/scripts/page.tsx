'use client';

import { sampleScripts } from '@/lib/scripts';
import Link from 'next/link';
import Image from 'next/image';

export default function ScriptsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">所有劇本</h1>
          <div className="flex gap-4">
            <select className="px-4 py-2 border rounded-lg bg-white">
              <option value="all">所有難度</option>
              <option value="easy">簡單</option>
              <option value="medium">中等</option>
              <option value="hard">困難</option>
            </select>
            <select className="px-4 py-2 border rounded-lg bg-white">
              <option value="newest">最新上架</option>
              <option value="popular">最受歡迎</option>
              <option value="price-asc">價格由低到高</option>
              <option value="price-desc">價格由高到低</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sampleScripts.map((script) => (
            <Link
              key={script.id}
              href={`/events/${script.id}`}
              className="group"
            >
              <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-200 hover:scale-105">
                <div className="relative h-48">
                  <Image
                    src={script.coverImage || '/images/scripts/default.jpg'}
                    alt={script.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">{script.title}</h3>
                  <p className="mt-2 text-gray-500">{script.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">{script.duration} 分鐘</span>
                    <span className="text-sm text-gray-500">
                      {script.difficulty === 'easy' && '簡單'}
                      {script.difficulty === 'medium' && '中等'}
                      {script.difficulty === 'hard' && '困難'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 