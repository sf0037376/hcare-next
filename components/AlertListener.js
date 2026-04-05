"use client"

import { useState, useEffect, useRef } from "react"
import { apiFetch } from "../lib/api"
import { Bell } from "lucide-react"
import useToast from "./toast"
import GlobalAlertOverlay from "./GlobalAlertOverlay"

export default function AlertListener() {
  const { Toast, show } = useToast()
  const lastCheckRef = useRef(new Date().toISOString())
  const [highPriorityQueue, setHighPriorityQueue] = useState([])
  const processedIdsRef = useRef(new Set())
  const audioRef = useRef(null)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    // Restore alarm state from session
    const savedState = sessionStorage.getItem("hospital_alarms_active")
    if (savedState === "true") {
      setIsAudioEnabled(true)
    }

    // Initialize Audio
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/sounds/alert.mp3")
      audioRef.current.loop = true
    }

    const poll = setInterval(async () => {
      const token = localStorage.getItem("token")
      if (!token) return

      try {
        const notifications = await apiFetch("/notifications?status=unread")
        if (!Array.isArray(notifications) || notifications.length === 0) return

        // Filter for truly new alerts after our last check
        const newAlerts = notifications.filter(n => new Date(n.created_at) > new Date(lastCheckRef.current))
        
        if (newAlerts.length > 0) {
          lastCheckRef.current = new Date().toISOString()
          
          // Categorize alerts
          const urgentAlerts = newAlerts.filter(n => {
            const isUrgent = n.priority === 'HIGH' || 
                             n.title.toLowerCase().includes('due') || 
                             n.title.toLowerCase().includes('abnormal')
            
            // Critical check: Ensure we haven't already queued this ID in this session
            const isProcessed = processedIdsRef.current.has(n.id)
            return isUrgent && !isProcessed
          })

          if (urgentAlerts.length > 0) {
            // Track these IDs as processed to prevent loops
            urgentAlerts.forEach(a => processedIdsRef.current.add(a.id))
            
            setHighPriorityQueue(prev => [...prev, ...urgentAlerts])
            
            if (isAudioEnabled && audioRef.current) {
              audioRef.current.play().catch(e => console.warn("Audio play blocked:", e))
            }
          }

          // Show non-urgent toasts
          const normalAlerts = newAlerts.filter(n => !urgentAlerts.some(ua => ua.id === n.id))
          if (normalAlerts.length > 0) {
            show(`🔔 ${normalAlerts[0].title}`, { variant: 'info' })
          }
        }
      } catch (err) {
        console.error("[AlertListener] Poll failed:", err)
      }
    }, 10000)

    return () => {
      clearInterval(poll)
      if (audioRef.current) audioRef.current.pause()
    }
  }, [show, isAudioEnabled])

  const handleAcknowledge = async (id) => {
    try {
      // Mark as read on the backend
      await apiFetch(`/notifications/${id}/read`, { method: 'PUT' })
      
      setHighPriorityQueue(prev => {
        const newQueue = prev.filter(a => a.id !== id)
        // Silence audio if queue is now empty
        if (newQueue.length === 0 && audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        }
        return newQueue
      })
    } catch (error) {
      console.error("[AlertListener] Acknowledgement failed:", error)
      // Force remove from UI anyway to prevent locking staff out
      setHighPriorityQueue(prev => prev.filter(a => a.id !== id))
    }
  }

  if (!isMounted) return null

  return (
    <>
      {Toast}
      
      {/* 
        Audio Enablement Control 
        Only visible when logged in to satisfy browser autoplay requirements.
      */}
      {!isAudioEnabled && typeof window !== "undefined" && localStorage.getItem("token") && (
        <button 
          onClick={() => {
            setIsAudioEnabled(true)
            sessionStorage.setItem("hospital_alarms_active", "true")
          }}
          className="fixed bottom-24 right-6 z-[100] bg-red-600 text-white px-5 py-4 rounded-full shadow-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest animate-bounce hover:bg-red-700 transition-colors"
        >
          <Bell className="w-5 h-5 fill-current" />
          Activate Hospital Alarms
        </button>
      )}

      {/* Intrusive Overlay Queue */}
      {highPriorityQueue.length > 0 && (
        <GlobalAlertOverlay 
          alert={highPriorityQueue[0]} 
          onAcknowledge={handleAcknowledge} 
        />
      )}
    </>
  )
}
