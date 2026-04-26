"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../lib/api"
import { Clock, Activity, Heart, Download, Zap, Watch, ShieldCheck, Smartphone, Flame, Moon, Footprints, Fingerprint, KeyRound, Check, X } from "lucide-react"

export default function HealthSyncDashboard() {
  const [patientId, setPatientId] = useState("")
  const [points, setPoints] = useState(0)
  const [syncStatus, setSyncStatus] = useState("Idle")
  const [lastSync, setLastSync] = useState(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  const [hasConsent, setHasConsent] = useState(false)
  const [deviceLinked, setDeviceLinked] = useState(false)
  const [provider, setProvider] = useState("")
  
  // New: Biometric/Passcode states
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingDevice, setPendingDevice] = useState(null)
  const [passcode, setPasscode] = useState("")

  useEffect(() => {
    const savedPid = localStorage.getItem("patientId") || "1"
    setPatientId(savedPid)

    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (patientId) {
      checkStatusAndPoints()
    }
  }, [patientId])

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
    if (passcode.length < 4) return // Simple validation for demo
    
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

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const formattedDate = time.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()

  // MODAL: Confirm Connection with Passcode/Biometric
  const ConfirmModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] w-full max-w-sm rounded-[32px] p-8 border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Fingerprint className="text-blue-500 animate-pulse" size={32} />
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-1">Confirm Identity</h2>
            <p className="text-xs text-zinc-400">Enter passcode to authorize device link</p>
          </div>

          <div className="flex gap-3 mt-2">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full border-2 border-zinc-700 transition-all ${passcode.length >= i ? 'bg-blue-500 border-blue-500 scale-110' : ''}`}
              ></div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "OK"].map((num) => (
              <button
                key={num}
                onClick={() => {
                  if (num === "C") setPasscode("")
                  else if (num === "OK") confirmConnection()
                  else if (passcode.length < 4) setPasscode(prev => prev + num)
                }}
                className={`h-14 rounded-2xl flex items-center justify-center font-bold text-lg transition-all ${
                  num === "OK" ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {num === "OK" ? <Check size={20} /> : num === "C" ? <X size={20} /> : num}
              </button>
            ))}
          </div>

          <button onClick={() => setShowConfirm(false)} className="text-xs text-zinc-500 uppercase font-black tracking-widest hover:text-white transition-colors">Cancel Authorization</button>
        </div>
      </div>
    </div>
  )

  if (loading && !hasConsent) {
    return <div className="min-h-screen bg-zinc-100 dark:bg-[#0a0a0a] flex items-center justify-center"><div className="animate-spin text-blue-500"><Activity size={40} /></div></div>
  }

  if (!hasConsent) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#111] max-w-lg w-full rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-[#333]">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-4">Health Data Consent</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
            NeoCare needs your permission to sync data from your smartwatch. Your data is encrypted and secure.
          </p>
          <div className="flex items-center gap-4">
            <button onClick={handleGiveConsent} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all">I Agree & Consent</button>
          </div>
        </div>
      </div>
    )
  }

  if (!deviceLinked) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
        {showConfirm && <ConfirmModal />}
        <div className="bg-white dark:bg-[#111] max-w-lg w-full rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-[#333]">
          <div className="flex items-center justify-between mb-8">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center">
              <Watch size={24} />
            </div>
            <button 
              onClick={() => initiateConnection("AUTO_DETECT")}
              className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all"
            >
              Generate ID & Auto-Link
            </button>
          </div>
          
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 uppercase tracking-tighter italic">Connect Telemetry</h1>
          <p className="text-xs text-zinc-500 mb-8 font-bold uppercase tracking-widest">Select Provider Stream</p>
          
          <div className="grid grid-cols-1 gap-3 mt-4">
            {[
              { id: 'APPLE_WATCH', name: 'Apple Watch', icon: <Watch className="text-red-500" /> },
              { id: 'GOOGLE_WATCH', name: 'Pixel Watch', icon: <Watch className="text-blue-500" /> },
              { id: 'IWATCH', name: 'iWatch Series', icon: <Watch className="text-pink-500" /> }
            ].map((d) => (
              <button 
                key={d.id} 
                onClick={() => initiateConnection(d.id)} 
                className="group flex items-center justify-between p-5 rounded-2xl border border-zinc-200 dark:border-[#222] hover:border-blue-500 transition-all bg-zinc-50 dark:bg-[#0a0a0a]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">{d.icon}</div>
                  <span className="font-bold text-zinc-900 dark:text-white uppercase tracking-tighter">{d.name}</span>
                </div>
                <Zap className="text-zinc-300 dark:text-zinc-800 group-hover:text-yellow-500 transition-colors" size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-[#0a0a0a] flex items-center justify-center p-4 md:p-8 font-sans transition-colors duration-500">
      <div className="relative w-full max-w-5xl rounded-[40px] bg-gradient-to-b from-zinc-300 to-zinc-400 dark:from-[#2a2a2a] dark:to-[#111] p-1 shadow-2xl">
        <div className="relative w-full rounded-[38px] bg-white dark:bg-[#050505] overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] dark:shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] border border-zinc-200 dark:border-[#333]">
          
          <div className="p-8 md:p-10 relative flex flex-col md:flex-row justify-between items-start gap-8 min-h-[500px]">
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-red-500/5 dark:bg-red-600/10 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none"></div>
            
            {/* Left: Telemetry & Stats */}
            <div className="flex flex-col gap-6 z-10 w-full md:w-1/3">
              <div className="flex items-center gap-3">
                <Watch className="text-red-500 w-6 h-6" />
                <span className="text-zinc-500 font-bold tracking-widest text-[10px] uppercase">{provider.replace('_', ' ')} TELEMETRY</span>
              </div>
              
              <div className="bg-zinc-50 dark:bg-[#080808] p-6 rounded-3xl border border-zinc-200 dark:border-[#222]">
                <div className="text-[10px] text-red-500 font-black uppercase mb-1">Health Points</div>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-light text-zinc-800 dark:text-white tabular-nums tracking-tighter">{points}</span>
                  <span className="text-xs text-zinc-500 mb-2">XP</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 dark:bg-[#080808] p-4 rounded-2xl border border-zinc-200 dark:border-[#222]">
                  <Footprints className="text-blue-500 mb-2" size={16} />
                  <div className="text-[9px] text-zinc-500 uppercase font-bold">Steps</div>
                  <div className="text-xl font-light dark:text-white">8,432</div>
                </div>
                <div className="bg-zinc-50 dark:bg-[#080808] p-4 rounded-2xl border border-zinc-200 dark:border-[#222]">
                  <Flame className="text-orange-500 mb-2" size={16} />
                  <div className="text-[9px] text-zinc-500 uppercase font-bold">Calories</div>
                  <div className="text-xl font-light dark:text-white">420</div>
                </div>
              </div>
            </div>

            {/* Center: Main Gauges */}
            <div className="flex-1 flex flex-col items-center justify-center gap-12 z-10 w-full">
              <div className="relative w-48 h-48 flex items-center justify-center">
                 {/* CSS Gauge */}
                 <div className="absolute inset-0 rounded-full border-8 border-zinc-100 dark:border-[#111] shadow-inner"></div>
                 <div className="absolute inset-0 rounded-full border-t-8 border-r-8 border-red-500 rotate-45"></div>
                 <div className="flex flex-col items-center">
                   <Heart className="text-red-500 mb-1" size={24} />
                   <span className="text-4xl font-light dark:text-white">72</span>
                   <span className="text-[10px] text-zinc-500 uppercase font-bold">BPM</span>
                 </div>
              </div>
              
              <div className="w-full flex flex-col gap-4">
                <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase px-2">
                   <span>Sync Accuracy</span>
                   <span className="text-red-500">98.4%</span>
                </div>
                <div className="w-full h-1 bg-zinc-200 dark:bg-[#222] rounded-full overflow-hidden">
                   <div className="h-full bg-red-500 w-[98%] shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                </div>
              </div>
            </div>

            {/* Right: Environment & Clock */}
            <div className="flex flex-col items-end gap-6 z-10 w-full md:w-1/3">
              <div className="text-right">
                <div className="text-3xl font-light text-zinc-800 dark:text-white tracking-widest">{formattedTime}</div>
                <div className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase">{formattedDate}</div>
              </div>

              <div className="bg-zinc-50 dark:bg-[#080808] p-6 rounded-3xl border border-zinc-200 dark:border-[#222] w-full max-w-[200px]">
                <div className="flex items-center gap-3 mb-4">
                  <Moon className="text-indigo-400" size={16} />
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Sleep Quality</span>
                </div>
                <div className="text-2xl font-light dark:text-white">82%</div>
                <div className="w-full h-1 bg-zinc-200 dark:bg-[#222] mt-2 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 w-[82%]"></div>
                </div>
              </div>

              <div className="mt-auto flex flex-col items-end gap-2">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">System Status</span>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => <div key={i} className={`w-3 h-1 rounded-full ${i <= 4 ? 'bg-red-500' : 'bg-zinc-800'}`}></div>)}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-zinc-100 dark:bg-[#0a0a0a] border-t border-zinc-200 dark:border-[#222] p-8 flex justify-between items-center">
            <div className="flex gap-4">
              <button onClick={handleTestSync} className="w-16 h-16 rounded-full bg-gradient-to-b from-zinc-200 to-zinc-300 dark:from-[#222] dark:to-[#111] shadow-lg border border-zinc-400 dark:border-[#333] flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                <Activity size={24} className={loading ? 'animate-spin' : 'text-red-500'} />
              </button>
              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Engage Sync</span>
                <span className="text-[9px] text-zinc-400">Manual Telemetry Override</span>
              </div>
            </div>
            
            <button onClick={handleDownloadCsv} className="px-8 py-3 rounded-full bg-zinc-800 dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-widest hover:bg-black dark:hover:bg-zinc-200 transition-all flex items-center gap-2">
              <Download size={14} /> Data Export
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
