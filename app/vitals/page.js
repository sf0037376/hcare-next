"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"
import Link from "next/link"

function VitalsClient() {
  const { Toast, show } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPatientId = searchParams.get("patient_id") || ""
  const [role, setRole] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [patients, setPatients] = useState([])
  const [form, setForm] = useState({
    patient_id: initialPatientId,
    hr: "",
    spo2: "",
    weight: "",
    head: "",
    height: "",
    bmi: "",
    notes: "",
    recorded_at: (() => {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      return now.toISOString().slice(0, 16);
    })()
  })

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

  // Advanced Clinical Alerts & Auto-notes logic
  useEffect(() => {
    const hrVal = parseInt(form.hr)
    const spo2Val = parseInt(form.spo2)
    const weightVal = parseFloat(form.weight)
    const headVal = parseFloat(form.head)
    const heightVal = parseFloat(form.height)
    
    let alerts = []

    // BMI Calculation (Weight / Height^2) - Height in cm converted to m
    if (weightVal && heightVal) {
      const heightInMeters = heightVal / 100
      const calculatedBmi = (weightVal / (heightInMeters * heightInMeters)).toFixed(2)
      if (form.bmi !== calculatedBmi) {
        setForm(prev => ({ ...prev, bmi: calculatedBmi }))
      }
    }

    // Heart Rate Alerts
    if (hrVal) {
      if (hrVal > 170) alerts.push("⚠️ High HR (Tachycardia)")
      else if (hrVal < 90) alerts.push("⚠️ Low HR (Bradycardia)")
    }
    
    // SpO2 Alerts
    if (spo2Val && spo2Val < 92) {
      alerts.push("⚠️ Low SpO2 (Hypoxia risk)")
    }

    // Weight Alerts (assuming neonatal context, < 2kg or > 4.5kg might be flags)
    if (weightVal) {
      if (weightVal < 2.0) alerts.push("⚠️ Low Birth Weight alert")
      if (weightVal > 4.5) alerts.push("⚠️ Macrosomia alert")
    }

    // Head Circumference Alerts (Neonatal average 33-35cm)
    if (headVal) {
      if (headVal < 31) alerts.push("⚠️ Microcephaly risk")
      else if (headVal > 37) alerts.push("⚠️ Macrocephaly risk")
    }

    if (alerts.length > 0) {
      setForm(prev => ({ ...prev, notes: alerts.join(". ") }))
    }
  }, [form.hr, form.spo2, form.weight, form.head, form.height])

  async function submit(e) {
    e.preventDefault()

    if (!form.patient_id) {
      show("Please select a patient")
      return
    }

    // Check if at least one vital is recorded
    const hasValue = form.hr || form.spo2 || form.weight || form.head || form.height || form.bmi
    if (!hasValue) {
      show("Please enter at least one measurement")
      return
    }

    setSubmitting(true)

    try {
      await apiFetch("/vitals", { 
        method: "POST", 
        body: JSON.stringify(form) 
      })
      show("Vitals saved successfully")
      setTimeout(() => router.back(), 1500)
    } catch (err) {
      show(err.message || "Failed to save vitals")
    } finally {
      setSubmitting(false)
    }
  }

  const currentRole = typeof window !== "undefined" ? (localStorage.getItem("role") || "").toLowerCase() : ""
  const dashboardLink = currentRole === "doctor" ? "/doctor-dashboard" : currentRole === "nurse" || currentRole === "staff" ? "/staff-dashboard" : "/dashboard"

  return (
    <ProtectedRoute roles={["admin", "doctor", "nurse", "staff", "patient"]}>
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-5xl mx-auto pb-40 px-4 lg:px-6 transition-all">
        {Toast}
        
        <div className="mb-12 font-mono">
          <Link href={dashboardLink} className="group inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 hover:text-blue-500 transition-all">
            <span className="group-hover:-translate-x-2 transition-transform italic">← Sector_Exit</span>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 py-8 relative">
          <div className="space-y-2">
            <h2 className="text-5xl md:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic leading-none premium-text-gradient">Biometric_Nexus</h2>
            <div className="flex items-center gap-4">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shadow-lg shadow-blue-600/50"></span>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] font-mono italic">Sector_Status: Surveillance_Cycle_Active</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 px-8 py-5 rounded-[2.5rem] glass-card border-white/5 shadow-2xl relative overflow-hidden group/status">
               <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] relative z-10"></span>
               <span className="text-[10px] font-black uppercase tracking-[0.4em] font-mono text-zinc-600 dark:text-zinc-200 relative z-10 italic">Telemetry_Stream: Active</span>
          </div>
        </div>

        <div className="glass-card rounded-[5rem] p-12 md:p-20 relative overflow-hidden group shadow-2xl border border-white/5">
          <div className="absolute top-0 right-0 p-24 opacity-[0.05] grayscale -rotate-12 scale-150 select-none pointer-events-none group-hover:rotate-0 transition-transform duration-1000">❤️</div>
          
          {role === 'doctor' ? (
            <div className="relative z-10 py-32 text-center font-mono">
              <div className="w-24 h-24 bg-blue-600/10 rounded-[2rem] flex items-center justify-center text-5xl mx-auto mb-10 shadow-2xl shadow-blue-600/10 grayscale opacity-40">⚕️</div>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic mb-4">Prescription_Mode_Locked</h3>
              <p className="text-[10px] text-zinc-500 font-black max-w-xs mx-auto leading-relaxed uppercase tracking-[0.4em] italic opacity-60">Biometric entry is restricted to Nursing segments for data integrity protection.</p>
            </div>
          ) : (
          <form onSubmit={submit} className="relative z-10 space-y-20 font-mono">
            {/* Context Infrastructure */}
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
                <label className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 block ml-4 italic">Surveillance_Timestamp</label>
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
                <div className="flex items-center gap-8 px-4">
                    <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.5em] italic shrink-0">Vital_Telemetry_Input</h4>
                    <div className="flex-1 h-px bg-zinc-100 dark:bg-white/5"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    <div className="space-y-6">
                        <label className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 block ml-4 italic">Heart_Rate <span className="text-zinc-500 lowercase tracking-widest">(bpm)</span></label>
                        <input
                        type="number"
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] px-10 py-8 text-2xl font-black tracking-tighter italic focus:ring-4 ring-red-500/10 transition-all"
                        value={form.hr}
                        onChange={(e) => setForm({ ...form, hr: e.target.value })}
                        placeholder="000"
                        />
                    </div>
                    <div className="space-y-6">
                        <label className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 block ml-4 italic">Blood_Oxygen <span className="text-zinc-500 lowercase tracking-widest">(spo2 %)</span></label>
                        <input
                        type="number"
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] px-10 py-8 text-2xl font-black tracking-tighter italic focus:ring-4 ring-blue-500/10 transition-all"
                        value={form.spo2}
                        onChange={(e) => setForm({ ...form, spo2: e.target.value })}
                        placeholder="00"
                        />
                    </div>
                    <div className="space-y-6">
                        <label className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 block ml-4 italic">Body_Weight <span className="text-zinc-500 lowercase tracking-widest">(kg)</span></label>
                        <input
                        type="number"
                        step="0.01"
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] px-10 py-8 text-2xl font-black tracking-tighter italic focus:ring-4 ring-emerald-500/10 transition-all"
                        value={form.weight}
                        onChange={(e) => setForm({ ...form, weight: e.target.value })}
                        placeholder="0.00"
                        />
                    </div>
                    <div className="space-y-6">
                        <label className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 block ml-4 italic">Head_circum <span className="text-zinc-500 lowercase tracking-widest">(cm)</span></label>
                        <input
                        type="number"
                        step="0.1"
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] px-10 py-8 text-2xl font-black tracking-tighter italic focus:ring-4 ring-purple-500/10 transition-all"
                        value={form.head}
                        onChange={(e) => setForm({ ...form, head: e.target.value })}
                        placeholder="00.0"
                        />
                    </div>
                    <div className="space-y-6">
                        <label className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 block ml-4 italic">Unit_Height <span className="text-zinc-500 lowercase tracking-widest">(cm)</span></label>
                        <input
                        type="number"
                        step="0.1"
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] px-10 py-8 text-2xl font-black tracking-tighter italic focus:ring-4 ring-orange-500/10 transition-all"
                        value={form.height}
                        onChange={(e) => setForm({ ...form, height: e.target.value })}
                        placeholder="00.0"
                        />
                    </div>
                    <div className="space-y-6">
                        <label className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 block ml-4 italic">Calculated_BMI</label>
                        <div className="w-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 rounded-[2rem] px-10 py-8 text-2xl font-black tracking-tighter italic shadow-2xl transition-all duration-700">
                           {form.bmi || 'DATA_WAIT'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
              <label className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 block ml-4 italic">Clinical_Observation_Telemetry</label>
              <textarea
                className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[3rem] px-10 py-10 text-[12px] font-black uppercase tracking-[0.2em] focus:ring-4 ring-blue-500/10 transition-all italic min-h-[180px] resize-none leading-relaxed placeholder:text-zinc-500/50"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="REAL-TIME_CLINICAL_TRIGGERS_AND_EXPERT_OBSERVATIONS_WILL_BE_SYNTHESIZED_HERE..."
              />
              <div className="flex items-center gap-4 px-6">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em] italic leading-none">Intelligence_Synthesis: Active_Surveillance</p>
              </div>
            </div>
            
            <div className="pt-10">
              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 py-10 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.8em] shadow-[0_45px_100px_-15px_rgba(0,0,0,0.4)] active:scale-95 hover:scale-[1.01] transition-all duration-700 italic disabled:opacity-50 relative overflow-hidden group/submit"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/10 to-transparent translate-x-[-100%] group-hover/submit:translate-x-[100%] transition-transform duration-1000"></div>
                {submitting ? (
                    <div className="flex items-center justify-center gap-6">
                        <div className="w-6 h-6 border-4 border-white/30 dark:border-zinc-950/30 border-t-white dark:border-t-zinc-950 rounded-full animate-spin" />
                        <span className="animate-pulse">SYNCHRONIZING_BIOMETRIC_DATA...</span>
                    </div>
                ) : (
                    <span className="relative z-10 flex items-center justify-center gap-4">
                        COMMIT_CLINICAL_TELEMETRY 💾
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

export default function Vitals() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading vitals...</div>}>
      <VitalsClient />
    </Suspense>
  )
}
