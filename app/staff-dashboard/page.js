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
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-7xl mx-auto pb-40 px-4 lg:px-6 transition-all">
        {Toast}
        
        {/* Institutional Command Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 py-8 relative">
          <div className="space-y-2">
            <h2 className="text-5xl md:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic leading-none premium-text-gradient">Operations_Nexus</h2>
            <div className="flex items-center gap-4">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50"></span>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] font-mono italic">Sector_Status: Duty_Cycle_Active</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 px-8 py-5 rounded-[2.5rem] glass-card border-white/5 shadow-2xl relative overflow-hidden group/status">
                 <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] relative z-10"></span>
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono text-zinc-600 dark:text-zinc-200 relative z-10">AUTH_LEVEL: {role.toUpperCase()}</span>
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-2xl -mr-16 -mt-16 transition-all duration-1000 group-hover/status:bg-white/10"></div>
            </div>
            <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-3xl shadow-2xl transition-all duration-700 hover:rotate-12 hover:scale-110">👩‍⚕️</div>
          </div>
        </div>

        {/* Tactical Personnel HUD */}
        <div className="bg-zinc-950 dark:bg-white rounded-[5rem] p-12 md:p-20 text-white dark:text-zinc-900 shadow-2xl mb-16 relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 p-24 opacity-[0.05] grayscale -rotate-12 scale-150 select-none pointer-events-none group-hover:rotate-0 transition-transform duration-1000">🧬</div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-16">
            <div className="space-y-10 max-w-3xl">
                <div className="flex items-center gap-4">
                    <span className="bg-blue-600/20 dark:bg-blue-600/10 px-6 py-2 rounded-xl text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] font-mono border border-blue-500/20">SHIFT_ID: NC-ST-{Math.floor(Math.random() * 9000) + 1000}</span>
                </div>
                <h3 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-none premium-text-gradient">
                    Identity: <br/> 
                    <span className="text-zinc-400 dark:text-zinc-500">{displayName.toLowerCase()}</span>
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-xl font-black leading-tight lowercase italic tracking-tighter max-w-xl">
                    Deployment active for <span className="text-blue-500 italic underline decoration-blue-500/30 underline-offset-8 decoration-4">{patients.length} assigned_nodes</span>. Maintain clinical surveillance protocol.
                </p>
            </div>
            <div className="flex flex-col items-center justify-center p-12 bg-white/5 dark:bg-zinc-950/5 rounded-[4rem] border border-white/5 shadow-2xl group-hover:scale-105 transition-transform duration-700">
                <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.4em] mb-4 italic font-mono">Vigilance_Score</span>
                <span className="text-7xl font-black italic tracking-tighter leading-none premium-text-gradient font-mono">98.4%</span>
            </div>
          </div>
        </div>

        {/* Tactical Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-20 font-mono">
          <Link href="/feeding" className="relative group transition-all duration-700 active:scale-95 shadow-2xl">
            <div className="absolute inset-0 bg-orange-600 opacity-0 group-hover:opacity-[0.03] rounded-[3.5rem] transition-all duration-1000"></div>
            <div className="relative p-12 glass-card rounded-[4rem] border-white/5 flex flex-col items-center text-center group-hover:border-orange-600/30 transition-all duration-700 overflow-hidden">
                <div className="w-24 h-24 rounded-[2rem] bg-orange-600/10 flex items-center justify-center text-5xl mb-10 transition-all duration-700 group-hover:scale-125 group-hover:rotate-12 shadow-2xl shadow-orange-600/5">🍼</div>
                <h4 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter italic uppercase underline decoration-orange-600/30 decoration-4 underline-offset-8">Nutritional_Log</h4>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mt-10 opacity-60">Deployment: EBM_PHASE</p>
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 blur-[80px] -mr-16 -mt-16 rounded-full group-hover:bg-orange-600/10 transition-all duration-1000"></div>
            </div>
          </Link>

          <Link href="/vitals" className="relative group transition-all duration-700 active:scale-95 shadow-2xl">
            <div className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-[0.03] rounded-[3.5rem] transition-all duration-1000"></div>
            <div className="relative p-12 glass-card rounded-[4rem] border-white/5 flex flex-col items-center text-center group-hover:border-red-600/30 transition-all duration-700 overflow-hidden">
                <div className="w-24 h-24 rounded-[2rem] bg-red-600/10 flex items-center justify-center text-5xl mb-10 transition-all duration-700 group-hover:scale-125 group-hover:-rotate-12 shadow-2xl shadow-red-600/5">❤️</div>
                <h4 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter italic uppercase underline decoration-red-600/30 decoration-4 underline-offset-8">Telemetry_Cap</h4>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mt-10 opacity-60">Stream: Biometric_Active</p>
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-[80px] -mr-16 -mt-16 rounded-full group-hover:bg-red-600/10 transition-all duration-1000"></div>
            </div>
          </Link>

          <Link href="/availability" className="relative group transition-all duration-700 active:scale-95 shadow-2xl">
            <div className="absolute inset-0 bg-purple-600 opacity-0 group-hover:opacity-[0.03] rounded-[3.5rem] transition-all duration-1000"></div>
            <div className="relative p-12 glass-card rounded-[4rem] border-white/5 flex flex-col items-center text-center group-hover:border-purple-600/30 transition-all duration-700 overflow-hidden">
                <div className="w-24 h-24 rounded-[2rem] bg-purple-600/10 flex items-center justify-center text-5xl mb-10 transition-all duration-700 group-hover:scale-125 group-hover:rotate-12 shadow-2xl shadow-purple-600/5">⏰</div>
                <h4 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter italic uppercase underline decoration-purple-600/30 decoration-4 underline-offset-8">Roster_Sync</h4>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mt-10 opacity-60">Cycle: Shift_Deployment</p>
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-[80px] -mr-16 -mt-16 rounded-full group-hover:bg-purple-600/10 transition-all duration-1000"></div>
            </div>
          </Link>
        </div>

        {/* Tactical Care Sequence Sheet */}
        {globalTasks.length > 0 && (role === 'nurse' || role === 'staff') && (
          <div className="mb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 px-6 font-mono">
              <div className="space-y-1">
                  <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter italic uppercase underline decoration-blue-600/30 decoration-4 underline-offset-8 leading-none">Nursing_Sequence_Sheet</h3>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] italic pt-4">Consolidated Care Protocol Forecast [4-Hour Window]</p>
              </div>
              <div className="px-8 py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-[1.5rem] shadow-2xl shadow-red-600/20 animate-pulse italic">Critical_Path_Initiated</div>
            </div>
            
            <div className="glass-card rounded-[4rem] overflow-hidden border-white/5 shadow-2xl">
              <div className="overflow-x-auto">
                <table className="clinical-table">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-white/5">
                      <th className="pl-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">T_Capture</th>
                      <th className="py-10 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Node_Identity</th>
                      <th className="py-10 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Care_Directive</th>
                      <th className="pr-12 text-right py-10 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Sector_Sync</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/5 font-mono">
                    {globalTasks.map((task, tidx) => {
                      const taskTime = new Date(task.time);
                      const isVerySoon = taskTime.getTime() < (Date.now() + 30 * 60 * 1000);
                      return (
                        <tr key={tidx} className={`group transition-all duration-700 ${isVerySoon ? 'bg-red-500/[0.04] dark:bg-red-500/10' : 'hover:bg-zinc-50 dark:hover:bg-white/5'}`}>
                          <td className="pl-12 py-10 whitespace-nowrap">
                            <div className="flex items-center gap-8">
                              <span className="text-4xl grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-125 group-hover:rotate-12">{task.icon}</span>
                              <div>
                                <p className={`text-2xl font-black italic tracking-tighter leading-none ${isVerySoon ? 'text-red-500 animate-pulse' : 'text-zinc-900 dark:text-white'}`}>
                                  {taskTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}_HRS
                                </p>
                                {isVerySoon && <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mt-3 italic">IMPENDING_ALERT</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-10">
                            <h4 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic leading-none">{task.patient_name}</h4>
                            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.4em] mt-4 italic opacity-60">Node_ID: #NC-{task.patient_id.toString().padStart(4, '0')}</p>
                          </td>
                          <td className="py-10">
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 dark:text-zinc-400 px-6 py-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-white/5 italic">
                                {task.label.toUpperCase()}
                            </span>
                          </td>
                          <td className="pr-12 py-10 text-right">
                            <Link
                              href={`/patients/${task.patient_id}/profile`}
                              className="px-8 py-4 bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-black uppercase tracking-[0.4em] rounded-[1.5rem] shadow-2xl hover:scale-105 active:scale-95 transition-all duration-500 inline-block italic"
                            >
                              Dispatch_Node →
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

        {/* Sector Identity Matrix */}
        <div className="flex items-center justify-between mb-12 px-6 font-mono">
            <div className="space-y-1">
                <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic underline decoration-blue-600/30 decoration-4 underline-offset-8 leading-none">Sector_Identity_Matrix</h3>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] italic pt-4">Live institutional throughview of assigned neonates</p>
            </div>
        </div>

        <div className="glass-card rounded-[5rem] p-12 md:p-20 border-white/5 shadow-2xl relative overflow-hidden group/matrix">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[120px] -mr-32 -mt-32 rounded-full transition-all duration-1000 group-hover/matrix:bg-blue-600/10"></div>
          {loading ? (
             <div className="py-48 flex flex-col items-center justify-center text-zinc-400 font-mono relative z-10">
               <div className="w-20 h-20 border-[6px] border-zinc-100 dark:border-white/5 border-t-blue-500 rounded-full animate-spin mb-10 shadow-2xl"></div>
               <p className="text-[12px] font-black uppercase tracking-[1em] italic animate-pulse">Synchronizing_Archive...</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12 relative z-10 font-mono">
               {patients.map((p) => (
                 <div key={p.id} className="glass-card p-10 rounded-[3.5rem] border-white/5 bg-zinc-50/50 dark:bg-white/5 hover:bg-white dark:hover:bg-zinc-800 transition-all duration-700 hover:shadow-2xl hover:-translate-y-2 group/card overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover/card:opacity-10 dark:text-white transition-opacity text-6xl italic -rotate-12">NC</div>
                    <div className="flex items-center justify-between mb-10">
                       <div className="flex items-center gap-6">
                         <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-2xl font-black shadow-2xl transition-all duration-700 group-hover/card:rotate-12 group-hover/card:scale-110">
                            {p.name.charAt(0).toUpperCase()}
                         </div>
                         <div>
                            <h4 className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic leading-none">{p.name}</h4>
                            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.4em] mt-3 italic opacity-60">UNIT::NC-{p.id.toString().padStart(4, '0')}</p>
                         </div>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <Link href={`/patients/${p.id}/profile`} className="flex flex-col items-center justify-center py-6 bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 rounded-[1.5rem] hover:scale-105 active:scale-95 transition-all duration-500 shadow-2xl group/btn">
                        <span className="text-2xl transition-transform group-hover/btn:-rotate-12">📄</span>
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] mt-3 italic">Vault_Entry</span>
                      </Link>
                      <Link href={`/feeding?patient_id=${p.id}`} className="flex flex-col items-center justify-center py-6 border-2 border-orange-600/20 text-orange-600 rounded-[1.5rem] hover:bg-orange-600/5 transition-all duration-500 hover:border-orange-600/40 group/btn">
                        <span className="text-2xl transition-transform group-hover/btn:rotate-12">🍼</span>
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] mt-3 italic">Nutrition</span>
                      </Link>
                      <Link href={`/vitals?patient_id=${p.id}`} className="flex flex-col items-center justify-center py-6 border-2 border-red-600/20 text-red-600 rounded-[1.5rem] hover:bg-red-600/5 transition-all duration-500 hover:border-red-600/40 group/btn">
                        <span className="text-2xl transition-transform group-hover/btn:-rotate-12">❤️</span>
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] mt-3 italic">Telemetry</span>
                      </Link>
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
