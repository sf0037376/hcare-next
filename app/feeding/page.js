"use client"

import Layout from "../../components/layout"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"

export default function Feeding() {
  const { Toast, show } = useToast()

  async function submit(e) {
    e.preventDefault()

    const body = {
      patient_id: e.target.patient.value,
      type: e.target.type.value,
      quantity: e.target.quantity.value,
    }

    await apiFetch("/feeding", { method: "POST", body: JSON.stringify(body) })
    show("Feeding saved")
  }

  return (
    <Layout>
      {Toast}
      <h2>Feeding</h2>

      <form onSubmit={submit}>
        <input name="patient" placeholder="Patient ID" required />
        <input name="type" placeholder="Type" required />
        <input name="quantity" placeholder="Quantity" required />
        <button>Save</button>
      </form>
    </Layout>
  )
}
