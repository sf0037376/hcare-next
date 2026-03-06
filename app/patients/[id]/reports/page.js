"use client"

import { useState, useRef, use } from "react"
import { apiFetch } from "../../../../lib/api"
import useToast from "../../../../components/toast"
import ProtectedRoute from "../../../../components/ProtectedRoute"
import Link from "next/link"

export default function PatientReports({ params }) {
  const unwrappedParams = use(params)
  const patientId = unwrappedParams.id
  
  const { Toast, show } = useToast()
  const [file, setFile] = useState(null)
  const [reportType, setReportType] = useState("General Lab Report")
  const [uploading, setUploading] = useState(false)
  const [analysis, setAnalysis] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setAnalysis("") // Clear previous analysis
    }
  }

  const handleUploadAndAnalyze = async (e) => {
    e.preventDefault()
    
    if (!file) {
      show("Please select a file first")
      return
    }

    setUploading(true)
    let uploadedFilename = ""

    // 1. Upload the file
    try {
      const formData = new FormData()
      formData.append("report", file)
      formData.append("patient_id", patientId)
      formData.append("report_type", reportType)

      // Get the token since we are using FormData and not our standard apiFetch
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''

      const uploadRes = await fetch('http://localhost:5000/reports/upload', {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      })

      if (!uploadRes.ok) throw new Error("Upload failed")
      
      const uploadData = await uploadRes.json()
      uploadedFilename = uploadData.fileName
      show("Report uploaded successfully. Starting analysis...")
      
    } catch (err) {
      console.error(err)
      show("Failed to upload report")
      setUploading(false)
      return
    }

    // 2. Analyze the file
    setUploading(false)
    setAnalyzing(true)
    
    try {
      const analysisData = await apiFetch("/reports/analyze", {
        method: "POST",
        body: JSON.stringify({
          filename: uploadedFilename,
          patient_id: patientId
        })
      })

      setAnalysis(analysisData.analysis)
      show("Analysis complete")
    } catch (err) {
      console.error(err)
      show("AI Analysis failed or timed out")
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
        {Toast}
        
        <div className="mb-6 flex items-center justify-between">
          <Link href={`/dashboard?patient_id=${patientId}`} className="text-blue-500 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
            &larr; Back to Patient
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">AI Report Analysis</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Upload clinical lab reports or documents for AI-assisted insights.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Upload Section */}
          <div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Upload Document</h3>
              
              <form onSubmit={handleUploadAndAnalyze} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Report Type</label>
                  <select
                    className="block w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option value="General Lab Report">General Lab Report</option>
                    <option value="Blood Test (CBC)">Blood Test (CBC)</option>
                    <option value="X-Ray Scan">X-Ray / Scan</option>
                    <option value="Discharge Summary">Discharge Summary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Select File (PDF, PNG, JPG)</label>
                  <div 
                    className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-8 text-center bg-zinc-50 dark:bg-zinc-950/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                    
                    <div className="text-4xl mb-3">📄</div>
                    {file ? (
                      <p className="font-semibold text-blue-600 dark:text-blue-400 break-all">{file.name}</p>
                    ) : (
                      <p className="text-zinc-500 font-medium">Click to browse files</p>
                    )}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={uploading || analyzing || !file}
                  className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {uploading ? "Uploading..." : analyzing ? "Analyzing with AI..." : "Upload & Analyze"}
                </button>
              </form>
            </div>
          </div>

          {/* Analysis View */}
          <div>
            <div className={`h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm flex flex-col overflow-hidden transition-all duration-300 ${analyzing ? 'ring-2 ring-blue-500 shadow-blue-500/20' : ''}`}>
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <span className="text-blue-500">✨</span> AI Analysis
                </h3>
              </div>
              
              <div className="p-6 flex-1 bg-zinc-50/30 dark:bg-zinc-950/30 relative">
                {analyzing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm z-10">
                    <div className="w-12 h-12 border-4 border-zinc-200 dark:border-zinc-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="font-medium animate-pulse text-blue-600 dark:text-blue-400">Processing medical data...</p>
                  </div>
                ) : analysis ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none 
                    prose-headings:text-zinc-800 dark:prose-headings:text-zinc-200
                    prose-a:text-blue-600 prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100">
                    {/* Basic Markdown Rendering */}
                    {analysis.split('\n').map((line, i) => {
                      if (line.startsWith('###')) return <h4 key={i} className="mt-4 mb-2">{line.replace('###', '').trim()}</h4>
                      if (line.startsWith('##')) return <h3 key={i} className="mt-5 mb-2 border-b border-zinc-200 dark:border-zinc-800 pb-1">{line.replace('##', '').trim()}</h3>
                      if (line.startsWith('#')) return <h2 key={i} className="mt-6 mb-3">{line.replace('#', '').trim()}</h2>
                      if (line.startsWith('* ') || line.startsWith('- ')) return <li key={i} className="ml-4 list-disc">{line.replace(/^[-*]\s/, '')}</li>
                      if (line.trim() === '') return <br key={i} />
                      return <p key={i} className="mb-2 leading-relaxed">{line}</p>
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 text-center px-4 py-12">
                    <div className="text-6xl mb-4 opacity-50">🤖</div>
                    <p>Upload a clinical report to generate an automated AI summary and identify key abnormalities.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  )
}
