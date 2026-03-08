"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"
import Link from "next/link"

export default function AvailabilityPage() {
  const { Toast, show } = useToast()
  const [slots, setSlots] = useState([])
  const [userId, setUserId] = useState(null)
  const [role, setRole] = useState("")
  const [staffMembers, setStaffMembers] = useState([])
  const [selectedStaffId, setSelectedStaffId] = useState("")
  const [patients, setPatients] = useState([])
  const [patientSearch, setPatientSearch] = useState("")
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [recurrence, setRecurrence] = useState("none")
  const [newSlot, setNewSlot] = useState({
    available_date: new Date().toISOString().split('T')[0],
    slot_start: "09:00",
    slot_end: "10:00"
  })

  useEffect(() => {
    const uid = localStorage.getItem("userId") || 1
    const r = (localStorage.getItem("role") || "doctor").toLowerCase()
    setUserId(uid)
    setRole(r)
    setSelectedStaffId(uid)

    async function loadInitialData() {
      try {
        const [slotData, ptData, userData] = await Promise.all([
          apiFetch(`/availability/${uid}`),
          r === 'admin' ? apiFetch("/patients") : Promise.resolve([]),
          r === 'admin' ? apiFetch("/users") : Promise.resolve([])
        ])
        setSlots(Array.isArray(slotData) ? slotData : [])
        setPatients(Array.isArray(ptData) ? ptData : [])
        if (r === 'admin') {
          setStaffMembers(userData.filter(u => ["doctor", "nurse"].includes(u.role.toLowerCase())))
        }
      } catch (err) {
        show("Failed to load initial data")
      }
    }
    loadInitialData()
  }, [show])

  async function loadSlotsForStaff(sid) {
    try {
      const data = await apiFetch(`/availability/${sid}`)
      setSlots(Array.isArray(data) ? data : [])
    } catch (err) {
      show("Failed to load availability for selected staff")
    }
  }

  async function handleAddSlot(e) {
    e.preventDefault()
    if (!userId) return

    try {
      const datesToSchedule = [newSlot.available_date]
      if (recurrence === 'week') {
         for(let i=1; i<7; i++) {
            const d = new Date(newSlot.available_date)
            d.setDate(d.getDate() + i)
            datesToSchedule.push(d.toISOString().split('T')[0])
         }
      } else if (recurrence === 'month') {
         for(let i=1; i<30; i++) {
            const d = new Date(newSlot.available_date)
            d.setDate(d.getDate() + i)
            datesToSchedule.push(d.toISOString().split('T')[0])
         }
      }

      for (const date of datesToSchedule) {
         await apiFetch("/availability", {
           method: "POST",
           body: JSON.stringify({ 
             ...newSlot, 
             available_date: date, 
             user_id: role === 'admin' ? selectedStaffId : userId,
             patient_id: selectedPatientId
           })
         })
      }

      show(datesToSchedule.length > 1 ? `Added slots for ${datesToSchedule.length} days` : "Availability slot added")
      
      const data = await apiFetch(`/availability/${role === 'admin' ? selectedStaffId : userId}`)
      setSlots(data)
      setPatientSearch("")
      setSelectedPatientId(null)
    } catch (err) {
      show("Failed to add slot")
    }
  }

  async function handleDelete(id) {
    try {
      await apiFetch(`/availability/${id}`, { method: "DELETE" })
      setSlots(slots.filter(s => s.id !== id))
      show("Slot removed")
    } catch (err) {
      show("Failed to remove slot")
    }
  }

  return (
    <ProtectedRoute roles={["doctor", "nurse", "admin"]}>
      <div className="animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
        {Toast}
        
        <div className="mb-8">
          <Link href={role === 'nurse' ? '/staff-dashboard' : role === 'admin' ? '/dashboard' : '/doctor-dashboard'} className="text-sm font-medium text-blue-600 hover:underline mb-2 block">← Back to Dashboard</Link>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {role === 'admin' ? "Manage Staff Shifts" : "Manage Availability"}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            {role === 'admin' ? "Assign nurses and doctors to patients for their daily shifts." : "Set your consultation hours for patient appointments."}
          </p>
        </div>

        {role === 'admin' && (
          <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-6 rounded-3xl flex items-center gap-6">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center text-2xl">👤</div>
            <div className="flex-1">
              <label className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider mb-1 block">Selected Staff Member</label>
              <select 
                className="w-full bg-transparent border-none p-0 text-xl font-bold text-zinc-900 dark:text-white focus:ring-0 cursor-pointer"
                value={selectedStaffId}
                onChange={(e) => {
                  setSelectedStaffId(e.target.value)
                  loadSlotsForStaff(e.target.value)
                }}
              >
                {staffMembers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm sticky top-6">
              <h3 className="font-bold mb-4">Add New Slot</h3>
              <form onSubmit={handleAddSlot} className="space-y-4">
                <div>
                  <label className="form-label">Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={newSlot.available_date}
                    onChange={e => setNewSlot({...newSlot, available_date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Start Time</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={newSlot.slot_start}
                    onChange={e => setNewSlot({...newSlot, slot_start: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">End Time</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={newSlot.slot_end}
                    onChange={e => setNewSlot({...newSlot, slot_end: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Recurrence</label>
                  <select 
                    className="form-input" 
                    value={recurrence}
                    onChange={e => setRecurrence(e.target.value)}
                  >
                    <option value="none">Just Once (Selected Date)</option>
                    <option value="week">Daily for 1 Week</option>
                    <option value="month">Daily for 1 Month</option>
                  </select>
                </div>

                {role === 'admin' && (
                  <div className="relative">
                    <label className="form-label">Assign Patient (Optional)</label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="Search patient..."
                      value={patientSearch}
                      onChange={e => {
                        setPatientSearch(e.target.value)
                        setShowPatientSuggestions(true)
                        if (!e.target.value) setSelectedPatientId(null)
                      }}
                      onFocus={() => setShowPatientSuggestions(true)}
                    />
                    {showPatientSuggestions && patientSearch && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                        {patients
                          .filter(p => 
                            p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
                            (p.phone || "").includes(patientSearch)
                          )
                          .map(p => (
                            <div 
                              key={p.id}
                              className="px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                              onClick={() => {
                                setSelectedPatientId(p.id)
                                setPatientSearch(p.name)
                                setShowPatientSuggestions(false)
                              }}
                            >
                              <p className="font-bold text-xs">{p.name}</p>
                              <p className="text-[10px] text-zinc-500">{p.phone} • {p.patient_type || 'OP'}</p>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                )}
                <button type="submit" className="w-full btn-primary py-3">Add Slot{recurrence !== 'none' ? 's' : ''}</button>
              </form>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Date</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Time Range</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {slots.map(slot => (
                    <tr key={slot.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">
                        {slot.available_date.split('T')[0].split('-').reverse().join('-')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {slot.slot_start} - {slot.slot_end}
                        {slot.patient_name && (
                           <div className="text-[10px] text-blue-600 font-bold uppercase mt-1">Assigned: {slot.patient_name} ({slot.patient_type})</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${slot.is_booked ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {slot.is_booked ? 'Booked' : 'Available'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleDelete(slot.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {slots.length === 0 && (
                <div className="p-12 text-center text-zinc-500">No availability slots defined.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
