import Link from 'next/link';
import { Button } from './Button';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            城市尋寶
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/scripts" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition-colors">
              所有劇本
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition-colors">
              關於我們
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition-colors">
                登入
              </Link>
              <Link href="/auth/register" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                註冊
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
            <span className="sr-only">Open main menu</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
} 