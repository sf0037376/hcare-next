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
  const [submitting, setSubmitting] = useState(false)

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

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        recorded_at: new Date(form.recorded_at).toISOString(),
        start_time: form.start_time ? new Date(form.start_time).toISOString() : "",
        end_time: form.end_time ? new Date(form.end_time).toISOString() : ""
      }
      await apiFetch("/feeding/feeding", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      show("✅ Feeding record saved successfully")
      setTimeout(() => router.back(), 1500)
    } catch (err) {
      show("❌ Failed to save feeding record")
      setSubmitting(false)
    }
  }

  const currentRole = typeof window !== "undefined" ? (localStorage.getItem("role") || "").toLowerCase() : ""
  const dashboardLink = currentRole === "doctor" ? "/doctor-dashboard" : currentRole === "nurse" || currentRole === "staff" ? "/staff-dashboard" : "/dashboard"

  return (
    <ProtectedRoute roles={["admin", "doctor", "nurse", "patient"]}>
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-5xl mx-auto pb-40 px-4 lg:px-6 transition-all">
        {Toast}

        <div className="mb-12 font-mono">
          <Link href={dashboardLink} className="group inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 hover:text-blue-500 transition-all">
            <span className="group-hover:-translate-x-2 transition-transform italic">← Sector_Exit</span>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 py-8 relative">
          <div className="space-y-2">
            <h2 className="text-5xl md:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic leading-none premium-text-gradient">Nutritional_Nexus</h2>
            <div className="flex items-center gap-4">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse shadow-lg shadow-orange-600/50"></span>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] font-mono italic">Sector_Status: Intake_Cycle_Active</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 px-8 py-5 rounded-[2.5rem] glass-card border-white/5 shadow-2xl relative overflow-hidden group/status">
               <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.8)] relative z-10"></span>
               <span className="text-[10px] font-black uppercase tracking-[0.4em] font-mono text-zinc-600 dark:text-zinc-200 relative z-10 italic">Composition_Sync: Nominal</span>
          </div>
        </div>

        <div className="glass-card rounded-[5rem] p-12 md:p-20 relative overflow-hidden group shadow-2xl border border-white/5">
          <div className="absolute top-0 right-0 p-24 opacity-[0.05] grayscale -rotate-12 scale-150 select-none pointer-events-none group-hover:rotate-0 transition-transform duration-1000">🍼</div>
          
          {role === 'doctor' ? (
            <div className="relative z-10 py-32 text-center font-mono">
              <div className="w-24 h-24 bg-orange-600/10 rounded-[2rem] flex items-center justify-center text-5xl mx-auto mb-10 shadow-2xl shadow-orange-600/10 grayscale opacity-40">⚕️</div>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic mb-4">Physician_Review_Mode</h3>
              <p className="text-[10px] text-zinc-500 font-black max-w-xs mx-auto leading-relaxed uppercase tracking-[0.4em] italic opacity-60">Feeding intake entry is reserved for clinical nursing segments to maintain data fidelity.</p>
            </div>
          ) : (
          <form onSubmit={submit} className="relative z-10 space-y-20 font-mono">
            {/* Operational Context infrastructure */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-6">
                <label className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 block ml-4 italic">Node_Identity_Select</label>
                {role === 'patient' ? (
                  <div className="flex items-center gap-6 w-full glass-card bg-blue-600/5 border-blue-600/20 rounded-[2.5rem] px-10 py-8 text-xl font-black text-blue-600 italic">
                    <span className="text-3xl">👤</span>
                    NODE_RECORD: #NC-{form.patient_id.toString().padStart(4, '0')}
                  </div>
                ) : (
                  <div className="relative group/select">
                    <select
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2.5rem] px-10 py-8 text-[12px] font-black uppercase tracking-[0.4em] focus:ring-4 ring-blue-500/10 transition-all appearance-none cursor-pointer italic pr-20"
                        value={form.patient_id}
                        onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                        required
                    >
                        <option value="">-- SELECT_ACTIVE_NODE --</option>
                        {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name.toUpperCase()} (UID:#{p.id})</option>
                        ))}
                    </select>
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover/select:opacity-100 group-hover/select:text-blue-500 transition-all">▼</div>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                <label className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 block ml-4 italic">Log_Timestamp_Capture</label>
                <input
                    type="datetime-local"
                    className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2.5rem] px-10 py-8 text-[12px] font-black uppercase tracking-[0.4em] focus:ring-4 ring-emerald-500/10 transition-all italic"
                    value={form.recorded_at}
                    onChange={(e) => setForm({ ...form, recorded_at: e.target.value })}
                    required
                />
              </div>
            </div>
            
            <div className="space-y-16">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-4">
                    <div className="flex items-center gap-8 flex-1">
                        <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.5em] italic shrink-0">Intake_Composition_Protocols</h4>
                        <div className="hidden md:block flex-1 h-px bg-zinc-100 dark:bg-white/5"></div>
                    </div>
                    <button 
                        type="button" 
                        onClick={addItem}
                        className="px-10 py-5 bg-orange-600/10 text-orange-600 text-[10px] font-black uppercase tracking-[0.4em] rounded-[2rem] border border-orange-600/20 hover:bg-orange-600 hover:text-white transition-all shadow-2xl shadow-orange-600/5 active:scale-95 italic shrink-0"
                    >
                        + Execute_Add_Component
                    </button>
                </div>

                <div className="space-y-8">
                    {form.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center glass-card bg-zinc-50/50 dark:bg-white/5 p-10 rounded-[3.5rem] border-white/5 shadow-xl transition-all duration-700 hover:border-orange-500/30 group/item">
                        <div className="lg:col-span-6 space-y-6">
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.4em] ml-4 italic">Composition_ID</label>
                            <div className="relative">
                                <input
                                    className="w-full bg-white dark:bg-zinc-950 border-none rounded-[2rem] px-10 py-6 text-[12px] font-black uppercase tracking-[0.2em] focus:ring-4 ring-orange-500/10 transition-all italic placeholder:text-zinc-500/50"
                                    value={item.type}
                                    onChange={(e) => updateItem(idx, "type", e.target.value)}
                                    placeholder="E.G. EBM || FORMULA || HMS..."
                                    list="feed-suggestions"
                                    required
                                />
                                <datalist id="feed-suggestions">
                                    <option value="EBM (Express Breast Milk)" />
                                    <option value="Formula" />
                                    <option value="HMS (Human Milk Supplement)" />
                                    <option value="Donor Milk" />
                                    <option value="Fortified EBM" />
                                </datalist>
                            </div>
                        </div>
                        <div className="lg:col-span-4 space-y-6">
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.4em] ml-4 italic">Volume <span className="lowercase tracking-widest">(ml)</span></label>
                            <input
                                type="number"
                                className="w-full bg-white dark:bg-zinc-950 border-none rounded-[2rem] px-10 py-6 text-xl font-black tracking-tighter italic focus:ring-4 ring-orange-500/10 transition-all"
                                value={item.quantity}
                                onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                                placeholder="0"
                                required
                            />
                        </div>
                        <div className="lg:col-span-2 flex justify-end">
                            {form.items.length > 1 && (
                            <button 
                                type="button" 
                                onClick={() => removeItem(idx)}
                                className="w-16 h-16 flex items-center justify-center text-red-500 bg-red-500/5 hover:bg-red-500 hover:text-white rounded-[1.5rem] transition-all duration-500 active:scale-90 border border-red-500/10 shadow-2xl"
                            >
                                <span className="text-2xl">🗑️</span>
                            </button>
                            )}
                        </div>
                    </div>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-10 p-12 bg-zinc-950 dark:bg-white rounded-[4rem] text-white dark:text-zinc-900 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden group/total">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 blur-[100px] -mr-32 -mt-32 rounded-full group-hover/total:bg-orange-600/20 transition-all duration-1000"></div>
                    <div className="relative z-10">
                        <p className="text-[11px] font-black uppercase tracking-[0.6em] text-zinc-500 mb-2 italic">Institutional_Summation</p>
                        <h4 className="text-lg font-black tracking-tighter uppercase italic opacity-60">Total_Intake_Volume_Yield</h4>
                    </div>
                    <div className="flex items-baseline gap-4 relative z-10">
                        <span className="text-7xl font-black font-mono tracking-tighter premium-text-gradient italic">{form.quantity}</span>
                        <span className="text-2xl font-black text-zinc-500 uppercase tracking-widest italic opacity-60">ml</span>
                    </div>
                </div>
            </div>

            <div className="space-y-12">
                <div className="flex items-center justify-between mb-8 px-4">
                    <div className="flex items-center gap-8 flex-1">
                        <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.5em] italic shrink-0">Duration_Telemetry_Capture</h4>
                        <div className="hidden md:block flex-1 h-px bg-zinc-100 dark:bg-white/5"></div>
                    </div>
                    <button
                        type="button"
                        onClick={toggleTimer}
                        className={`px-10 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.4em] transition-all shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] active:scale-95 italic shrink-0 ${
                            isTimerRunning 
                            ? 'bg-red-600 text-white shadow-red-600/20 animate-pulse' 
                            : 'bg-emerald-600 text-white shadow-emerald-600/20 hover:scale-105'
                        }`}
                    >
                        {isTimerRunning ? '⏹️ TERMINATE_TIMER' : '▶️ INITIATE_SESSION_TIMER'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div className="space-y-6">
                        <label className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 block ml-4 italic">Session_Initiation</label>
                        <input
                            type="datetime-local"
                            className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2.5rem] px-10 py-8 text-[12px] font-black uppercase tracking-[0.4em] focus:ring-4 ring-emerald-500/10 transition-all italic"
                            value={form.start_time}
                            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                        />
                    </div>
                    <div className="space-y-6">
                        <label className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 block ml-4 italic">Session_Termination</label>
                        <input
                            type="datetime-local"
                            className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2.5rem] px-10 py-8 text-[12px] font-black uppercase tracking-[0.4em] focus:ring-4 ring-orange-500/10 transition-all italic"
                            value={form.end_time}
                            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                        />
                    </div>
                </div>
            </div>
            
            <div className="pt-10">
              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 py-10 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.8em] shadow-[0_45px_100px_-15px_rgba(0,0,0,0.4)] active:scale-95 hover:scale-[1.01] transition-all duration-700 italic disabled:opacity-50 relative overflow-hidden group/submit"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/0 via-white/10 to-transparent translate-x-[-100%] group-hover/submit:translate-x-[100%] transition-transform duration-1000"></div>
                {submitting ? (
                    <div className="flex items-center justify-center gap-6">
                        <div className="w-6 h-6 border-4 border-white/30 dark:border-zinc-950/30 border-t-white dark:border-t-zinc-950 rounded-full animate-spin" />
                        <span className="animate-pulse">SYNCHRONIZING_NUTRI_LOG...</span>
                    </div>
                ) : (
                    <span className="relative z-10 flex items-center justify-center gap-4">
                        COMMIT_INTAKE_DIRECTIVE 🍼
                    </span>
                )}
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
