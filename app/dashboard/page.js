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
  const [stats, setStats] = useState({
    occupancyRate: 0,
    liveAppointments: 0,
    revenueToday: 0,
    staffOnline: 0,
    staffTotal: 0
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
    } else if (userRole === 'pharmacist') {
      window.location.href = '/pharmacy/fulfillment'
      return
    }

    async function loadPatients() {
      try {
        const data = await apiFetch("/patients")
        setPatients(Array.isArray(data) ? data : [])
      } catch (e) {
        show("Failed to load patients")
      }
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
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-40 max-w-7xl mx-auto px-4 lg:px-6 transition-all">
        {Toast}
        
        {/* Institutional Command Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16 py-8 relative">
          <div className="space-y-2">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic leading-none premium-text-gradient">Command_Nexus</h2>
            <div className="flex items-center gap-4">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></span>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] font-mono italic">Sector_Status: Clinical_Sync_Active</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {(role === "doctor" || role === "nurse" || role === "staff") && (
              <div className="w-full sm:w-auto flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900 px-6 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-all">
                <span className="text-xl">👤</span>
                <select
                  id="patient-select"
                  value={selectedPatientId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedPatientId(val);
                    const p = patients.find(p => String(p.id) === val);
                    setSelectedPatientName(p ? p.name : "");
                  }}
                  className="bg-transparent border-none text-[11px] font-black text-zinc-800 dark:text-zinc-200 focus:ring-0 cursor-pointer min-w-[200px] py-1 uppercase tracking-widest relative z-10 font-mono"
                >
                  <option value="">-- clinical_selector --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id} className="dark:bg-zinc-900">
                      {p.name.toUpperCase()} [ID_{p.id}]
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Link href="/patients" className="w-full sm:w-auto btn-primary">Institutional_Directory →</Link>
          </div>
        </div>

        {/* Dynamic Operational Sector Content */}
        {role === 'admin' || role === 'super_admin' ? (
          <div className="space-y-16">
            {/* Facility Telemetry Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-2 pro-card p-10 group relative overflow-hidden transition-all shadow-sm">
                <div className="relative z-10">
                  <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em] mb-8 italic">Facility_Operational_Metrics</h3>
                  <div className="grid grid-cols-2 gap-12">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4 opacity-70">Capacity_Vector</p>
                      <p className="text-6xl font-black italic text-zinc-900 dark:text-white leading-none tracking-tighter">{stats.occupancyRate}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4 opacity-70">Active_Diagnostic_Flow</p>
                      <p className="text-6xl font-black italic text-zinc-900 dark:text-white leading-none tracking-tighter">{stats.liveAppointments}</p>
                    </div>
                  </div>
                  <div className="mt-12 w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${stats.occupancyRate}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 rounded-2xl p-10 flex flex-col justify-between group transition-all">
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-400 italic">Financial_Flow_Today</p>
                    <h4 className="text-5xl font-black italic tracking-tighter mt-12 leading-none">₹{(stats.revenueToday / 1000).toFixed(1)}k</h4>
                    <span className="inline-block mt-4 text-[9px] font-black uppercase tracking-widest text-emerald-500">↑ Delta_Stable</span>
                </div>
              </div>

              <div className="pro-card p-10 flex flex-col justify-between group transition-all shadow-sm">
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 italic">Sector_Personnel</p>
                    <h4 className="text-5xl font-black text-zinc-900 dark:text-white mt-12 italic leading-none">{stats.staffOnline}<span className="text-zinc-300 dark:text-zinc-700 mx-1">/</span>{stats.staffTotal}</h4>
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-4">Node_Registry_Active</p>
                </div>
              </div>
            </div>

            {/* Tactical Control Node Grid */}
            <div className="space-y-12">
              <div className="flex items-center gap-6 px-4">
                  <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.5em] italic">Tactical_Override_Controls</h3>
                  <div className="flex-1 h-px bg-zinc-100 dark:bg-white/5"></div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { label: "Patient_Identity", icon: "👤", color: "blue", path: "/patients" },
                  { label: "Pharma_Ledger", icon: "📋", color: "purple", path: "/billing/orders" },
                  { label: "Shift_Protocol", icon: "📅", color: "indigo", path: "/appointments" },
                  { label: "Institutional_Ledger", icon: "💰", color: "emerald", path: "/billing" }
                ].map((item) => (
                  <Link 
                    key={item.label}
                    href={item.path}
                    className="pro-card p-8 flex flex-col items-center justify-center gap-6 group hover:border-blue-500/50 transition-all shadow-sm"
                  >
                    <div className="w-16 h-16 rounded-xl bg-zinc-950 dark:bg-zinc-800 text-white flex items-center justify-center text-2xl transition-all group-hover:scale-110">
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] font-mono">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : selectedPatientId ? (
          <div className="space-y-16">
            {/* Clinical Command Node */}
            <div className="mb-12 animate-in slide-in-from-bottom-8 duration-1000">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 px-4">
                <div className="flex items-center gap-6">
                    <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter italic uppercase">Clinical_Execution_Manual</h3>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse hidden md:block"></span>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 hidden md:block">Sector_Operational: Priority_Care</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {role !== "pharmacist" && (
                  <>
                    <button onClick={() => openModal("feed")} className="pro-card p-10 group flex flex-col items-center justify-center gap-6 hover:border-orange-500/30 transition-all shadow-sm">
                      <div className="w-20 h-20 rounded-2xl bg-orange-600/5 text-orange-600 flex items-center justify-center text-4xl group-hover:scale-110 transition-all">🍼</div>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] font-mono">Log_Feeding</span>
                    </button>
                    <button onClick={() => openModal("vitals")} className="pro-card p-10 group flex flex-col items-center justify-center gap-6 hover:border-red-500/30 transition-all shadow-sm">
                      <div className="w-20 h-20 rounded-2xl bg-red-600/5 text-red-600 flex items-center justify-center text-4xl group-hover:scale-110 transition-all">❤️</div>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] font-mono">Log_Vitals</span>
                    </button>
                  </>
                )}
                <button 
                  onClick={() => openModal("med")}
                  className={`pro-card p-10 group flex flex-col items-center justify-center gap-6 hover:border-purple-500/30 transition-all shadow-sm ${role === 'pharmacist' ? 'sm:col-span-2' : ''}`}
                >
                  <div className="w-20 h-20 rounded-2xl bg-purple-600/5 text-purple-600 flex items-center justify-center text-4xl group-hover:scale-110 transition-all">💊</div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] font-mono">Log_Medicine</span>
                </button>
                <Link 
                  href={`/medication/prescribe?patient_id=${selectedPatientId}`}
                  className="pro-card p-10 group flex flex-col items-center justify-center gap-6 hover:border-blue-500/30 transition-all shadow-sm"
                >
                  <div className="w-20 h-20 rounded-2xl bg-blue-600/5 text-blue-600 flex items-center justify-center text-4xl group-hover:scale-110 transition-all">✍️</div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] font-mono">New_Prescription</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Institutional Personnel Landing */
          <div className="bg-zinc-950 dark:bg-white rounded-[5rem] p-16 md:p-24 text-white dark:text-zinc-900 shadow-2xl mb-16 relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 p-24 opacity-[0.05] grayscale -rotate-12 scale-150 select-none pointer-events-none group-hover:rotate-0 transition-transform duration-1000">🏥</div>
            <div className="relative z-10 max-w-4xl">
              <h3 className="text-7xl md:text-9xl font-black mb-10 tracking-tighter uppercase italic leading-none premium-text-gradient">Sector_Ready</h3>
              <p className="text-zinc-400 dark:text-zinc-500 text-xl md:text-3xl font-black leading-tight max-w-2xl lowercase italic tracking-tighter">
                Institutional protocol required. Select a clinical node from the mission selector above to initialize high-fidelity monitoring.
              </p>
              <div className="mt-16 flex items-center gap-6">
                 <div className="h-2 w-32 bg-blue-600/20 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-1/3 animate-pulse"></div>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 italic">Wait_State: Locked</span>
              </div>
            </div>
          </div>
        )}

        {/* Tactical Personnel Task Sheet */}
        {(role === 'nurse' || role === 'staff') && globalTasks.length > 0 && (
          <div className="mb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 px-4 font-mono">
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter italic uppercase flex items-center gap-6">
                Personnel_Deployment_Sheet
                <span className="bg-red-600 text-white text-[10px] px-6 py-2 rounded-full uppercase tracking-[0.4em] font-black shadow-2xl animate-pulse">Impending: Next_4H</span>
              </h3>
              <p className="text-[10px) font-black text-zinc-400 uppercase tracking-widest italic">Node_Sync: Verified</p>
            </div>
            
            <div className="clinical-table-container">
              <table className="clinical-table">
                <thead>
                  <tr>
                    <th>T_Shift_Due</th>
                    <th>Identity_Sector</th>
                    <th>Care_Directive</th>
                    <th className="text-right">Commit_Vector</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/20">
                  {globalTasks.map((task, tidx) => {
                    const taskTime = new Date(task.time);
                    const isVerySoon = taskTime.getTime() < (Date.now() + 30 * 60 * 1000);
                    return (
                      <tr key={tidx} className={isVerySoon ? 'bg-red-500/5' : ''}>
                        <td>
                          <div className="flex items-center gap-6">
                            <span className="text-2xl">{task.icon}</span>
                            <div>
                              <p className={`text-xl font-black italic tracking-tighter ${isVerySoon ? 'text-red-600' : 'text-zinc-900 dark:text-white'}`}>
                                {taskTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}_Z
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 italic tracking-tighter">{task.patient_name.toUpperCase()}</p>
                          <p className="text-tactical opacity-50">NODE_#{task.patient_id}</p>
                        </td>
                        <td>
                          <span className="text-tactical text-zinc-500">{task.label}</span>
                        </td>
                        <td className="text-right">
                          <Link href={`/patients/${task.patient_id}/profile`} className="btn-secondary !py-2 !px-4 !rounded-lg text-[9px]">VIEW_VAULT →</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Global Institutional Telemetry */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pb-40">
          {[
            { label: role === 'admin' ? "Registry_Total" : "Log_Freq", val: patients.length, unit: "nodes", icon: "🏥" },
            { label: "Alert_Signals", val: "24", unit: "sig", icon: "⚡" },
            { label: "Institutional_Sync", val: "Elite", unit: "", icon: "🕒" },
            { label: "Deployment", val: "Active", unit: "", icon: "🛡️" }
          ].map((stat) => (
            <div key={stat.label} className="pro-card p-8 flex flex-col items-center text-center gap-4 transition-all">
              <div className="w-16 h-16 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-3xl shadow-sm">
                {stat.icon}
              </div>
              <div className="font-mono">
                <p className="text-tactical text-zinc-400 mb-1">{stat.label}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <h4 className="text-2xl font-black text-zinc-900 dark:text-white uppercase leading-none">{stat.val}</h4>
                  <span className="text-tactical text-zinc-400">{stat.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Deployment Overlays */}
        {modalType && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/80 transition-all">
            <div className="pro-card w-full max-w-xl p-12 shadow-2xl animate-elite-zoom">
              <div className="mb-12 text-center">
                <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-4xl mx-auto mb-8 shadow-sm">
                  {modalType === "feed" ? "🍼" : modalType === "vitals" ? "❤️" : "💊"}
                </div>
                <h3 className="text-4xl font-black text-zinc-900 dark:text-white uppercase tracking-tight italic">
                  {modalType === "feed" ? "log_nutritional" : modalType === "vitals" ? "log_biometric" : "log_pharma"}
                </h3>
                <p className="text-tactical text-zinc-400 mt-2 italic">Node_Identity: {selectedPatientName}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                <div className="font-mono">
                  <label className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 block mb-4 ml-2 italic">Institutional_Timestamp</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] p-6 text-[13px] font-black uppercase tracking-[0.2em] focus:ring-4 ring-blue-600/20 transition-all text-zinc-800 dark:text-zinc-200"
                    value={formState.recorded_at}
                    onChange={(e) => setFormState((s) => ({ ...s, recorded_at: e.target.value }))}
                    required
                  />
                </div>

                {modalType === "feed" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 block mb-4 ml-2 italic">Category</label>
                      <select
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] p-6 text-[13px] font-black uppercase tracking-[0.2em] focus:ring-4 ring-blue-600/20 transition-all cursor-pointer"
                        value={formState.type}
                        onChange={(e) => setFormState((s) => ({ ...s, type: e.target.value }))}
                        required
                      >
                        <option value="">SELECT_TYPE</option>
                        <option value="EBM">EBM_MATERNAL</option>
                        <option value="Formula">SYNTHETIC_FORMULA</option>
                        <option value="IV_FLUIDS">IV_FLUID_PROTOCOL</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 block mb-4 ml-2 italic">Quantity_ML</label>
                      <input
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] p-6 text-[13px] font-black uppercase tracking-[0.2em] focus:ring-4 ring-blue-600/20 transition-all placeholder:text-zinc-500"
                        placeholder="E.G. 50"
                        value={formState.quantity}
                        onChange={(e) => setFormState((s) => ({ ...s, quantity: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                )}

                {modalType === "vitals" && (
                  <div className="space-y-8 font-mono">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 block mb-4 ml-2 italic">HR_BPM</label>
                        <input
                          className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] p-6 text-[13px] font-black uppercase tracking-[0.2em] focus:ring-4 ring-blue-600/20 transition-all font-mono"
                          placeholder="000"
                          value={formState.hr}
                          onChange={(e) => setFormState((s) => ({ ...s, hr: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 block mb-4 ml-2 italic">SpO2_%</label>
                        <input
                          className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] p-6 text-[13px] font-black uppercase tracking-[0.2em] focus:ring-4 ring-blue-600/20 transition-all font-mono"
                          placeholder="00"
                          value={formState.spo2}
                          onChange={(e) => setFormState((s) => ({ ...s, spo2: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 block mb-4 ml-2 italic">Clinical_Observations</label>
                      <textarea
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[3rem] p-8 text-[13px] font-black italic tracking-tight focus:ring-4 ring-blue-600/20 transition-all min-h-[160px] resize-none"
                        placeholder="Initialize observation telemetry..."
                        value={formState.notes}
                        onChange={(e) => setFormState((s) => ({ ...s, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {modalType === "med" && (
                  <div className="space-y-8 font-mono">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 block mb-4 ml-2 italic">Instructional_Schedule</label>
                      <select
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] p-6 text-[13px] font-black uppercase tracking-[0.2em] focus:ring-4 ring-blue-600/20 transition-all cursor-pointer"
                        value={formState.scheduleId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const m = medOptions.find(opt => String(opt.id) === id);
                          setFormState(s => ({ ...s, scheduleId: id, medicine: m?.medicine || "", dose: m?.dosage || "" }));
                        }}
                        required
                      >
                        <option value="">SELECT_ACTIVE_PRESCRIPTION</option>
                        {medOptions.map(m => <option key={m.id} value={m.id} className="dark:bg-zinc-900">{m.medicine.toUpperCase()} [{m.dosage.toUpperCase()}]</option>)}
                      </select>
                    </div>
                    {formState.medicine && (
                      <div className="p-8 bg-purple-600/5 border border-purple-600/20 rounded-[3rem] animate-in zoom-in-95 duration-500">
                        <p className="text-[9px] font-black text-purple-500 uppercase tracking-[0.4em] mb-4 italic">Verification_Signal_Locked</p>
                        <h4 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 italic tracking-tighter uppercase">{formState.medicine} <span className="opacity-40">[{formState.dose}]</span></h4>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-10">
                  <button type="submit" className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 py-8 rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-[11px] hover:scale-105 active:scale-95 transition-all shadow-2xl">Execute_Commit →</button>
                  <button type="button" onClick={() => setModalType(null)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 py-8 rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-[11px] hover:bg-zinc-200 dark:hover:bg-zinc-700/50 transition-all font-mono">Abort_Protocol</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
