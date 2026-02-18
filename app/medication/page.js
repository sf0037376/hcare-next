"use client"

import Layout from "../../components/layout"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"

export default function Medication() {
  const { Toast, show } = useToast()

  async function submit(e) {
    e.preventDefault()

    const body = {
      patient_id: e.target.patient.value,
      medicine: e.target.medicine.value,
      dose: e.target.dose.value,
    }

    await apiFetch("/medication", { method: "POST", body: JSON.stringify(body) })
    show("Medication saved")
  }

  return (
    <Layout>
      {Toast}
      <h2>Medication</h2>

      <form onSubmit={submit}>
        <input name="patient" placeholder="Patient ID" required />
        <input name="medicine" placeholder="Medicine" required />
        <input name="dose" placeholder="Dose" required />
        <button>Save</button>
      </form>
    </Layout>
  )
}
