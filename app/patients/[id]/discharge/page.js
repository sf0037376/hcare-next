"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { apiFetch } from "../../../lib/api"
import useToast from "../../../components/toast"

export default function FinalizeDischarge() {
  const { id } = useParams()
  const router = useRouter()
  const { Toast, show } = useToast()
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(false)
  const [patient, setPatient] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch(`/patients/${id}`)
        setPatient(data)
      } catch (e) {
        show("Failed to load patient data")
      }
    }
    load()
  }, [id, show])

  async function handleDischarge(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await apiFetch(`/patients/${id}/discharge`, {
        method: "POST",
        body: JSON.stringify({ summary })
      })
      show("Patient successfully discharged")
      setTimeout(() => router.push(`/patients/${id}/profile`), 1500)
    } catch (err) {
      show(err.message || "Final discharge failed")
    } finally {
      setLoading(false)
    }
  }

  if (!patient) return null

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 sm:p-12 flex items-center justify-center">
      {Toast}
      <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-8 sm:p-12 shadow-2xl">
        <h1 className="text-4xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic mb-2">Finalize Discharge</h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-10">Patient: {patient.name} (#{patient.id})</p>

        <form onSubmit={handleDischarge} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400" htmlFor="summary">Discharge Summary & Instructions</label>
            <textarea
              id="summary"
              required
              aria-label="Discharge Summary"
              className="w-full px-6 py-5 bg-zinc-50 dark:bg-zinc-800/80 rounded-3xl border border-zinc-100 dark:border-zinc-800 font-bold text-sm min-h-[200px] focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all"
              placeholder="Enter final clinical summary and follow-up instructions..."
              value={summary}
              onChange={e => setSummary(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="flex-1 py-5 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-[2] py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all"
            >
              {loading ? "Processing..." : "Confirm Final Discharge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
