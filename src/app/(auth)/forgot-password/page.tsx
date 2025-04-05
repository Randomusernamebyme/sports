'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Loading } from '@/components/ui/Loading';

export default function ForgotPasswordPage() {
  const { resetPassword, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    email?: string;
  }>({});

  const validateForm = () => {
    const errors: typeof formErrors = {};
    if (!email) {
      errors.email = '請輸入電子郵件';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = '請輸入有效的電子郵件地址';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      console.error('密碼重置失敗:', error);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-center text-2xl font-bold text-gray-900">
            檢查你的電子郵件
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            我們已經發送了一封密碼重置郵件到 {email}
          </p>
        </div>

        <div>
          <Link
            href="/login"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            返回登入頁面
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-center text-2xl font-bold text-gray-900">
          重置密碼
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          或者{' '}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            返回登入頁面
          </Link>
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && <Alert variant="error">{error}</Alert>}

        <div>
          <Input
            label="電子郵件"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={formErrors.email}
            required
          />
        </div>

        <div>
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? '發送中...' : '發送重置郵件'}
          </Button>
        </div>
      </form>
    </div>
  );
} 