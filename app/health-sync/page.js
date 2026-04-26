"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { apiFetch } from "../../lib/api"
import { Clock, Activity, Heart, Download, Zap, Watch, ShieldCheck, Smartphone, Flame, Moon, Footprints, Fingerprint, Check, X, TrendingUp, Calendar } from "lucide-react"

function HealthSyncContent() {
  const searchParams = useSearchParams()
  const [patientId, setPatientId] = useState("")
  const [role, setRole] = useState("")
  const [points, setPoints] = useState(0)
  const [syncStatus, setSyncStatus] = useState("Idle")
  const [lastSync, setLastSync] = useState(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  const [hasConsent, setHasConsent] = useState(false)
  const [deviceLinked, setDeviceLinked] = useState(false)
  const [provider, setProvider] = useState("")
  
  // History states
  const [history, setHistory] = useState([])
  const [timeRange, setTimeRange] = useState("1h") // 1h, 6h, 1d, 1w
  
  // Biometric states
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingDevice, setPendingDevice] = useState(null)
  const [passcode, setPasscode] = useState("")

  useEffect(() => {
    const savedPid = localStorage.getItem("patientId") || "1"
    const savedRole = (localStorage.getItem("role") || "").toLowerCase()
    setRole(savedRole)

    // If doctor/nurse, they might be viewing a specific patient
    const queryPid = searchParams.get("pId")
    const pid = (savedRole === "doctor" || savedRole === "nurse" || savedRole === "admin") ? (queryPid || savedPid) : savedPid
    setPatientId(pid)

    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [searchParams])

  useEffect(() => {
    if (patientId) {
      checkStatusAndPoints()
      loadHistory()
    }
  }, [patientId, timeRange])

  const checkStatusAndPoints = async () => {
    setLoading(true)
    try {
      const [statusData, pointsData] = await Promise.all([
        apiFetch(`/health-sync/status/${patientId}`),
        apiFetch(`/health-sync/points/${patientId}`)
      ])
      
      setHasConsent(statusData.consent_given === 1)
      setDeviceLinked(!!statusData.wearable_id)
      setProvider(statusData.wearable_provider || "")
      setPoints(pointsData.total_points || 0)
    } catch (err) {
      console.error("Error fetching status:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const data = await apiFetch(`/health-sync/history/${patientId}?range=${timeRange}`)
      setHistory(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Error fetching history:", err)
    }
  }

  const handleGiveConsent = async () => {
    setLoading(true)
    try {
      await apiFetch(`/health-sync/consent`, {
        method: "POST",
        body: JSON.stringify({ patient_id: patientId, consent_given: true })
      })
      setHasConsent(true)
    } catch (err) {
      console.error("Error giving consent:", err)
    } finally {
      setLoading(false)
    }
  }

  const initiateConnection = (selectedProvider) => {
    setPendingDevice({
      provider: selectedProvider,
      id: `SYNC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    })
    setShowConfirm(true)
  }

  const confirmConnection = async () => {
    if (passcode.length < 4) return 
    setLoading(true)
    setShowConfirm(false)
    try {
      await apiFetch(`/health-sync/link`, {
        method: "PATCH",
        body: JSON.stringify({ 
          patient_id: patientId, 
          wearable_id: pendingDevice.id, 
          provider: pendingDevice.provider 
        })
      })
      setProvider(pendingDevice.provider)
      setDeviceLinked(true)
      setPasscode("")
    } catch (err) {
      console.error("Error connecting device:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleTestSync = async () => {
    setLoading(true)
    setSyncStatus("Syncing...")
    try {
      const data = await apiFetch(`/health-sync/test`, {
        method: "POST",
        body: JSON.stringify({ patient_id: patientId, provider: provider || "APPLE_WATCH" })
      })
      if (data) {
        setPoints(prev => prev + (data.points_awarded || 0))
        setSyncStatus("Success")
        setLastSync(new Date())
        loadHistory()
        setTimeout(() => setSyncStatus("Idle"), 3000)
      }
    } catch (err) {
      console.error("Test sync failed:", err)
      setSyncStatus("Failed")
      setTimeout(() => setSyncStatus("Idle"), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCsv = () => {
    window.open(`http://localhost:5000/api/health-sync/csv/${patientId}`, '_blank')
  }

  // --- CHART RENDERING ---
  const renderLineChart = (data, dataKey, color, label, yMin, yMax) => {
    if (data.length < 2) return <div className="h-32 flex items-center justify-center text-[10px] text-zinc-500 uppercase font-black">Insufficient Data</div>
    
    const width = 300
    const height = 100
    const padding = 10
    
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding
      const val = d[dataKey] || yMin
      const y = height - ((val - yMin) / (yMax - yMin)) * (height - padding * 2) - padding
      return `${x},${y}`
    }).join(" ")

    return (
      <div className="relative">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
          <span className={`text-xs font-bold tabular-nums`} style={{ color }}>{data[data.length-1][dataKey]}</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`M ${points} L ${width-padding},${height-padding} L ${padding},${height-padding} Z`} fill={`url(#grad-${dataKey})`} />
          <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
          {/* Latest point circle */}
          {(() => {
            const last = points.split(" ").pop().split(",")
            return <circle cx={last[0]} cy={last[1]} r="3" fill={color} className="animate-pulse" />
          })()}
        </svg>
      </div>
    )
  }

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const formattedDate = time.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()

  if (loading && !hasConsent) {
    return <div className="min-h-screen bg-zinc-100 dark:bg-[#0a0a0a] flex items-center justify-center"><div className="animate-spin text-blue-500"><Activity size={40} /></div></div>
  }

  if (!hasConsent && role === "patient") {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#111] max-w-lg w-full rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-[#333]">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-4">Health Data Consent</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">NeoCare needs permission to sync data from your watch. Data is encrypted.</p>
          <button onClick={handleGiveConsent} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all uppercase text-sm tracking-widest">I Agree & Consent</button>
        </div>
      </div>
    )
  }

  if (!deviceLinked && role === "patient") {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
        {showConfirm && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] w-full max-w-sm rounded-[32px] p-8 border border-white/10 shadow-2xl">
            <div className="flex flex-col items-center gap-6">
              <Fingerprint className="text-blue-500" size={32} />
              <div className="text-center"><h2 className="text-xl font-bold text-white mb-1">Confirm Identity</h2><p className="text-xs text-zinc-400">Enter passcode to authorize link</p></div>
              <div className="flex gap-3 mt-2">{[1,2,3,4].map(i => <div key={i} className={`w-3 h-3 rounded-full border border-zinc-700 ${passcode.length >= i ? 'bg-blue-500' : ''}`}></div>)}</div>
              <div className="grid grid-cols-3 gap-3 w-full">
                {[1,2,3,4,5,6,7,8,9,"C",0,"OK"].map(num => (
                  <button key={num} onClick={() => { if(num==="C") setPasscode(""); else if(num==="OK") confirmConnection(); else if(passcode.length<4) setPasscode(p => p+num) }} className="h-12 bg-zinc-900 text-white rounded-xl font-bold">{num}</button>
                ))}
              </div>
              <button onClick={() => setShowConfirm(false)} className="text-xs text-zinc-500 uppercase font-black">Cancel</button>
            </div>
          </div>
        </div>}
        <div className="bg-white dark:bg-[#111] max-w-lg w-full rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-[#333]">
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-8 italic uppercase tracking-tighter">Connect Watch</h1>
          <button onClick={() => initiateConnection("AUTO_DETECT")} className="w-full mb-6 text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-4 py-3 rounded-xl border border-blue-500/20">Generate ID & Auto-Link</button>
          <div className="space-y-3">
            {['APPLE_WATCH', 'GOOGLE_WATCH', 'IWATCH'].map(id => (
              <button key={id} onClick={() => initiateConnection(id)} className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-[#222] bg-zinc-50 dark:bg-[#0a0a0a] hover:border-blue-500 transition-all">
                <span className="font-bold text-zinc-900 dark:text-white uppercase tracking-tighter">{id.replace('_', ' ')}</span>
                <Watch size={18} className="text-zinc-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-[#0a0a0a] flex items-center justify-center p-4 md:p-8 font-sans transition-colors duration-500">
      <div className="relative w-full max-w-6xl rounded-[40px] bg-gradient-to-b from-zinc-300 to-zinc-400 dark:from-[#2a2a2a] dark:to-[#111] p-1 shadow-2xl">
        <div className="relative w-full rounded-[38px] bg-white dark:bg-[#050505] overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] border border-zinc-200 dark:border-[#333]">
          
          <div className="p-8 md:p-10 flex flex-col gap-8">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-black italic shadow-lg">R</div>
                <div>
                  <h1 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic">Telemetria-Clinica</h1>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Racing Diagnostics & Rewards</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-2xl font-light text-zinc-800 dark:text-white tracking-widest">{formattedTime}</div>
                  <div className="text-[9px] font-bold text-zinc-500 tracking-[0.2em] uppercase">{formattedDate}</div>
                </div>
                {role === "patient" && (
                   <div className="bg-zinc-100 dark:bg-[#111] px-4 py-2 rounded-xl border border-zinc-200 dark:border-[#222]">
                     <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Points</div>
                     <div className="text-xl font-light text-zinc-800 dark:text-white">{points}</div>
                   </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Gauges Column */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                 <div className="bg-zinc-50 dark:bg-[#080808] p-6 rounded-3xl border border-zinc-200 dark:border-[#222]">
                   <div className="flex items-center justify-between mb-6">
                     <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Live Pulse</span>
                     <Activity size={14} className="text-red-500 animate-pulse" />
                   </div>
                   <div className="flex items-center justify-center py-4">
                     <div className="relative w-40 h-40 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-zinc-100 dark:border-[#111] shadow-inner"></div>
                        <div className="absolute inset-0 rounded-full border-t-4 border-red-500 rotate-[30deg]"></div>
                        <div className="flex flex-col items-center">
                          <span className="text-5xl font-light dark:text-white tabular-nums">{history.length > 0 ? history[history.length-1].hr : "--"}</span>
                          <span className="text-[9px] text-zinc-500 uppercase font-black">BPM</span>
                        </div>
                     </div>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div className="bg-zinc-50 dark:bg-[#080808] p-5 rounded-2xl border border-zinc-200 dark:border-[#222]">
                     <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest block mb-2">SpO2</span>
                     <span className="text-2xl font-light dark:text-white">{history.length > 0 ? history[history.length-1].spo2 : "--"}%</span>
                   </div>
                   <div className="bg-zinc-50 dark:bg-[#080808] p-5 rounded-2xl border border-zinc-200 dark:border-[#222]">
                     <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-2">BP SYST</span>
                     <span className="text-2xl font-light dark:text-white">{history.length > 0 ? history[history.length-1].bp_systolic : "--"}</span>
                   </div>
                 </div>
              </div>

              {/* History & Cardiography Charts Column */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="bg-zinc-900 dark:bg-[#080808] p-6 rounded-3xl border border-zinc-800 dark:border-[#222] shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8 z-10 relative">
                    <div className="flex items-center gap-3">
                      <TrendingUp size={16} className="text-red-500" />
                      <span className="text-xs font-black text-white uppercase tracking-widest">Cardiography History</span>
                    </div>
                    <div className="flex gap-1 bg-black/40 p-1 rounded-lg">
                      {['1h', '6h', '1d', '2d', '1w'].map(r => (
                        <button key={r} onClick={() => setTimeRange(r)} className={`px-3 py-1 rounded text-[9px] font-black uppercase transition-all ${timeRange === r ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>{r}</button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {renderLineChart(history, "hr", "#ef4444", "Heart Rate (BPM)", 50, 180)}
                    {renderLineChart(history, "spo2", "#3b82f6", "Oxygen (%)", 80, 100)}
                    {renderLineChart(history, "bp_systolic", "#10b981", "BP Systolic", 80, 180)}
                    {renderLineChart(history, "bp_diastolic", "#fbbf24", "BP Diastolic", 50, 120)}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-zinc-50 dark:bg-[#0a0a0a] p-6 rounded-3xl border border-zinc-200 dark:border-[#222]">
                  <div className="flex gap-4">
                    <button onClick={handleTestSync} className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"><Zap size={20} /></button>
                    <div><p className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">Engage Test Sync</p><p className="text-[9px] text-zinc-500 uppercase">Simulate Telemetry Injection</p></div>
                  </div>
                  <button onClick={handleDownloadCsv} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md"><Download size={14} /> Export Dataset</button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function HealthSyncDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><Activity className="text-red-600 animate-spin" /></div>}>
      <HealthSyncContent />
    </Suspense>
  )
}
