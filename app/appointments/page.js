"use client"

import { useState, useEffect, useCallback } from "react"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"
import Link from "next/link"

export default function AppointmentPage() {
  const { Toast, show } = useToast()
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [form, setForm] = useState({
    patient_id: "",
    doctor_id: "",
    appointment_time: "",
    reason: "",
    patient_name: "",
    phone: "",
    aadhaar: "",
    abha_id: "",
    abha_address: ""
  })
  const [isNewPatient, setIsNewPatient] = useState(false)
  const [doctorSchedule, setDoctorSchedule] = useState([])
  const [selectedDate, setSelectedDate] = useState("")
  const [availableSlots, setAvailableSlots] = useState([])
  const [useCustomDate, setUseCustomDate] = useState(false)
  const [patientSearch, setPatientSearch] = useState("")
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [apptData, patientData, userData] = await Promise.all([
        apiFetch("/appointments"),
        apiFetch("/patients"),
        apiFetch("/users")
      ])
      setAppointments(Array.isArray(apptData) ? apptData : [])
      setPatients(Array.isArray(patientData) ? patientData : [])
      setDoctors(userData.filter(u => u.role.toLowerCase() === "doctor"))
    } catch (err) {
      show("Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [show])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    // Handle query params for patient booking separately
    const params = new URLSearchParams(window.location.search)
    const pid = params.get('patient_id')
    if (pid && patients.length > 0) {
      setForm(f => ({ ...f, patient_id: pid }))
      const p = patients.find(p => String(p.id) === String(pid))
      if (p) setPatientSearch(p.name)
    }
  }, [patients]) // Runs only when patients list is loaded/updated

  useEffect(() => {
    if (form.doctor_id) {
      apiFetch(`/availability/${form.doctor_id}?future=1`)
        .then(data => {
           const sched = Array.isArray(data) ? data.filter(d => d.status === 'AVAILABLE') : []
           setDoctorSchedule(sched)
           setSelectedDate("")
           setForm(f => ({...f, appointment_time: ""}))
        })
        .catch(err => setDoctorSchedule([]))
    } else {
      setDoctorSchedule([])
      setSelectedDate("")
      setForm(f => ({...f, appointment_time: ""}))
    }
  }, [form.doctor_id])

  useEffect(() => {
    if (selectedDate && doctorSchedule.length > 0) {
       const daySlots = doctorSchedule.filter(d => d.available_date.split('T')[0] === selectedDate)
       const generated = []
       daySlots.forEach(block => {
          let current = new Date(`1970-01-01T${block.slot_start}`)
          const end = new Date(`1970-01-01T${block.slot_end}`)
          while(current < end) {
             generated.push(current.toTimeString().substring(0, 5))
             current = new Date(current.getTime() + 30 * 60000)
          }
       })
       setAvailableSlots(generated)
    } else {
       setAvailableSlots([])
    }
  }, [selectedDate, doctorSchedule])

  async function handleBook(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await apiFetch("/appointments", {
        method: "POST",
        body: JSON.stringify(form)
      })
      show("Appointment booked and doctor notified")
      setForm({ 
        patient_id: "", doctor_id: "", appointment_time: "", reason: "",
        patient_name: "", phone: "", aadhaar: "", abha_id: "", abha_address: "" 
      })
      setSelectedDate("")
      setPatientSearch("")
      setIsNewPatient(false)
      setUseCustomDate(false)
      loadData()
    } catch (err) {
      show(err.message || "Failed to book appointment")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProtectedRoute roles={["admin", "doctor", "patient"]}>
      <div className="animate-in fade-in duration-700 max-w-7xl mx-auto pb-safe px-4 lg:px-0">
        {Toast}
        
        <div className="mb-6">
          <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-blue-600 flex items-center gap-2 transition-all group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Return_to_Command_Center
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12 py-8">
            <div className="space-y-2">
                <h2 className="page-title">clinical_scheduling</h2>
                <p className="page-subtitle">Sector_Operational: Priority_Throughput</p>
            </div>
            <div className="flex items-center gap-4 px-6 py-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-tactical text-emerald-600">Queue_Active_Sync</span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Booking Operational Form */}
          <div className="lg:col-span-4">
            <div className="pro-card p-10 shadow-sm sticky top-28">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h3 className="text-xl font-black tracking-tight uppercase text-zinc-900 dark:text-white leading-none">Book_Slot</h3>
                        <p className="text-tactical text-zinc-400 mt-2">Allocation_Module</p>
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <input 
                            type="checkbox" 
                            id="newPatientToggle"
                            className="hidden"
                            checked={isNewPatient}
                            onChange={e => {
                              setIsNewPatient(e.target.checked)
                              setPatientSearch("")
                              setForm(prev => ({...prev, patient_id: ""}))
                            }}
                        />
                        <label 
                            htmlFor="newPatientToggle" 
                            className={`px-3 py-1.5 rounded-lg text-tactical cursor-pointer transition-all ${isNewPatient ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 shadow-md' : 'text-zinc-400'}`}
                        >
                            New_Entity
                        </label>
                    </div>
                </div>
                
                <form onSubmit={handleBook} className="space-y-8">
                    <div className="space-y-6">
                        {!isNewPatient ? (
                            <div className="relative group">
                                <label className="form-label">Search_Patient_Archive</label>
                                <input 
                                    type="text"
                                    className="form-input"
                                    placeholder="Search by ID or Phone..."
                                    value={patientSearch}
                                    onChange={e => {
                                        setPatientSearch(e.target.value)
                                        setShowPatientSuggestions(true)
                                        if (!e.target.value) setForm({...form, patient_id: ""})
                                    }}
                                    onFocus={() => setShowPatientSuggestions(true)}
                                />
                                {showPatientSuggestions && patientSearch && (
                                    <div className="absolute z-50 w-full mt-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-h-[300px] overflow-y-auto no-scrollbar animate-elite-zoom">
                                        {patients
                                        .filter(p => 
                                            p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
                                            (p.phone || "").includes(patientSearch)
                                        )
                                        .map(p => (
                                            <div 
                                                key={p.id}
                                                className="px-8 py-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer border-b border-zinc-100 dark:border-zinc-800 last:border-0 transition-all group/item"
                                                onClick={() => {
                                                    setForm({...form, patient_id: p.id})
                                                    setPatientSearch(p.name)
                                                    setShowPatientSuggestions(false)
                                                }}
                                            >
                                                <div className="font-black text-sm text-zinc-900 dark:text-white uppercase tracking-tight group-hover/item:text-blue-600 transition-colors">{p.name}</div>
                                                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">{p.phone} • {p.patient_type || 'OP'}</p>
                                            </div>
                                        ))
                                        }
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4 p-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-3xl border border-zinc-100 dark:border-zinc-700/50">
                                <div>
                                    <label className="form-label">Full_Legal_Identity</label>
                                    <input 
                                        className="form-input !bg-transparent font-black"
                                        placeholder="Enter Name"
                                        value={form.patient_name}
                                        onChange={e => setForm({...form, patient_name: e.target.value})}
                                        required={isNewPatient}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="form-label">Phone_Contact</label>
                                        <input 
                                            className="form-input !bg-transparent font-black font-mono tracking-widest"
                                            placeholder="Mobile"
                                            value={form.phone}
                                            onChange={e => setForm({...form, phone: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label opacity-40 italic">Aadhaar_ID (Opt)</label>
                                        <input 
                                            className="form-input !bg-transparent font-black font-mono" 
                                            placeholder="12 digits"
                                            value={form.aadhaar}
                                            onChange={e => setForm({...form, aadhaar: e.target.value.replace(/\D/g, '').slice(0, 12)})}
                                            maxLength={12}
                                        />
                                    </div>
                                </div>
                                
                                <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-700">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4 text-center">ABDM_Federated_Health_Link</p>
                                    <div className="space-y-3">
                                        <input 
                                            className="form-input !bg-transparent text-xs font-black"
                                            placeholder="ABHA ID (e.g. 1234-5678-9012-34)"
                                            value={form.abha_id}
                                            onChange={e => setForm({...form, abha_id: e.target.value})}
                                        />
                                        <input 
                                            className="form-input !bg-transparent text-xs font-black"
                                            placeholder="ABHA Address (e.g. name@abdm)"
                                            value={form.abha_address}
                                            onChange={e => setForm({...form, abha_address: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="form-label">Assigned_Clinical_Lead</label>
                            <select 
                                className="form-input font-black uppercase tracking-tight"
                                value={form.doctor_id}
                                onChange={e => setForm({...form, doctor_id: e.target.value})}
                                required
                            >
                                <option value="">-- Assign Physician --</option>
                                {doctors.map(d => <option key={d.id} value={d.id}>{d.username.toUpperCase()}</option>)}
                            </select>
                        </div>
                        
                        {form.doctor_id && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <label className="form-label mb-0">Temporal_Allocation</label>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                    setUseCustomDate(!useCustomDate)
                                    setForm({...form, appointment_time: ""})
                                    setSelectedDate("")
                                    }} 
                                    className="text-[9px] font-black uppercase tracking-widest text-blue-600 hover:text-white transition-all bg-blue-500/10 hover:bg-blue-600 px-4 py-2 rounded-xl"
                                >
                                    {useCustomDate ? "Schedule_Sync" : "Override_Manual"}
                                </button>
                            </div>
                            
                            {useCustomDate ? (
                                <input 
                                    type="datetime-local"
                                    className="form-input font-black !py-4 italic"
                                    value={form.appointment_time}
                                    onChange={e => setForm({...form, appointment_time: e.target.value})}
                                    required
                                />
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="form-label opacity-40 italic">Available_Date</label>
                                        <select 
                                            className="form-input font-black !py-4"
                                            value={selectedDate}
                                            onChange={e => {
                                            setSelectedDate(e.target.value)
                                            setForm({...form, appointment_time: ""})
                                            }}
                                            required
                                        >
                                            <option value="">-- Date --</option>
                                            {[...new Set(doctorSchedule.filter(d => d.available_date.split('T')[0] >= new Date().toISOString().split('T')[0]).map(d => d.available_date.split('T')[0]))].sort().map(date => (
                                            <option key={date} value={date}>{date.split('-').reverse().join('-')}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label opacity-40 italic">Selected_Slot</label>
                                        <select 
                                            className="form-input font-black !py-4"
                                            value={form.appointment_time ? form.appointment_time.split('T')[1].substring(0,5) : ""}
                                            onChange={e => {
                                            if (e.target.value) {
                                                const datePart = selectedDate
                                                const timePart = e.target.value
                                                setForm({...form, appointment_time: `${datePart}T${timePart}:00`})
                                            } else {
                                                setForm({...form, appointment_time: ""})
                                            }
                                            }}
                                            disabled={!selectedDate}
                                            required
                                        >
                                            <option value="">-- Slot --</option>
                                            {availableSlots.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                        )}

                        <div>
                            <label className="form-label">Clinical_Objective / Reason</label>
                            <textarea 
                                className="form-input min-h-[120px] font-black placeholder:italic"
                                placeholder="Indicate diagnostic intent..."
                                value={form.reason}
                                onChange={e => setForm({...form, reason: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={submitting} 
                            className="w-full btn-primary py-8 bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 text-xs font-black uppercase tracking-[0.4em] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {submitting ? "Processing_Allocation..." : "Authorize_Booking"}
                        </button>
                    </div>
                </form>
              <div className="absolute -bottom-20 -left-20 text-[20rem] opacity-5 grayscale group-hover:-rotate-6 transition-all duration-1000 select-none">📅</div>
            </div>
          </div>

          {/* Institutional Schedule Matrix */}
          <div className="lg:col-span-8 space-y-10">
            <div className="flex items-center justify-between px-6">
                <div>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none mb-1">Schedule_Matrix</h3>
                    <p className="text-tactical text-zinc-400">Institutional_Throughview</p>
                </div>
                <div className="px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold uppercase tracking-widest rounded-xl shadow-sm text-[10px]">
                    {appointments.length} ACTIVE_RECORDS
                </div>
            </div>
            
            <div className="clinical-table-container">
                <table className="clinical-table">
                  <thead>
                    <tr>
                      <th className="pl-10">Synchronized_Time</th>
                      <th>Patient_Entity</th>
                      <th>Lead_Physician</th>
                      <th className="pr-10 text-right">Clearance_Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/30">
                    {appointments
                      .filter(appt => {
                        const role = (localStorage.getItem('role') || '').toLowerCase()
                        const patientId = localStorage.getItem('patientId')
                        if (role === 'patient') return String(appt.patient_id) === String(patientId)
                        return true
                      })
                      .map(appt => (
                              <tr key={appt.id}>
                        <td>
                            <div className="flex flex-col">
                                <span className="text-xl font-black italic tracking-tighter text-zinc-900 dark:text-white">
                                    {new Date(appt.appointment_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                                <span className="text-tactical text-zinc-400 mt-1">
                                    {appt.appointment_time.split('T')[0].split('-').reverse().join('-')}
                                </span>
                            </div>
                        </td>
                        <td>
                            <div className="flex flex-col">
                                <h4 className="font-extrabold text-zinc-900 dark:text-white tracking-tight uppercase">{appt.patient_name}</h4>
                                <p className="text-tactical text-zinc-500 mt-1 uppercase">INTENT: {appt.reason || 'Routine'}</p>
                            </div>
                        </td>
                        <td>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-400">MD</div>
                                <span className="text-tactical text-zinc-600 dark:text-zinc-300">DR_{appt.doctor_name.toUpperCase()}</span>
                            </div>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-4">
                            <span className={`status-badge ${
                              appt.is_confirmed ? 'text-emerald-600' : 'text-blue-600 animate-pulse'
                            }`}>
                              {appt.is_confirmed ? 'Confirmed' : 'Pending'}
                            </span>
                            {!appt.is_confirmed && (
                              <button 
                                onClick={async () => {
                                  try {
                                    await apiFetch(`/appointments/${appt.id}/confirm`, { method: 'PUT' });
                                    show("Appointment confirmed! Doctor notified.");
                                    loadData();
                                  } catch (e) {
                                    show("Failed to confirm");
                                  }
                                }}
                                className="btn-secondary !py-2 !px-4 !rounded-lg text-[9px]"
                              >
                                AUTHORIZE ✓
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {appointments.length === 0 && !loading && (
                      <tr>
                        <td colSpan="4" className="py-60 text-center opacity-30 text-zinc-500 uppercase text-[10px] font-black tracking-widest italic">Schedule_Matrix_Empty</td>
                      </tr>
                    )}
                    {loading && (
                        <tr>
                            <td colSpan="4" className="py-60 text-center">
                                <div className="w-12 h-12 border-4 border-zinc-200 dark:border-zinc-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">Synchronizing_Archive...</p>
                            </td>
                        </tr>
                    )}
                  </tbody>
                </table>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
