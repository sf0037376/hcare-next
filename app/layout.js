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
  const showShell = !['/', '/login', '/contact', '/terms', '/privacy'].includes(pathname)

  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:bg-white focus:text-blue-600 focus:p-4 focus:z-50 focus:rounded-xl focus:shadow-2xl focus:font-black focus:uppercase focus:text-xs focus:tracking-widest">
          Skip to content
        </a>
        
        {showShell ? (
          <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-black font-sans antialiased text-zinc-900 dark:text-zinc-50">
            <Sidebar />
            <div className="flex-1 flex flex-col md:ml-64 relative w-full h-full overflow-hidden">
              <Topbar />
              <main id="main-content" className="flex-1 overflow-y-auto pb-24 md:pb-6 relative w-full h-full custom-scrollbar">
                <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full">
                  {children}
                </div>
              </main>
              <BottomNav />
            </div>
          </div>
        ) : (
          <div id="main-content" className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center font-sans antialiased text-zinc-900 dark:text-zinc-50 p-4">
            {children}
          </div>
        )}
      </body>
    </html>
  )
}
