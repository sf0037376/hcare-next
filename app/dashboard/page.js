'use client'
import { useEffect, useState } from "react"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"

export default function Dashboard() {
  const { Toast, show } = useToast()
  const [patients, setPatients] = useState([])
  const [selectedPatientId, setSelectedPatientId, selectedPatientName] = useState("")
  const [modalType, setModalType] = useState(null) // 'feed' | 'vitals' | 'med'
  const [medOptions, setMedOptions] = useState([])
  const [formState, setFormState] = useState({
    type: "",
    quantity: "",
    hr: "",
    spo2: "",
    medicine: "",
    dose: "",
    scheduleId: "",
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
      medicine: "",
      dose: "",
      scheduleId: "",
    })

    if (type === "med") {
      // Load medication schedule options for this patient
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

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      if (modalType === "feed") {
        await apiFetch("/feeding/feeding", {
          method: "POST",
          body: JSON.stringify({
            patient_id: selectedPatientId,
            patient_name: selectedPatientName,
            type: formState.type,
            quantity: formState.quantity,
          }),
        })
        show("Feeding saved")
      } else if (modalType === "vitals") {
        await apiFetch("/vitals", {
          method: "POST",
          body: JSON.stringify({
            patient_id: selectedPatientId,
            patient_name: selectedPatientName,
            hr: formState.hr,
            spo2: formState.spo2,
          }),
        })
        show("Vitals saved")
      } else if (modalType === "med") {
        await apiFetch("/medication/medication", {
          method: "POST",
          body: JSON.stringify({
            patient_id: selectedPatientId,
            patient_name: selectedPatientName,
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
      <div className="page">
        {Toast}
        <h2 className="page-title">Dashboard</h2>

        <div className="form" style={{ maxWidth: 400, marginBottom: "1.5rem" }}>
          <label htmlFor="patient-select">Select patient</label>
          <select
            id="patient-select"
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
          >
            <option value="">-- Choose patient --</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || `Patient #${p.id}`}
              </option>
            ))}
          </select>

          <input
            name="patient-name"
            placeholder="Patient Name"
            value={selectedPatientName}
            onChange={(e) => setSelectedPatientName(e.target.value)}
          />

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="button" onClick={() => openModal("feed")}>
              Add Feed
            </button>
            <button type="button" onClick={() => openModal("vitals")}>
              Add Vitals
            </button>
            <button type="button" onClick={() => openModal("med")}>
              Mark Medication Done
            </button>
          </div>
        </div>

        <div className="grid">
          <div className="card">Feeds Today: 0</div>
          <div className="card">Medications: 0</div>
          <div className="card">Vitals Logged: 0</div>
        </div>

        {modalType && (
          <div className="modal-backdrop">
            <div className="modal">
              <h3 className="page-title" style={{ marginTop: 0 }}>
                {modalType === "feed"
                  ? "Add Feed"
                  : modalType === "vitals"
                  ? "Add Vitals"
                  : "Mark Medication Done"}
              </h3>

              <form onSubmit={handleSubmit} className="form">
                <input
                  name="patient"
                  value={selectedPatientId}
                  readOnly
                  disabled
                />

                {modalType === "feed" && (
                  <>
                    <label>Feed Type</label>
                    <select
                      value={formState.type}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, type: e.target.value }))
                      }
                      required
                    >
                      <option value="">Select type</option>
                      <option value="EBM">EBM</option>
                      <option value="Formula">Formula</option>
                    </select>
                    <input
                      placeholder="Quantity"
                      value={formState.quantity}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          quantity: e.target.value,
                        }))
                      }
                      required
                    />
                  </>
                )}

                {modalType === "vitals" && (
                  <>
                    <input
                      placeholder="Heart Rate"
                      value={formState.hr}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, hr: e.target.value }))
                      }
                      required
                    />
                    <input
                      placeholder="SpO2"
                      value={formState.spo2}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, spo2: e.target.value }))
                      }
                      required
                    />
                  </>
                )}

                {modalType === "med" && (
                  <>
                    <label>Medicine</label>
                    <select
                      value={formState.scheduleId}
                      onChange={(e) => {
                        const selectedId = e.target.value
                        const selected = medOptions.find(
                          (m) => String(m.id) === selectedId
                        )
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
                    <input
                      placeholder="Dose"
                      value={formState.dose}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, dose: e.target.value }))
                      }
                      required
                    />
                  </>
                )}

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="submit">Save</button>
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    style={{ background: "#6b7280" }}
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
