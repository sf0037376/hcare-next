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
    type: "",
    quantity: "",
    recorded_at: new Date().toISOString().slice(0, 16)
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

  async function submit(e) {
    e.preventDefault()

    if (!form.patient_id) {
      show("Please select a patient")
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Feed Taxonomy</label>
                <select
                  className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-bold text-zinc-900 dark:text-white appearance-none"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  required
                >
                  <option value="">Select type</option>
                  <option value="EBM">EBM (Breast Milk)</option>
                  <option value="Formula">Formula</option>
                  <option value="IV_FLUIDS">IV Fluids</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Volumetric Quantity (ml)</label>
                <input
                  className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-bold text-zinc-900 dark:text-white placeholder:text-zinc-500"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="e.g. 50"
                  type="number"
                  min="0"
                  required
                />
              </div>
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
