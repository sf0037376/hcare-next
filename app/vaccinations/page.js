'use client'

import { useState, useEffect } from "react"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"
import VaccinationCard from "../../components/VaccinationCard"
import { useSearchParams } from "next/navigation"

export default function VaccinationsPage() {
  const { Toast, show } = useToast()
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patient_id')

  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(patientId || "")
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('')

  useEffect(() => {
    setRole((localStorage.getItem('role') || '').toLowerCase())
    loadPatients()
  }, [])

  async function loadPatients() {
    try {
      setLoading(true)
      const data = await apiFetch('/patients')
      setPatients(data || [])
    } catch (err) {
      show("Failed to load patients")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 pb-24 max-w-7xl mx-auto px-4 sm:px-6">
        {Toast}

        <div className="mb-8">
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">💉 Vaccination Management</h1>
          <p className="text-zinc-500">Track and manage patient immunization records</p>
        </div>

        {/* Patient Selector */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 mb-8">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Select Patient</h3>
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a patient...</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.name} (ID: {patient.id})
              </option>
            ))}
          </select>
        </div>

        {/* Vaccination Card */}
        {selectedPatient && (
          <VaccinationCard patientId={selectedPatient} />
        )}

        {!selectedPatient && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
            <span className="text-6xl mb-4 block">💉</span>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Select a Patient</h3>
            <p className="text-zinc-500">Choose a patient from the dropdown above to view their vaccination records</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}