"use client"
import { useState } from "react"

export default function useToast() {
  const [msg, setMsg] = useState("")

  function show(message) {
    setMsg(message)
    setTimeout(() => setMsg(""), 3000)
  }

  const Toast = msg ? (
    <div className="toast-container">
      <div className="toast animate-in slide-in-from-bottom-5 duration-300">
        <span className="text-lg">🔔</span>
        {msg}
      </div>
    </div>
  ) : null

  return { Toast, show }
}
