"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"
import Link from "next/link"

export default function AlertsPage() {
  const { Toast, show } = useToast()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  async function fetchAlerts() {
    try {
      const data = await apiFetch("/notifications")
      setAlerts(Array.isArray(data) ? data : [])
    } catch (err) {
      show("Failed to load alerts")
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id) {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PUT" })
      setAlerts(alerts.map(a => a.id === id ? { ...a, status: 'read' } : a))
    } catch (err) {
      show("Failed to update alert")
    }
  }

  return (
    <ProtectedRoute>
      <div className="animate-in fade-in duration-500 max-w-4xl mx-auto pb-20 px-4">
        {Toast}
        <div className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight italic">Alerts Hub</h1>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2 italic">Real-time updates and hospital notifications</p>
          </div>
          <button 
            onClick={fetchAlerts}
            className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 transition-colors"
            title="Refresh"
          >
            🔄
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(alert => (
              <div 
                key={alert.id} 
                className={`bg-white dark:bg-zinc-900 border ${alert.status === 'unread' ? 'border-blue-500 shadow-lg shadow-blue-500/5' : 'border-zinc-200 dark:border-zinc-800'} p-6 rounded-[32px] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all group hover:border-zinc-400`}
              >
                <div className="flex gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${alert.status === 'unread' ? 'bg-blue-600 text-white animate-pulse' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                    {alert.title.includes("Charge") ? "🧾" : alert.title.includes("Med") ? "💊" : "🔔"}
                  </div>
                  <div>
                    <h4 className={`text-lg font-black ${alert.status === 'unread' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      {alert.title}
                    </h4>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl">
                      {alert.message}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-2">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto shrink-0 mt-4 md:mt-0">
                  {alert.title.includes("Charge") && (
                    <Link 
                      href={localStorage.getItem("role") === 'patient' ? "/patients/financials" : "/billing"}
                      className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all text-center"
                    >
                      Review
                    </Link>
                  )}
                  {alert.status === 'unread' && (
                    <button 
                      onClick={() => markAsRead(alert.id)}
                      className="flex-1 md:flex-none px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="py-32 border-4 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[64px] flex flex-col items-center justify-center opacity-40">
                <span className="text-7xl mb-6">🏜️</span>
                <p className="text-xl font-black uppercase tracking-[0.2em] italic">All caught up!</p>
                <p className="text-xs font-bold mt-2">No active alerts at the moment.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
