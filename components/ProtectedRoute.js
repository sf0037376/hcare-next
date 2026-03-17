'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Enforces role-based access. Redirects to /login if not authenticated
// or to /dashboard if role is not in the allowed list.
export default function ProtectedRoute({ children, roles = [] }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = (localStorage.getItem('role') || '').toUpperCase()

    if (!token) {
      router.replace('/')
      return
    }

    const allowedRoles = roles.map(r => r.toUpperCase())
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      router.replace('/dashboard')
      return
    }

    setAuthorized(true)
  }, [router, roles])

  if (!authorized) return null

  return children
}
