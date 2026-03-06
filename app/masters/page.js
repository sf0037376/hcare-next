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
      <div className="animate-in fade-in duration-500 pb-20 max-w-6xl mx-auto">
        {Toast}
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Hospital Masters</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Configure facilities, pricing, and service rates.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl w-fit mb-8">
          <button 
            onClick={() => setActiveTab("pricing")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "pricing" ? "bg-white dark:bg-zinc-900 shadow-sm text-blue-600" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
          >
            💰 Pricing Master
          </button>
          <button 
            onClick={() => setActiveTab("wards")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "wards" ? "bg-white dark:bg-zinc-900 shadow-sm text-blue-600" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
          >
            🛌 Wards & Beds
          </button>
        </div>

        {activeTab === "pricing" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Price Form */}
            <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm h-fit">
              <h3 className="text-lg font-bold mb-6">Add New Charge</h3>
              <form onSubmit={handleAddPrice} className="space-y-4">
                <div>
                  <label className="form-label text-xs">Service Name</label>
                  <input 
                    className="form-input" 
                    placeholder="e.g. ICU Consultation" 
                    value={newPrice.service_name} 
                    onChange={e => setNewPrice({...newPrice, service_name: e.target.value})}
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label text-xs">Base Charge (₹)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="0.00" 
                      value={newPrice.base_charge} 
                      onChange={e => setNewPrice({...newPrice, base_charge: e.target.value})}
                      required 
                    />
                  </div>
                  <div>
                    <label className="form-label text-xs">Category</label>
                    <select 
                      className="form-input" 
                      value={newPrice.category} 
                      onChange={e => setNewPrice({...newPrice, category: e.target.value})}
                    >
                      <option value="CONSULTATION">Consultation</option>
                      <option value="ICU">ICU Charge</option>
                      <option value="LAB">Lab Test</option>
                      <option value="AMBULANCE">Ambulance</option>
                      <option value="SURGERY">Surgery</option>
                      <option value="EQUIPMENT">Equipment / Device</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label text-xs">Patient Type Applicability</label>
                  <select 
                    className="form-input" 
                    value={newPrice.patient_type} 
                    onChange={e => setNewPrice({...newPrice, patient_type: e.target.value})}
                  >
                    <option value="BOTH">Both IP & OP</option>
                    <option value="IP">In-Patient Only</option>
                    <option value="OP">Out-Patient Only</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary w-full !py-3 font-bold mt-2">Add to Master</button>
              </form>
            </div>

            {/* Price Table */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-100/50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Service</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Category</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Type</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Charge (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
                  {pricing.map(p => (
                    <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold">{p.service_name}</td>
                      <td className="px-6 py-4"><span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">{p.category}</span></td>
                      <td className="px-6 py-4 text-xs text-zinc-500">{p.patient_type}</td>
                      <td className="px-6 py-4 text-sm font-bold text-right text-blue-600">₹{parseFloat(p.base_charge).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pricing.length === 0 && <p className="py-20 text-center text-zinc-500">No pricing entries found.</p>}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Ward Form & List */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm">
                <h3 className="text-lg font-bold mb-6">Create Ward</h3>
                <form onSubmit={handleAddWard} className="space-y-4">
                  <div>
                    <label className="form-label text-xs">Ward Name</label>
                    <input className="form-input" placeholder="e.g. NICU Level III" value={newWard.name} onChange={e => setNewWard({...newWard, name: e.target.value})} required />
                  </div>
                  <div>
                    <label className="form-label text-xs">Ward Type</label>
                    <select className="form-input" value={newWard.type} onChange={e => setNewWard({...newWard, type: e.target.value})}>
                      <option value="GENERAL">General Ward</option>
                      <option value="ICU">ICU</option>
                      <option value="PRIVATE">Private Room</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary w-full !py-3 font-bold">Add Ward</button>
                </form>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-sm">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Available Wards</h4>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {wards.map(w => (
                    <button 
                      key={w.id} 
                      onClick={() => { setSelectedWard(w); loadBeds(w.id); }}
                      className={`w-full text-left px-6 py-4 hov:bg-zinc-50 transition-all flex items-center justify-between group ${selectedWard?.id === w.id ? 'bg-blue-50/50 dark:bg-blue-500/10' : ''}`}
                    >
                      <div>
                        <p className={`font-bold text-sm ${selectedWard?.id === w.id ? 'text-blue-600' : ''}`}>{w.name}</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold">{w.type}</p>
                      </div>
                      <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bed Management for Selected Ward */}
            <div className="lg:col-span-2">
              {selectedWard ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold">{selectedWard.name} <span className="text-sm font-normal text-zinc-500 ml-2">(Manage Beds)</span></h3>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm">
                    <form onSubmit={handleAddBed} className="flex flex-col md:flex-row items-end gap-4">
                      <div className="flex-1">
                        <label className="form-label text-xs">Bed Number / ID</label>
                        <input className="form-input" placeholder="e.g. B-101" value={newBed.bed_number} onChange={e => setNewBed({...newBed, bed_number: e.target.value})} required />
                      </div>
                      <div className="flex-1">
                        <label className="form-label text-xs">Daily Rate (₹)</label>
                        <input type="number" className="form-input" placeholder="500.00" value={newBed.daily_charge} onChange={e => setNewBed({...newBed, daily_charge: e.target.value})} required />
                      </div>
                      <button type="submit" className="btn-primary !py-3 !px-8 font-bold">Add Bed</button>
                    </form>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {beds.map(b => (
                      <div key={b.id} className={`p-6 rounded-[28px] border transition-all ${
                        b.status === 'AVAILABLE' 
                          ? 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' 
                          : 'bg-red-50/30 border-red-100 dark:bg-red-500/10 dark:border-red-500/20'
                        }`}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Bed No.</p>
                        <h4 className="text-xl font-bold mb-4">{b.bed_number}</h4>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${b.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{b.status}</span>
                        </div>
                        <p className="mt-4 text-sm font-bold text-zinc-900 dark:text-white">₹{parseFloat(b.daily_charge).toLocaleString()}<span className="text-[8px] text-zinc-500 ml-1">/DAY</span></p>
                      </div>
                    ))}
                  </div>
                  {beds.length === 0 && <p className="py-20 text-center text-zinc-500 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[32px]">No beds added to this ward yet.</p>}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 bg-zinc-50/50 dark:bg-zinc-800/10 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[40px]">
                  <span className="text-5xl mb-4">🏠</span>
                  <p className="text-zinc-500 font-medium">Select a ward to manage its beds</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
