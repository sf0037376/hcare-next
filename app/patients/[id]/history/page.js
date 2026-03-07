"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../../../lib/api"
import useToast from "../../../../components/toast"
import ProtectedRoute from "../../../../components/ProtectedRoute"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function PatientHistory() {
  const { id } = useParams()
  const { Toast, show } = useToast()
  const [patient, setPatient] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHistory() {
      try {
        const profileData = await apiFetch(`/patients/${id}/full-profile`)
        setPatient(profileData.patient)
        
        const combined = [
          ...profileData.vitals.map(v => ({ ...v, type: 'VITALS', summary: `Vitals logged: HR ${v.hr || '--'}, SpO2 ${v.spo2 || '--'}%`, time: v.recorded_at })),
          ...profileData.medication_logs.map(m => ({ ...m, type: 'MEDICATION', summary: `${m.medicine} - ${m.dosage || m.dose} administered`, time: m.recorded_at })),
          ...profileData.feeding_logs.map(f => ({ ...f, type: 'FEEDING', summary: `${f.type} Feed - ${f.quantity}ml logged`, time: f.recorded_at }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time))

        setHistory(combined)
      } catch (err) {
        show("Failed to load patient history")
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
  }, [id, show])

  return (
    <ProtectedRoute roles={["admin", "doctor", "nurse", "patient"]}>
      <div className="animate-in fade-in duration-500 pb-safe max-w-4xl mx-auto">
        {Toast}
        
        <div className="mb-8">
          <Link href={`/patients/${id}/profile`} className="text-zinc-500 hover:text-blue-600 transition-colors text-sm font-semibold flex items-center gap-1">
            &larr; Back to Profile
          </Link>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Patient Clinical History</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Full clinical timeline for {patient?.name || `Patient #${id}`}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 relative before:absolute before:left-8 before:top-2 before:bottom-2 before:w-px before:bg-zinc-200 dark:before:bg-zinc-800">
          {history.map(item => (
            <div key={item.id} className="relative pl-16 group">
              {/* Dot */}
              <div className={`absolute left-[30px] top-4 w-4 h-4 rounded-full border-4 border-white dark:border-zinc-900 group-hover:scale-125 transition-transform z-10 ${
                item.urgent ? 'bg-red-500 shadow-red-500/40' : 'bg-blue-500'
              }`} />
              
              <div className={`bg-white dark:bg-zinc-900 border ${item.urgent ? 'border-red-200 dark:border-red-900/40 bg-red-50/30' : 'border-zinc-200 dark:border-zinc-800'} rounded-3xl p-6 shadow-sm`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                      item.type === 'VITALS' ? 'bg-blue-100 text-blue-600' :
                      item.type === 'MEDICATION' ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {item.type}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                      {new Date(item.time).toLocaleString()}
                    </span>
                  </div>
                  {item.urgent && (
                    <span className="text-xs font-bold text-red-600 flex items-center gap-1 uppercase italic">
                      ⚠️ High Priority Alert
                    </span>
                  )}
                </div>
                
                <h4 className="font-bold text-lg mb-2 text-zinc-900 dark:text-white">{item.summary}</h4>
                {item.notes && <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">"{item.notes}"</p>}
                {item.recorder && <p className="mt-4 text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Logged by: {item.recorder}</p>}
              </div>
            </div>
          ))}

          {history.length === 0 && !loading && (
            <div className="text-center py-20">
              <p className="text-zinc-500 font-medium">No medical history available yet.</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
