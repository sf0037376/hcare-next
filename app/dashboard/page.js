'use client'
import { useEffect, useState } from "react"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"
import Link from "next/link"

export default function Dashboard() {
  const { Toast, show } = useToast()
  const [patients, setPatients] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [selectedPatientName, setSelectedPatientName] = useState("")
  const [modalType, setModalType] = useState(null) // 'feed' | 'vitals' | 'med'
  const [role, setRole] = useState("")
  const [medOptions, setMedOptions] = useState([])
  const [formState, setFormState] = useState({
    type: "",
    quantity: "",
    hr: "",
    spo2: "",
    weight: "",
    head: "",
    notes: "",
    medicine: "",
    dose: "",
    scheduleId: "",
    recorded_at: new Date().toISOString().slice(0, 16)
  })

  useEffect(() => {
    async function loadPatients() {
      try {
        const data = await apiFetch("/patients")
        setPatients(Array.isArray(data) ? data : [])
      } catch (e) {
        show("Failed to load patients")
      }
    }

    loadPatients()
    setRole((localStorage.getItem("role") || "").toLowerCase())
  }, [show])

  function requirePatient() {
    if (!selectedPatientId) {
      alert("Please select a patient first")
      return false
    }
    return true
  }

  function openModal(type) {
    if (!requirePatient()) return
    setFormState({
      type: "",
      quantity: "",
      hr: "",
      spo2: "",
      weight: "",
      head: "",
      notes: "",
      medicine: "",
      dose: "",
      scheduleId: "",
      recorded_at: new Date().toISOString().slice(0, 16)
    })

    if (type === "med") {
      apiFetch(`/medication/schedule/${selectedPatientId}`)
        .then((data) => {
          setMedOptions(Array.isArray(data) ? data : [])
        })
        .catch(() => {
          setMedOptions([])
          show("Failed to load medication schedule")
        })
    }

    setModalType(type)
  }

  // Auto-notes logic for the modal
  useEffect(() => {
    if (modalType !== 'vitals') return;
    const hrVal = parseInt(formState.hr)
    const spo2Val = parseInt(formState.spo2)
    let autoNotes = []

    if (hrVal) {
      if (hrVal > 170) autoNotes.push("High HR (Tachycardia)")
      else if (hrVal < 90) autoNotes.push("Low HR (Bradycardia)")
    }
    if (spo2Val && spo2Val < 92) {
      autoNotes.push("Low SpO2 (Hypoxia risk)")
    }

    if (autoNotes.length > 0) {
      setFormState(prev => ({ ...prev, notes: autoNotes.join(". ") }))
    }
  }, [formState.hr, formState.spo2, modalType])

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      const baseBody = {
        patient_id: selectedPatientId,
        patient_name: selectedPatientName,
        recorded_at: formState.recorded_at
      }

      if (modalType === "feed") {
        await apiFetch("/feeding/feeding", {
          method: "POST",
          body: JSON.stringify({
            ...baseBody,
            type: formState.type,
            quantity: formState.quantity,
          }),
        })
        show("Feeding saved")
      } else if (modalType === "vitals") {
        await apiFetch("/vitals", {
          method: "POST",
          body: JSON.stringify({
            ...baseBody,
            hr: formState.hr,
            spo2: formState.spo2,
            weight: formState.weight,
            head: formState.head,
            notes: formState.notes
          }),
        })
        show("Vitals saved")
      } else if (modalType === "med") {
        await apiFetch("/medication/medication", {
          method: "POST",
          body: JSON.stringify({
            ...baseBody,
            scheduleId: formState.scheduleId,
            medicine: formState.medicine,
            dose: formState.dose,
          }),
        })
        show("Medication logged")
      }

      setModalType(null)
    } catch (err) {
      show("Failed to save")
    }
  }

  return (
    <ProtectedRoute>
      <div className="animate-in fade-in duration-500">
        {Toast}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Dashboard</h2>
            {selectedPatientName && (
              <p className="text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Monitoring: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{selectedPatientName}</span>
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-2 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <select
              id="patient-select"
              value={selectedPatientId}
              onChange={(e) => {
                setSelectedPatientId(e.target.value);
                const p = patients.find(p => String(p.id) === e.target.value);
                setSelectedPatientName(p ? p.name : "");
              }}
              className="bg-transparent border-none text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:ring-0 cursor-pointer min-w-[200px]"
            >
              <option value="">-- Switch Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || `Patient #${p.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hero Section */}
        {!selectedPatientId ? (
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 sm:p-12 text-white shadow-lg shadow-blue-500/20 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <span className="text-9xl">🏥</span>
            </div>
            <div className="relative z-10 max-w-lg">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">Select a Patient</h3>
              <p className="text-blue-100 mb-8 text-lg">Choose a patient from the dropdown above to view their vitals, log medications, or add feeding records.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Quick Actions Base on the provided UI */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {role !== "pharmacist" && (
                  <>
                    <button 
                      onClick={() => openModal("feed")}
                      className="flex flex-col items-center justify-center gap-3 p-6 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 rounded-3xl transition-colors border border-orange-100 dark:border-orange-500/20 group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        🍼
                      </div>
                      <span className="font-semibold text-orange-900 dark:text-orange-100 text-sm">Log Feed</span>
                    </button>
                    
                    <button 
                      onClick={() => openModal("vitals")}
                      className="flex flex-col items-center justify-center gap-3 p-6 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-3xl transition-colors border border-red-100 dark:border-red-500/20 group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        ❤️
                      </div>
                      <span className="font-semibold text-red-900 dark:text-red-100 text-sm">Add Vitals</span>
                    </button>
                  </>
                )}
                
                <button 
                  onClick={() => openModal("med")}
                  className={`flex flex-col items-center justify-center gap-3 p-6 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-100 rounded-3xl transition-colors border border-purple-100 dark:border-purple-500/20 group ${role === 'pharmacist' ? 'col-span-2' : 'col-span-2 md:col-span-1'}`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    💊
                  </div>
                  <span className="font-semibold text-purple-900 dark:text-purple-100 text-sm">Log Medication</span>
                </button>
                
                <Link 
                  href={`/medication/prescribe?patient_id=${selectedPatientId}`}
                  className="flex flex-col items-center justify-center gap-3 p-6 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-3xl transition-colors border border-blue-100 dark:border-blue-500/20 group col-span-2 md:col-span-1"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    ✍️
                  </div>
                  <span className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Prescribe</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 text-xl">
                  📊
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Feeds Today</p>
                  <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">0</h4>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 text-xl">
                  📋
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Medications Done</p>
                  <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">0</h4>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 text-xl">
                  📈
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Vitals Logged</p>
                  <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">0</h4>
                </div>
              </div>
            </div>
          </>
        )}

        {modalType && (
          <div className="modal-backdrop">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {modalType === "feed"
                    ? "Add Feed"
                    : modalType === "vitals"
                    ? "Add Vitals"
                    : "Mark Medication Done"}
                </h3>
                <p className="text-sm text-zinc-500 mt-1">For patient: {selectedPatientName || selectedPatientId}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label text-xs">Date & Time of Log</label>
                  <input
                    type="datetime-local"
                    className="form-input !py-2 !text-sm"
                    value={formState.recorded_at}
                    onChange={(e) => setFormState((s) => ({ ...s, recorded_at: e.target.value }))}
                    required
                  />
                </div>

                {modalType === "feed" && (
                  <>
                    <div>
                      <label className="form-label text-xs">Feed Type</label>
                      <select
                        className="form-input !py-2 !text-sm"
                        value={formState.type}
                        onChange={(e) => setFormState((s) => ({ ...s, type: e.target.value }))}
                        required
                      >
                        <option value="">Select type</option>
                        <option value="EBM">EBM (Breast Milk)</option>
                        <option value="Formula">Formula</option>
                        <option value="IV_FLUIDS">IV Fluids</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label text-xs">Quantity (ml)</label>
                      <input
                        className="form-input !py-2 !text-sm"
                        placeholder="e.g. 50"
                        value={formState.quantity}
                        onChange={(e) => setFormState((s) => ({ ...s, quantity: e.target.value }))}
                        required
                      />
                    </div>
                  </>
                )}

                {modalType === "vitals" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="form-label text-xs">Heart Rate</label>
                        <input
                          className="form-input !py-2 !text-sm"
                          placeholder="bpm"
                          value={formState.hr}
                          onChange={(e) => setFormState((s) => ({ ...s, hr: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="form-label text-xs">SpO2 (%)</label>
                        <input
                          className="form-input !py-2 !text-sm"
                          placeholder="%"
                          value={formState.spo2}
                          onChange={(e) => setFormState((s) => ({ ...s, spo2: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="form-label text-xs">Weight (kg)</label>
                        <input
                          className="form-input !py-2 !text-sm"
                          placeholder="e.g. 2.5"
                          value={formState.weight}
                          onChange={(e) => setFormState((s) => ({ ...s, weight: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="form-label text-xs">Head (cm)</label>
                        <input
                          className="form-input !py-2 !text-sm"
                          placeholder="e.g. 33.5"
                          value={formState.head}
                          onChange={(e) => setFormState((s) => ({ ...s, head: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="form-label text-xs">Clinical Notes</label>
                      <textarea
                        className="form-input !py-2 !text-sm min-h-[60px] resize-none"
                        placeholder="Clinical observations..."
                        value={formState.notes}
                        onChange={(e) => setFormState((s) => ({ ...s, notes: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                {modalType === "med" && (
                  <>
                    <div>
                      <label className="form-label text-xs">Scheduled Medicine</label>
                      <select
                        className="form-input !py-2 !text-sm"
                        value={formState.scheduleId}
                        onChange={(e) => {
                          const selectedId = e.target.value
                          const selected = medOptions.find((m) => String(m.id) === selectedId)
                          setFormState((s) => ({
                            ...s,
                            scheduleId: selectedId,
                            medicine: selected ? selected.medicine : "",
                            dose: selected ? selected.dosage : "",
                          }))
                        }}
                        required
                      >
                        <option value="">Select medicine</option>
                        {medOptions.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.medicine} ({m.dosage})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label text-xs">Confirm Dose</label>
                      <input
                        className="form-input !py-2 !text-sm"
                        placeholder="Dose"
                        value={formState.dose}
                        onChange={(e) => setFormState((s) => ({ ...s, dose: e.target.value }))}
                        required
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-2">
                  <button 
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition-colors shadow-sm text-sm"
                  >
                    Save Record
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white py-2.5 rounded-xl font-semibold transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
