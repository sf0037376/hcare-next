"use client"

import { useState, useEffect, useRef } from "react"
import { apiFetch } from "../lib/api"
import { Bell } from "lucide-react"
import { io } from "socket.io-client"
import { initializeApp } from "firebase/app"
import { getMessaging, getToken, onMessage } from "firebase/messaging"
import useToast from "./toast"
import GlobalAlertOverlay from "./GlobalAlertOverlay"

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDLuU8Xmo9Co6_tsWU7uFw1OeeXwdG0gLk",
  authDomain: "hcare-7ca08.firebaseapp.com",
  projectId: "hcare-7ca08",
  storageBucket: "hcare-7ca08.firebasestorage.app",
  messagingSenderId: "31424477293",
  appId: "1:31424477293:web:f48b240552896a6b942764",
  measurementId: "G-WQCK4TDJT8"
};

const VAPID_KEY = "BKP7XCN5bILnw0kSnX_NpICwal8LYIcojwkldGFXRYFtTMidZaZiwFbCcx1NtvY5OlRYp4VIGG-HzPoM8LBtHnI";

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

    // 2.5 Initialize Firebase Messaging & Register Token
    const setupFCM = async (userId) => {
      try {
        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);
        
        // Request Permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const fcm_token = await getToken(messaging, { vapidKey: VAPID_KEY });
          if (fcm_token) {
            console.log("🔥 Browser FCM Token registered:", fcm_token);
            await apiFetch(`/users/${userId}/fcm-token`, {
              method: 'PUT',
              body: { fcm_token }
            });
          }
        }
      } catch (err) {
        console.error("🔥 Firebase Messaging failed:", err.message);
      }
    };

    // 3. Socket.IO Connection
    const token = localStorage.getItem("token")
    const userId = localStorage.getItem("userId")
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

    if (token && userId) {
      // SANITIZE URL: Extract origin to avoid "Invalid Namespace" errors if apiUrl has a path (like /api)
      let origin = apiUrl
      let socketPath = "/socket.io"
      
      try {
        const urlObj = new URL(apiUrl)
        origin = urlObj.origin
        // If your API is at /api, socket.io should be at /api/socket.io
        if (urlObj.pathname !== "/") {
          socketPath = `${urlObj.pathname.replace(/\/$/, "")}/socket.io`
        }
      } catch (e) {
        console.warn("📡 Could not parse apiUrl for socket, using defaults")
      }

      socketRef.current = io(origin, {
        auth: { token },
        path: socketPath,
        transports: ["websocket", "polling"],
        withCredentials: true
      })

      socketRef.current.on("connect_error", (err) => {
        console.error("📡 WebSocket connection error:", err.message)
      })

      socketRef.current.on("connect", () => {
        console.log("📡 Connected to WebSocket Alerts")
        socketRef.current.emit("join", { userId })
      })

        // 2.5 Setup FCM if userId exists
        if (userId) setupFCM(userId);

        socketRef.current.on("new_notification", (n) => {
        console.log("🔔 Received Real-time Alert:", n.title)
        
        if (processedIdsRef.current.has(n.id)) return
        processedIdsRef.current.add(n.id)

        // FILTER LOGIC: Adjusted for Admin Oversight
        const isHigh = n.priority === 'HIGH' || n.priority === 'high'
        const isCriticalType = n.title.toLowerCase().includes('due') || 
                               n.title.toLowerCase().includes('reminder') || 
                               n.title.toLowerCase().includes('abnormal') ||
                               n.title.toLowerCase().includes('missed')

        // If backend says isSilenced=true, we don't trigger intrusive UI/Sound.
        // For Admins, backend now only silences routine items.
        const isUrgent = isHigh && isCriticalType && !n.isSilenced

        if (isUrgent) {
          setHighPriorityQueue(prev => [...prev, n])
          const currentEnabled = localStorage.getItem("hospital_alarms_enabled") !== "false"
          if (currentEnabled && audioRef.current) {
            audioRef.current.play().catch(e => console.warn("Audio blocked", e))
          }
        } else {
          // Normal Notification / Silenced Routine Alert
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
