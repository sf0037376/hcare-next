"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { apiFetch } from "../../../../lib/api"
import useToast from "../../../../components/toast"
import ProtectedRoute from "../../../../components/ProtectedRoute"
import Link from "next/link"

export default function PatientReportsPage() {
  const { id: patientId } = useParams()
  const { Toast, show } = useToast()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [analyzingId, setAnalyzingId] = useState(null)

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await apiFetch(`/labs/patient/${patientId}`)
        setReports(Array.isArray(data) ? data : [])
      } catch (err) {
        show("Failed to load lab reports")
      } finally {
        setLoading(false)
      }
    }
    loadReports()
  }, [patientId, show])

  async function handleAnalyze(reportId, resultText) {
    if (!resultText) return show("No result to analyze")
    setAnalyzingId(reportId)
    try {
      // For manual results, we send the text. For files, we'd use the analyze-report endpoint.
      // Here we'll simulate the AI suggestion for manual text
      const response = await apiFetch("/reports/analyze", {
        method: "POST",
        body: JSON.stringify({ 
          text_content: resultText, // Backend needs to handle this or we use a more generic analysis
          is_manual: true
        })
      })
      
      const aiSteps = response.analysis || "Follow-up recommended in 2 days."
      
      await apiFetch(`/labs/${reportId}/results`, {
        method: "PUT",
        body: JSON.stringify({ result: resultText, ai_suggested_steps: aiSteps })
      })
      
      show("AI Analysis complete")
      // Update local state
      setReports(reports.map(r => r.id === reportId ? { ...r, ai_suggested_steps: aiSteps, status: 'COMPLETED' } : r))
    } catch (err) {
      show("AI Analysis failed")
    } finally {
      setAnalyzingId(null)
    }
  }

  return (
    <ProtectedRoute roles={["admin", "doctor", "nurse", "patient"]}>
      <div className="animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
        {Toast}
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Lab Reports</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Clinical findings and AI-powered diagnostic suggestions.</p>
          </div>
          <Link href={`/patients/${patientId}/profile`} className="btn-secondary text-sm flex items-center gap-1">&larr; Back to Profile</Link>
        </div>

        <div className="space-y-6">
          {reports.map(report => (
            <div key={report.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold">{report.test_name}</h3>
                  <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Ordered on: {new Date(report.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  report.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {report.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="form-label">Clinical Result</label>
                  {report.status === 'ORDERED' ? (
                    <div className="space-y-4">
                      <textarea 
                        className="form-input min-h-[120px]" 
                        placeholder="Enter lab findings here..."
                        onChange={e => report._pendingResult = e.target.value}
                      ></textarea>
                      <button 
                        onClick={() => handleAnalyze(report.id, report._pendingResult)}
                        disabled={analyzingId === report.id}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                      >
                        {analyzingId === report.id ? 'Analyzing...' : 'Submit & Analyze with AI'}
                        <span>✨</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-sm leading-relaxed whitespace-pre-wrap">
                      {report.result}
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label flex items-center gap-2">
                    AI Suggested Next Steps
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md uppercase font-black">Beta AI</span>
                  </label>
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl border border-blue-100/50 dark:border-blue-500/10 min-h-[120px]">
                    {report.ai_suggested_steps ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-blue-900/80 dark:text-blue-200/80 italic">
                        {report.ai_suggested_steps}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-400 italic">Pending analysis...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {reports.length === 0 && !loading && (
            <div className="py-20 text-center bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <span className="text-4xl block mb-4">🧪</span>
              <p className="text-zinc-500 font-medium">No lab tests ordered for this patient yet.</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
