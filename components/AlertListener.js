"use client"

import { useState, useEffect, useRef } from "react"
import { apiFetch } from "../lib/api"
import { Bell } from "lucide-react"
import { io } from "socket.io-client"
import useToast from "./toast"
import GlobalAlertOverlay from "./GlobalAlertOverlay"

export default function AlertListener() {
  const { Toast, show } = useToast()
  const [highPriorityQueue, setHighPriorityQueue] = useState([])
  const processedIdsRef = useRef(new Set())
  const audioRef = useRef(null)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    setIsMounted(true)
    
    // 1. Establish Baseline (Fetch unread to silence them initially)
    const establishBaseline = async () => {
      try {
        const notifications = await apiFetch("/notifications?status=unread")
        if (Array.isArray(notifications)) {
          notifications.forEach(n => processedIdsRef.current.add(n.id))
        }
      } catch (err) {
        console.error("[AlertListener] Baseline fetch failed:", err)
      }
    }
    establishBaseline()

    // 2. Initialize Audio
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/sounds/alert.mp3")
      audioRef.current.loop = true
      
      const primeAudio = () => {
        if (audioRef.current) {
          audioRef.current.volume = 0
          audioRef.current.play().then(() => {
            audioRef.current.pause()
            audioRef.current.volume = 1
            window.removeEventListener('click', primeAudio)
          }).catch(() => {})
        }
      }
      window.addEventListener('click', primeAudio)
    }

    // 3. Socket.IO Connection
    const token = localStorage.getItem("token")
    const userId = localStorage.getItem("userId")
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

    if (token && userId) {
      socketRef.current = io(apiUrl, {
        auth: { token }
      })

      socketRef.current.on("connect", () => {
        console.log("📡 Connected to WebSocket Alerts")
        socketRef.current.emit("join", { userId })
      })

      socketRef.current.on("new_notification", (n) => {
        console.log("🔔 Received Real-time Alert:", n.title)
        
        if (processedIdsRef.current.has(n.id)) return
        processedIdsRef.current.add(n.id)

        // FILTER LOGIC: High Priority + Specific Keywords
        const isHigh = n.priority === 'HIGH' || n.priority === 'high'
        const isCriticalType = n.title.toLowerCase().includes('due') || 
                               n.title.toLowerCase().includes('reminder') || 
                               n.title.toLowerCase().includes('abnormal')

        const userRole = (localStorage.getItem("role") || "").toUpperCase()
        const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
        const isUrgent = isHigh && isCriticalType && !n.isSilenced && !isAdmin

        if (isUrgent) {
          setHighPriorityQueue(prev => [...prev, n])
          const currentEnabled = localStorage.getItem("hospital_alarms_enabled") !== "false"
          if (currentEnabled && audioRef.current) {
            audioRef.current.play().catch(e => console.warn("Audio blocked", e))
          }
        } else {
          // Normal Notification / Silenced Admin Alert
          show(`🔔 ${n.title}`, { variant: 'info' })
        }
      })
    }

    // 4. Handle External Toggles
    const handleToggle = (e) => setIsAudioEnabled(e.detail?.enabled)
    window.addEventListener('hospital-alarms-toggle', handleToggle)

    return () => {
      if (socketRef.current) socketRef.current.disconnect()
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
