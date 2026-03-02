"use client"

import { useSearchParams } from "next/navigation"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"

export default function Vitals() {
  const { Toast, show } = useToast()
  const searchParams = useSearchParams()
  const initialPatientId = searchParams.get("patient_id") || ""

  async function submit(e) {
    e.preventDefault()

    const body = {
      patient_id: e.target.patient.value,
      hr: e.target.hr.value,
      spo2: e.target.spo2.value,
    }

    await apiFetch("/vitals", { method: "POST", body: JSON.stringify(body) })
    show("Vitals saved")
  }

  return (
    <ProtectedRoute>
      <div className="page">
        {Toast}
        <h2 className="page-title">Vitals</h2>

        <form onSubmit={submit} className="form">
          <input
            name="patient"
            placeholder="Patient ID"
            defaultValue={initialPatientId}
            required
          />
          <input name="hr" placeholder="Heart Rate" required />
          <input name="spo2" placeholder="SpO2" required />
          <button type="submit">Save</button>
        </form>
      </div>
    </ProtectedRoute>
  )
}
