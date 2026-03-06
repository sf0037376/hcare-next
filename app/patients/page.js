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
      <div className="animate-in fade-in duration-500">
        {Toast}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Patients Directory</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage and register new patients in the system.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Create Patient Form */}
          <div className="xl:col-span-1">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm top-24 sticky">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="text-blue-500">➕</span> Register Patient
              </h3>
              
              <form onSubmit={createPatient} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Full Name</label>
                  <input
                    className="block w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                    name="name"
                    placeholder="Enter patient name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Date of Birth</label>
                  <input
                    className="block w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                    name="dob"
                    type="date"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Gender</label>
                  <select
                    className="block w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                    name="gender"
                    defaultValue="M"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
                
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button 
                    type="submit"
                    className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    Register Patient
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Patients List */}
          <div className="xl:col-span-2">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">All Patients</h3>
              </div>
              
              {loading ? (
                <div className="p-8 pb-12 flex flex-col items-center justify-center text-zinc-500">
                  <div className="w-8 h-8 border-4 border-zinc-200 dark:border-zinc-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                  <p>Loading patient directory...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-900/50">ID</th>
                        <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-900/50">Patient Name</th>
                        <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-900/50">Date of Birth</th>
                        <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-900/50">Gender</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {patients.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">
                            <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-xs">#{p.id}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                              {p.name.charAt(0)}
                            </div>
                            {p.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">{p.dob}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                            {p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : 'Other'}
                          </td>
                        </tr>
                      ))}
                      {patients.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center text-sm text-zinc-500">
                            No patients found in the system. Register a new patient to get started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

