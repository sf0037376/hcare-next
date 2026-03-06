"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"
import Link from "next/link"

export default function Feeding() {
  const { Toast, show } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPatientId = searchParams.get("patient_id") || ""

  const [patients, setPatients] = useState([])
  const [form, setForm] = useState({
    patient_id: initialPatientId,
    type: "",
    quantity: "",
    recorded_at: new Date().toISOString().slice(0, 16)
  })

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

  const role = typeof window !== "undefined" ? (localStorage.getItem("role") || "").toLowerCase() : ""
  const dashboardLink = role === "doctor" ? "/doctor-dashboard" : role === "nurse" || role === "staff" ? "/staff-dashboard" : "/dashboard"

  return (
    <ProtectedRoute roles={["admin", "doctor", "nurse"]}>
      <div className="animate-in fade-in duration-500 max-w-2xl mx-auto pb-safe">
        {Toast}

        <div className="mb-6">
          <Link href={dashboardLink} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-medium text-sm flex items-center gap-1 transition-colors">
            &larr; Back to Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Log Feeding</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Record a patient's recent feeding session.</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-5 pointer-events-none">
            <span className="text-9xl">🍼</span>
          </div>
          
          <form onSubmit={submit} className="relative z-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Select Patient</label>
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
              </div>
              <div>
                <label className="form-label">Time of Feeding</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={form.recorded_at}
                  onChange={(e) => setForm({ ...form, recorded_at: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Feed Type</label>
                <select
                  className="form-input"
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
              
              <div>
                <label className="form-label">Quantity (ml)</label>
                <input
                  className="form-input"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="e.g. 50"
                  type="number"
                  min="0"
                  required
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button 
                type="submit"
                className="w-full btn-primary !bg-orange-500 hover:!bg-orange-600 shadow-orange-500/20"
              >
                Save Feeding Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}
