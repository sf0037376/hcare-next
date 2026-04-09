"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import NotificationBell from "./notification"
import { apiFetch } from "../lib/api"
import Link from "next/link"
import { Volume2, VolumeX } from "lucide-react"

export default function Topbar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [alarmsEnabled, setAlarmsEnabled] = useState(true)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  // Initialize alarms state
  useEffect(() => {
    const saved = localStorage.getItem("hospital_alarms_enabled")
    setAlarmsEnabled(saved !== "false") // Default to true
    
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleToggleAlarms = async () => {
    const newState = !alarmsEnabled
    setAlarmsEnabled(newState)
    localStorage.setItem("hospital_alarms_enabled", String(newState))
    
    // Dispatch event to AlertListener
    window.dispatchEvent(new CustomEvent('hospital-alarms-toggle', { detail: { enabled: newState } }))
    
    // Sync with backend
    try {
      const userId = localStorage.getItem("userId")
      if (userId) {
        await apiFetch(`/users/${userId}/notifications`, {
          method: 'PUT',
          body: JSON.stringify({ alarms_enabled: newState })
        })
      }
    } catch (err) {
      console.error("[Topbar] Failed to sync alarm preference:", err)
    }
  }

  const handleSearch = useCallback((value) => {
    clearTimeout(debounceRef.current)
    setQuery(value)
    if (!value.trim()) { setResults([]); setShowDropdown(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await apiFetch(`/patients?q=${encodeURIComponent(value)}`)
        setResults(Array.isArray(data) ? data.slice(0, 8) : [])
        setShowDropdown(true)
      } catch { setResults([]) }
    }, 300)
  }, [])

  function handleNotificationClick() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl border-b border-zinc-200 dark:border-white/5 transition-all duration-300">
      <div className="flex items-center gap-6">
        {/* Mobile Branding */}
        <div className="md:hidden flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-lg shadow-xl shadow-blue-500/20">
            🏥
          </div>
          <span className="text-lg font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic">NeoCare</span>
        </div>
        
        {/* Search with Autocomplete */}
        <div ref={wrapperRef} className="relative max-w-md w-full hidden md:block">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
            🔍
          </div>
          <input
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            className="w-[300px] lg:w-[450px] bg-zinc-100 dark:bg-zinc-900/50 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold text-zinc-900 dark:text-white transition-all duration-300 placeholder:text-zinc-500 focus:ring-4 focus:ring-blue-500/10 outline-none shadow-inner"
            placeholder="Search clinical records, meds, reports..."
          />
          {showDropdown && (
            <div className="absolute top-full mt-3 left-0 w-full bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
              {results.length > 0 ? (
                <div className="p-2">
                  <p className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl mb-1">Search Results</p>
                  {results.map(p => (
                    <Link
                      key={p.id}
                      href={`/patients/${p.id}/profile`}
                      onClick={() => { setShowDropdown(false); setQuery("") }}
                      className="flex items-center gap-4 px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-2xl transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold group-hover:scale-110 transition-transform">
                        {p.name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-zinc-900 dark:text-white tracking-tight">{p.name}</p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">#{p.id} · {p.phone || "No phone"}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : query && (
                <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/50">
                    <span className="text-3xl opacity-30 block mb-3">🔍</span>
                    <p className="text-sm text-zinc-500 font-bold">No clinical data found for &quot;{query}&quot;</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* ALARM TOGGLE */}
        <div 
          onClick={handleToggleAlarms}
          title={alarmsEnabled ? "Silence Health Alarms" : "Enable Health Alarms"}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-lg ${
            alarmsEnabled 
              ? "bg-red-500 text-white shadow-red-500/25 animate-pulse-subtle" 
              : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 shadow-inner"
          }`}
        >
          {alarmsEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </div>

        <div
          onClick={handleNotificationClick}
          className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all active:scale-95 shadow-inner"
        >
          <NotificationBell />
        </div>
        
        <div className="md:hidden w-11 h-11 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden active:scale-95 transition-transform">
          <img src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff" alt="User" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  )
}
