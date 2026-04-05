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
    
    // Restore alarm state from persistent settings
    const savedState = localStorage.getItem("hospital_alarms_enabled")
    if (savedState === "true" || savedState === null) { // Default to true if not set
      setIsAudioEnabled(true)
    }

    // Initialize Audio
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/sounds/alert.mp3")
      audioRef.current.loop = true

      // FIRST-GESTURE UNLOCK: Prime audio on first click
      const primeAudio = () => {
        if (audioRef.current) {
          // Play a very short silent volume to "prime" the browser audio context
          audioRef.current.volume = 0
          audioRef.current.play()
            .then(() => {
               audioRef.current.pause()
               audioRef.current.volume = 1
               console.log("[AlertListener] Audio primed successfully")
               window.removeEventListener('click', primeAudio)
            })
            .catch(e => console.warn("[AlertListener] Priming failed, will retry on next click"))
        }
      }
      window.addEventListener('click', primeAudio)
    }

    // LISTENER FOR REMOTE TOGGLE (from Topbar)
    const handleToggle = (e) => {
      const enabled = e.detail?.enabled
      setIsAudioEnabled(enabled)
    }
    window.addEventListener('hospital-alarms-toggle', handleToggle)

    const poll = setInterval(async () => {
      const token = localStorage.getItem("token")
      if (!token) return

      try {
        const notifications = await apiFetch("/notifications?status=unread")
        if (!Array.isArray(notifications) || notifications.length === 0) return

        const newAlerts = notifications.filter(n => new Date(n.created_at) > new Date(lastCheckRef.current))
        
        if (newAlerts.length > 0) {
          lastCheckRef.current = new Date().toISOString()
          
          const urgentAlerts = newAlerts.filter(n => {
            const isUrgent = n.priority === 'HIGH' || 
                             n.title.toLowerCase().includes('due') || 
                             n.title.toLowerCase().includes('abnormal')
            const isProcessed = processedIdsRef.current.has(n.id)
            return isUrgent && !isProcessed
          })

          if (urgentAlerts.length > 0) {
            urgentAlerts.forEach(a => processedIdsRef.current.add(a.id))
            setHighPriorityQueue(prev => [...prev, ...urgentAlerts])
            
            // Check state again before playing
            const currentEnabled = localStorage.getItem("hospital_alarms_enabled") === "true"
            if (currentEnabled && audioRef.current) {
              audioRef.current.play().catch(e => console.warn("Audio play blocked:", e))
            }
          }

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
      window.removeEventListener('hospital-alarms-toggle', handleToggle)
      if (audioRef.current) audioRef.current.pause()
    }
  }, [show])

  const handleAcknowledge = async (id) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PUT' })
      setHighPriorityQueue(prev => {
        const newQueue = prev.filter(a => a.id !== id)
        if (newQueue.length === 0 && audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        }
        return newQueue
      })
    } catch (error) {
      console.error("[AlertListener] Acknowledgement failed:", error)
      setHighPriorityQueue(prev => prev.filter(a => a.id !== id))
    }
  }

  if (!isMounted) return null

  return (
    <>
      {Toast}
      
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
