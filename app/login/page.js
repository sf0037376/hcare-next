'use client'
import { useState } from 'react'
import Cookies from 'js-cookie'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function login() {
    if (!username || !password) {
      alert('Enter username and password')
      return
    }

    setLoading(true)
    try {
      const data = await apiFetch(`/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!data?.token) {
        throw new Error('Invalid login response')
      }

      // Store auth data (both cookie and localStorage so that
      // middleware / proxy checks based on cookies keep working)
      Cookies.set('token', data.token, { expires: 7, path: '/' })
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)
      localStorage.setItem('userId', String(data.user_id) ?? '2')
      localStorage.setItem('orgId', String(data.organisation_id) ?? '1')

      // Navigate to dashboard using a hard redirect so that
      // any lingering client routing state can't interfere.
      window.location.href = '/dashboard'
    } catch (e) {
      alert(e?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <h2>HomeCareLogin</h2>
      <input
        placeholder="Username"
        onChange={e => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        onChange={e => setPassword(e.target.value)}
      />
      <button onClick={login} disabled={loading}>
        {loading ? 'Signing in...' : 'Login'}
      </button>
    </div>
  )
}
