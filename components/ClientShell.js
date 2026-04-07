"use client"

import { usePathname } from "next/navigation"
import Sidebar from "./sidebar"
import Topbar from "./topbar"
import BottomNav from "./BottomNav"
import AlertListener from "./AlertListener"
import { useState, useEffect } from "react"

export default function ClientShell({ children }) {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Client-side only auth check
    const token = localStorage.getItem("token")
    setIsAuthenticated(!!token)
    setIsLoading(false)
  }, [pathname])

  // Exclude landing pages, auth, and dynamic org pages from the clinical shell
  const isOrgRoute = /^\/\d+$/.test(pathname)
  const isExcluded = ['/', '/login', '/contact', '/terms', '/privacy', '/register-patient'].includes(pathname) || isOrgRoute
  
  const showShell = !isExcluded && isAuthenticated && !isLoading

  if (isLoading) return null // Prevent layout shift

  return (
    <>
      {showShell ? (
        <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-black font-sans antialiased text-zinc-900 dark:text-zinc-50">
          <AlertListener />
          <Sidebar />
          <div className="flex-1 flex flex-col md:ml-64 relative w-full h-full overflow-hidden transition-all duration-300">
            <Topbar />
            <main id="main-content" className="flex-1 overflow-y-auto pt-20 md:pt-0 pb-24 md:pb-6 relative w-full h-full custom-scrollbar">
              <div className="px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto min-h-full">
                {children}
              </div>
            </main>
            <BottomNav />
          </div>
        </div>
      ) : (
        <div id="main-content" className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center font-sans antialiased text-zinc-900 dark:text-zinc-50 p-0">
          {children}
        </div>
      )}
    </>
  )
}
