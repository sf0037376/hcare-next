'use client'
import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function login() {
    setLoading(true)
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })

      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)
      localStorage.setItem("orgId", data.organisation_id || "1")
      router.push('/dashboard')
    } catch (e) {
      alert(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="login">
      <h2>HomeCare</h2>
      <input placeholder="Username" onChange={e=>setUsername(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e=>setPassword(e.target.value)} />
      <button onClick={login} disabled={loading}>
        {loading ? 'Signing in...' : 'Login'}
      </button>
    </div>
  )
}
