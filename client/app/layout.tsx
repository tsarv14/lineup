import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'Lineup - Discover Top Creators',
  description: 'Find and subscribe to the best sports picks creators',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="dark:bg-black relative">
        <div className="fixed inset-0 bg-gradient-to-b from-black via-slate-900 to-black pointer-events-none z-0"></div>
        <div className="relative z-10">
          <AuthProvider>
            {children}
            <Toaster position="top-right" />
          </AuthProvider>
        </div>
      </body>
    </html>
  )
}

