'use client'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

export default function Dashboard() {
  const [stats, setStats] = useState({})

  useEffect(()=>{
    apiFetch('/dashboard').then(setStats)
  },[])

  return (
    <div className="grid">
      <div className="card">Feeds Today: {stats.feeds}</div>
      <div className="card">Medications: {stats.meds}</div>
      <div className="card">Vitals Logged: {stats.vitals}</div>
    </div>
  )
}
