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
    if (form.doctor_id) {
      apiFetch(`/availability/${form.doctor_id}`)
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
    <ProtectedRoute roles={["admin", "doctor"]}>
      <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
        {Toast}
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Appointments & Scheduling</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Manage patient visits and notify doctors of new bookings. Aligning with ABDM standards.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Book Appointment</h3>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="newPatientToggle"
                    className="w-4 h-4 rounded text-blue-600"
                    checked={isNewPatient}
                    onChange={e => setIsNewPatient(e.target.checked)}
                  />
                  <label htmlFor="newPatientToggle" className="text-sm font-medium text-zinc-600">New Patient</label>
                </div>
              </div>
              
              <form onSubmit={handleBook} className="space-y-4">
                {!isNewPatient ? (
                  <div>
                    <label className="form-label">Existing Patient</label>
                    <select 
                      className="form-input"
                      value={form.patient_id}
                      onChange={e => setForm({...form, patient_id: e.target.value})}
                      required={!isNewPatient}
                    >
                      <option value="">-- Select Patient --</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="form-label">Patient Name</label>
                      <input 
                        className="form-input"
                        placeholder="Full Name"
                        value={form.patient_name}
                        onChange={e => setForm({...form, patient_name: e.target.value})}
                        required={isNewPatient}
                      />
                    </div>
                    <div>
                      <label className="form-label text-zinc-500">Aadhaar No. (Optional)</label>
                      <input 
                        className="form-input bg-white/50 dark:bg-zinc-950/50" 
                        placeholder="Enter 12 digit Aadhaar"
                        value={form.aadhaar}
                        onChange={e => setForm({...form, aadhaar: e.target.value.replace(/\D/g, '').slice(0, 12)})}
                        maxLength={12}
                      />
                    </div>
                    <div>
                      <label className="form-label">Phone Number</label>
                      <input 
                        className="form-input"
                        placeholder="10-digit mobile"
                        value={form.phone}
                        onChange={e => setForm({...form, phone: e.target.value})}
                      />
                    </div>
                  </>
                )}

                {isNewPatient && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 space-y-3">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">ABDM Details</p>
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1 block">ABHA ID</label>
                      <input 
                        className="form-input text-sm py-2"
                        placeholder="1234-5678-9012-34"
                        value={form.abha_id}
                        onChange={e => setForm({...form, abha_id: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1 block">ABHA Address</label>
                      <input 
                        className="form-input text-sm py-2"
                        placeholder="name@abdm"
                        value={form.abha_address}
                        onChange={e => setForm({...form, abha_address: e.target.value})}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="form-label">Doctor</label>
                  <select 
                    className="form-input"
                    value={form.doctor_id}
                    onChange={e => setForm({...form, doctor_id: e.target.value})}
                    required
                  >
                    <option value="">-- Assign Doctor --</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.username}</option>)}
                  </select>
                </div>
                
                {form.doctor_id && (
                  <>
                    <div className="flex justify-end mb-2">
                      <button 
                        type="button" 
                        onClick={() => {
                          setUseCustomDate(!useCustomDate)
                          setForm({...form, appointment_time: ""})
                          setSelectedDate("")
                        }} 
                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-full"
                      >
                        {useCustomDate ? "Use Doctor Schedule" : "Enter Custom / Past Date"}
                      </button>
                    </div>
                    {useCustomDate ? (
                      <div>
                        <label className="form-label">Date & Time</label>
                        <input 
                          type="datetime-local"
                          className="form-input"
                          value={form.appointment_time}
                          onChange={e => setForm({...form, appointment_time: e.target.value})}
                          required
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Available Date</label>
                          <select 
                        className="form-input"
                        value={selectedDate}
                        onChange={e => {
                          setSelectedDate(e.target.value)
                          setForm({...form, appointment_time: ""})
                        }}
                        required
                      >
                        <option value="">-- Select Date --</option>
                        {[...new Set(doctorSchedule.map(d => d.available_date.split('T')[0]))].sort().map(date => (
                           <option key={date} value={date}>{new Date(date).toLocaleDateString()}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Time Slot</label>
                      <select 
                        className="form-input"
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
                        <option value="">-- Select Time --</option>
                        {availableSlots.map(time => (
                           <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                  </>
                )}
                {!form.doctor_id && (
                  <div>
                    <label className="form-label text-zinc-400">Date & Time</label>
                    <div className="form-input bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 flex items-center h-11 text-sm border-dashed">Select a doctor first</div>
                  </div>
                )}
                
                <div>
                  <label className="form-label">Reason for Visit</label>
                  <textarea 
                    className="form-input min-h-[80px]"
                    placeholder="Brief description..."
                    value={form.reason}
                    onChange={e => setForm({...form, reason: e.target.value})}
                  />
                </div>
                <button type="submit" disabled={submitting} className="w-full btn-primary py-3 mt-2 shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                  {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Confirm Booking"}
                </button>
              </form>
            </div>
          </div>

          {/* Appointment List */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="text-lg font-semibold px-2 flex items-center justify-between">
              Upcoming Schedule
              <span className="text-xs font-medium text-zinc-400">{appointments.length} Appointments</span>
            </h3>
            
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-4">Time</th>
                      <th className="px-6 py-4">Patient</th>
                      <th className="px-6 py-4">Doctor</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {appointments.map(appt => (
                      <tr key={appt.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400">
                          {new Date(appt.appointment_time).toLocaleString('en-US', { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-zinc-900 dark:text-white">{appt.patient_name}</p>
                          <p className="text-xs text-zinc-500 truncate max-w-[150px]">{appt.reason}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                          {appt.doctor_name}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              appt.is_confirmed ? 'bg-emerald-100 text-emerald-600' : 
                              appt.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-600' : 
                              'bg-zinc-100 text-zinc-600'
                            }`}>
                              {appt.is_confirmed ? 'CONFIRMED' : appt.status}
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
                                className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg transition-colors border border-emerald-100 dark:border-emerald-800"
                              >
                                CONFIRM ✓
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {appointments.length === 0 && !loading && (
                      <tr>
                        <td colSpan="4" className="px-6 py-20 text-center text-zinc-400 italic">
                          No appointments scheduled yet.
                        </td>
                      </tr>
                    )}
                    {loading && (
                      <tr>
                        <td colSpan="4" className="px-6 py-10 text-center text-zinc-400">Loading schedule...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
