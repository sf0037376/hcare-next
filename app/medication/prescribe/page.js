"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { apiFetch } from "../../../lib/api"
import useToast from "../../../components/toast"
import ProtectedRoute from "../../../components/ProtectedRoute"
import Link from "next/link"

function PrescribeClient() {
  const { Toast, show } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPatientId = searchParams.get("patient_id") || ""
  const scheduleId = searchParams.get("schedule_id") || ""
  const isEdit = !!scheduleId

  const [patients, setPatients] = useState([])
  const [medicines, setMedicines] = useState([])
  const [medicineQuery, setMedicineQuery] = useState("")
  const [showMedDropdown, setShowMedDropdown] = useState(false)
  const [timingMode, setTimingMode] = useState("RELATIVE")
  const [specificTimings, setSpecificTimings] = useState(["09:00"])
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
  const [submitting, setSubmitting] = useState(false)
  const [newMedicine, setNewMedicine] = useState({ name: "", category: "General", unit_price: 0 })
  
  const [labTestsList, setLabTestsList] = useState([])
  const [labSearch, setLabSearch] = useState("")
  const [selectedLabs, setSelectedLabs] = useState([])

  const filteredMedicines = medicineQuery
    ? medicines.filter(m => m.medicine?.toLowerCase().includes(medicineQuery.toLowerCase()))
    : medicines.slice(0, 10)
  const filteredLabs = labSearch
    ? labTestsList.filter(t => t.name?.toLowerCase().includes(labSearch.toLowerCase()))
    : labTestsList

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

  const loadLabTests = useCallback(async () => {
    try {
      const data = await apiFetch("/labs/list")
      setLabTestsList(Array.isArray(data) ? data : [])
    } catch (err) {
      show("Failed to load lab tests")
    }
  }, [show])

  useEffect(() => {
    loadPatients()
    loadMedicines()
    loadLabTests()
  }, [loadPatients, loadMedicines, loadLabTests])

  useEffect(() => {
    async function loadSchedule() {
      if (!scheduleId) return
      try {
        const item = await apiFetch(`/medication/schedule/item/${scheduleId}`)
        const timings = item.specific_timings ? JSON.parse(item.specific_timings) : []
        setForm({
          patient_id: item.patient_id,
          medicine: item.medicine,
          dosage: item.dosage,
          times_per_day: item.times_per_day,
          first_dose: item.first_dose,
          interval_minutes: item.interval_minutes,
          start_date: item.start_date ? new Date(item.start_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
        })
        if (timings.length > 0) {
          setTimingMode("SPECIFIC")
          setSpecificTimings(timings)
        }
        setMedicineQuery(item.medicine)
      } catch (err) {
        show("Failed to load schedule details")
      }
    }
    loadSchedule()
  }, [scheduleId, show])

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
      setMedicineQuery(newMedicine.name)
      setNewMedicine({ name: "", category: "General", unit_price: 0 })
    } catch (err) {
      show("Failed to add new medicine")
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.patient_id) return show("Select a patient")
    if (!form.medicine && selectedLabs.length === 0) return show("Enter a medicine or select at least one lab test")

    setSubmitting(true)

    try {
      const promises = []
      
      if (form.medicine) {
        const url = isEdit ? `/medication/schedule/${scheduleId}` : "/medication/schedule"
        const method = isEdit ? "PUT" : "POST"
        promises.push(apiFetch(url, {
          method,
          body: JSON.stringify({
            ...form,
            specific_timings: timingMode === "SPECIFIC" ? specificTimings : null
          })
        }))
      }

      if (selectedLabs.length > 0) {
        selectedLabs.forEach(testId => {
          promises.push(apiFetch("/labs/order", {
            method: "POST",
            body: JSON.stringify({
              patient_id: form.patient_id,
              test_id: testId,
              doctor_id: 1 // Placeholder for current doctor
            })
          }))
        })
      }

      await Promise.all(promises)
      show("Prescription and Lab Orders saved")
      setTimeout(() => router.back(), 1500)
    } catch (err) {
      show(err.message || "Failed to save prescription/lab orders")
    } finally {
      if (!err || typeof err === 'undefined' || !err.message) {
         // Usually if it's successful we are routing back anyway, but let's unlock
      }
      setSubmitting(false)
    }
  }

  return (
    <ProtectedRoute roles={["DOCTOR"]}>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto pb-20">
        {Toast}
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{isEdit ? 'Adjust Dosage' : 'Create Prescription'}</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">{isEdit ? 'Update details for this prescription. History will be preserved.' : 'Generate a new medication schedule for a patient.'}</p>
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
                    {isEdit && <p className="text-[10px] font-bold text-zinc-400 mt-2 uppercase tracking-widest">Locked for current adjustment</p>}
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
                    <div className="relative">
                      <input
                        className="form-input"
                        placeholder="Type to search medicine (optional if ordering labs)..."
                        value={medicineQuery || form.medicine}
                        onFocus={() => setShowMedDropdown(true)}
                        onChange={e => { setMedicineQuery(e.target.value); setForm({...form, medicine: e.target.value}); setShowMedDropdown(true) }}
                        onBlur={() => setTimeout(() => setShowMedDropdown(false), 150)}
                      />
                      {showMedDropdown && filteredMedicines.length > 0 && (
                        <div className="absolute z-20 top-full mt-1 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                          {filteredMedicines.map(m => (
                            <div
                              key={m.id}
                              className="px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer text-sm font-medium"
                              onMouseDown={() => { setForm({...form, medicine: m.medicine}); setMedicineQuery(m.medicine); setShowMedDropdown(false) }}
                            >
                              {m.medicine}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2 space-y-4">
                    <div className="flex items-center gap-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Timing Mode</label>
                        <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
                          <button 
                            type="button" 
                            onClick={() => setTimingMode("RELATIVE")}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timingMode === 'RELATIVE' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900'}`}
                          >
                            Interval Based
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setTimingMode("SPECIFIC")}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timingMode === 'SPECIFIC' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900'}`}
                          >
                            Specific Times
                          </button>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-zinc-500 font-medium">
                          {timingMode === 'RELATIVE' 
                            ? "Doses will be scheduled exactly every X hours starting from the first dose." 
                            : "Define exact times of the day for administration (e.g. Morning, Evening)."}
                        </p>
                      </div>
                    </div>

                    {timingMode === 'RELATIVE' ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="form-label mb-0">Daily Administration Slots</label>
                          <button 
                            type="button"
                            onClick={() => setSpecificTimings([...specificTimings, "12:00"])}
                            className="text-xs font-bold text-blue-600 hover:underline"
                          >
                            + Add Time Slot
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {specificTimings.map((time, idx) => (
                            <div key={idx} className="relative group/slot">
                              <input 
                                type="time"
                                className="form-input !py-3"
                                value={time}
                                onChange={e => {
                                  const newTimings = [...specificTimings]
                                  newTimings[idx] = e.target.value
                                  setSpecificTimings(newTimings)
                                }}
                                required
                              />
                              {specificTimings.length > 1 && (
                                <button 
                                  type="button"
                                  onClick={() => setSpecificTimings(specificTimings.filter((_, i) => i !== idx))}
                                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity shadow-lg"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
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
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <h4 className="font-bold text-zinc-900 dark:text-white mb-4 uppercase tracking-widest text-xs">Request Lab Tests</h4>
                  <input
                    className="form-input mb-3"
                    placeholder="Search tests..."
                    value={labSearch}
                    onChange={e => setLabSearch(e.target.value)}
                  />
                  {selectedLabs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedLabs.map(id => {
                        const t = labTestsList.find(x => x.id === id)
                        return t ? (
                          <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                            {t.name}
                            <button type="button" onClick={() => setSelectedLabs(selectedLabs.filter(l => l !== id))} className="text-blue-400 hover:text-blue-600">×</button>
                          </span>
                        ) : null
                      })}
                    </div>
                  )}
                  <div className="max-h-48 overflow-y-auto space-y-1 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-2">
                    {filteredLabs.map(test => (
                      <label key={test.id} className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedLabs.includes(test.id)}
                          onChange={e => {
                            if (e.target.checked) setSelectedLabs([...selectedLabs, test.id])
                            else setSelectedLabs(selectedLabs.filter(id => id !== test.id))
                          }}
                        />
                        <span className="text-sm">{test.name}</span>
                      </label>
                    ))}
                    {filteredLabs.length === 0 && <p className="text-xs text-zinc-400 text-center py-4">No tests match your search</p>}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <button type="submit" disabled={submitting} className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                    {submitting ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isEdit ? 'Update & Prescribe' : 'Confirm & Prescribe')}
                  </button>
                </div>
              </div>
            </form>
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

export default function PrescribePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading prescription tool...</div>}>
      <PrescribeClient />
    </Suspense>
  )
}
