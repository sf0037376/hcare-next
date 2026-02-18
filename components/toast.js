"use client"
import { useState } from "react"

export default function useToast() {
  const [msg, setMsg] = useState("")

  function show(message) {
    setMsg(message)
    setTimeout(() => setMsg(""), 3000)
  }

  const Toast = msg ? <div className="toast">{msg}</div> : null

  return { Toast, show }
}
