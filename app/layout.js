'use client'
import './globals.css'
import { usePathname } from 'next/navigation'

import Sidebar from '@/components/sidebar'
import Topbar from '@/components/topbar'

// Root layout only controls chrome (sidebar/topbar) based on route.
// It does NOT perform any redirects to avoid loops.
export default function RootLayout({ children }) {
  const pathname = usePathname()
  const showShell = pathname !== '/login'

  return (
    <html lang="en">
      <body>
        {showShell ? (
          <>
            {/* <Sidebar /> */}
            <div className="main">
              <Topbar />
              <div className="content">{children}</div>
            </div>
          </>
        ) : (
          <>{children}</>
        )}
      </body>
    </html>
  )
}
