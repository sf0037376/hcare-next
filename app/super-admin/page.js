"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"
import Link from "next/link"

const SUPER_ADMIN_PIN = "0000"

export default function SuperAdminDashboard() {
  const { Toast, show } = useToast()
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddOrg, setShowAddOrg] = useState(false)
  const [pinVerified, setPinVerified] = useState(false)
  const [pinInput, setPinInput] = useState("")
  const [pinError, setPinError] = useState("")
  const [newOrg, setNewOrg] = useState({
    name: "",
    currency: "INR",
    organisation_type: "HOSPITAL",
    license_expiry: "",
    max_users: 10
  })

  useEffect(() => {
    if (pinVerified) loadOrgs()
  }, [pinVerified])

  function handlePinSubmit(e) {
    e.preventDefault()
    if (pinInput === SUPER_ADMIN_PIN) {
      setPinVerified(true)
      setPinError("")
    } else {
      setPinError("Incorrect PIN. Try again.")
      setPinInput("")
    }
  }

  async function loadOrgs() {
    try {
      const data = await apiFetch("/organisations")
      setOrgs(Array.isArray(data) ? data : [])
    } catch (err) {
      show("Failed to load organizations")
    } finally {
      setLoading(false)
    }
  }

  async function handleAddOrg(e) {
    e.preventDefault()
    try {
      await apiFetch("/organisations", {
        method: "POST",
        body: JSON.stringify(newOrg)
      })
      show("Organization added successfully")
      setShowAddOrg(false)
      loadOrgs()
    } catch (err) {
      show("Failed to add organization")
    }
  }

  // PIN Gate
  if (!pinVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="bg-zinc-900 border border-zinc-800 rounded-[40px] p-12 w-full max-w-sm text-center shadow-2xl">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-lg shadow-blue-500/30">
            🔒
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Super Admin Access</h2>
          <p className="text-zinc-400 text-sm mb-8">Enter your 4-digit PIN to continue</p>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              placeholder="••••"
              className="w-full text-center text-3xl tracking-[1rem] bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {pinError && <p className="text-red-400 text-sm">{pinError}</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-colors">
              Unlock
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN"]}>
      <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
        {Toast}
        
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Super Admin Console</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Global multi-tenant management and hospitality licensing.</p>
          </div>
          <button 
            onClick={() => setShowAddOrg(true)}
            className="btn-primary flex items-center gap-2 group"
          >
            <span className="group-hover:rotate-90 transition-transform">➕</span>
            Add New Hospital
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-blue-600 rounded-[32px] p-8 text-white shadow-xl shadow-blue-500/20">
            <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-2">Total Organizations</p>
            <h3 className="text-5xl font-black">{orgs.length}</h3>
          </div>
          <div className="bg-zinc-900 dark:bg-zinc-800 rounded-[32px] p-8 text-white shadow-xl">
            <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-2">Active Licenses</p>
            <h3 className="text-5xl font-black">{orgs.filter(o => o.status === 'ACTIVE').length}</h3>
          </div>
          <div className="bg-emerald-500 rounded-[32px] p-8 text-white shadow-xl shadow-emerald-500/20">
            <p className="text-emerald-100 text-sm font-bold uppercase tracking-widest mb-2">Global Revenue</p>
            <h3 className="text-5xl font-black">₹ 12.4L</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
            <h3 className="text-xl font-bold">Hospital Network</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-8 py-5">Organization Name</th>
                  <th className="px-8 py-5">Type</th>
                  <th className="px-8 py-5">License Expiry</th>
                  <th className="px-8 py-5">Max Users</th>
                  <th className="px-8 py-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                {orgs.map(org => (
                  <tr key={org.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600">
                          {org.name?.[0]}
                        </div>
                        <span className="font-bold text-zinc-900 dark:text-white">{org.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold uppercase">
                        {org.organisation_type}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm text-zinc-500">
                      {org.license_expiry ? new Date(org.license_expiry).toLocaleDateString() : 'Lifetime'}
                    </td>
                    <td className="px-8 py-6 font-mono text-zinc-600 dark:text-zinc-400">
                      {org.max_users} Slots
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        org.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {org.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Org Modal */}
        {showAddOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[40px] p-10 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">Register New Hospital</h3>
                <button onClick={() => setShowAddOrg(false)} className="text-zinc-400 hover:text-zinc-600 text-2xl">&times;</button>
              </div>
              <form onSubmit={handleAddOrg} className="space-y-5">
                <div>
                  <label className="form-label text-xs uppercase tracking-widest font-black text-zinc-400">Hospital Name</label>
                  <input 
                    className="form-input !py-4" 
                    placeholder="e.g. City General Hospital"
                    value={newOrg.name}
                    onChange={e => setNewOrg({...newOrg, name: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label text-xs uppercase tracking-widest font-black text-zinc-400">Type</label>
                    <select 
                      className="form-input !py-4"
                      value={newOrg.organisation_type}
                      onChange={e => setNewOrg({...newOrg, organisation_type: e.target.value})}
                    >
                      <option value="HOSPITAL">Hospital</option>
                      <option value="CLINIC">Clinic</option>
                      <option value="PHARMACY">Pharmacy</option>
                      <option value="HOME_CARE">Home Care</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label text-xs uppercase tracking-widest font-black text-zinc-400">License Expiry</label>
                    <input 
                      type="date"
                      className="form-input !py-4"
                      value={newOrg.license_expiry}
                      onChange={e => setNewOrg({...newOrg, license_expiry: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label text-xs uppercase tracking-widest font-black text-zinc-400">User Limit (Slots)</label>
                  <input 
                    type="number"
                    className="form-input !py-4"
                    value={newOrg.max_users}
                    onChange={e => setNewOrg({...newOrg, max_users: parseInt(e.target.value) || 10})}
                    required
                  />
                </div>
                <button type="submit" className="w-full btn-primary !py-5 text-lg font-bold shadow-blue-500/30">
                  Onboard Organization
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
