"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { apiFetch } from "../../../lib/api"
import useToast from "../../../components/toast"
import ProtectedRoute from "../../../components/ProtectedRoute"
import Link from "next/link"

export default function PharmacistDashboard() {
  const { Toast, show } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [fulfilling, setFulfilling] = useState(null)
  // Barcode scanner
  const barcodeRef = useRef(null)
  const [barcodeMode, setBarcodeMode] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState("")

  // Real API search — by name, phone, or patient ID
  async function handleSearch(e) {
    if (e) e.preventDefault()
    if (!searchTerm.trim()) return show("Enter a name, phone, or Patient ID to search")
    setLoading(true)
    try {
      const patients = await apiFetch(`/patients?q=${encodeURIComponent(searchTerm)}`)
      if (!patients?.length) { setPrescriptions([]); setLoading(false); return }
      // For each matching patient, fetch current prescription (latest schedule)
      const allRx = []
      for (const p of patients.slice(0, 5)) {
        try {
          const schedule = await apiFetch(`/medication/schedule?patient_id=${p.id}&current=1`)
          if (Array.isArray(schedule) && schedule.length) {
            // Only current (latest) prescription per medicine
            const latest = {}
            schedule.forEach(s => { if (!latest[s.medicine]) latest[s.medicine] = s })
            Object.values(latest).forEach(rx => allRx.push({ ...rx, patient_name: p.name, phone: p.phone, patient_id: p.id }))
          }
        } catch { /* patient may have no prescriptions */ }
      }
      setPrescriptions(allRx)
    } catch (err) {
      show("Search failed: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fulfillPrescription(id) {
    setFulfilling(id)
    try {
      await apiFetch(`/medication/fulfill/${id}`, { method: "POST" })
      show(`Prescription #${id} fulfilled ✓ Inventory updated`)
      setPrescriptions(prescriptions.map(p => p.id === id ? { ...p, status: "Fulfilled" } : p))
    } catch (err) {
      show("Failed to fulfill: " + err.message)
    } finally {
      setFulfilling(null)
    }
  }

  // Barcode handler — detects rapid type (scanner), looks up item
  const handleBarcodeKey = useCallback(async (e) => {
    if (!barcodeMode) return
    if (e.key === "Enter" && barcodeInput.trim()) {
      try {
        // Search inventory by barcode field
        const items = await apiFetch(`/pharmacy/inventory?barcode=${encodeURIComponent(barcodeInput.trim())}`)
        if (items?.length) {
          show(`Scanned: ${items[0].medicine} (Stock: ${items[0].stock_quantity})`)
        } else {
          show(`Barcode ${barcodeInput} not found in inventory. You can add it.`)
        }
      } catch { show("Barcode lookup failed") }
      setBarcodeInput("")
    } else if (e.key !== "Enter") {
      setBarcodeInput(prev => prev + e.key)
    }
  }, [barcodeMode, barcodeInput, show])

  useEffect(() => {
    window.addEventListener("keydown", handleBarcodeKey)
    return () => window.removeEventListener("keydown", handleBarcodeKey)
  }, [handleBarcodeKey])

  return (
    <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN", "PHARMACIST"]}>
      <div className="animate-in fade-in slide-in-from-bottom-5 duration-1000 max-w-7xl mx-auto pb-40 px-6 transition-all">
        {Toast}

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 px-4">
          <div>
            <h2 className="text-6xl font-black tracking-tighter uppercase premium-text-gradient italic leading-none mb-4">Pharma_Nexus_Counter</h2>
            <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em] font-mono">Mission-Critical_Clinical_Fulfillment & Logistical_Deduction.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setBarcodeMode(!barcodeMode); setBarcodeInput("") }}
              className={`flex items-center gap-4 px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] transition-all duration-700 border-2 font-mono ${barcodeMode ? "bg-blue-600 text-white border-blue-500 shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)]" : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:scale-105 active:scale-95"}`}
            >
              <span>{barcodeMode ? "📷 SCANNER_ACTIVE" : "📷 ACTIVATE_BARCODE"}</span>
            </button>
            <Link href="/pharmacy/inventory" className="px-10 py-5 rounded-[2rem] bg-zinc-100 dark:bg-zinc-800 p-6 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all font-mono">🏪 INVENTORY_CORE</Link>
          </div>
        </div>

        {barcodeMode && (
          <div className="mb-12 bg-blue-600/5 dark:bg-blue-600/10 border-2 border-dashed border-blue-600/30 rounded-[3rem] p-10 flex items-center gap-8 animate-pulse relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
            <span className="text-5xl">📡</span>
            <div className="font-mono">
              <p className="text-xl font-black text-blue-600 dark:text-blue-400 italic tracking-tighter uppercase mb-2">Barcode_Sensor_Frequency_Locked</p>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Focus_Active_Window || SCAN_NODE_IDENTIFIER.</p>
            </div>
            {barcodeInput && <span className="ml-auto font-mono text-[13px] font-black text-blue-600 bg-blue-600/10 border border-blue-600/20 px-6 py-3 rounded-2xl tracking-[0.2em] italic">{barcodeInput}_SIGNAL</span>}
          </div>
        )}

        {/* Tactical Search Vector */}
        <div className="glass-card rounded-[4rem] p-10 mb-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border-white/5 relative overflow-hidden group">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-6 relative z-10">
            <div className="flex-1 relative group/search">
              <span className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within/search:text-blue-500 transition-colors text-2xl group-hover/search:scale-125 duration-500">🔍</span>
              <input
                type="text"
                className="w-full bg-zinc-100/50 dark:bg-zinc-800/30 border-none rounded-[2.5rem] pl-20 pr-10 py-8 text-[11px] font-black text-zinc-900 dark:text-zinc-100 outline-none transition-all placeholder:text-zinc-500 tracking-[0.2em] focus:ring-4 ring-blue-500/10 italic"
                placeholder="EXECUTE_SEARCH_VECTOR: PATIENT_NAME || IDENT_ID || PHONE_NODE..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="submit" className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 px-16 py-8 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl hover:scale-105 active:scale-95 transition-all duration-500 font-mono disabled:opacity-50" disabled={loading}>
              {loading ? "INITIALIZING_SEARCH..." : "RUN_SEARCH →"}
            </button>
          </form>
          <div className="absolute -bottom-20 -right-20 text-[25rem] opacity-[0.02] grayscale -rotate-12 select-none pointer-events-none group-hover:rotate-0 transition-transform duration-1000">🔍</div>
        </div>

        {/* Prescription Deployment Grid */}
        <div className="space-y-12">
          <div className="flex items-center justify-between px-6">
              <h3 className="text-3xl font-black tracking-tighter uppercase italic text-zinc-400 flex items-center gap-6">
                Clinical_Fulfillment_Matrix
                {prescriptions.length > 0 && (
                  <span className="text-[10px] font-black px-6 py-2 rounded-full bg-blue-600/10 text-blue-600 border border-blue-600/20 font-mono italic animate-pulse">
                    {prescriptions.filter(p => p.status !== "Fulfilled").length}_NODES_PENDING
                  </span>
                )}
              </h3>
              <div className="h-px bg-zinc-100 dark:bg-zinc-800 flex-1 mx-10 hidden md:block opacity-30"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {prescriptions.map(p => (
              <div key={p.id} className={`glass-card rounded-[4rem] p-12 border-white/5 shadow-2xl transition-all duration-700 relative overflow-hidden group ${p.status === "Fulfilled" ? "opacity-60 grayscale" : "hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] hover:scale-[1.02]"}`}>
                <div className={`absolute top-0 right-0 w-64 h-64 blur-[120px] -mr-32 -mt-32 rounded-full transition-all duration-1000 ${p.status === 'Fulfilled' ? 'bg-emerald-500/5' : 'bg-blue-600/5 group-hover:bg-blue-600/10'}`}></div>
                
                <div className="flex justify-between items-start mb-10 relative z-10">
                  <div className="font-mono">
                    <h4 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter italic uppercase group-hover:text-blue-600 transition-colors">{p.patient_name}</h4>
                    <p className="text-[10px] text-zinc-400 font-black mt-3 uppercase tracking-[0.3em] font-mono opacity-80 italic">NODE_IDENT: {p.patient_id} || CELL_NODE: {p.phone}</p>
                  </div>
                  <span className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.4em] font-mono italic transition-all duration-700 ${
                    p.status === "Fulfilled" ? "bg-emerald-600 text-white shadow-2xl shadow-emerald-600/20" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:bg-blue-600 group-hover:text-white shadow-xl"
                  }`}>
                    {p.status || "WAIT_STATE"}
                  </span>
                </div>

                <div className="bg-zinc-100/50 dark:bg-zinc-800/30 rounded-[2.5rem] p-8 mb-10 border border-white/5 group-hover:bg-white dark:group-hover:bg-zinc-900 transition-all duration-700 relative overflow-hidden font-mono">
                  <div className="flex items-center gap-6 relative z-10">
                    <span className="text-4xl grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-125 group-hover:rotate-6">💊</span>
                    <div>
                      <p className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic">{p.medicine}</p>
                      <p className="text-[10px] text-zinc-500 font-black mt-2 uppercase tracking-[0.2em]">DOSAGE: {p.dosage} || Q_INTERVAL: {p.times_per_day}_DAILY || INCEPT: {p.start_date?.slice(0,10).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="absolute -bottom-10 -right-10 text-8xl opacity-[0.03] grayscale transition-all duration-1000 group-hover:rotate-45">✨</div>
                </div>

                <div className="flex gap-4 relative z-10 font-mono">
                  {p.status !== "Fulfilled" ? (
                    <button
                      onClick={() => fulfillPrescription(p.id)}
                      disabled={fulfilling === p.id}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-emerald-600/20 active:scale-95 hover:scale-105 transition-all duration-500 disabled:opacity-50"
                    >
                      {fulfilling === p.id ? "SYNCING_LOGISTICS..." : "✓ EXECUTE_FULFILLMENT"}
                    </button>
                  ) : (
                    <Link
                      href={`/billing?patient_id=${p.patient_id}`}
                      className="flex-1 bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 py-6 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-105 active:scale-95 transition-all duration-500 text-center flex items-center justify-center italic"
                    >
                      GENERATE_LEDGER_TRANS →
                    </Link>
                  )}
                  <Link
                    href={`/patients/${p.patient_id}/profile`}
                    className="w-20 bg-zinc-100 dark:bg-zinc-800 border border-white/5 rounded-[2rem] hover:bg-zinc-950 dark:hover:bg-white hover:text-white dark:hover:text-zinc-950 transition-all duration-500 flex items-center justify-center text-2xl shadow-xl active:scale-90"
                  >
                    👤
                  </Link>
                </div>
              </div>
            ))}
            {!loading && prescriptions.length === 0 && (
              <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-40 group hover:opacity-100 transition-all duration-1000">
                <span className="text-[12rem] mb-12 grayscale group-hover:grayscale-0 group-hover:rotate-12 transition-all duration-1000">💊</span>
                <h3 className="text-3xl font-black uppercase tracking-[0.4em] text-zinc-500 italic">Prescription_Matrix_Null</h3>
                <p className="text-[11px] font-black text-zinc-400 mt-6 uppercase tracking-[0.3em] font-mono italic">RUN_SEARCH_VECTOR to populate high-fidelity match nodes.</p>
              </div>
            )}
            {loading && (
              <div className="col-span-full py-40 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-8 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-10 shadow-2xl shadow-blue-500/20"></div>
                <p className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-500 animate-pulse font-mono italic">Querying_Prescription_Databases...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>

  )
}
