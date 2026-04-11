"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../lib/api"
import useToast from "./toast"

export default function VaccinationCard({ patientId }) {
  const { Toast, show } = useToast()
  const [logs, setLogs] = useState([])
  const [master, setMaster] = useState([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState("")
  const [filterStatus, setFilterStatus] = useState("all") // all, done, due, pending

  useEffect(() => {
    setRole((localStorage.getItem("role") || "").toLowerCase())
    loadData()
  }, [patientId])

  async function loadData() {
    try {
      setLoading(true)
      const logsData = await apiFetch(`/vaccination/patient/${patientId}`)
      const masterData = await apiFetch(`/vaccination/master`)
      setLogs(logsData || [])
      setMaster(masterData || [])
    } catch (err) {
      show("Failed to load vaccination data")
    } finally {
      setLoading(false)
    }
  }

  // Get pending vaccines (from master but not in logs)
  const getPendingVaccines = () => {
    return master.filter(m => !logs.find(l => l.vaccine_id === m.id))
  }

  const handlePrescribeAll = async () => {
    const pendingVaccines = getPendingVaccines()
    if (pendingVaccines.length === 0) {
      show("All standard vaccines already prescribed")
      return
    }

    const newPrescriptions = pendingVaccines.map(m => {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + m.default_due_days)
      return { vaccine_id: m.id, due_date: dueDate.toISOString().split('T')[0] }
    })

    try {
      await apiFetch(`/vaccination/prescribe`, {
        method: "POST",
        body: JSON.stringify({ patient_id: patientId, vaccines: newPrescriptions })
      })
      show("Standard vaccination schedule generated", { variant: "success" })
      loadData()
    } catch (err) {
      show("Failed to prescribe vaccinations")
    }
  }

  const handlePrescribeOne = async (vaccine) => {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + vaccine.default_due_days)

    try {
      await apiFetch(`/vaccination/prescribe`, {
        method: "POST",
        body: JSON.stringify({
          patient_id: patientId,
          vaccines: [{ vaccine_id: vaccine.id, due_date: dueDate.toISOString().split('T')[0] }]
        })
      })
      show(`${vaccine.vaccine_name} prescribed`, { variant: "success" })
      loadData()
    } catch (err) {
      show("Failed to prescribe vaccination")
    }
  }

  const handleLogGiven = async (id) => {
    try {
      await apiFetch(`/vaccination/log/${id}`, {
        method: "PUT",
        body: JSON.stringify({ given_date: new Date().toISOString().split('T')[0] })
      })
      show("Vaccination logged as given", { variant: "success" })
      loadData()
    } catch (err) {
      show("Failed to log vaccination")
    }
  }

  const doneVaccines = logs.filter(l => l.status === 'DONE')
  const dueVaccines = logs.filter(l => l.status === 'DUE')
  const pendingVaccines = logs.filter(l => l.status === 'PENDING')
  const notPrescribedVaccines = getPendingVaccines()

  let filteredLogs = []
  if (filterStatus === 'done') filteredLogs = doneVaccines
  else if (filterStatus === 'due') filteredLogs = dueVaccines
  else if (filterStatus === 'pending') filteredLogs = pendingVaccines
  else filteredLogs = [...doneVaccines, ...dueVaccines, ...pendingVaccines]

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden mb-8 p-6">
      {Toast}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">💉 Vaccination Record</h3>
          <p className="text-sm text-zinc-500">Prescribed: {doneVaccines.length + dueVaccines.length + pendingVaccines.length} | Done: {doneVaccines.length} | Due: {dueVaccines.length} | Pending: {pendingVaccines.length}</p>
        </div>
        {role === "doctor" && (
          <button 
            onClick={handlePrescribeAll}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors whitespace-nowrap"
          >
            + Prescribe All Standard
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-zinc-500 text-center py-8">Loading vaccination data...</div>
      ) : (
        <>
          {filteredLogs.length > 0 || logs.length > 0 ? (
            <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 text-sm font-bold transition-colors ${filterStatus === "all" ? "text-blue-600 border-b-2 border-blue-600" : "text-zinc-600 dark:text-zinc-400"}`}
              >
                All ({doneVaccines.length + dueVaccines.length + pendingVaccines.length})
              </button>
              <button
                onClick={() => setFilterStatus("done")}
                className={`px-4 py-2 text-sm font-bold transition-colors ${filterStatus === "done" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-zinc-600 dark:text-zinc-400"}`}
              >
                Done ({doneVaccines.length})
              </button>
              <button
                onClick={() => setFilterStatus("due")}
                className={`px-4 py-2 text-sm font-bold transition-colors ${filterStatus === "due" ? "text-red-600 border-b-2 border-red-600" : "text-zinc-600 dark:text-zinc-400"}`}
              >
                Due ({dueVaccines.length})
              </button>
              <button
                onClick={() => setFilterStatus("pending")}
                className={`px-4 py-2 text-sm font-bold transition-colors ${filterStatus === "pending" ? "text-amber-600 border-b-2 border-amber-600" : "text-zinc-600 dark:text-zinc-400"}`}
              >
                Pending ({pendingVaccines.length})
              </button>
            </div>
          ) : null}

          {/* Prescribed Vaccinations Table */}
          {filteredLogs.length > 0 ? (
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                    <th className="py-3 px-4 text-xs font-bold text-zinc-500 uppercase">Vaccine</th>
                    <th className="py-3 px-4 text-xs font-bold text-zinc-500 uppercase">Disease</th>
                    <th className="py-3 px-4 text-xs font-bold text-zinc-500 uppercase">Due Date</th>
                    <th className="py-3 px-4 text-xs font-bold text-zinc-500 uppercase">Status</th>
                    <th className="py-3 px-4 text-xs font-bold text-zinc-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => {
                    const isDone = log.status === 'DONE'
                    const isDue = log.status === 'DUE'
                    return (
                      <tr key={log.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                        <td className="py-4 px-4">
                          <p className="font-bold text-sm text-zinc-900 dark:text-white">{log.vaccine_name}</p>
                          <p className="text-xs text-zinc-500">{log.dose_number}</p>
                        </td>
                        <td className="py-4 px-4 text-sm text-zinc-600 dark:text-zinc-400">{log.disease}</td>
                        <td className="py-4 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                          {new Date(log.due_date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-sm">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${isDone ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : isDue ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                            {isDone ? '✓ Done' : isDue ? '⚠️ Due' : '⏳ Pending'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          {!isDone && (role === "doctor" || role === "nurse" || role === "patient") ? (
                            <button 
                              onClick={() => handleLogGiven(log.id)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 rounded-lg text-xs font-bold transition-all"
                            >
                              Mark Done
                            </button>
                          ) : isDone ? (
                            <span className="text-zinc-500 text-xs font-medium">
                              {new Date(log.given_date).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-zinc-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            filteredLogs.length === 0 && logs.length > 0 && (
              <div className="text-center py-8 text-zinc-500">No {filterStatus} vaccinations</div>
            )
          )}

          {/* Not Yet Prescribed Vaccines */}
          {role === "doctor" && notPrescribedVaccines.length > 0 && (
            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">📋 Available to Prescribe</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {notPrescribedVaccines.map(vaccine => (
                  <div key={vaccine.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{vaccine.vaccine_name}</p>
                      <p className="text-xs text-zinc-500">{vaccine.disease}</p>
                    </div>
                    <button
                      onClick={() => handlePrescribeOne(vaccine)}
                      className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 rounded-lg text-xs font-bold transition-all whitespace-nowrap"
                    >
                      Prescribe
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {logs.length === 0 && notPrescribedVaccines.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <span className="text-4xl block mb-2">💉</span>
              <p>No vaccinations prescribed yet</p>
              {role === "doctor" && (
                <p className="text-xs mt-2">Click "Prescribe All Standard" to add standard vaccination schedule</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
