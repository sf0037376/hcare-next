"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useToast from "../components/toast"

export default function LoginPage() {
  const router = useRouter()
  const { Toast, show } = useToast()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  async function handleLogin(e) {
    e.preventDefault()

    const res = await fetch("http://localhost:5000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      show(data.message || "Login failed")
      return
    }

    localStorage.setItem("token", data.token)
    localStorage.setItem("role", data.role)

    router.push("/dashboard")
  }

  return (
    <div style={{ padding: 40 }}>
      {Toast}

      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button>Login</button>
      </form>
    </div>
  )
}
