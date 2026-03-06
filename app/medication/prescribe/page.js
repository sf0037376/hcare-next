"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { apiFetch } from "../../../lib/api"
import useToast from "../../../components/toast"
import ProtectedRoute from "../../../components/ProtectedRoute"
import Link from "next/link"

export default function PrescribePage() {
  const { Toast, show } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPatientId = searchParams.get("patient_id") || ""

  const [patients, setPatients] = useState([])
  const [medicines, setMedicines] = useState([])
  const [form, setForm] = useState({
    patient_id: initialPatientId,
    medicine: "",
    dosage: "",
    times_per_day: 1,
    first_dose: "09:00",
    interval_minutes: 1440,
    start_date: new Date().toISOString().slice(0, 10)
  })

  const [showAddMedicine, setShowAddMedicine] = useState(false)
  const [newMedicine, setNewMedicine] = useState({ name: "", category: "General", unit_price: 0 })

  const loadPatients = useCallback(async () => {
    try {
      const data = await apiFetch("/patients")
      setPatients(Array.isArray(data) ? data : [])
    } catch (err) {
      show("Failed to load patients")
    }
  }, [show])

  const loadMedicines = useCallback(async () => {
    try {
      const data = await apiFetch("/pharmacy/inventory")
      setMedicines(Array.isArray(data) ? data : [])
    } catch (err) {
      show("Failed to load medicines")
    }
  }, [show])

  useEffect(() => {
    loadPatients()
    loadMedicines()
  }, [loadPatients, loadMedicines])

  async function handleAddMedicine(e) {
    if (e) e.preventDefault()
    try {
      await apiFetch("/pharmacy/inventory", {
        method: "POST",
        body: JSON.stringify({
          medicine: newMedicine.name,
          category: newMedicine.category,
          price: newMedicine.unit_price,
          stock: 0 // Adding with empty stock per request
        })
      })
      show("New medicine added to pharmacy inventory")
      setShowAddMedicine(false)
      loadMedicines()
      setForm({ ...form, medicine: newMedicine.name })
      setNewMedicine({ name: "", category: "General", unit_price: 0 })
    } catch (err) {
      show("Failed to add new medicine")
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.patient_id) return show("Select a patient")
    if (!form.medicine) return show("Select or add a medicine")

    try {
      await apiFetch("/medication/schedule", {
        method: "POST",
        body: JSON.stringify(form)
      })
      show("Prescription saved and scheduled")
      setTimeout(() => router.back(), 1500)
    } catch (err) {
      show("Failed to save prescription")
    }
  }

  return (
    <ProtectedRoute roles={["doctor", "admin"]}>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto pb-20">
        {Toast}
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Create Prescription</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Generate a new medication schedule for a patient.</p>
          </div>
          <button onClick={() => router.back()} className="btn-secondary text-sm">Cancel</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="form-label">Select Patient</label>
                    <select 
                      className="form-input"
                      value={form.patient_id}
                      onChange={e => setForm({...form, patient_id: e.target.value})}
                      required
                    >
                      <option value="">-- Choose Patient --</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="form-label mb-0">Medicine</label>
                      <button 
                        type="button" 
                        onClick={() => setShowAddMedicine(true)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        + Add Missing Medicine
                      </button>
                    </div>
                    <select 
                      className="form-input"
                      value={form.medicine}
                      onChange={e => setForm({...form, medicine: e.target.value})}
                      required
                    >
                      <option value="">-- Select from Inventory --</option>
                      {medicines.map(m => <option key={m.id} value={m.medicine}>{m.medicine}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Dosage</label>
                    <input 
                      className="form-input" 
                      placeholder="e.g. 1.5ml or 250mg"
                      value={form.dosage}
                      onChange={e => setForm({...form, dosage: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Times Per Day</label>
                    <input 
                      type="number"
                      className="form-input" 
                      value={form.times_per_day}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 1
                        setForm({...form, times_per_day: val, interval_minutes: Math.floor(1440/val)})
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">First Dose Time</label>
                    <input 
                      type="time"
                      className="form-input" 
                      value={form.first_dose}
                      onChange={e => setForm({...form, first_dose: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Start Date</label>
                    <input 
                      type="date"
                      className="form-input" 
                      value={form.start_date}
                      onChange={e => setForm({...form, start_date: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <button type="submit" className="w-full btn-primary py-4 text-lg">
                    Confirm & Prescribe
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-3xl p-6 h-fit sticky top-6">
              <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2">
                <span>ℹ️</span> Dosage Help
              </h4>
              <ul className="text-sm text-blue-800/80 dark:text-blue-300/80 space-y-3">
                <li>• <b>TDS</b>: 3 times a day (8-hourly)</li>
                <li>• <b>BD</b>: 2 times a day (12-hourly)</li>
                <li>• <b>OD</b>: Once a day (24-hourly)</li>
                <li>• <b>SOS</b>: As needed only</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Add Medicine Modal */}
        {showAddMedicine && (
          <div className="modal-backdrop overflow-y-auto">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold mb-6">Inward Missing Medicine</h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Medicine Name</label>
                  <input 
                    className="form-input" 
                    placeholder="Enter full name"
                    value={newMedicine.name}
                    onChange={e => setNewMedicine({...newMedicine, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <input 
                    className="form-input" 
                    placeholder="e.g. Antibiotic"
                    value={newMedicine.category}
                    onChange={e => setNewMedicine({...newMedicine, category: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">Est. Unit Price ($)</label>
                  <input 
                    type="number"
                    className="form-input" 
                    placeholder="0.00"
                    value={newMedicine.unit_price}
                    onChange={e => setNewMedicine({...newMedicine, unit_price: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/20 text-xs text-amber-700 dark:text-amber-400">
                  ⚠️ Note: Adding a medicine here will register it in the pharmacy directory with <b>0 stock</b> for future inwarding.
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={handleAddMedicine} className="flex-1 btn-primary !bg-blue-600">Register Item</button>
                  <button onClick={() => setShowAddMedicine(false)} className="flex-1 btn-secondary">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
