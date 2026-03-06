"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"
import Link from "next/link"

export default function DoctorDashboard() {
  const { Toast, show } = useToast()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        const patientsData = await apiFetch("/patients")
        setPatients(Array.isArray(patientsData) ? patientsData : [])
      } catch (err) {
        show("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              On Call
            </span>
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

        {/* Patients Overview */}
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Urgent Patients Overview</h3>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
          {loading ? (
             <div className="p-8 flex items-center justify-center text-zinc-500">
               <div className="w-8 h-8 border-4 border-zinc-200 dark:border-zinc-700 border-t-purple-500 rounded-full animate-spin"></div>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-900/50">Patient</th>
                    <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-900/50">DOB</th>
                    <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-900/50">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {patients.slice(0, 5).map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs uppercase">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            {p.name}
                            <div className="text-xs text-zinc-500 font-normal">ID: #{p.id}</div>
                          </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">{p.dob}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                        <Link href={`/dashboard?patient_id=${p.id}`} className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-semibold text-sm">
                          View Details &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {patients.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center text-zinc-500 text-sm">No patients assigned found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
