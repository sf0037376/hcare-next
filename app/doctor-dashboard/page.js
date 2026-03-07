"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"
import Link from "next/link"

export default function DoctorDashboard() {
  const { Toast, show } = useToast()
  const [patients, setPatients] = useState([])
  const [logs, setLogs] = useState([])
  const [meds, setMeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [activityStatus, setActivityStatus] = useState("AVAILABLE")
  const [userId, setUserId] = useState(null)

  // Accordion state
  const [openSection, setOpenSection] = useState('urgent')

  useEffect(() => {
    async function init() {
      try {
        const uid = localStorage.getItem("userId")
        setUserId(uid)
        
        const [patientsData, logsData, medsData, usersData] = await Promise.all([
          apiFetch("/patients"),
          apiFetch("/vitals"),
          apiFetch("/medication/schedule"),
          apiFetch("/users")
        ]).catch(() => [[], [], [], []])

        setPatients(Array.isArray(patientsData) ? patientsData : [])
        setLogs(Array.isArray(logsData) ? logsData : [])
        setMeds(Array.isArray(medsData) ? medsData : [])
        
        if (uid && Array.isArray(usersData)) {
          const me = usersData.find(u => u.id === parseInt(uid))
          if (me && me.activity_status) setActivityStatus(me.activity_status)
        }
      } catch (err) {
        show("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  async function updateActivity(newStatus) {
    if (!userId) return
    setActivityStatus(newStatus)
    try {
      await apiFetch(`/users/${userId}/activity`, {
        method: "PUT",
        body: JSON.stringify({ activity_status: newStatus })
      })
      show(`Status updated to ${newStatus}`)
    } catch (e) {
      show("Failed to update status")
    }
  }

  return (
    <ProtectedRoute>
      <div className="animate-in fade-in duration-500">
        {Toast}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Doctor Dashboard</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Overview of assigned patients and alerts.</p>
          </div>
        </div>

        {/* Hero Alert Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 sm:p-10 text-white shadow-lg shadow-purple-500/20 mb-8 relative overflow-hidden flex items-center justify-between">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider border border-white/10 ${
                activityStatus === 'EMERGENCY' ? 'bg-red-500/80 border-red-500' : ''
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  activityStatus === 'AVAILABLE' ? 'bg-green-400' :
                  activityStatus === 'ON_ROUNDS' ? 'bg-blue-400' :
                  activityStatus === 'IN_SURGERY' ? 'bg-orange-400' :
                  'bg-white'
                }`}></span>
                {activityStatus.replace('_', ' ')}
              </span>
              <select 
                value={activityStatus}
                onChange={e => updateActivity(e.target.value)}
                className="bg-black/20 text-white text-xs font-bold uppercase tracking-wider rounded-full px-3 py-1 outline-none border border-white/10 hover:bg-black/30 transition-colors backdrop-blur-md cursor-pointer appearance-none"
              >
                <option value="AVAILABLE" className="text-black">AVAILABLE</option>
                <option value="ON_ROUNDS" className="text-black">ON ROUNDS</option>
                <option value="IN_SURGERY" className="text-black">IN SURGERY</option>
                <option value="EMERGENCY" className="text-black">EMERGENCY</option>
                <option value="OFF_DUTY" className="text-black">OFF DUTY</option>
              </select>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-2">Welcome Dr. {typeof window !== "undefined" ? localStorage.getItem("username") || "" : ""}</h3>
            <p className="text-purple-100 text-lg">You have {patients.length} active patients under your care today.</p>
          </div>
          <div className="hidden md:flex opacity-20 transform rotate-12 scale-150 absolute right-12">
            <span className="text-9xl">🩺</span>
          </div>
        </div>

        {/* Fast Actions Grid */}
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Quick Links</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <Link href="/patients" className="flex flex-col items-center justify-center gap-3 p-6 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-3xl transition-colors border border-blue-100 dark:border-blue-900/20 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🛏️
            </div>
            <span className="font-semibold text-blue-900 dark:text-blue-100 text-sm">All Patients</span>
          </Link>
          
          <Link href="/medication" className="flex flex-col items-center justify-center gap-3 p-6 bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-3xl transition-colors border border-purple-100 dark:border-purple-900/20 group">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              💊
            </div>
            <span className="font-semibold text-purple-900 dark:text-purple-100 text-sm">Prescriptions</span>
          </Link>
          
          <Link href="/vitals" className="flex flex-col items-center justify-center gap-3 p-6 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-3xl transition-colors border border-red-100 dark:border-red-900/20 group">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              ❤️
            </div>
            <span className="font-semibold text-red-900 dark:text-red-100 text-sm">Check Vitals</span>
          </Link>
          
          <Link href="/notifications" className="flex flex-col items-center justify-center gap-3 p-6 bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded-3xl transition-colors border border-orange-100 dark:border-orange-900/20 group">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🔔
            </div>
            <span className="font-semibold text-orange-900 dark:text-orange-100 text-sm">Send Alert</span>
          </Link>
        </div>

        {/* Accordion Sections */}
        <div className="space-y-4">
          
          {/* Urgent Patients List */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
            <button 
              onClick={() => setOpenSection(openSection === 'urgent' ? '' : 'urgent')}
              className="w-full px-6 py-5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                🚨 Urgent Patients Overview
                <span className="bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full">{patients.length}</span>
              </h3>
              <span className={`transform transition-transform ${openSection === 'urgent' ? 'rotate-180' : ''}`}>▼</span>
            </button>
            
            {openSection === 'urgent' && (
              <div className="border-t border-zinc-200 dark:border-zinc-800">
                {loading ? (
                  <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-purple-500 rounded-full animate-spin border-t-transparent"></div></div>
                ) : patients.length > 0 ? (
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {patients.slice(0, 5).map(p => (
                      <li key={p.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 flex items-center justify-center font-bold">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-white">{p.name}</p>
                            <p className="text-xs text-zinc-500">ID: #{p.id} • {p.dob}</p>
                          </div>
                        </div>
                        <Link href={`/patients/${p.id}/profile`} className="text-sm font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg">
                          View Profile
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-6 text-center text-zinc-500 text-sm">No urgent patients assigned.</div>
                )}
              </div>
            )}
          </div>

          {/* Recent Logs List */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
            <button 
              onClick={() => setOpenSection(openSection === 'logs' ? '' : 'logs')}
              className="w-full px-6 py-5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                📋 Recent Logs
              </h3>
              <span className={`transform transition-transform ${openSection === 'logs' ? 'rotate-180' : ''}`}>▼</span>
            </button>
            
            {openSection === 'logs' && (
              <div className="border-t border-zinc-200 dark:border-zinc-800">
                {loading ? (
                  <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-purple-500 rounded-full animate-spin border-t-transparent"></div></div>
                ) : logs.length > 0 ? (
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {/* Placeholder map since we don't have a real Recent Logs global endpoint yet */}
                    {logs.map(log => <li key={log.id} className="p-4 text-sm text-zinc-600">Log entry</li>)}
                  </ul>
                ) : (
                  <div className="p-6 text-center text-zinc-500 text-sm">No recent logs found.</div>
                )}
              </div>
            )}
          </div>

          {/* Recent Medications List */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
            <button 
              onClick={() => setOpenSection(openSection === 'meds' ? '' : 'meds')}
              className="w-full px-6 py-5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                💊 Recent Medications
              </h3>
              <span className={`transform transition-transform ${openSection === 'meds' ? 'rotate-180' : ''}`}>▼</span>
            </button>
            
            {openSection === 'meds' && (
              <div className="border-t border-zinc-200 dark:border-zinc-800">
                {loading ? (
                  <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-purple-500 rounded-full animate-spin border-t-transparent"></div></div>
                ) : meds.length > 0 ? (
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    <li className="p-4 text-sm text-zinc-600 italic">Medication history available in patient profiles.</li>
                  </ul>
                ) : (
                  <div className="p-6 text-center text-zinc-500 text-sm">No recent medications found.</div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </ProtectedRoute>
  )
}
