"use client"

import { useSearchParams } from "next/navigation"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"

export default function Feeding() {
  const { Toast, show } = useToast()
  const searchParams = useSearchParams()
  const initialPatientId = searchParams.get("patient_id") || ""

  async function submit(e) {
    e.preventDefault()

    const body = {
      patient_id: e.target.patient.value,
      type: e.target.type.value,
      quantity: e.target.quantity.value,
    }

    await apiFetch("/feeding/feeding", {
      method: "POST",
      body: JSON.stringify(body),
    })
    show("Feeding saved")
  }

  return (
    <ProtectedRoute>
      <div className="page">
        {Toast}
        <h2 className="page-title">Feeding</h2>

        <form onSubmit={submit} className="form">
          <input
            name="patient"
            placeholder="Patient ID"
            defaultValue={initialPatientId}
            required
          />
          <input name="type" placeholder="Type" required />
          <input name="quantity" placeholder="Quantity" required />
          <button type="submit">Save</button>
        </form>
      </div>
    </ProtectedRoute>
  )
}
