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
  const [role, setRole] = useState("")

  const [patients, setPatients] = useState([])
  const [patientMeds, setPatientMeds] = useState([])
  const [form, setForm] = useState({
    patient_id: initialPatientId,
    medicine: "",
    dose: "",
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

    try {
      await apiFetch("/medication/medication", {
        method: "POST",
        body: JSON.stringify({
          patient_id: form.patient_id,
          scheduleId: form.scheduleId || null,
          medicine: form.medicine,
          dose: form.dose,
          recorded_at: form.recorded_at
        }),
      })
      show("Medication administration logged")
      setTimeout(() => router.back(), 1500)
    } catch (err) {
      show("Failed to log medication")
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
          <h2 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase italic">Administer Medication</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">Log a new medication dose with precision and care.</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.05] dark:opacity-[0.08] pointer-events-none group-hover:scale-125 transition-transform duration-1000">
            <span className="text-[12rem]">💊</span>
          </div>
          
          <form onSubmit={submit} className="relative z-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Patient Context</label>
                {role === 'patient' ? (
                  <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 font-bold text-zinc-900 dark:text-white">
                    Logged in as Patient #{form.patient_id}
                  </div>
                ) : (
                  <select
                    className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-bold text-zinc-900 dark:text-white appearance-none"
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
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Administration Timeline</label>
                <input
                  type="datetime-local"
                  className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-bold text-zinc-900 dark:text-white"
                  value={form.recorded_at}
                  onChange={(e) => setForm({ ...form, recorded_at: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Medication Identity</label>
                {patientMeds.length > 0 ? (
                  <select
                    className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-bold text-zinc-900 dark:text-white appearance-none"
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
                    <option value="">-- Select Prescribed Medicine --</option>
                    {patientMeds.map(m => (
                      <option key={m.id} value={m.medicine}>{m.medicine}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-bold text-zinc-900 dark:text-white placeholder:text-zinc-500"
                    value={form.medicine}
                    onChange={(e) => setForm({ ...form, medicine: e.target.value })}
                    placeholder={form.patient_id ? "No prescriptions found. Enter manually..." : "Select a patient first"}
                    required
                  />
                )}
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Dosage Specification</label>
                <input
                  className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-bold text-zinc-900 dark:text-white placeholder:text-zinc-500"
                  value={form.dose}
                  onChange={(e) => setForm({ ...form, dose: e.target.value })}
                  placeholder="e.g. 5ml or 1 Tablet"
                  required
                />
              </div>
            </div>

            <div className="pt-10 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button 
                type="submit"
                className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black uppercase text-xs tracking-[0.25em] rounded-2xl shadow-xl shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                Execute Log →
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
