"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"

export default function PatientsPage() {
  const { Toast, show } = useToast()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadPatients() {
    try {
      const data = await apiFetch("/patients")
      setPatients(Array.isArray(data) ? data : [])
    } catch (e) {
      show("Failed to load patients")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [])

  async function createPatient(e) {
    e.preventDefault()
    const body = {
      name: e.target.name.value,
      dob: e.target.dob.value,
      gender: e.target.gender.value,
    }

    try {
      await apiFetch("/patients", {
        method: "POST",
        body: JSON.stringify(body),
      })
      show("Patient created")
      e.target.reset()
      loadPatients()
    } catch (e) {
      show("Failed to create patient")
    }
  }

  return (
    <ProtectedRoute>
      <div className="page">
        {Toast}
        <h2 className="page-title">Patients</h2>

        <form onSubmit={createPatient} className="form">
          <input name="name" placeholder="Name" required />
          <input name="dob" type="date" placeholder="Date of Birth" required />
          <select name="gender" defaultValue="M">
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
          <button type="submit">Create Patient</button>
        </form>

        {loading ? (
          <p>Loading patients...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>DOB</th>
                  <th>Gender</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.dob}</td>
                    <td>{p.gender}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

