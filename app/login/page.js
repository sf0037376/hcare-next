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

      // Store auth data
      Cookies.set('token', data.token, { expires: 7, path: '/' })
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role || '')
      localStorage.setItem('username', data.username || data.name || username)
      localStorage.setItem('userId', String(data.user_id) ?? '2')
      localStorage.setItem('orgId', String(data.organisation_id) ?? '1')
      if (data.patient_id) {
        localStorage.setItem('patientId', String(data.patient_id))
      }

      // Route based on role
      const userRole = (data.role || '').toLowerCase()
      if (userRole === 'doctor') {
        window.location.href = '/doctor-dashboard'
      } else if (['nurse', 'staff', 'attender'].includes(userRole)) {
        window.location.href = '/staff-dashboard'
      } else {
        window.location.href = '/dashboard'
      }
    } catch (e) {
      alert(e?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl mx-auto shadow-lg shadow-blue-500/30 mb-6">
          🏥
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">NeoCare</h2>
        <p className="mt-2 text-sm text-zinc-500 font-medium">Hospital Management System</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); login(); }} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Username</label>
          <input
            className="block w-full px-4 py-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium placeholder-zinc-400 focus:outline-none"
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Password</label>
          <input
            type="password"
            className="block w-full px-4 py-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium placeholder-zinc-400 focus:outline-none"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mt-8"
        >
          {loading ? 'Signing in...' : 'Sign in to account'}
        </button>
      </form>
    </div>
  )
}
