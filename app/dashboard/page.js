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
  const [globalTasks, setGlobalTasks] = useState([])
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
    const userRole = (localStorage.getItem("role") || "").toLowerCase()
    setRole(userRole)
    if (userRole === 'patient') {
      const pId = localStorage.getItem('patientId')
      if (pId && pId !== "undefined") {
        window.location.href = `/patients/${pId}/profile`
        return
      } else {
        // Fallback: fetch from /dashboard to get patient ID if localStorage is missing it
        apiFetch("/dashboard").then(data => {
          if (data && data.patient_id) {
            localStorage.setItem('patientId', data.patient_id)
            window.location.href = `/patients/${data.patient_id}/profile`
          }
        }).catch(err => console.error("Could not fetch patient dashboard", err))
        return
      }
    }

    async function loadPatients() {
      try {
        const data = await apiFetch("/patients")
        setPatients(Array.isArray(data) ? data : [])
      } catch (e) {
        show("Failed to load patients")
      }
    }

    if (userRole !== 'patient') {
      loadPatients()
      loadGlobalTasks()
    }
    
    async function loadGlobalTasks() {
      try {
        const data = await apiFetch("/patients/global-tasks")
        setGlobalTasks(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Failed to load global tasks", err)
      }
    }
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
      <div className="animate-in fade-in duration-500 pb-safe">
        {Toast}
        
        {/* Header with Patient Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md py-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Dashboard</h2>
            {selectedPatientName && (
              <p className="text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Monitoring: <span className="text-zinc-800 dark:text-zinc-200">{selectedPatientName}</span>
              </p>
            )}
          </div>
          
          {(role === "doctor" || role === "patient") && (
            <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl shadow-inner border border-zinc-200 dark:border-zinc-800">
              <span className="pl-3 text-zinc-400">👤</span>
              <select
                id="patient-select"
                value={selectedPatientId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedPatientId(val);
                  const p = patients.find(p => String(p.id) === val);
                  setSelectedPatientName(p ? p.name : "");
                }}
                className="bg-transparent border-none text-sm font-bold text-zinc-800 dark:text-zinc-200 focus:ring-0 cursor-pointer min-w-[220px] py-2"
              >
                <option value="">-- Switch Patient View --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (ID: {p.id})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Dynamic Dashboard Content */}
        {role === 'admin' ? (
          <>
            {/* Admin Overview: Hospital Health */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="md:col-span-2 bg-zinc-900 dark:bg-zinc-800 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                  <h3 className="text-3xl font-black mb-2">Facility Health</h3>
                  <p className="text-zinc-400 text-lg font-medium opacity-80">Real-time occupancy and performance.</p>
                  <div className="mt-10 flex gap-10">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Bed Occupancy</p>
                      <p className="text-4xl font-black italic font-mono">84%</p>
                    </div>
                    <div className="w-px h-12 bg-zinc-700/50 self-center"></div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Live Appointments</p>
                      <p className="text-4xl font-black italic font-mono">42</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-12 -right-12 text-[12rem] opacity-5 grayscale select-none rotate-12">🏥</div>
              </div>
              
              <div className="bg-blue-600 rounded-[40px] p-8 text-white shadow-xl shadow-blue-500/20 flex flex-col justify-between group cursor-pointer hover:bg-blue-500 transition-all duration-500 hover:scale-[1.02]">
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest">Revenue Today</p>
                <h4 className="text-5xl font-black italic font-mono tracking-tighter">₹14.2k</h4>
                <div className="mt-6 flex items-center gap-2 text-xs font-black text-blue-200">
                  <span className="p-1 px-3 bg-blue-500/50 backdrop-blur-sm rounded-full border border-blue-400/30">↑ 12.5%</span>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-8 shadow-sm flex flex-col justify-between group transition-all duration-500 hover:shadow-xl">
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Staff Online</p>
                <h4 className="text-5xl font-black text-zinc-900 dark:text-white font-mono">18/24</h4>
                <Link href="/users/manage" className="text-blue-600 text-xs font-black uppercase tracking-widest hover:text-blue-700 mt-6 flex items-center gap-2 group-hover:translate-x-2 transition-all">
                  Directory <span>&rarr;</span>
                </Link>
              </div>
            </div>

            {/* Admin Quick Controls */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Control Center</h3>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Admin Privileges</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: "Patients", icon: "👥", color: "blue", path: "/patients" },
                  { label: "Orders", icon: "📋", color: "emerald", path: "/billing/orders" },
                  { label: "Appts", icon: "📅", color: "purple", path: "/appointments" },
                  { label: "Billing", icon: "💰", color: "orange", path: "/billing" }
                ].map((item) => (
                  <Link 
                    key={item.label}
                    href={item.path}
                    className={`flex flex-col items-center justify-center gap-4 p-10 bg-${item.color}-50/50 dark:bg-${item.color}-500/5 hover:bg-${item.color}-100 dark:hover:bg-${item.color}-500/10 rounded-[40px] transition-all border border-${item.color}-100/50 dark:border-${item.color}-500/10 group shadow-sm hover:shadow-md`}
                  >
                    <div className={`w-16 h-16 rounded-3xl bg-${item.color}-100 dark:bg-${item.color}-500/20 text-${item.color}-600 dark:text-${item.color}-400 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </div>
                    <span className={`font-black text-${item.color}-900 dark:text-${item.color}-50 text-sm uppercase tracking-widest`}>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : selectedPatientId ? (
          <>
            {/* Clinical Interface */}
            <div className="mb-12 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Clinical Actions</h3>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Session</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {role !== "pharmacist" && (
                  <>
                    <button onClick={() => openModal("feed")} className="flex flex-col items-center justify-center gap-4 p-10 bg-orange-50/50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 rounded-[40px] transition-all border border-orange-100/50 group shadow-sm hover:shadow-md">
                      <div className="w-16 h-16 rounded-3xl bg-orange-100 dark:bg-orange-500/20 text-orange-600 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">🍼</div>
                      <span className="font-black text-orange-900 dark:text-orange-100 text-sm uppercase tracking-widest">Log Feed</span>
                    </button>
                    <button onClick={() => openModal("vitals")} className="flex flex-col items-center justify-center gap-4 p-10 bg-red-50/50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-[40px] transition-all border border-red-100/50 group shadow-sm hover:shadow-md">
                      <div className="w-16 h-16 rounded-3xl bg-red-100 dark:bg-red-500/20 text-red-600 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">❤️</div>
                      <span className="font-black text-red-900 dark:text-red-100 text-sm uppercase tracking-widest">Add Vitals</span>
                    </button>
                  </>
                )}
                <button 
                  onClick={() => openModal("med")}
                  className={`flex flex-col items-center justify-center gap-4 p-10 bg-purple-50/50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-[40px] transition-all border border-purple-100/50 group shadow-sm hover:shadow-md ${role === 'pharmacist' ? 'col-span-2' : ''}`}
                >
                  <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">💊</div>
                  <span className="font-black text-purple-900 dark:text-purple-100 text-sm uppercase tracking-widest">Log Med</span>
                </button>
                <Link 
                  href={`/medication/prescribe?patient_id=${selectedPatientId}`}
                  className="flex flex-col items-center justify-center gap-4 p-10 bg-blue-50/50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-[40px] transition-all border border-blue-100/50 group shadow-sm hover:shadow-md"
                >
                  <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">✍️</div>
                  <span className="font-black text-blue-900 dark:text-blue-100 text-sm uppercase tracking-widest">Prescribe</span>
                </Link>
              </div>
            </div>
          </>
        ) : (
          /* Staff Landing Page */
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[48px] p-16 text-white shadow-2xl mb-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-16 opacity-10 group-hover:scale-105 transition-transform duration-1000">
              <span className="text-[12rem] font-black italic select-none">CARE</span>
            </div>
            <div className="relative z-10 max-w-2xl">
              <h3 className="text-5xl font-black mb-6 tracking-tighter italic">Patient Management</h3>
              <p className="text-blue-100 text-2xl font-medium leading-relaxed opacity-90 max-w-xl">
                Ready to provide care? Select a patient from the dropdown above to begin monitoring and recording clinical data.
              </p>
              <div className="mt-12 flex gap-4">
                 <div className="h-1 w-20 bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-1/3 animate-progress transition-all"></div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* NEW: Global Task Sheet (Next 4 Hours) for all patients */}
        {(role === 'nurse' || role === 'staff') && globalTasks.length > 0 && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                Nursing Task Sheet <span className="bg-red-600 text-white text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-black">Next 4 Hours</span>
              </h3>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Global Care Plan</span>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-800/50">
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[.25em] text-zinc-400">Due Time</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[.25em] text-zinc-400">Patient</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[.25em] text-zinc-400">Task</th>
                      <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[.25em] text-zinc-400">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {globalTasks.map((task, tidx) => {
                      const taskTime = new Date(task.time);
                      const isVerySoon = taskTime.getTime() < (Date.now() + 30 * 60 * 1000);
                      return (
                        <tr key={tidx} className={`group transition-colors ${isVerySoon ? 'bg-red-50/50 dark:bg-red-500/5' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'}`}>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <span className="text-2xl">{task.icon}</span>
                              <div>
                                <p className={`text-base font-black ${isVerySoon ? 'text-red-600 animate-pulse' : 'text-zinc-900 dark:text-white'}`}>
                                  {taskTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                                </p>
                                {isVerySoon && <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mt-0.5">Immediate Due</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">{task.patient_name}</p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">ID: #{task.patient_id}</p>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{task.label}</p>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <Link
                              href={`/patients/${task.patient_id}/profile`}
                              className="text-[10px] font-black uppercase tracking-widest bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-2xl transition-all shadow-lg active:scale-95 inline-block"
                            >
                              Go to Profile
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Universal Metrics (Condensed) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-20">
          {[
            { label: role === 'admin' ? "Total Admitted" : "Recent Logs", val: patients.length, icon: "🏥", color: "blue" },
            { label: "Urgent Tasks", val: "2", icon: "⚡", color: "red" },
            { label: "Shift Status", val: "Active", icon: "🕒", color: "emerald" }
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-6 group hover:border-zinc-400 dark:hover:border-zinc-500 transition-all duration-300">
              <div className={`w-16 h-16 rounded-3xl bg-${stat.color}-50 dark:bg-${stat.color}-500/5 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">{stat.label}</p>
                <h4 className="text-3xl font-black text-zinc-900 dark:text-white font-mono">{stat.val}</h4>
              </div>
            </div>
          ))}
        </div>

        {/* Modal System */}
        {modalType && (
          <div className="modal-backdrop z-[100] p-4 flex items-center justify-center bg-zinc-950/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[48px] p-10 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
              <div className="mb-10 text-center">
                <h3 className="text-3xl font-black text-zinc-900 dark:text-white lowercase tracking-tight">
                  {modalType === "feed" ? "log_feeding" : modalType === "vitals" ? "add_vitals" : "log_medication"}
                </h3>
                <p className="text-sm text-zinc-500 font-bold mt-2 uppercase tracking-widest opacity-60">Patient: {selectedPatientName}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-3 ml-1">Timestamp</label>
                  <input
                    type="datetime-local"
                    className="form-input !py-4 !px-6 !rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-none font-bold text-zinc-700 dark:text-zinc-200"
                    value={formState.recorded_at}
                    onChange={(e) => setFormState((s) => ({ ...s, recorded_at: e.target.value }))}
                    required
                  />
                </div>

                {modalType === "feed" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-3 ml-1">Feed Type</label>
                      <select
                        className="form-input !py-4 !px-6 !rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-none font-bold"
                        value={formState.type}
                        onChange={(e) => setFormState((s) => ({ ...s, type: e.target.value }))}
                        required
                      >
                        <option value="">Select...</option>
                        <option value="EBM">EBM</option>
                        <option value="Formula">Formula</option>
                        <option value="IV_FLUIDS">IV Fluids</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-3 ml-1">Quantity (ml)</label>
                      <input
                        className="form-input !py-4 !px-6 !rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-none font-bold"
                        placeholder="e.g. 50"
                        value={formState.quantity}
                        onChange={(e) => setFormState((s) => ({ ...s, quantity: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                )}

                {modalType === "vitals" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-3 ml-1">Heart Rate (bpm)</label>
                        <input
                          className="form-input !py-4 !px-6 !rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-none font-bold"
                          placeholder="000"
                          value={formState.hr}
                          onChange={(e) => setFormState((s) => ({ ...s, hr: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-3 ml-1">SpO2 (%)</label>
                        <input
                          className="form-input !py-4 !px-6 !rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-none font-bold"
                          placeholder="00"
                          value={formState.spo2}
                          onChange={(e) => setFormState((s) => ({ ...s, spo2: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-3 ml-1">Clinical Observations</label>
                      <textarea
                        className="form-input !py-4 !px-6 !rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-none font-bold min-h-[100px] resize-none"
                        placeholder="Type any notes here..."
                        value={formState.notes}
                        onChange={(e) => setFormState((s) => ({ ...s, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {modalType === "med" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-3 ml-1">Schedule</label>
                      <select
                        className="form-input !py-4 !px-6 !rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-none font-bold"
                        value={formState.scheduleId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const m = medOptions.find(opt => String(opt.id) === id);
                          setFormState(s => ({ ...s, scheduleId: id, medicine: m?.medicine || "", dose: m?.dosage || "" }));
                        }}
                        required
                      >
                        <option value="">Select Scheduled Dose...</option>
                        {medOptions.map(m => <option key={m.id} value={m.id}>{m.medicine} ({m.dosage})</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-6">
                  <button type="submit" className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-6 rounded-[24px] font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform">Save Entry</button>
                  <button type="button" onClick={() => setModalType(null)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 py-6 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors">Discard</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
