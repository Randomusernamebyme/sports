import { ScriptCardWrapper } from '@/components/ui/ScriptCardWrapper';
import { sampleScripts } from '@/lib/scripts';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Navbar */}
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">城市尋寶運動遊戲</span>
              <span className="block text-primary-600">探索城市的新方式</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              探索城市，解開謎題，發現驚喜！
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link href="/scripts" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10">
                  開始探索
                </Link>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-primary-600 text-2xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900">解謎尋寶</h3>
              <p className="mt-2 text-gray-500">
                通過解開精心設計的謎題，探索城市的每個角落
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-primary-600 text-2xl mb-4">🏃</div>
              <h3 className="text-lg font-medium text-gray-900">城市探索</h3>
              <p className="mt-2 text-gray-500">
                以全新的視角發現城市中的特色景點和隱藏寶藏
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-primary-600 text-2xl mb-4">🎭</div>
              <h3 className="text-lg font-medium text-gray-900">城市冒險</h3>
              <p className="mt-2 text-gray-500">
                體驗融合劇本殺元素的城市探索遊戲
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Scripts Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            精選劇本
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {sampleScripts.map((script) => (
              <ScriptCardWrapper key={script.id} script={script} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary-50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            準備好開始你的城市探索之旅了嗎？
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            立即註冊，開始你的城市尋寶冒險！
          </p>
          <Link href="/register" className="inline-block bg-primary-600 text-white px-8 py-3 rounded-md hover:bg-primary-700 transition-colors">
            立即註冊
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">快速連結</h3>
            <ul className="space-y-2">
              <li><Link href="/scripts" className="hover:text-primary-400">所有劇本</Link></li>
              <li><Link href="/about" className="hover:text-primary-400">關於我們</Link></li>
              <li><Link href="/contact" className="hover:text-primary-400">聯絡我們</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">支援</h3>
            <ul className="space-y-2">
              <li><Link href="/faq" className="hover:text-primary-400">常見問題</Link></li>
              <li><Link href="/terms" className="hover:text-primary-400">使用條款</Link></li>
              <li><Link href="/privacy" className="hover:text-primary-400">隱私政策</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">追蹤我們</h3>
            <div className="flex space-x-4">
              <Link href="#" className="hover:text-primary-400">Facebook</Link>
              <Link href="#" className="hover:text-primary-400">Instagram</Link>
              <Link href="#" className="hover:text-primary-400">Twitter</Link>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400">
              © 2024 城市尋寶. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 