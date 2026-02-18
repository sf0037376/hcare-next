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
    <div className="topbar">
      <h3>Healthcare System</h3>
      <NotificationBell />
    </div>
  )
}
