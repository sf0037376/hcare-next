"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../../../lib/api"
import useToast from "../../../../components/toast"
import ProtectedRoute from "../../../../components/ProtectedRoute"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

export default function DischargeSummary() {
  const { id } = useParams()
  const router = useRouter()
  const { Toast, show } = useToast()
  
  const [patient, setPatient] = useState(null)
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const fullData = await apiFetch(`/patients/${id}/full-profile`)
        setPatient(fullData.patient)
        
        const latestVitals = fullData.vitals[0] || {}
        const meds = fullData.medication_schedule.map(m => m.medicine).join(", ")
        const lastFeed = fullData.feeding_logs[0] || {}
        
        // Auto-generate a rich summary using real clinical data
        const draft = `DISCHARGE SUMMARY: ${fullData.patient.name}
--------------------------------------------------
Clinical Course: Stable clinical condition observed during the stay.
Latest Vitals (at discharge): HR: ${latestVitals.hr || '--'} bpm, SpO2: ${latestVitals.spo2 || '--'}%.
Nutrition: Last feed recorded as ${lastFeed.type || '--'} (${lastFeed.quantity || '--'}ml).

Prescribed Medications on Discharge:
- ${meds || 'None'}

Advice:
- Continue above medications as scheduled.
- Maintain hygiene and monitor temperature.
- Follow-up in OPD after 1 week.`
        
        setSummary(draft)
      } catch (err) {
        show("Failed to load clinical profile")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, show])

  async function handleDischarge() {
    setSubmitting(true)
    try {
      await apiFetch(`/patients/${id}/discharge`, {
        method: "POST",
        body: JSON.stringify({ summary })
      })
      show("Patient discharged successfully!")
      setTimeout(() => router.push("/patients"), 2000)
    } catch (err) {
      show("Failed to complete discharge")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProtectedRoute roles={["admin"]}>
      <div className="animate-in fade-in duration-500 pb-safe max-w-2xl mx-auto">
        {Toast}
        
        <div className="mb-6">
          <Link href={`/patients/${id}/profile`} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-medium text-sm flex items-center gap-1 transition-colors">
            &larr; Back to Profile
          </Link>
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-4">Discharge Summary</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Finalize clinical notes for {patient?.name}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm">
          <div className="mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Patient Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Name</p>
                <p className="font-bold">{patient?.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Admission ID</p>
                <p className="font-bold">#ADM-{patient?.id}</p>
              </div>
            </div>
          </div>

          <div className="mb-8 text-zinc-900 dark:text-white">
            <label className="form-label mb-3">Clinical Summary & Advise</label>
            <textarea 
              className="form-input min-h-[200px] !py-4"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Enter detailed discharge instructions..."
            />
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleDischarge}
              disabled={submitting}
              className="btn-primary !py-4 w-full shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : "📜 Finalize & Discharge"}
            </button>
            <button 
              onClick={() => window.print()}
              className="py-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              🖨️ Print Preview
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
