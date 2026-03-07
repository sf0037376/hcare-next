"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../../lib/api"
import useToast from "../../../components/toast"
import ProtectedRoute from "../../../components/ProtectedRoute"

export default function IPLogs() {
  const { Toast, show } = useToast()
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({ description: "", quantity: 1, unit_price: "" })
  const [recentItems, setRecentItems] = useState([])

  useEffect(() => {
    loadPatients()
  }, [])

  async function loadPatients() {
    try {
      const data = await apiFetch("/patients")
      // Be more inclusive: Show if status is Admitted OR if patient_type is IP
      setPatients(Array.isArray(data) ? data.filter(p => p.status === 'Admitted' || p.patient_type === 'IP') : [])
    } catch (err) {
      show("Failed to load patient directory")
    }
  }

  async function loadPatientLogs(pid) {
    try {
      const data = await apiFetch(`/billing/ip-items/${pid}`)
      setRecentItems(data)
    } catch (err) {
      show("Failed to load logs")
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedPatient) return show("Select a patient first")
    if (!form.description || !form.unit_price) return show("Description and Price are required")

    try {
      await apiFetch("/billing/ip-items", {
        method: "POST",
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          ...form
        })
      })
      show("Billing item logged successfully")
      setForm({ description: "", quantity: 1, unit_price: "" })
      loadPatientLogs(selectedPatient.id)
    } catch (err) {
      show("Failed to log item")
    }
  }

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    String(p.id).includes(search)
  )

  return (
    <ProtectedRoute roles={["admin", "super_admin"]}>
      <div className="p-6 md:p-12 animate-in fade-in duration-500 max-w-6xl mx-auto">
        {Toast}
        <div className="mb-12">
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight italic">IP Billing Log</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2 italic">Official ledger for un-invoiced patient charges</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Patient Selection sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Select IP Patient</h3>
              <input 
                className="form-input !py-3 !rounded-xl !text-sm mb-4" 
                placeholder="Search by name or ID..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredPatients.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => { setSelectedPatient(p); loadPatientLogs(p.id); }}
                    className={`w-full text-left p-4 rounded-2xl transition-all border ${
                      selectedPatient?.id === p.id 
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
                      : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-100'
                    }`}
                  >
                    <p className="font-bold text-sm">{p.name}</p>
                    <p className={`text-[10px] font-black uppercase mt-1 ${selectedPatient?.id === p.id ? 'text-blue-100' : 'text-zinc-500'}`}>
                      ID: #{p.id} • Bed: {p.bed_number || 'N/A'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Log Entry & Recent History */}
          <div className="lg:col-span-2 space-y-8">
            {selectedPatient ? (
              <>
                <div className="bg-zinc-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10">
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6">New Entry for {selectedPatient.name}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-[10px] uppercase font-black text-zinc-500 mb-2 block ml-1">Charge Description</label>
                        <input 
                          className="w-full bg-zinc-800 border-none rounded-2xl p-4 text-sm font-bold text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. Consultation Fee / Consumables"
                          value={form.description}
                          onChange={(e) => setForm({...form, description: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-black text-zinc-500 mb-2 block ml-1">Qty</label>
                        <input 
                          type="number"
                          className="w-full bg-zinc-800 border-none rounded-2xl p-4 text-sm font-bold text-white"
                          value={form.quantity}
                          onChange={(e) => setForm({...form, quantity: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-black text-zinc-500 mb-2 block ml-1">Unit Price</label>
                        <input 
                          type="number"
                          className="w-full bg-zinc-800 border-none rounded-2xl p-4 text-sm font-bold text-white"
                          placeholder="₹"
                          value={form.unit_price}
                          onChange={(e) => setForm({...form, unit_price: e.target.value})}
                        />
                      </div>
                      <div className="md:col-span-4 mt-2">
                        <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-500/20">
                          + Log Charge & Notify Patient
                        </button>
                      </div>
                    </form>
                  </div>
                  <div className="absolute -bottom-10 -right-10 text-9xl opacity-5 grayscale select-none">🧾</div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest px-2">Active Logs (Un-billed)</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {recentItems.map(item => (
                      <div key={item.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl flex justify-between items-center group hover:border-zinc-400 transition-all">
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-white">{item.description}</p>
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">
                            {item.quantity} x ₹{item.unit_price} • {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <p className="font-black text-lg text-zinc-900 dark:text-white font-mono">₹{item.total_amount}</p>
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                            item.acceptance_status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-600' : 
                            item.acceptance_status === 'REJECTED' ? 'bg-red-100 text-red-600' : 
                            'bg-amber-100 text-amber-600 animate-pulse'
                          }`}>
                            {item.acceptance_status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {recentItems.length === 0 && (
                      <div className="py-20 bg-zinc-50 dark:bg-zinc-800/20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[40px] flex flex-col items-center justify-center opacity-40">
                         <span className="text-4xl mb-4">📭</span>
                         <p className="text-sm font-bold uppercase tracking-widest">No recent billing logs</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[500px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[48px] flex flex-col items-center justify-center opacity-30">
                 <span className="text-6xl mb-6">🏥</span>
                 <p className="text-xl font-black uppercase tracking-[0.2em] italic">Select a patient to begin logging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
