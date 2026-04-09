"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"

export default function UsersPage() {
  const { Toast, show } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadUsers() {
    try {
      const data = await apiFetch("/users")
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {
      show("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function createUser(e) {
    e.preventDefault()
    const body = {
      username: e.target.username.value,
      password: e.target.password.value,
      role: e.target.role.value,
    }

    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify(body),
      })
      show("User created")
      e.target.reset()
      loadUsers()
    } catch (e) {
      show("Failed to create user")
    }
  }

  return (
    <ProtectedRoute>
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-[1600px] mx-auto pb-40 px-4 lg:px-8 transition-all">
        {Toast}
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20 py-8 relative">
          <div className="space-y-4">
            <h2 className="text-6xl md:text-8xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic leading-none premium-text-gradient">Identity_Nexus</h2>
            <div className="flex items-center gap-6">
              <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse shadow-lg shadow-blue-600/50"></span>
              <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.5em] font-mono italic">Sector_Status: Security_Sync_Active</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 px-10 py-6 rounded-[3rem] glass-card border-white/5 shadow-2xl relative overflow-hidden group/status">
               <span className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)] relative z-10"></span>
               <span className="text-[11px] font-black uppercase tracking-[0.5em] font-mono text-zinc-600 dark:text-zinc-200 relative z-10 italic">Auth_Link: Nominal</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 font-mono">
          {/* Create User Operational Form */}
          <div className="xl:col-span-4">
            <div className="glass-card rounded-[5rem] p-12 md:p-16 shadow-2xl border border-white/5 relative overflow-hidden group/provision sticky top-28">
              <div className="absolute top-0 right-0 p-20 opacity-[0.03] grayscale -rotate-12 scale-150 select-none pointer-events-none group-hover/provision:rotate-0 transition-transform duration-1000">🔑</div>
              
              <div className="relative z-10 mb-12 space-y-4">
                  <h3 className="text-3xl font-black tracking-tighter uppercase premium-text-gradient italic leading-none">Provisioning</h3>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] italic leading-none">Initialize_New_Clinical_Credentials</p>
              </div>
              
              <form onSubmit={createUser} className="relative z-10 space-y-12">
                <div className="space-y-10">
                    <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-[0.6em] text-zinc-400 block ml-6 italic">Identity_Alias</label>
                        <input
                            className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2.5rem] px-10 py-8 text-2xl font-black italic tracking-tighter focus:ring-4 ring-blue-500/10 transition-all placeholder:text-zinc-500/20"
                            name="username"
                            placeholder="UNIQUE_IDENTIFIER..."
                            required
                        />
                    </div>
                    
                    <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-[0.6em] text-zinc-400 block ml-6 italic">Access_Cipher</label>
                        <input
                            className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2.5rem] px-10 py-8 text-2xl font-black italic tracking-tighter focus:ring-4 ring-blue-500/10 transition-all placeholder:text-zinc-500/20"
                            name="password"
                            type="password"
                            placeholder="••••••••••••"
                            required
                        />
                    </div>
                    
                    <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-[0.6em] text-zinc-400 block ml-6 italic">Clearance_Level</label>
                        <div className="relative group/role">
                            <select
                                className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2.5rem] px-10 py-8 text-[12px] font-black uppercase tracking-[0.4em] focus:ring-4 ring-blue-500/10 transition-all appearance-none cursor-pointer italic pr-20"
                                name="role"
                                defaultValue="nurse"
                            >
                                <option value="admin">Institutional Administrator</option>
                                <option value="nurse">Clinical Nurse Resident</option>
                                <option value="doctor">Medical Practitioner (MD)</option>
                                <option value="pharmacist">Pharmacy Logistics Officer</option>
                            </select>
                            <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover/role:opacity-100 group-hover/role:text-blue-500 transition-all italic text-[12px]">▼</div>
                        </div>
                    </div>
                </div>
                
                <div className="pt-8">
                  <button 
                    type="submit"
                    className="w-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 py-10 rounded-[3rem] text-[12px] font-black uppercase tracking-[0.8em] shadow-[0_45px_100px_-15px_rgba(0,0,0,0.4)] active:scale-95 hover:scale-[1.01] transition-all duration-700 italic flex items-center justify-center relative overflow-hidden group/btn"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                    AUTHORIZE_ACCOUNT
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Institutional User Registry */}
          <div className="xl:col-span-8">
            <div className="glass-card rounded-[5rem] overflow-hidden border border-white/5 shadow-2xl relative">
                <div className="p-16 bg-zinc-50 dark:bg-white/5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between gap-8">
                    <div className="space-y-2">
                        <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic leading-none">Staff_Directory</h3>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] italic leading-none">Institutional_Personnel_Archive</p>
                    </div>
                    <div className="flex -space-x-4">
                        {users.slice(0, 5).map((u, i) => (
                          <div key={i} className="w-12 h-12 rounded-full border-4 border-white dark:border-zinc-900 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center text-[10px] font-black ring-4 ring-transparent hover:ring-blue-500/20 transition-all cursor-pointer shadow-xl">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                        ))}
                    </div>
                </div>
              
              {loading ? (
                <div className="py-60 flex flex-col items-center justify-center text-zinc-400">
                  <div className="w-16 h-16 border-4 border-zinc-100 dark:border-white/5 border-t-blue-600 rounded-full animate-spin mb-8 shadow-2xl"></div>
                  <p className="text-[11px] font-black uppercase tracking-[0.8em] italic animate-pulse">SYNCHRONIZING_SECURE_DIRECTORY...</p>
                </div>
              ) : (
                <div className="overflow-x-auto font-mono">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-white/5">
                        <th className="px-16 py-10 text-[11px] font-black text-zinc-400 uppercase tracking-[0.6em] italic">Identity_Signature</th>
                        <th className="px-8 py-10 text-[11px] font-black text-zinc-400 uppercase tracking-[0.6em] italic hidden lg:table-cell text-center">Authorization_Protocol</th>
                        <th className="px-16 py-10 text-[11px] font-black text-zinc-400 uppercase tracking-[0.6em] italic text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                      {users.map((u) => (
                        <tr key={u.id} className="group hover:bg-blue-500/5 transition-all duration-700">
                          <td className="px-16 py-12">
                            <div className="flex items-center gap-8">
                                <div className="w-20 h-20 rounded-[2rem] bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center text-3xl font-black shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-700 italic border border-white/10">
                                  {u.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter italic uppercase group-hover:text-blue-500 transition-colors">{u.username}</h4>
                                  <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.4em] italic">UUID#NC-{u.id.toString().padStart(5, '0')}</p>
                                </div>
                            </div>
                          </td>
                          <td className="px-8 py-12 hidden lg:table-cell">
                             <div className="flex justify-center">
                                <span className={`text-[9px] font-black px-6 py-3 rounded-2xl border-2 uppercase tracking-[0.4em] italic shadow-2xl transition-all duration-700 group-hover:scale-110 ${
                                    u.role === 'admin' ? 'bg-purple-600/10 text-purple-600 border-purple-600/20' :
                                    u.role === 'doctor' ? 'bg-blue-600/10 text-blue-600 border-blue-600/20' :
                                    u.role === 'pharmacist' ? 'bg-amber-600/10 text-amber-600 border-amber-600/20' :
                                    'bg-emerald-600/10 text-emerald-600 border-emerald-600/20'
                                }`}>
                                    {u.role.toUpperCase()}
                                </span>
                             </div>
                          </td>
                          <td className="px-16 py-12 text-right">
                             <div className="flex items-center justify-end gap-6 px-8 py-4 rounded-[2.5rem] bg-zinc-100 dark:bg-white/5 border border-white/5 w-fit ml-auto shadow-xl group/badge">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 dark:text-zinc-300 italic group-hover/badge:tracking-[0.6em] transition-all duration-700">{u.status || 'Verified_Active'}</span>
                             </div>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan="3" className="py-60 text-center opacity-20 text-zinc-500 uppercase text-[12px] font-black tracking-[1em] italic">REGISTRY_BUFFER_EMPTY</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

