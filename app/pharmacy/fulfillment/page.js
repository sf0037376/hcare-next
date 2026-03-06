"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../../lib/api"
import useToast from "../../../components/toast"
import ProtectedRoute from "../../../components/ProtectedRoute"
import Link from "next/link"

export default function PharmacistDashboard() {
  const { Toast, show } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(false)

  // Mocking search for now
  async function handleSearch(e) {
    if (e) e.preventDefault()
    setLoading(true)
    try {
      // In a real app: GET /medication/search?q=searchTerm
      // This would return prescriptions matching name/phone/id
      const mockData = [
        { id: 101, patient_id: 1, patient_name: "Baby John", medicine: "Amoxicillin", dose: "5ml", type: "Syrup", frequency: "TDS", status: "Pending", phone: "9876543210" },
        { id: 102, patient_id: 2, patient_name: "Baby Doe", medicine: "Paracetamol", dose: "2ml", type: "Drops", frequency: "SOS", status: "Pending", phone: "1234567890" }
      ]
      
      const filtered = mockData.filter(p => 
        p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.phone.includes(searchTerm)
      )
      setPrescriptions(filtered)
    } finally {
      setLoading(false)
    }
  }

  async function fulfillPrescription(id) {
    try {
      // Mock fulfillment and inventory update
      show(`Prescription #${id} fulfilled. Inventory updated.`)
      setPrescriptions(prescriptions.map(p => 
        p.id === id ? { ...p, status: "Fulfilled" } : p
      ))
    } catch (err) {
      show("Failed to fulfill prescription")
    }
  }

  return (
    <ProtectedRoute roles={["admin", "pharmacist"]}>
      <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
        {Toast}
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Pharmacist Dashboard</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Search and fulfill doctor prescriptions for patients.</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">🔍</span>
              <input
                type="text"
                className="form-input pl-11"
                placeholder="Search by Patient Name, Phone Number, or ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary shadow-blue-500/20 px-8">
              Search
            </button>
          </form>
        </div>

        {/* Prescription List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold px-2 flex items-center gap-2">
            Active Prescriptions
            {prescriptions.length > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                {prescriptions.filter(p => p.status === 'Pending').length}
              </span>
            )}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prescriptions.map(p => (
              <div key={p.id} className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm transition-all ${p.status === 'Fulfilled' ? 'opacity-60' : 'hover:border-blue-500/50'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white text-lg">{p.patient_name}</h4>
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{p.phone}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    p.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {p.status}
                  </span>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">💊</span>
                    <div>
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200">{p.medicine}</p>
                      <p className="text-xs text-zinc-500">{p.type} • {p.dose} • {p.frequency}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {p.status === 'Pending' ? (
                    <button 
                      onClick={() => fulfillPrescription(p.id)}
                      className="flex-1 btn-primary py-2.5 text-sm !bg-emerald-600 shadow-emerald-500/10"
                    >
                      Process & Fulfill
                    </button>
                  ) : (
                    <Link 
                      href={`/billing?patient_id=${p.patient_id}`}
                      className="flex-1 btn-primary py-2.5 text-sm !bg-blue-600 shadow-blue-500/10 text-center"
                    >
                      Generate Bill
                    </Link>
                  )}
                  <button className="px-4 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    📄
                  </button>
                </div>
              </div>
            ))}
            {!loading && prescriptions.length === 0 && (
              <div className="col-span-full py-12 text-center text-zinc-500 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl">
                Enter a patient name or phone number to find prescriptions.
              </div>
            )}
            {loading && (
              <div className="col-span-full py-12 text-center text-zinc-500">Searching...</div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
