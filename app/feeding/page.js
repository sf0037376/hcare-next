"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"
import Link from "next/link"

function FeedingClient() {
  const { Toast, show } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPatientId = searchParams.get("patient_id") || ""
  const [role, setRole] = useState("")

  const [patients, setPatients] = useState([])
  const [form, setForm] = useState({
    patient_id: initialPatientId,
    type: "Mixed",
    quantity: 0,
    items: [{ type: "", quantity: "" }],
    recorded_at: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: false }).replace(',', '').slice(0, 16),
    start_time: "",
    end_time: ""
  })
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  useEffect(() => {
    const userRole = (localStorage.getItem("role") || "").toLowerCase()
    setRole(userRole)
    if (userRole === "patient") {
      const pId = localStorage.getItem("patientId")
      if (pId) setForm(prev => ({ ...prev, patient_id: pId }))
    }
  }, [])

  useEffect(() => {
    async function loadPatients() {
      try {
        const data = await apiFetch("/patients")
        setPatients(Array.isArray(data) ? data : [])
      } catch (err) {
        show("Failed to load patients list")
      }
    }
    loadPatients()
  }, [show])

  const addItem = () => {
    setForm(prev => ({ ...prev, items: [...prev.items, { type: "", quantity: "" }] }))
  }

  const removeItem = (index) => {
    const newItems = form.items.filter((_, i) => i !== index)
    setForm(prev => ({ ...prev, items: newItems }))
  }

  const updateItem = (index, field, value) => {
    const newItems = [...form.items]
    newItems[index][field] = value
    const total = newItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0)
    setForm(prev => ({ ...prev, items: newItems, quantity: total }))
  }

  const toggleTimer = () => {
    const now = new Date().toISOString().slice(0, 16)
    if (!isTimerRunning) {
      setForm(prev => ({ ...prev, start_time: now, end_time: "" }))
      setIsTimerRunning(true)
    } else {
      setForm(prev => ({ ...prev, end_time: now }))
      setIsTimerRunning(false)
    }
  }

  async function submit(e) {
    e.preventDefault()

    if (!form.patient_id) {
      show("Please select a patient")
      return
    }

    if (form.items.some(item => !item.type || !item.quantity)) {
        show("Please fill all feed item details")
        return
    }

    try {
      await apiFetch("/feeding/feeding", {
        method: "POST",
        body: JSON.stringify(form),
      })
      show("Feeding record saved")
      setTimeout(() => router.back(), 1500)
    } catch (err) {
      show("Failed to save feeding record")
    }
  }

  const currentRole = typeof window !== "undefined" ? (localStorage.getItem("role") || "").toLowerCase() : ""
  const dashboardLink = currentRole === "doctor" ? "/doctor-dashboard" : currentRole === "nurse" || currentRole === "staff" ? "/staff-dashboard" : "/dashboard"

  return (
    <ProtectedRoute roles={["admin", "doctor", "nurse", "patient"]}>
      <div className="animate-in fade-in duration-500 max-w-2xl mx-auto pb-safe">
        {Toast}

        <div className="mb-6">
          <Link href={dashboardLink} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-medium text-sm flex items-center gap-1 transition-colors">
            &larr; Back to Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase italic">Log Feeding Session</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">Capture nutritional intake data for precise patient monitoring.</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.05] dark:opacity-[0.08] pointer-events-none group-hover:scale-125 transition-transform duration-1000">
            <span className="text-[12rem]">🍼</span>
          </div>

          {role === 'doctor' ? (
            <div className="relative z-10 py-12 text-center">
              <span className="text-6xl mb-6 block">⚕️</span>
              <p className="text-zinc-900 dark:text-white text-xl font-black italic">Physician Access Restricted</p>
              <p className="text-sm text-zinc-400 mt-2 font-bold uppercase tracking-widest">Feeding entry is reserved for Nursing and Staff personnel.</p>
            </div>
          ) : (
          <form onSubmit={submit} className="relative z-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Patient Focus</label>
                {role === 'patient' ? (
                   <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 font-bold text-zinc-900 dark:text-white uppercase tracking-tight">
                    Patient #{form.patient_id} Profile
                  </div>
                ) : (
                  <select
                    className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-bold text-zinc-900 dark:text-white appearance-none"
                    value={form.patient_id}
                    onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Log Timestamp</label>
                <input
                  type="datetime-local"
                  className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-bold text-zinc-900 dark:text-white"
                  value={form.recorded_at}
                  onChange={(e) => setForm({ ...form, recorded_at: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Feed Components</label>
                <button 
                  type="button" 
                  onClick={addItem}
                  className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-3 py-1.5 rounded-xl border border-orange-100 dark:border-orange-800 hover:scale-105 transition-transform"
                >
                  + Add Item
                </button>
              </div>
              
              <div className="space-y-4">
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-4 items-end bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex-1 space-y-2 w-full">
                      <label className="text-[9px] font-bold uppercase text-zinc-400">Type</label>
                      <input
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 font-bold text-sm"
                        value={item.type}
                        onChange={(e) => updateItem(idx, "type", e.target.value)}
                        placeholder="e.g. EBM, Formula, Dialysate..."
                        required
                      />
                    </div>
                    <div className="w-full sm:w-32 space-y-2">
                      <label className="text-[9px] font-bold uppercase text-zinc-400">Qty (ml)</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 font-bold text-sm"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                        placeholder="0"
                        required
                      />
                    </div>
                    {form.items.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeItem(idx)}
                        className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center p-6 bg-zinc-900 dark:bg-white rounded-3xl text-white dark:text-zinc-900">
                <span className="text-xs font-black uppercase tracking-widest">Total Volume</span>
                <span className="text-2xl font-black font-mono">{form.quantity} ml</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Feed Duration Timer</label>
                <button
                  type="button"
                  onClick={toggleTimer}
                  className={`px-6 py-2 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg ${
                    isTimerRunning 
                    ? 'bg-red-500 text-white shadow-red-500/20' 
                    : 'bg-emerald-500 text-white shadow-emerald-500/20'
                  }`}
                >
                  {isTimerRunning ? '⏹️ Stop Timer' : '▶️ Start Timer'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Duration: Start</label>
                  <input
                    type="datetime-local"
                    className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-bold text-zinc-900 dark:text-white"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Duration: End</label>
                  <input
                    type="datetime-local"
                    className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-bold text-zinc-900 dark:text-white"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-10 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button 
                type="submit"
                className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black uppercase text-xs tracking-[0.25em] rounded-2xl shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                Commit Record →
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default function Feeding() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading feeding logs...</div>}>
      <FeedingClient />
    </Suspense>
  )
}
