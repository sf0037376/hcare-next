'use client'
import './globals.css'
import { usePathname } from 'next/navigation'

import Sidebar from '@/components/sidebar'
import Topbar from '@/components/topbar'
import BottomNav from '@/components/BottomNav'

// Root layout only controls chrome (sidebar/topbar/bottomnav) based on route.
// It does NOT perform any redirects to avoid loops.
export default function RootLayout({ children }) {
  const pathname = usePathname()
  const showShell = pathname !== '/login'

  return (
    <html lang="en">
      <body>
        {showShell ? (
          <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-black font-sans antialiased text-zinc-900 dark:text-zinc-50">
            <Sidebar />
            <div className="flex-1 flex flex-col md:ml-64 relative w-full h-full overflow-hidden">
              <Topbar />
              <main className="flex-1 overflow-y-auto pb-24 md:pb-6 relative w-full h-full custom-scrollbar">
                <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full">
                  {children}
                </div>
              </main>
              <BottomNav />
            </div>
          </div>
        ) : (
          <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center font-sans antialiased text-zinc-900 dark:text-zinc-50 p-4">
            {children}
          </div>
        )}
      </body>
    </html>
  )
}
