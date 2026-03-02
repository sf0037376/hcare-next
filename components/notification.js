"use client"
import { useEffect, useState } from "react"
import { apiFetch } from "../lib/api"

export default function NotificationBell() {
  const [count, setCount] = useState(0)

  async function load() {
    // Backend notifications router is mounted at /notifications and
    // defines GET /notifications/unread, so the full path is
    // /notifications/notifications/unread
    const data = await apiFetch("/notifications/notifications/unread")
    if (data) setCount(data.count || 0)
  }

  useEffect(() => {
    // load()
    // const i = setInterval(load, 15000)
    // return () => clearInterval(i)
  }, [])

  return (
    <div className="bell">
      🔔 {count > 0 && <span className="badge">{count}</span>}
    </div>
  )
}
