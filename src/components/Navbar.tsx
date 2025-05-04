'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-primary-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/icons/icon-192x192.png"
                  alt="城市尋寶"
                  width={32}
                  height={32}
                  className="header-icon"
                />
                <span className="ml-2 text-xl font-bold text-primary-900">城市尋寶</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/'
                    ? 'border-primary-500 text-primary-900'
                    : 'border-transparent text-primary-600 hover:border-primary-300 hover:text-primary-700'
                }`}
              >
                首頁
              </Link>
              <Link
                href="/events"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/events'
                    ? 'border-primary-500 text-primary-900'
                    : 'border-transparent text-primary-600 hover:border-primary-300 hover:text-primary-700'
                }`}
              >
                遊戲
              </Link>
              <Link
                href="/about"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/about'
                    ? 'border-primary-500 text-primary-900'
                    : 'border-transparent text-primary-600 hover:border-primary-300 hover:text-primary-700'
                }`}
              >
                關於我們
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/profile"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/profile')
                      ? 'border-primary-500 text-primary-900'
                      : 'border-transparent text-primary-600 hover:border-primary-300 hover:text-primary-700'
                  }`}
                >
                  個人中心
                </Link>
                <button
                  onClick={() => logout()}
                  className="btn-primary"
                >
                  登出
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/auth/login')
                      ? 'border-primary-500 text-primary-900'
                      : 'border-transparent text-primary-600 hover:border-primary-300 hover:text-primary-700'
                  }`}
                >
                  登入
                </Link>
                <Link
                  href="/auth/register"
                  className="btn-primary"
                >
                  註冊
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 