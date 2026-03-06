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
  const [recurrence, setRecurrence] = useState("none")
  const [newSlot, setNewSlot] = useState({
    available_date: new Date().toISOString().split('T')[0],
    slot_start: "09:00",
    slot_end: "10:00"
  })

  useEffect(() => {
    const uid = localStorage.getItem("user_id") || 1
    const r = localStorage.getItem("role") || "doctor"
    setUserId(uid)
    setRole(r)

    async function loadSlots() {
      try {
        const data = await apiFetch(`/availability/${uid}`) 
        setSlots(Array.isArray(data) ? data : [])
      } catch (err) {
        show("Failed to load availability")
      }
    }
    loadSlots()
  }, [show])

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
           body: JSON.stringify({ ...newSlot, available_date: date, user_id: userId })
         })
      }

      show(datesToSchedule.length > 1 ? `Added slots for ${datesToSchedule.length} days` : "Availability slot added")
      
      const data = await apiFetch(`/availability/${userId}`)
      setSlots(data)
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
          <Link href={`/${role === 'nurse' ? 'staff-dashboard' : 'doctor-dashboard'}`} className="text-sm font-medium text-blue-600 hover:underline mb-2 block">← Back to Dashboard</Link>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Manage Availability</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Set your consultation hours for patient appointments.</p>
        </div>

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
                        {new Date(slot.available_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {slot.slot_start} - {slot.slot_end}
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
