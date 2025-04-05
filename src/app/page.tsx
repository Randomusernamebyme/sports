import { ScriptCard } from '@/components/ui/ScriptCard';
import { sampleScripts } from '@/lib/scripts';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="relative h-[90vh] flex items-center">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/hero-bg.jpg"
              alt="城市尋寶背景"
              fill
              className="object-cover brightness-50"
              priority
            />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center text-white">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                探索城市
                <br />
                <span className="text-blue-400">解開謎題</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-200">
                透過精心設計的尋寶遊戲，探索城市的每個角落，解開謎題，發現驚喜！
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/scripts">
                  <Button className="bg-blue-600 text-white hover:bg-blue-700 text-lg px-8 py-4">
                    開始探索
                  </Button>
                </Link>
                <Link href="/about">
                  <Button className="bg-white/10 text-white hover:bg-white/20 text-lg px-8 py-4 backdrop-blur-sm">
                    了解更多
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Scripts */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">精選劇本</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                精選最受歡迎的城市尋寶劇本，帶你探索不同區域的精彩故事
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sampleScripts.map((script) => (
                <Link href={`/scripts/${script.id}`} key={script.id} className="group">
                  <ScriptCard script={script} />
                </Link>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/scripts">
                <Button className="bg-white text-blue-600 hover:bg-gray-100">
                  查看更多劇本
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">為什麼選擇我們？</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                我們提供最優質的城市尋寶體驗，讓你的探索之旅充滿樂趣
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center group">
                <div className="w-20 h-20 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <span className="text-4xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">精心設計的謎題</h3>
                <p className="text-gray-600">每個謎題都經過精心設計，確保遊戲體驗的趣味性和挑戰性。</p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <span className="text-4xl">🗺️</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">探索城市角落</h3>
                <p className="text-gray-600">帶你探索城市的每個角落，發現不為人知的景點和故事。</p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <span className="text-4xl">🏆</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">成就系統</h3>
                <p className="text-gray-600">完成遊戲獲得成就，與好友分享你的冒險經歷。</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">準備好開始你的冒險了嗎？</h2>
              <p className="text-xl mb-8 text-blue-100">
                立即加入我們，開始探索城市的每個角落，解開謎題，發現驚喜！
              </p>
              <Link href="/auth/register">
                <Button className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
                  立即註冊
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-4">城市尋寶</h3>
              <p className="text-gray-400">探索城市，解開謎題，發現驚喜！</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">快速連結</h4>
              <ul className="space-y-3">
                <li><Link href="/scripts" className="text-gray-400 hover:text-white transition-colors">所有劇本</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">關於我們</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">聯絡我們</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">支援</h4>
              <ul className="space-y-3">
                <li><Link href="/faq" className="text-gray-400 hover:text-white transition-colors">常見問題</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">使用條款</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">隱私政策</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">追蹤我們</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Facebook</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Instagram</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 城市尋寶. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 