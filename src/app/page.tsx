import { ScriptCard } from '@/components/ui/ScriptCard';
import { sampleScripts } from '@/lib/scripts';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="bg-blue-600 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6">探索城市，解開謎題</h1>
              <p className="text-xl mb-8">
                透過精心設計的尋寶遊戲，探索城市的每個角落，解開謎題，發現驚喜！
              </p>
              <Link href="/scripts">
                <Button className="bg-white text-blue-600 hover:bg-gray-100">
                  開始探索
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Scripts */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">精選劇本</h2>
              <Link href="/scripts" className="text-blue-600 hover:text-blue-700">
                查看全部 →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleScripts.map((script) => (
                <Link href={`/scripts/${script.id}`} key={script.id}>
                  <ScriptCard script={script} />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">為什麼選擇我們？</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold mb-2">精心設計的謎題</h3>
                <p className="text-gray-600">每個謎題都經過精心設計，確保遊戲體驗的趣味性和挑戰性。</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🗺️</div>
                <h3 className="text-xl font-semibold mb-2">探索城市角落</h3>
                <p className="text-gray-600">帶你探索城市的每個角落，發現不為人知的景點和故事。</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold mb-2">成就系統</h3>
                <p className="text-gray-600">完成遊戲獲得成就，與好友分享你的冒險經歷。</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">城市尋寶</h3>
              <p className="text-gray-400">探索城市，解開謎題，發現驚喜！</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">快速連結</h4>
              <ul className="space-y-2">
                <li><Link href="/scripts" className="text-gray-400 hover:text-white">所有劇本</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white">關於我們</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white">聯絡我們</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">支援</h4>
              <ul className="space-y-2">
                <li><Link href="/faq" className="text-gray-400 hover:text-white">常見問題</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white">使用條款</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white">隱私政策</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">追蹤我們</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">Facebook</a>
                <a href="#" className="text-gray-400 hover:text-white">Instagram</a>
                <a href="#" className="text-gray-400 hover:text-white">Twitter</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 城市尋寶. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 