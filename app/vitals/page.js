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
      <div className="animate-in fade-in duration-500 max-w-2xl mx-auto pb-safe">
        {Toast}
        
        <div className="mb-6">
          <Link href={dashboardLink} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-medium text-sm flex items-center gap-1 transition-colors">
            &larr; Back to Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Log Vitals</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Record neonatal vitals and measurements.</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-5 pointer-events-none">
            <span className="text-9xl">❤️</span>
          </div>
          
          {role === 'doctor' ? (
            <div className="relative z-10 py-12 text-center">
              <span className="text-4xl mb-4 block">⚕️</span>
              <p className="text-zinc-500 font-medium">Doctors can prescribe medications and view patient history.</p>
              <p className="text-sm text-zinc-400 mt-2">Vitals entry is restricted to Nursing and Staff personnel.</p>
            </div>
          ) : (
          <form onSubmit={submit} className="relative z-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Select Patient</label>
                {role === 'patient' ? (
                  <div className="form-input bg-zinc-50 dark:bg-zinc-800/50 font-bold text-zinc-900 dark:text-white">
                    Logged in as Patient #{form.patient_id}
                  </div>
                ) : (
                  <select
                    className="form-input"
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
              <div>
                <label className="form-label">Time of Recording</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={form.recorded_at}
                  onChange={(e) => setForm({ ...form, recorded_at: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="form-label">Heart Rate (bpm)</label>
                <input
                  type="number"
                  className="form-input border-red-200 dark:border-red-900/30"
                  value={form.hr}
                  onChange={(e) => setForm({ ...form, hr: e.target.value })}
                  placeholder="e.g. 140"
                />
              </div>
              <div className="col-span-2">
                <label className="form-label">SpO2 (%)</label>
                <input
                  type="number"
                  className="form-input border-blue-200 dark:border-blue-900/30"
                  value={form.spo2}
                  onChange={(e) => setForm({ ...form, spo2: e.target.value })}
                  placeholder="e.g. 98"
                />
              </div>
              <div className="col-span-2">
                <label className="form-label">Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input border-emerald-200 dark:border-emerald-900/30"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  placeholder="e.g. 2.5"
                />
              </div>
              <div className="col-span-2">
                <label className="form-label">Head Circ (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input border-purple-200 dark:border-purple-900/30"
                  value={form.head}
                  onChange={(e) => setForm({ ...form, head: e.target.value })}
                  placeholder="e.g. 33.5"
                />
              </div>
              <div className="col-span-2">
                <label className="form-label">Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input border-zinc-200 dark:border-zinc-800"
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                  placeholder="e.g. 170"
                />
              </div>
              <div className="col-span-2">
                <label className="form-label">BMI (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input bg-zinc-50 dark:bg-zinc-800/50"
                  value={form.bmi}
                  onChange={(e) => setForm({ ...form, bmi: e.target.value })}
                  placeholder="Auto-calculated"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Clinical Notes / Observation</label>
              <textarea
                className="form-input min-h-[100px] resize-none"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Auto-generated notes will appear here, or type manually..."
              />
            </div>
            
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button 
                type="submit"
                disabled={submitting}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Save Vitals Record"}
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
