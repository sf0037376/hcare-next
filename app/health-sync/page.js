"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../lib/api"
import { Clock, Activity, Heart, Download, Zap, Watch, ShieldCheck, Smartphone } from "lucide-react"

export default function HealthSyncDashboard() {
  const [patientId, setPatientId] = useState("")
  const [points, setPoints] = useState(0)
  const [syncStatus, setSyncStatus] = useState("Idle")
  const [lastSync, setLastSync] = useState(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  // New states for consent and device connection
  const [hasConsent, setHasConsent] = useState(false)
  const [deviceLinked, setDeviceLinked] = useState(false)
  const [provider, setProvider] = useState("")

  useEffect(() => {
    const savedPid = localStorage.getItem("patientId") || "1" // Fallback to 1
    setPatientId(savedPid)

    // Clock timer
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

  const handleConnectDevice = async (selectedProvider) => {
    setLoading(true)
    try {
      await apiFetch(`/health-sync/link`, {
        method: "PATCH",
        body: JSON.stringify({ 
          patient_id: patientId, 
          wearable_id: `DEVICE_${Math.floor(Math.random()*10000)}`, 
          provider: selectedProvider 
        })
      })
      setProvider(selectedProvider)
      setDeviceLinked(true)
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
        body: JSON.stringify({ patient_id: patientId, provider: provider || "APPLE_HEALTH" })
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

  if (loading && !hasConsent) {
    return <div className="min-h-screen bg-zinc-100 dark:bg-[#0a0a0a] flex items-center justify-center"><div className="animate-spin text-blue-500"><Activity size={40} /></div></div>
  }

  // CONSENT PAGE
  if (!hasConsent) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#111] max-w-lg w-full rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-[#333]">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-4">Health Data Consent</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
            To provide you with personalized insights and reward points, NeoCare needs your permission to sync and securely store vitals data from your smartwatch or health apps (like Apple Health or Google Fit). Your data is encrypted and strictly confidential.
          </p>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleGiveConsent}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
            >
              {loading ? "Processing..." : "I Agree & Consent"}
            </button>
            <button className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 font-bold py-3 px-6 rounded-xl transition-all">
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // DEVICE CONNECTION PAGE
  if (!deviceLinked) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#111] max-w-lg w-full rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-[#333]">
          <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mb-6">
            <Smartphone size={32} />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Connect Your Device</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            Select your primary health data provider to begin syncing your vitals and earning rewards.
          </p>
          
          <div className="space-y-4">
            <button 
              onClick={() => handleConnectDevice("APPLE_HEALTH")}
              disabled={loading}
              className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group bg-white dark:bg-[#151515]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                  <Activity className="text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-zinc-900 dark:text-white">Apple Health</h3>
                  <p className="text-xs text-zinc-500">Sync from iPhone & Apple Watch</p>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-700 group-hover:border-blue-500"></div>
            </button>

            <button 
              onClick={() => handleConnectDevice("GOOGLE_FIT")}
              disabled={loading}
              className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-red-500 dark:hover:border-red-500 transition-colors group bg-white dark:bg-[#151515]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-red-50 dark:group-hover:bg-red-900/30 transition-colors">
                  <Heart className="text-zinc-700 dark:text-zinc-300 group-hover:text-red-600 dark:group-hover:text-red-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-zinc-900 dark:text-white">Google Fit</h3>
                  <p className="text-xs text-zinc-500">Sync from Android Wearables</p>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-700 group-hover:border-red-500"></div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // DASHBOARD PAGE (FERRARI UI)
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-[#0a0a0a] flex items-center justify-center p-4 md:p-8 font-sans transition-colors duration-500">
      
      <div className="relative w-full max-w-4xl rounded-[40px] bg-gradient-to-b from-zinc-300 to-zinc-400 dark:from-[#2a2a2a] dark:to-[#111] p-1 shadow-2xl">
        
        <div className="relative w-full rounded-[38px] bg-white dark:bg-[#050505] overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] dark:shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] border border-zinc-200 dark:border-[#333]">
          
          <div className="p-8 md:p-12 relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8 min-h-[400px]">
            
            <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-red-500/10 dark:bg-red-600/20 rounded-full blur-[80px] -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-orange-500/10 dark:bg-orange-600/10 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="flex flex-col gap-8 z-10">
              <div className="flex items-center gap-3">
                <Watch className="text-zinc-400 dark:text-zinc-500 w-8 h-8" />
                <span className="text-zinc-400 dark:text-zinc-500 font-bold tracking-[0.2em] text-xs uppercase">
                  {provider.replace('_', ' ')} SYNC
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="inline-block border border-red-500/30 dark:border-red-600/50 rounded px-2 py-0.5 mb-2">
                    <span className="text-[10px] text-red-600 dark:text-red-500 font-bold tracking-widest uppercase">Rewards</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-6xl md:text-7xl font-light text-zinc-800 dark:text-white tabular-nums tracking-tighter">
                      {points}
                    </span>
                    <span className="text-xl text-zinc-500 dark:text-zinc-400 mb-2 font-light">pts</span>
                  </div>
                </div>

                <div>
                  <div className="inline-block border border-orange-500/30 dark:border-orange-500/50 rounded px-2 py-0.5 mb-2">
                    <span className="text-[10px] text-orange-600 dark:text-orange-500 font-bold tracking-widest uppercase">Sync Status</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl md:text-4xl font-light text-zinc-700 dark:text-zinc-200 tabular-nums tracking-tighter">
                      {syncStatus}
                    </span>
                    {syncStatus === 'Success' && <Zap className="text-orange-500 w-5 h-5 mb-1" />}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-6 z-10 w-full md:w-auto">
              <div className="w-full max-w-xs relative h-16 flex items-end">
                <div className="absolute inset-x-0 bottom-0 border-b border-zinc-200 dark:border-zinc-800"></div>
                <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <polyline
                    points="0,20 15,20 20,5 25,30 30,20 100,20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-red-500 dark:text-red-500"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute right-0 top-0 text-[10px] text-zinc-400 font-bold flex items-center gap-1">
                  <Heart size={10} className="text-red-500" /> HR
                </div>
              </div>

              <div className="w-full max-w-xs relative h-16 flex items-end">
                <div className="absolute inset-x-0 bottom-0 border-b border-zinc-200 dark:border-zinc-800"></div>
                <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <polyline
                    points="0,25 40,25 45,15 50,28 55,25 100,25"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-blue-500 dark:text-blue-400"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute right-0 top-0 text-[10px] text-zinc-400 font-bold flex items-center gap-1">
                  <Activity size={10} className="text-blue-500" /> SPO2
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-6 z-10">
              <div className="text-right">
                <div className="text-2xl font-light text-zinc-800 dark:text-white tracking-widest">{formattedTime}</div>
                <div className="text-xs font-bold text-zinc-500 tracking-widest uppercase">{formattedDate}</div>
              </div>
              
              <div className="relative w-24 h-24 rounded-full border-2 border-zinc-300 dark:border-[#333] bg-white dark:bg-[#111] flex items-center justify-center shadow-inner">
                <div className="absolute w-1 h-1 rounded-full bg-red-500 z-20"></div>
                <div className="absolute w-0.5 h-6 bg-zinc-800 dark:bg-zinc-300 origin-bottom rounded-full" style={{ transform: `translateY(-50%) rotate(${(time.getHours() % 12) * 30 + time.getMinutes() * 0.5}deg)` }}></div>
                <div className="absolute w-0.5 h-9 bg-zinc-600 dark:bg-zinc-400 origin-bottom rounded-full" style={{ transform: `translateY(-50%) rotate(${time.getMinutes() * 6}deg)` }}></div>
                <div className="absolute w-[1px] h-10 bg-red-500 origin-bottom rounded-full" style={{ transform: `translateY(-50%) rotate(${time.getSeconds() * 6}deg)` }}></div>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="absolute w-[1px] h-2 bg-zinc-300 dark:bg-zinc-700" style={{ transform: `rotate(${i * 30}deg) translateY(-10px)`, top: '10px' }}></div>
                ))}
              </div>
              
              {lastSync && (
                <div className="text-right mt-4">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Last Synced</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-300">
                    {lastSync.toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="bg-zinc-100 dark:bg-[#0a0a0a] border-t border-zinc-200 dark:border-[#222] p-6 flex flex-wrap items-center justify-between gap-6 shadow-[inset_0_10px_20px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_10px_20px_rgba(0,0,0,0.3)]">
            
            <div className="flex items-center gap-4">
              <button 
                onClick={handleTestSync}
                disabled={loading}
                className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-b from-zinc-200 to-zinc-300 dark:from-[#222] dark:to-[#111] shadow-[0_4px_10px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] dark:active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] border border-zinc-400 dark:border-[#333] transition-all"
                title="Trigger Manual Sync"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-[#1a1a1a] shadow-inner flex items-center justify-center border border-zinc-300 dark:border-[#2a2a2a]">
                  <Activity size={18} className={`${loading ? 'animate-spin text-orange-500' : 'text-zinc-700 dark:text-zinc-400 group-hover:text-red-500'} transition-colors`} />
                </div>
              </button>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Test Sync</span>
                <span className="text-[9px] text-zinc-400 uppercase">Simulate Wearable</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Export Data</span>
                <span className="text-[9px] text-zinc-400 uppercase">Vitals & Rewards (CSV)</span>
              </div>
              <button 
                onClick={handleDownloadCsv}
                className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-b from-zinc-200 to-zinc-300 dark:from-[#222] dark:to-[#111] shadow-[0_4px_10px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] dark:active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] border border-zinc-400 dark:border-[#333] transition-all"
                title="Download CSV"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-[#1a1a1a] shadow-inner flex items-center justify-center border border-zinc-300 dark:border-[#2a2a2a]">
                  <Download size={18} className="text-zinc-700 dark:text-zinc-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
