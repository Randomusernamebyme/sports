import Link from 'next/link';
import { Button } from './Button';

export function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-blue-600">
            城市尋寶
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/scripts" className="text-gray-600 hover:text-gray-900">
              所有劇本
            </Link>
            <Link href="/auth/login">
              <Button variant="outline">登入</Button>
            </Link>
            <Link href="/auth/register">
              <Button>註冊</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 