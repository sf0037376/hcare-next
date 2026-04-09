"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"
import Link from "next/link"

function MedicationClient() {
  const { Toast, show } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPatientId = searchParams.get("patient_id") || ""
  const initialMedicine = searchParams.get("medicine") || ""
  const initialDose = searchParams.get("dose") || ""
  const initialScheduleId = searchParams.get("scheduleId") || ""

  const [role, setRole] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [patients, setPatients] = useState([])
  const [patientMeds, setPatientMeds] = useState([])
  const [form, setForm] = useState({
    patient_id: initialPatientId,
    medicine: initialMedicine,
    dose: initialDose,
    scheduleId: initialScheduleId,
    recorded_at: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: false }).replace(',', '').slice(0, 16)
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

  // Fetch patient profile when patient_id changes to load prescriptions
  useEffect(() => {
    async function loadPatientProfile() {
      if (!form.patient_id) {
        setPatientMeds([])
        return
      }
      try {
        const fullData = await apiFetch(`/patients/${form.patient_id}/full-profile`)
        if (fullData && fullData.medication_schedule) {
          setPatientMeds(fullData.medication_schedule)
        } else {
          setPatientMeds([])
        }
      } catch (err) {
        console.error("Failed to load patient meds", err)
        setPatientMeds([])
      }
    }
    loadPatientProfile()
  }, [form.patient_id])

  async function submit(e) {
    e.preventDefault()

    if (!form.patient_id) {
      show("Please select a patient")
      return
    }

    setSubmitting(true)
    try {
      await apiFetch("/medication/medication", {
        method: "POST",
        body: JSON.stringify({
          patient_id: form.patient_id,
          scheduleId: form.scheduleId || null,
          medicine: form.medicine,
          dose: form.dose,
          recorded_at: new Date(form.recorded_at).toISOString()
        }),
      })
      show("✅ Medication administration logged successfully")
      setTimeout(() => router.back(), 1500)
    } catch (err) {
      show("❌ Failed to log medication")
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
            <h2 className="text-5xl md:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic leading-none premium-text-gradient">Pharma_Nexus</h2>
            <div className="flex items-center gap-4">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse shadow-lg shadow-purple-600/50"></span>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] font-mono italic">Sector_Status: Dose_Registry_Active</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 px-8 py-5 rounded-[2.5rem] glass-card border-white/5 shadow-2xl relative overflow-hidden group/status">
               <span className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)] relative z-10"></span>
               <span className="text-[10px] font-black uppercase tracking-[0.4em] font-mono text-zinc-600 dark:text-zinc-200 relative z-10 italic">Archive_Sync: Nomimal</span>
          </div>
        </div>

        <div className="glass-card rounded-[5rem] p-12 md:p-20 relative overflow-hidden group shadow-2xl border border-white/5">
          <div className="absolute top-0 right-0 p-24 opacity-[0.05] grayscale -rotate-12 scale-150 select-none pointer-events-none group-hover:rotate-0 transition-transform duration-1000">💊</div>
          
          <form onSubmit={submit} className="relative z-10 space-y-20 font-mono">
            {/* Operational Context Matrix */}
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
                <label className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 block ml-4 italic">Capture_Timestamp</label>
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
                    <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.5em] italic shrink-0">Pharma_Deployment_Parameters</h4>
                    <div className="flex-1 h-px bg-zinc-100 dark:bg-white/5"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <div className="space-y-6">
                        <label className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 block ml-4 italic">Medication_Directive</label>
                        {patientMeds.length > 0 ? (
                        <div className="relative group/select">
                           <select
                                className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2.5rem] px-10 py-8 text-[12px] font-black uppercase tracking-[0.4em] focus:ring-4 ring-purple-500/10 transition-all appearance-none cursor-pointer italic pr-20"
                                value={form.medicine}
                                onChange={(e) => {
                                    const selectedMed = patientMeds.find(m => m.medicine === e.target.value)
                                    setForm({
                                        ...form,
                                        medicine: e.target.value,
                                        dose: selectedMed ? selectedMed.dosage : form.dose,
                                        scheduleId: selectedMed ? selectedMed.id : null
                                    })
                                }}
                                required
                            >
                                <option value="">-- SELECT_PRESCRIBED_PROTOCOL --</option>
                                {patientMeds.map(m => (
                                <option key={m.id} value={m.medicine}>{m.medicine.toUpperCase()}</option>
                                ))}
                            </select>
                            <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover/select:opacity-100 group-hover/select:text-purple-500 transition-all">▼</div>
                        </div>
                        ) : (
                        <input
                            className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2.5rem] px-10 py-8 text-[12px] font-black uppercase tracking-[0.4em] focus:ring-4 ring-purple-500/10 transition-all italic placeholder:text-zinc-500/50"
                            value={form.medicine}
                            onChange={(e) => setForm({ ...form, medicine: e.target.value })}
                            placeholder={form.patient_id ? "PROTOCOL_WAIT: MANUAL_ENTRY_REQUIRED..." : "SECTOR_LOCKED: SELECT_NODE_IDENTITY"}
                            required
                        />
                        )}
                    </div>
                    
                    <div className="space-y-6">
                        <label className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 block ml-4 italic">Dosage_specification</label>
                        <input
                            className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2.5rem] px-10 py-8 text-[12px] font-black uppercase tracking-[0.4em] focus:ring-4 ring-purple-500/10 transition-all italic placeholder:text-zinc-500/50"
                            value={form.dose}
                            onChange={(e) => setForm({ ...form, dose: e.target.value })}
                            placeholder="E.G. 5ML_ISO || 1_UNIT_CAP"
                            required
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
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-white/10 to-transparent translate-x-[-100%] group-hover/submit:translate-x-[100%] transition-transform duration-1000"></div>
                {submitting ? (
                    <div className="flex items-center justify-center gap-6">
                        <div className="w-6 h-6 border-4 border-white/30 dark:border-zinc-950/30 border-t-white dark:border-t-zinc-950 rounded-full animate-spin" />
                        <span className="animate-pulse">SYNCHRONIZING_PHARMA_LOG...</span>
                    </div>
                ) : (
                    <span className="relative z-10 flex items-center justify-center gap-4">
                        COMMIT_ADMIN_DIRECTIVE 💊
                    </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default function Medication() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading medication log...</div>}>
      <MedicationClient />
    </Suspense>
  )
}
