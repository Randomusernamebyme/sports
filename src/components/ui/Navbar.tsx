import Link from 'next/link';
import { Button } from './Button';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
            城市尋寶
          </Link>
          
          <div className="flex items-center gap-8">
            <Link href="/scripts" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              所有劇本
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              關於我們
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="outline" className="text-sm px-4 py-2">
                  登入
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="text-sm px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white">
                  註冊
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 