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
    <div className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 py-3 md:py-4 glass border-b border-white/10 dark:border-white/5 transition-all duration-300">
      <div className="flex items-center gap-3">
        {/* Mobile Branding */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm shadow-lg shadow-blue-500/20">
            🏥
          </div>
          <span className="text-sm font-black tracking-tighter text-zinc-900 dark:text-white uppercase">NeoCare</span>
        </div>
        {/* Search with Autocomplete */}
        <div ref={wrapperRef} className="relative max-w-md w-full hidden md:block">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
            🔍
          </div>
          <input
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            className="block w-[300px] lg:w-[400px] p-2.5 pl-10 text-sm text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-900 border-none rounded-full focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-zinc-800 transition-all placeholder-zinc-500"
            placeholder="Search patients, meds, or reports..."
          />
          {showDropdown && results.length > 0 && (
            <div className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50">
              {results.map(p => (
                <Link
                  key={p.id}
                  href={`/patients/${p.id}/profile`}
                  onClick={() => { setShowDropdown(false); setQuery("") }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {p.name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{p.name}</p>
                    <p className="text-xs text-zinc-500">#{p.id} · {p.phone || "No phone"}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {showDropdown && query && results.length === 0 && (
            <div className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-4 text-sm text-zinc-400 z-50">
              No patients found for &quot;{query}&quot;
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* ALARM TOGGLE */}
        <div 
          onClick={handleToggleAlarms}
          title={alarmsEnabled ? "Silence Health Alarms" : "Enable Health Alarms"}
          className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${
            alarmsEnabled 
              ? "bg-red-50 text-red-600 hover:bg-red-100" 
              : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 hover:bg-zinc-200"
          }`}
        >
          {alarmsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </div>

        <div
          onClick={handleNotificationClick}
          className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
        >
          <NotificationBell />
        </div>
        <div className="md:hidden w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <img src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff" alt="User" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  )
}
