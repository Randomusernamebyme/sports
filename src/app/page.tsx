import { ScriptCard } from '@/components/ui/ScriptCard';
import { sampleScripts } from '@/lib/scripts';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              城市尋寶集會
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12">
              準備好展開冒險了嗎？
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">解謎尋寶</h3>
                <p className="text-gray-600 text-sm">
                  解開謎題，探索城市的秘密。
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🌳</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">城市探索</h3>
                <p className="text-gray-600 text-sm">
                  發現城市中的隱藏景點。
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏰</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">城市冒險</h3>
                <p className="text-gray-600 text-sm">
                  完成精彩的城市挑戰。
                </p>
              </div>
            </div>
            <Link href="/auth/register">
              <Button className="bg-blue-600 text-white hover:bg-blue-700 text-lg px-8 py-4 rounded-xl">
                開始探索
              </Button>
            </Link>
          </div>
        </section>

        {/* Featured Scripts */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">精選劇本</h2>
              <p className="text-gray-600">
                立即註冊，開始你的城市探索之旅
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sampleScripts.map((script) => (
                <div key={script.id} className="group" onClick={() => alert('請先登入以查看劇本詳情')}>
                  <ScriptCard script={script} />
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/auth/register">
                <Button className="bg-white text-blue-600 hover:bg-gray-50 border border-blue-200">
                  立即註冊查看更多
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">準備好開始你的冒險了嗎？</h2>
              <p className="text-xl mb-8 text-blue-100">
                加入我們，開始你的城市探索之旅！
              </p>
              <Link href="/auth/register">
                <Button className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-xl">
                  立即註冊
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                城市尋寶
              </h3>
              <p className="text-gray-600">探索城市，解開謎題，發現驚喜！</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">快速連結</h4>
              <ul className="space-y-3">
                <li><Link href="/scripts" className="text-gray-600 hover:text-gray-900 transition-colors">所有劇本</Link></li>
                <li><Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">關於我們</Link></li>
                <li><Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">聯絡我們</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">支援</h4>
              <ul className="space-y-3">
                <li><Link href="/faq" className="text-gray-600 hover:text-gray-900 transition-colors">常見問題</Link></li>
                <li><Link href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">使用條款</Link></li>
                <li><Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">隱私政策</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">追蹤我們</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Facebook</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Instagram</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Twitter</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-12 pt-8 text-center text-gray-600">
            <p>&copy; 2024 城市尋寶. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 