"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"
import Link from "next/link"

export default function StaffDashboard() {
  const { Toast, show } = useToast()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState("Staff")
  const [role, setRole] = useState("")
  const [globalTasks, setGlobalTasks] = useState([])

  useEffect(() => {
    // Only access localStorage on the client
    setDisplayName(localStorage.getItem("username") || "Staff")
    setRole((localStorage.getItem("role") || "").toLowerCase())
    async function init() {
      try {
        const patientsData = await apiFetch("/patients")
        setPatients(Array.isArray(patientsData) ? patientsData : [])
        
        // Fetch global tasks
        const tasksData = await apiFetch("/patients/global-tasks")
        setGlobalTasks(Array.isArray(tasksData) ? tasksData : [])
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
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Staff Dashboard</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Daily tasks, feeding, and vitals monitoring.</p>
          </div>
        </div>

        {/* Hero Alert Section */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-8 sm:p-10 text-white shadow-lg shadow-orange-500/20 mb-8 relative overflow-hidden flex items-center justify-between">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
               <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse"></span>
               Shift Active
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold mb-2">Hello, {displayName}</h3>
            <p className="text-orange-100 text-lg">Ready to log your rounds for {patients.length} patients.</p>
          </div>
          <div className="hidden md:flex opacity-20 transform -rotate-12 scale-150 absolute right-12">
            <span className="text-9xl">🩺</span>
          </div>
        </div>

        {/* Task Grid */}
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Required Logging</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <Link href="/feeding" className="flex items-center gap-5 p-6 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-3xl transition-all border border-zinc-200 dark:border-zinc-800 shadow-sm group">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">
               🍼
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white text-lg">Feed Patient</h4>
              <p className="text-sm text-zinc-500">Log formula/EBM delivery</p>
            </div>
          </Link>

          <Link href="/vitals" className="flex items-center gap-5 p-6 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-3xl transition-all border border-zinc-200 dark:border-zinc-800 shadow-sm group">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">
               ❤️
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white text-lg">Check Vitals</h4>
              <p className="text-sm text-zinc-500">Record HR and SpO2 levels</p>
            </div>
          </Link>

          <Link href="/availability" className="flex items-center gap-5 p-6 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-3xl transition-all border border-zinc-200 dark:border-zinc-800 shadow-sm group">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">
               ⏰
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white text-lg">My Schedule</h4>
              <p className="text-sm text-zinc-500">View your assigned shifts</p>
            </div>
          </Link>
        </div>

        {/* Clinical Task Sheet (Next 4 Hours) */}
        {globalTasks.length > 0 && (role === 'nurse' || role === 'staff') && (
          <div className="mb-12 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                Nursing Task Sheet <span className="bg-red-600 text-white text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-black">Next 4 Hours</span>
              </h3>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Aggregate Care Plan</span>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-800/50">
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[.25em] text-zinc-400">Due Time</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[.25em] text-zinc-400">Patient</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[.25em] text-zinc-400">Task</th>
                      <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[.25em] text-zinc-400">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {globalTasks.map((task, tidx) => {
                      const taskTime = new Date(task.time);
                      const isVerySoon = taskTime.getTime() < (Date.now() + 30 * 60 * 1000);
                      return (
                        <tr key={tidx} className={`group transition-colors ${isVerySoon ? 'bg-red-50/50 dark:bg-red-500/5' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'}`}>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <span className="text-2xl">{task.icon}</span>
                              <div>
                                <p className={`text-base font-black ${isVerySoon ? 'text-red-600 animate-pulse' : 'text-zinc-900 dark:text-white'}`}>
                                  {taskTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                                </p>
                                {isVerySoon && <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mt-0.5">Due Soon</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">{task.patient_name}</p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest italic">Ward Activity</p>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{task.label}</p>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <Link
                              href={`/patients/${task.patient_id}/profile`}
                              className="text-[10px] font-black uppercase tracking-widest bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-2xl transition-all shadow-lg active:scale-95 inline-block"
                            >
                              Open Profile
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Patients Overview */}
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Patient Roster</h3>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
          {loading ? (
             <div className="p-8 flex items-center justify-center text-zinc-500">
               <div className="w-8 h-8 border-4 border-zinc-200 dark:border-zinc-700 border-t-orange-500 rounded-full animate-spin"></div>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800">
               {patients.map((p) => (
                 <div key={p.id} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-300">
                           {p.name.charAt(0)}
                         </div>
                         <div>
                            <h4 className="font-bold text-zinc-900 dark:text-white">{p.name}</h4>
                            <p className="text-xs text-zinc-500">ID: #{p.id}</p>
                         </div>
                       </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link href={`/patients/${p.id}/profile`} className="flex-1 py-2 text-center text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-lg transition-colors">Profile / Meds</Link>
                      <Link href={`/feeding?patient_id=${p.id}`} className="flex-1 py-2 text-center text-xs font-semibold bg-orange-50 hover:bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 dark:text-orange-400 rounded-lg transition-colors">Feed</Link>
                      <Link href={`/vitals?patient_id=${p.id}`} className="flex-1 py-2 text-center text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-lg transition-colors">Vitals</Link>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
