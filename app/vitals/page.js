"use client"

import Layout from "../../components/layout"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"

export default function Vitals() {
  const { Toast, show } = useToast()

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
    <Layout>
      {Toast}
      <h2>Vitals</h2>

      <form onSubmit={submit}>
        <input name="patient" placeholder="Patient ID" required />
        <input name="hr" placeholder="Heart Rate" required />
        <input name="spo2" placeholder="SpO2" required />
        <button>Save</button>
      </form>
    </Layout>
  )
}
