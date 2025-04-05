import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
})

export const metadata: Metadata = {
  title: '城市尋寶',
  description: '探索城市，解開謎題，完成任務',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster position="top-center" />
          <div id="recaptcha-container" className="fixed bottom-0 left-0 w-full h-0 overflow-hidden" />
        </AuthProvider>
      </body>
    </html>
  )
} 