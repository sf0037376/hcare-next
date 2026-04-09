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
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-7xl mx-auto pb-40 px-4 lg:px-6 transition-all">
        {Toast}
        
        {/* Institutional Command Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 py-8 relative">
          <div className="space-y-2">
            <h2 className="text-5xl md:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic leading-none premium-text-gradient">Clinical_Oversight</h2>
            <div className="flex items-center gap-4">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50"></span>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] font-mono italic">Sector_Status: Diagnostic_Awareness_Active</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-4 px-8 py-5 rounded-[2.5rem] border transition-all duration-700 shadow-2xl relative overflow-hidden group/status ${
                activityStatus === 'EMERGENCY' ? 'bg-red-600 border-red-500 shadow-red-500/40 animate-pulse' : 'glass-card border-white/5'
            }`}>
                 <span className={`w-3 h-3 rounded-full relative z-10 ${
                    activityStatus === 'AVAILABLE' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]' :
                    activityStatus === 'EMERGENCY' ? 'bg-white shadow-[0_0_20px_rgba(255,255,255,1)]' :
                    'bg-zinc-400'
                }`}></span>
                <select 
                    value={activityStatus}
                    onChange={e => updateActivity(e.target.value)}
                    className={`bg-transparent text-[10px] font-black uppercase tracking-[0.3em] outline-none cursor-pointer appearance-none relative z-10 font-mono ${
                        activityStatus === 'EMERGENCY' ? 'text-white' : 'text-zinc-600 dark:text-zinc-200'
                    }`}
                >
                    <option value="AVAILABLE" className="dark:bg-zinc-900">NODE_STATUS: ACTIVE</option>
                    <option value="ON_ROUNDS" className="dark:bg-zinc-900">SECTOR_ROUNDS</option>
                    <option value="IN_SURGERY" className="dark:bg-zinc-900">SURGICAL_LOCKED</option>
                    <option value="EMERGENCY" className="dark:bg-zinc-900">⚠️ CRITICAL_MODE</option>
                    <option value="OFF_DUTY" className="dark:bg-zinc-900">NODE_OFFLINE</option>
                </select>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-2xl -mr-16 -mt-16 transition-all duration-1000 group-hover/status:bg-white/10"></div>
            </div>
            <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-3xl shadow-2xl transition-all duration-700 hover:rotate-12 hover:scale-110">👨‍⚕️</div>
          </div>
        </div>

        {/* Tactical Officer HUD */}
        <div className="bg-zinc-950 dark:bg-white rounded-[5rem] p-12 md:p-20 text-white dark:text-zinc-900 shadow-2xl mb-16 relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 p-24 opacity-[0.05] grayscale -rotate-12 scale-150 select-none pointer-events-none group-hover:rotate-0 transition-transform duration-1000">🩺</div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
                <h3 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-none premium-text-gradient">
                    Officer_Log <br/> 
                    <span className="text-zinc-400 dark:text-zinc-500">Dr. {typeof window !== "undefined" ? localStorage.getItem("username") || "Physician" : ""}</span>
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-xl font-black leading-tight max-w-xl lowercase italic tracking-tighter">
                    Institutional stability verified across {patients.length} assigned clinical nodes. Critical telemetry monitoring active.
                </p>
                <div className="flex flex-wrap gap-8 pt-4">
                    <div className="glass-card !bg-white/5 dark:!bg-zinc-950/5 border-white/5 px-10 py-6 rounded-[2.5rem] shadow-2xl">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-500 mb-2 italic">Active_Census</p>
                        <p className="text-4xl font-black italic tracking-tighter leading-none">{patients.length}</p>
                    </div>
                    <div className="glass-card !bg-white/5 dark:!bg-zinc-950/5 border-white/5 px-10 py-6 rounded-[2.5rem] shadow-2xl">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-red-500 mb-2 italic">Impending_Alerts</p>
                        <p className="text-4xl font-black italic tracking-tighter leading-none">{meds.filter(m => m.next_due && new Date(m.next_due) < new Date()).length}</p>
                    </div>
                </div>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-8">
                <Link href="/patients" className="glass-card !bg-white/5 dark:!bg-zinc-950/5 border-white/5 p-12 rounded-[3.5rem] hover:bg-white/10 dark:hover:bg-zinc-950/10 transition-all duration-700 group/card shadow-2xl active:scale-95">
                    <span className="text-5xl block mb-10 transition-all duration-700 group-hover/card:scale-125 group-hover/card:rotate-12">🛏️</span>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-2 italic">Sector_Registry</p>
                    <p className="text-2xl font-black italic tracking-tighter leading-none">ALL_NODES →</p>
                </Link>
                <Link href="/medication" className="glass-card !bg-white/5 dark:!bg-zinc-950/5 border-white/5 p-12 rounded-[3.5rem] hover:bg-white/10 dark:hover:bg-zinc-950/10 transition-all duration-700 group/card shadow-2xl active:scale-95">
                    <span className="text-5xl block mb-10 transition-all duration-700 group-hover/card:scale-125 group-hover/card:-rotate-12">💊</span>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-2 italic">Pharma_Protocol</p>
                    <p className="text-2xl font-black italic tracking-tighter leading-none">PRESCRIBE →</p>
                </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Active Sector Registry */}
          <div className="lg:col-span-8 space-y-12">
            <div className="flex items-center justify-between px-4 font-mono">
                <div className="space-y-1">
                   <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter italic uppercase underline decoration-blue-600/30 decoration-4 underline-offset-8">Operational_Census</h3>
                   <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] italic pt-2">Institutional monitoring sequence</p>
                </div>
                <Link href="/patients" className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 hover:scale-105 transition-all">Registry_Override →</Link>
            </div>

            <div className="glass-card rounded-[4rem] overflow-hidden border-white/5 shadow-2xl">
                <table className="clinical-table">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-white/5">
                        <th className="pl-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Node_Identity</th>
                        <th className="hidden md:table-cell py-10 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Care_Vector</th>
                        <th className="py-10 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Telemetry_Stability</th>
                        <th className="pr-12 text-right py-10 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Access_Key</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/5 font-mono">
                        {loading ? (
                             <tr><td colSpan="4" className="py-24 text-center text-zinc-400 uppercase text-[10px] font-black tracking-[0.8em] animate-pulse italic">Initializing_Clinical_Sync...</td></tr>
                        ) : patients.length > 0 ? (
                            patients.slice(0, 6).map(p => (
                                <tr key={p.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all duration-700 cursor-pointer" onClick={() => window.location.href = `/patients/${p.id}/profile`}>
                                    <td className="pl-12 py-10">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center text-2xl font-black shadow-2xl transition-all duration-700 group-hover:rotate-12 group-hover:scale-110">
                                                {p.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter italic uppercase leading-none">{p.name}</h4>
                                                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.4em] mt-3 opacity-60">Node_ID: NC-PR-{p.id.toString().padStart(4, '0')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden md:table-cell py-10">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] italic">Directive_Type</span>
                                            <span className="text-[12px] font-black text-zinc-600 dark:text-zinc-400 italic">"Intensive_Clinical_Locked"</span>
                                        </div>
                                    </td>
                                    <td className="py-10">
                                        <div className="flex items-center gap-3">
                                            <span className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                                            </span>
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic leading-none">Status: Nominal</span>
                                        </div>
                                    </td>
                                    <td className="pr-12 py-10 text-right">
                                        <Link href={`/patients/${p.id}/profile`} className="inline-block px-8 py-4 rounded-[1.5rem] bg-zinc-950 dark:bg-white text-[9px] font-black uppercase tracking-[0.4em] text-white dark:text-zinc-900 shadow-2xl active:scale-95 hover:scale-105 transition-all duration-500">Vault_Entry →</Link>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="4" className="py-32 text-center opacity-30 text-zinc-500 uppercase text-[10px] font-black tracking-[0.5em] italic">No_Registry_Artifacts_Detected</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>

          {/* Tactical Logistics Grid */}
          <div className="lg:col-span-4 space-y-12">
            <div className="px-4 font-mono">
                <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter italic uppercase underline decoration-blue-600/30 decoration-4 underline-offset-8">Tactical_Forecast</h3>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] italic pt-2">Care_Sequence: T_Delta_Next_4H</p>
            </div>

            <div className="glass-card rounded-[4rem] p-12 shadow-2xl border-white/5 relative overflow-hidden group/forecast">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 blur-[100px] -mr-24 -mt-24 rounded-full transition-all duration-1000 group-hover/forecast:bg-blue-600/10"></div>
                <div className="space-y-12 relative z-10 font-mono">
                    {(() => {
                        const now = new Date();
                        const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
                        const schedule = meds
                            .filter(m => m.next_due)
                            .map(m => ({ ...m, dueTime: new Date(m.next_due) }))
                            .filter(m => m.dueTime >= now && m.dueTime <= fourHoursFromNow)
                            .sort((a,b) => a.dueTime - b.dueTime);

                        if (schedule.length === 0) return (
                            <div className="py-16 text-center opacity-40 group-hover/forecast:opacity-100 transition-opacity duration-1000">
                                <span className="text-7xl block mb-10 grayscale group-hover/forecast:grayscale-0 transition-all duration-1000 rotate-12">🌙</span>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] italic">Zero_Events_Forecasted</p>
                            </div>
                        );

                        return schedule.slice(0, 5).map((task, idx) => (
                            <div key={idx} className="flex gap-8 group/task">
                                <div className="flex flex-col items-center">
                                    <div className="w-14 h-14 rounded-[1.5rem] bg-zinc-50 dark:bg-white/5 flex items-center justify-center text-3xl grayscale group-hover/task:grayscale-0 group-hover/task:rotate-12 transition-all duration-700 shadow-lg border border-white/5 relative overflow-hidden">
                                        <span className="relative z-10">💊</span>
                                        <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover/task:opacity-100 transition-opacity"></div>
                                    </div>
                                    {idx !== schedule.slice(0, 5).length - 1 && <div className="w-0.5 flex-1 bg-zinc-100 dark:bg-white/5 my-4"></div>}
                                </div>
                                <div className="pb-4 pt-1">
                                    <p className="text-xl font-black text-zinc-900 dark:text-white group-hover/task:text-blue-600 transition-colors uppercase tracking-tighter italic leading-none">{task.medicine}</p>
                                    <div className="flex items-center gap-3 mt-4">
                                      <span className="bg-zinc-100 dark:bg-white/5 px-3 py-1 rounded-lg text-[9px] font-black text-zinc-500 uppercase tracking-widest border border-white/5">T_DUE: {task.dueTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}_HRS</span>
                                    </div>
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            </div>

            {/* Diagnostic Protocol Links */}
            <div className="grid grid-cols-1 gap-6">
                <Link href="/vitals" className="relative group transition-all duration-700 active:scale-95 shadow-2xl">
                  <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-[0.03] rounded-[3rem] transition-all duration-1000"></div>
                  <div className="relative p-10 glass-card rounded-[3.5rem] border-white/5 flex items-center justify-between group-hover:border-blue-600/30 transition-all duration-700 overflow-hidden">
                    <div className="flex items-center gap-8 relative z-10 font-mono">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600/10 flex items-center justify-center text-4xl grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110 group-hover:rotate-12 shadow-2xl shadow-blue-600/5">🩺</div>
                        <div>
                            <p className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic leading-none">Biometric_Sync</p>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em] mt-3 italic">Capture_Diagnostic_Stream</p>
                        </div>
                    </div>
                    <span className="text-3xl text-zinc-300 dark:text-zinc-600 group-hover:translate-x-3 transition-all duration-700 relative z-10 italic">→</span>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[80px] -mr-16 -mt-16 rounded-full group-hover:bg-blue-600/10 transition-all duration-1000"></div>
                  </div>
                </Link>

                <Link href="/notifications" className="relative group transition-all duration-700 active:scale-95 shadow-2xl">
                  <div className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-[0.03] rounded-[3rem] transition-all duration-1000"></div>
                  <div className="relative p-10 glass-card rounded-[3.5rem] border-white/5 flex items-center justify-between group-hover:border-red-600/30 transition-all duration-700 overflow-hidden">
                    <div className="flex items-center gap-8 relative z-10 font-mono">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-red-600/10 flex items-center justify-center text-4xl grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110 group-hover:-rotate-12 shadow-2xl shadow-red-600/5">📣</div>
                        <div>
                            <p className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic leading-none">Alert_Sequence</p>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em] mt-3 italic">Broadcast_Institutional_Alert</p>
                        </div>
                    </div>
                    <span className="text-3xl text-zinc-300 dark:text-zinc-600 group-hover:translate-x-3 transition-all duration-700 relative z-10 italic">→</span>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-[80px] -mr-16 -mt-16 rounded-full group-hover:bg-red-600/10 transition-all duration-1000"></div>
                  </div>
                </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
