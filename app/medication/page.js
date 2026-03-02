"use client"

import { useSearchParams } from "next/navigation"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"

export default function Medication() {
  const { Toast, show } = useToast()
  const searchParams = useSearchParams()
  const initialPatientId = searchParams.get("patient_id") || ""

  async function submit(e) {
    e.preventDefault()

    const body = {
      patient_id: e.target.patient.value,
      medicine: e.target.medicine.value,
      dose: e.target.dose.value,
    }

    await apiFetch("/medication/medication", {
      method: "POST",
      body: JSON.stringify(body),
    })
    show("Medication saved")
  }

  return (
    <ProtectedRoute>
      <div className="page">
        {Toast}
        <h2 className="page-title">Medication</h2>

        <form onSubmit={submit} className="form">
          <input
            name="patient"
            placeholder="Patient ID"
            defaultValue={initialPatientId}
            required
          />
          <input name="medicine" placeholder="Medicine" required />
          <input name="dose" placeholder="Dose" required />
          <button type="submit">Save</button>
        </form>
      </div>
    </ProtectedRoute>
  )
}
