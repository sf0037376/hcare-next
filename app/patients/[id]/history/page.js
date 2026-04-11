"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../../../lib/api"
import useToast from "../../../../components/toast"
import ProtectedRoute from "../../../../components/ProtectedRoute"
import Link from "next/link"
import { useParams } from "next/navigation"
import VaccinationCard from "../../../../components/VaccinationCard"

export default function PatientHistory() {
  const { id } = useParams()
  const { Toast, show } = useToast()
  const [patient, setPatient] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

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

  const filteredHistory = history.filter(item => {
    const itemDate = new Date(item.time).toISOString().split('T')[0]
    if (startDate && itemDate < startDate) return false
    if (endDate && itemDate > endDate) return false
    return true
  })

  const exportPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf")
      const { default: autoTable } = await import("jspdf-autotable")
      
      const doc = new jsPDF()
      
      // Header
      doc.setFontSize(22)
      doc.setTextColor(40, 44, 52)
      doc.text("NeoCare Clinical History Report", 14, 22)
      
      doc.setFontSize(12)
      doc.setTextColor(100)
      doc.text(`Patient: ${patient?.name || id}`, 14, 32)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38)
      if (startDate || endDate) {
        doc.text(`Range: ${startDate || 'Start'} to ${endDate || 'End'}`, 14, 44)
      }

      const tableData = filteredHistory.map(item => [
        new Date(item.time).toLocaleString(),
        item.type,
        item.summary,
        item.notes || "-",
        item.recorder || "-"
      ])

      autoTable(doc, {
        startY: 50,
        head: [['Time', 'Type', 'Summary', 'Notes', 'Staff']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillStyle: [59, 130, 246] }, // NeoCare Blue
        styles: { fontSize: 9 }
      })

      doc.save(`NeoCare_History_${patient?.name || id}_${new Date().toISOString().split('T')[0]}.pdf`)
      show("PDF report generated successfully", { variant: "success" })
    } catch (err) {
      console.error("PDF generation failed:", err)
      show("Failed to generate PDF. Ensure jspdf is installed.", { variant: "error" })
    }
  }

  const exportCSV = () => {
    try {
      const headers = ["Time", "Type", "Summary", "Notes", "Staff"]
      const rows = filteredHistory.map(item => [
        `"${new Date(item.time).toLocaleString()}"`,
        `"${item.type}"`,
        `"${item.summary}"`,
        `"${item.notes || ''}"`,
        `"${item.recorder || ''}"`
      ])
      
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `NeoCare_History_${patient?.name || id}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      show("CSV export downloaded")
    } catch (err) {
      show("CSV export failed")
    }
  }

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
            </div>
          </div>
        </div>

        <div className="mb-8 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">From Date</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all px-4 py-2"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">To Date</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all px-4 py-2"
              />
            </div>
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(""); setEndDate(""); }}
                className="mt-6 text-zinc-400 hover:text-zinc-600 text-xs font-bold uppercase tracking-wider underline"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={exportCSV}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-2"
            >
              📊 Export CSV
            </button>
            <button 
              onClick={exportPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2"
            >
              📄 Download PDF
            </button>
          </div>
        </div>

        <VaccinationCard patientId={id} />

        <div className="space-y-6 relative before:absolute before:left-8 before:top-2 before:bottom-2 before:w-px before:bg-zinc-200 dark:before:bg-zinc-800">
          {filteredHistory.map((item, idx) => (
            <div key={`${item.type}-${item.id || idx}`} className="relative pl-16 group">
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
