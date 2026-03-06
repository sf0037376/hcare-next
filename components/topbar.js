"use client"

import { useEffect } from "react"
import NotificationBell from "./notification"

export default function Topbar() {
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission()
    }
  }, [])

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-4">
        {/* Mobile Logo */}
        <div className="md:hidden w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm shadow-md shadow-blue-500/20">
          🏥
        </div>
        <div className="relative group max-w-md w-full hidden md:block">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
            🔍
          </div>
          <input 
            type="text" 
            className="block w-[300px] lg:w-[400px] p-2.5 pl-10 text-sm text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-900 border-none rounded-full focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-zinc-800 transition-all placeholder-zinc-500" 
            placeholder="Search patients, meds, or reports..." 
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
          <NotificationBell />
        </div>
        
        <div className="md:hidden w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
          👨‍⚕️
        </div>
      </div>
    </div>
  )
}
