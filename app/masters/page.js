"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"
import Link from "next/link"

export default function MastersPage() {
  const { Toast, show } = useToast()
  const [activeTab, setActiveTab] = useState("pricing") // pricing | wards
  
  // Pricing State
  const [pricing, setPricing] = useState([])
  const [newPrice, setNewPrice] = useState({ service_name: "", base_charge: "", patient_type: "BOTH", category: "CONSULTATION" })
  
  // Wards State
  const [wards, setWards] = useState([])
  const [newWard, setNewWard] = useState({ name: "", type: "GENERAL" })
  const [selectedWard, setSelectedWard] = useState(null)
  const [beds, setBeds] = useState([])
  const [newBed, setNewBed] = useState({ bed_number: "", daily_charge: "" })

  useEffect(() => {
    loadPricing()
    loadWards()
  }, [])

  async function loadPricing() {
    try {
      const data = await apiFetch("/pricing")
      setPricing(data)
    } catch (err) { show("Failed to load pricing") }
  }

  async function loadWards() {
    try {
      const data = await apiFetch("/wards")
      setWards(data)
    } catch (err) { show("Failed to load wards") }
  }

  async function loadBeds(wardId) {
    try {
      const data = await apiFetch(`/wards/${wardId}/beds`)
      setBeds(data)
    } catch (err) { show("Failed to load beds") }
  }

  // PRICING HANDLERS
  async function handleAddPrice(e) {
    e.preventDefault()
    try {
      await apiFetch("/pricing", { method: "POST", body: JSON.stringify(newPrice) })
      show("Pricing added")
      setNewPrice({ service_name: "", base_charge: "", patient_type: "BOTH", category: "CONSULTATION" })
      loadPricing()
    } catch (err) { show("Error adding price") }
  }

  // WARD HANDLERS
  async function handleAddWard(e) {
    e.preventDefault()
    try {
      await apiFetch("/wards", { method: "POST", body: JSON.stringify(newWard) })
      show("Ward created")
      setNewWard({ name: "", type: "GENERAL" })
      loadWards()
    } catch (err) { show("Error adding ward") }
  }

  async function handleAddBed(e) {
    e.preventDefault()
    try {
      await apiFetch("/wards/beds", { 
        method: "POST", 
        body: JSON.stringify({ ...newBed, ward_id: selectedWard.id }) 
      })
      show("Bed added")
      setNewBed({ bed_number: "", daily_charge: "" })
      loadBeds(selectedWard.id)
    } catch (err) { show("Error adding bed") }
  }

  return (
    <ProtectedRoute roles={["admin"]}>
      <div className="animate-in fade-in duration-700 max-w-7xl mx-auto pb-safe px-4 lg:px-0">
        {Toast}
        
        <div className="page-header flex-row items-center">
            <div>
                <h2 className="page-title">hospital_masters</h2>
                <p className="page-subtitle">Configure clinical facilities, service rates, and institutional logistics.</p>
            </div>
            <div className="hidden md:flex items-center gap-3 px-6 py-2.5 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Master Data Sync Active</span>
            </div>
        </div>

        {/* Tactical Tab Switcher */}
        <div className="flex gap-2 p-2 bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800/60 rounded-[1.5rem] w-fit mb-12 shadow-2xl shadow-zinc-900/[0.02]">
          <button 
            onClick={() => setActiveTab("pricing")}
            className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === "pricing" ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 shadow-xl" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
          >
            💰 Pricing_Protocol
          </button>
          <button 
            onClick={() => setActiveTab("wards")}
            className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === "wards" ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 shadow-xl" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
          >
            🛌 Ward_Architecture
          </button>
        </div>

        {activeTab === "pricing" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Price Operational Form */}
            <div className="lg:col-span-4">
                <div className="glass-card rounded-[3rem] p-8 md:p-10 shadow-2xl shadow-zinc-900/[0.03] border-white/5 sticky top-28">
                    <div className="mb-10">
                        <h3 className="text-2xl font-black tracking-tight uppercase premium-text-gradient mb-1">Charge_Registration</h3>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Append new billable clinical protocols.</p>
                    </div>

                    <form onSubmit={handleAddPrice} className="space-y-8">
                        <div className="space-y-6">
                            <div>
                                <label className="form-label">protocol_service_name</label>
                                <input 
                                    className="form-input text-lg font-black" 
                                    placeholder="e.g. ICU Consultation" 
                                    value={newPrice.service_name} 
                                    onChange={e => setNewPrice({...newPrice, service_name: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">base_charge (₹)</label>
                                    <input 
                                        type="number" 
                                        className="form-input font-black" 
                                        placeholder="0.00" 
                                        value={newPrice.base_charge} 
                                        onChange={e => setNewPrice({...newPrice, base_charge: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="form-label">taxonomical_category</label>
                                    <select 
                                        className="form-input cursor-pointer" 
                                        value={newPrice.category} 
                                        onChange={e => setNewPrice({...newPrice, category: e.target.value})}
                                    >
                                        <option value="CONSULTATION">Consultation</option>
                                        <option value="ICU">ICU Charge</option>
                                        <option value="LAB">Lab Test</option>
                                        <option value="AMBULANCE">Ambulance</option>
                                        <option value="SURGERY">Surgery</option>
                                        <option value="EQUIPMENT">Medical Device</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="form-label">applicability_scope</label>
                                <select 
                                    className="form-input cursor-pointer" 
                                    value={newPrice.patient_type} 
                                    onChange={e => setNewPrice({...newPrice, patient_type: e.target.value})}
                                >
                                    <option value="BOTH">Universal (IP & OP)</option>
                                    <option value="IP">In-Patient Lockdown</option>
                                    <option value="OP">Out-Patient Terminal</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-4">
                            <button type="submit" className="w-full btn-primary py-6 bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-zinc-900/20 active:scale-[0.98] transition-all">Publish Protocol</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Price Registry Archive */}
            <div className="lg:col-span-8">
                <div className="glass-card rounded-[3.5rem] overflow-hidden border-white/5 shadow-2xl shadow-zinc-900/[0.02]">
                    <table className="clinical-table">
                        <thead>
                            <tr>
                                <th className="pl-10">Clinical Protocol</th>
                                <th>Biological Category</th>
                                <th>Accessibility</th>
                                <th className="pr-10 text-right">Unit Rate (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/30">
                            {pricing.map(p => (
                                <tr key={p.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all">
                                    <td className="pl-10 py-7">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-sm grayscale group-hover:grayscale-0 transition-all">📑</div>
                                            <span className="text-sm font-extrabold text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight">{p.service_name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="text-[10px] font-black px-4 py-2 bg-zinc-100/50 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 uppercase tracking-widest text-zinc-500">{p.category}</span>
                                    </td>
                                    <td>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${p.patient_type === 'BOTH' ? 'text-blue-500' : 'text-zinc-400'}`}>
                                            {p.patient_type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="pr-10 py-7 text-right">
                                        <span className="text-lg font-black font-mono text-zinc-900 dark:text-white tabular-nums tracking-tighter italic">
                                            ₹{parseFloat(p.base_charge).toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {pricing.length === 0 && (
                         <div className="py-32 flex flex-col items-center justify-center opacity-40">
                            <span className="text-8xl mb-6">📉</span>
                            <h3 className="text-xl font-black uppercase tracking-[0.2em] text-zinc-500">Pricing Oracle Empty</h3>
                            <p className="text-xs font-bold text-zinc-400 mt-2 italic">Standardize hospital charges to activate billing.</p>
                        </div>
                    )}
                </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Ward & Bed Operational Modules */}
            <div className="lg:col-span-4 space-y-10">
                {/* Create Ward Form */}
                <div className="glass-card rounded-[3rem] p-8 md:p-10 shadow-2xl shadow-zinc-900/[0.03] border-white/5">
                    <div className="mb-10">
                        <h3 className="text-2xl font-black tracking-tight uppercase premium-text-gradient mb-1">Ward_Genesis</h3>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Declare new clinical ward environment.</p>
                    </div>

                    <form onSubmit={handleAddWard} className="space-y-8">
                        <div className="space-y-6">
                            <div>
                                <label className="form-label">architectural_unit_name</label>
                                <input className="form-input text-lg font-black" placeholder="e.g. NICU Level III" value={newWard.name} onChange={e => setNewWard({...newWard, name: e.target.value})} required />
                            </div>
                            <div>
                                <label className="form-label">tactical_ward_type</label>
                                <select className="form-input cursor-pointer" value={newWard.type} onChange={e => setNewWard({...newWard, type: e.target.value})}>
                                    <option value="GENERAL">General Care Unit</option>
                                    <option value="ICU">Intensive Care (ICU)</option>
                                    <option value="PRIVATE">Premium Private Suite</option>
                                    <option value="EMERGENCY">Triage / Emergency</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-4">
                             <button type="submit" className="w-full btn-primary py-6 bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-zinc-900/20 active:scale-[0.98] transition-all">Commit Genesis</button>
                        </div>
                    </form>
                </div>

                {/* Ward Selection Archive */}
                <div className="glass-card rounded-[3.5rem] overflow-hidden border-white/5 shadow-2xl shadow-zinc-900/[0.02]">
                    <div className="p-8 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Global Facility Inventory</h4>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {wards.map(w => (
                            <button 
                                key={w.id} 
                                onClick={() => { setSelectedWard(w); loadBeds(w.id); }}
                                className={`w-full text-left px-10 py-8 transition-all flex items-center justify-between group relative overflow-hidden ${selectedWard?.id === w.id ? 'bg-blue-600' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                            >
                                <div className="relative z-10">
                                    <p className={`text-lg font-black tracking-tight ${selectedWard?.id === w.id ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>{w.name}</p>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${selectedWard?.id === w.id ? 'text-blue-100' : 'text-zinc-500'}`}>{w.type}</p>
                                </div>
                                <span className={`text-2xl relative z-10 transition-transform duration-500 ${selectedWard?.id === w.id ? 'text-white translate-x-1' : 'text-zinc-300 group-hover:translate-x-1'}`}>→</span>
                                {selectedWard?.id === w.id && <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-90"></div>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Precision Bed Configuration Terminal */}
            <div className="lg:col-span-8">
              {selectedWard ? (
                <div className="space-y-12">
                  <div className="flex flex-col md:flex-row md:items-end justify-between px-2 gap-6">
                    <div>
                        <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter mb-2">{selectedWard.name}</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">Occupancy Registry & Hardware Configuration</p>
                    </div>
                    <div className="px-6 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Total Units: {beds.length}</span>
                    </div>
                  </div>

                  <div className="glass-card rounded-[3rem] p-8 md:p-10 shadow-2xl shadow-zinc-900/[0.03] border-white/5 relative overflow-hidden group">
                    <form onSubmit={handleAddBed} className="flex flex-col lg:flex-row items-end gap-6 relative z-10">
                        <div className="flex-1 w-full">
                            <label className="form-label">bed_logistical_id</label>
                            <input className="form-input text-lg font-black" placeholder="e.g. B-101-ALPHA" value={newBed.bed_number} onChange={e => setNewBed({...newBed, bed_number: e.target.value})} required />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="form-label">daily_precision_rate (₹)</label>
                            <input type="number" className="form-input font-black" placeholder="500.00" value={newBed.daily_charge} onChange={e => setNewBed({...newBed, daily_charge: e.target.value})} required />
                        </div>
                        <button type="submit" className="w-full lg:w-auto btn-primary !py-5 !px-12 font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-500/10 active:scale-95 transition-all">Commence Bed Install</button>
                    </form>
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] grayscale pointer-events-none group-hover:scale-110 transition-transform duration-1000 select-none">🛏️</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {beds.map(b => (
                      <div key={b.id} className={`p-10 rounded-[3rem] border-2 transition-all duration-500 group relative overflow-hidden hover:shadow-2xl ${
                        b.status === 'AVAILABLE' 
                          ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30' 
                          : 'bg-red-500/5 border-red-500/10 hover:border-red-500/30'
                        }`}>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-10">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 group-hover:scale-110 shadow-xl ${b.status === 'AVAILABLE' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white animate-pulse'}`}>
                                    {b.status === 'AVAILABLE' ? '✅' : '🔴'}
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Status Protocol</p>
                                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${b.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-red-100 text-red-600 border-red-200'}`}>{b.status}</p>
                                </div>
                            </div>
                            
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Structural Unit ID</p>
                            <h4 className="text-3xl font-black text-zinc-900 dark:text-white mb-8 tracking-tighter truncate">{b.bed_number}</h4>
                            
                            <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800/50 flex items-end justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Precision Rate</p>
                                    <p className="text-xl font-black font-mono italic text-zinc-900 dark:text-white">₹{parseFloat(b.daily_charge).toLocaleString()}<span className="text-[10px] text-zinc-500 ml-1">/24H</span></p>
                                </div>
                                <button className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-300 hover:text-blue-500 hover:bg-blue-500/5 border border-zinc-100 dark:border-zinc-700 transition-all flex items-center justify-center">⚙️</button>
                            </div>
                        </div>
                        {b.status !== 'AVAILABLE' && <div className="absolute bottom-0 right-0 p-6 text-6xl opacity-[0.02] grayscale -mb-4 -mr-4 group-hover:scale-110 transition-transform">🚑</div>}
                      </div>
                    ))}
                  </div>
                  {beds.length === 0 && (
                        <div className="py-32 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-800/10 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[4rem] opacity-40">
                            <span className="text-8xl mb-6">🏚️</span>
                            <h3 className="text-xl font-black uppercase tracking-[0.2em] text-zinc-500">Ward Configuration Empty</h3>
                            <p className="text-xs font-bold text-zinc-400 mt-2 italic">Commence structural install to activate diagnostic units.</p>
                        </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-40 bg-zinc-50/50 dark:bg-zinc-800/10 border-2 border-dashed border-zinc-200 dark:border-zinc-800/60 rounded-[4rem] group hover:bg-zinc-100/50 transition-all">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-5xl mb-10 shadow-2xl group-hover:scale-110 transition-transform duration-700">🏢</div>
                  <h3 className="text-2xl font-black text-zinc-400 uppercase tracking-[0.3em]">Sector_Awaiting_Identity</h3>
                  <p className="text-xs font-bold text-zinc-500 mt-4 uppercase tracking-[0.2em]">Select an architectural ward to engage hardware management.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
