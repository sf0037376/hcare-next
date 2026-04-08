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
      <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
        {Toast}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Pharmacy Counter</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Search prescriptions by patient name, phone, or ID.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setBarcodeMode(!barcodeMode); setBarcodeInput("") }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border ${barcodeMode ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20" : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
            >
              📷 {barcodeMode ? "Scanner Active" : "Barcode Scan"}
            </button>
            <Link href="/pharmacy/inventory" className="btn-secondary text-sm">🏪 Inventory</Link>
            <Link href="/billing" className="btn-primary text-sm">🧾 Billing</Link>
          </div>
        </div>

        {barcodeMode && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl px-6 py-4 flex items-center gap-4">
            <span className="text-2xl">📷</span>
            <div>
              <p className="font-semibold text-blue-800 dark:text-blue-200">Barcode Scanner Active</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Focus this window and scan any barcode. The system will identify the item.</p>
            </div>
            {barcodeInput && <span className="ml-auto font-mono text-blue-700 text-sm bg-blue-100 px-3 py-1 rounded-lg">{barcodeInput}</span>}
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">🔍</span>
              <input
                type="text"
                className="form-input pl-11"
                placeholder="Patient Name, Phone Number, or Patient ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary shadow-blue-500/20 px-8" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        {/* Prescription List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold px-2 flex items-center gap-2">
            Current Prescriptions
            {prescriptions.length > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                {prescriptions.filter(p => p.status !== "Fulfilled").length} pending
              </span>
            )}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prescriptions.map(p => (
              <div key={p.id} className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm transition-all ${p.status === "Fulfilled" ? "opacity-60" : "hover:border-blue-500/50"}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white text-lg">{p.patient_name}</h4>
                    <p className="text-xs text-zinc-500 font-medium">{p.phone} · ID #{p.patient_id}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    p.status === "Fulfilled" ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
                  }`}>
                    {p.status || "Pending"}
                  </span>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💊</span>
                    <div>
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200">{p.medicine}</p>
                      <p className="text-xs text-zinc-500">{p.dosage} · {p.times_per_day}×/day · From {p.start_date?.slice(0,10)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {p.status !== "Fulfilled" ? (
                    <button
                      onClick={() => fulfillPrescription(p.id)}
                      disabled={fulfilling === p.id}
                      className="flex-1 btn-primary py-2.5 text-sm !bg-emerald-600 shadow-emerald-500/10 disabled:opacity-50"
                    >
                      {fulfilling === p.id ? "Processing..." : "✓ Fulfill & Deduct Stock"}
                    </button>
                  ) : (
                    <Link
                      href={`/billing?patient_id=${p.patient_id}`}
                      className="flex-1 btn-primary py-2.5 text-sm !bg-blue-600 shadow-blue-500/10 text-center"
                    >
                      Generate Bill
                    </Link>
                  )}
                  <Link
                    href={`/patients/${p.patient_id}/profile`}
                    className="px-4 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center"
                  >
                    👤
                  </Link>
                </div>
              </div>
            ))}
            {!loading && prescriptions.length === 0 && (
              <div className="col-span-full py-16 text-center text-zinc-500 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl">
                <p className="text-4xl mb-4">💊</p>
                <p className="font-semibold">Search for a patient to see their current prescription</p>
                <p className="text-sm mt-2">Search by name, phone, or Patient ID</p>
              </div>
            )}
            {loading && (
              <div className="col-span-full py-12 text-center text-zinc-500">
                <div className="w-8 h-8 border-4 border-zinc-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                Searching prescriptions...
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
