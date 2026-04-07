"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"
import Link from "next/link"

export default function PatientsModule() {
  const { Toast, show } = useToast()
    const [patients, setPatients] = useState([])
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(true)
    const [editingPatient, setEditingPatient] = useState(null)
    const [role, setRole] = useState('')
    const [doctors, setDoctors] = useState([])
    const [nurses, setNurses] = useState([])
    const [wards, setWards] = useState([])
    const [beds, setBeds] = useState([])

    useEffect(() => {
      async function loadSetup() {
        try {
          const userRole = (localStorage.getItem('role') || '').toLowerCase()
          setRole(userRole)
          const patientsData = await apiFetch("/patients")
          setPatients(Array.isArray(patientsData) ? patientsData : [])
          const users = await apiFetch("/users")
          setDoctors(users.filter(u => u.role.toLowerCase() === 'doctor'))
          setNurses(users.filter(u => u.role.toLowerCase() === 'nurse' || u.role.toLowerCase() === 'staff'))
          
          const wardsData = await apiFetch("/wards")
          setWards(wardsData)
        } catch (err) {
          show("Failed to load data")
        } finally {
          setLoading(false)
        }
      }
      loadSetup()
    }, [show])

    useEffect(() => {
      if (editingPatient?.assigned_ward_id && editingPatient?.patient_type === 'IP') {
        async function loadBeds() {
          try {
            const data = await apiFetch(`/wards/${editingPatient.assigned_ward_id}/beds`)
            // Include currently assigned bed even if status is BOOKED, so it shows up in edit mode
            setBeds(data.filter(b => b.status === "AVAILABLE" || b.id === editingPatient.assigned_bed_id))
          } catch (err) { console.error(err) }
        }
        loadBeds()
      } else {
        setBeds([])
      }
    }, [editingPatient?.assigned_ward_id, editingPatient?.patient_type])

    async function handleUpdatePatient(e) {
      e.preventDefault()
      try {
        await apiFetch(`/patients/${editingPatient.id}`, {
          method: "PUT",
          body: JSON.stringify(editingPatient)
        })
        show("Patient updated successfully")
        setPatients(patients.map(p => p.id === editingPatient.id ? editingPatient : p))
        setEditingPatient(null)
      } catch (err) {
        show("Failed to update patient")
      }
    }

    const filteredPatients = patients.filter(p => 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm) ||
      p.id.toString().includes(searchTerm) ||
      p.aadhaar?.includes(searchTerm) ||
      p.abha_id?.includes(searchTerm)
    )
    
    const isAdmin = role === 'admin'

  return (
    <ProtectedRoute roles={["admin", "doctor"]}>
      <div className="animate-in fade-in duration-500 pb-safe">
        {Toast}
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Patients Module</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage hospital admissions and clinical records.</p>
          </div>
          {isAdmin && (
            <Link href="/users/admission" className="btn-primary !py-3 !px-6 shadow-blue-500/20">
              + New Admission
            </Link>
          )}
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 mb-8 shadow-sm">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">🔍</span>
            <input 
              type="text" 
              placeholder="Search by name, phone, Aadhaar, ABHA ID or Patient ID..." 
              className="form-input !pl-12 !py-4 bg-zinc-50 dark:bg-zinc-800/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 text-zinc-900 dark:text-white pb-32">
            {filteredPatients.map(p => (
              <div key={p.id} className="glass-card p-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group border-white/10">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                      {p.name?.[0] || "#"}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-lg tracking-tight truncate max-w-[120px] md:max-w-[160px]">{p.name}</h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest opacity-70">ID: #{p.id}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                    p.status === 'ACTIVE' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                      : 'bg-zinc-50 text-zinc-500 border-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                  }`}>
                    {p.status || 'ACTIVE'}
                  </span>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-bold uppercase tracking-widest">Care Type</span>
                    <span className={`font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${p.patient_type === 'IP' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                      {p.patient_type || 'OP'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs overflow-hidden">
                    <span className="text-zinc-500 font-bold uppercase tracking-widest">Aadhaar</span>
                    <span className="font-mono text-[10px] text-zinc-900 dark:text-zinc-100 truncate max-w-[140px] text-right font-black">{p.aadhaar}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs overflow-hidden">
                    <span className="text-zinc-500 font-bold uppercase tracking-widest">ABHA ID</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 truncate max-w-[140px] text-right">{p.abha_id || "Not Linked"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link href={`/patients/${p.id}/profile`} className="btn-secondary !py-3 text-sm text-center">View Profile</Link>
                  {isAdmin && (
                    <>
                      <Link href={`/patients/${p.id}/discharge`} className="btn-primary !py-3 text-sm text-center !bg-zinc-900 dark:!bg-white dark:text-zinc-900">Discharge</Link>
                      <button 
                        onClick={() => setEditingPatient({...p})}
                        className="col-span-2 py-3 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        Edit Patient Data
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Patient Modal */}
        {editingPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[40px] p-10 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">Edit Patient: {editingPatient.name}</h3>
                <button onClick={() => setEditingPatient(null)} className="text-zinc-400 hover:text-zinc-600 text-2xl">&times;</button>
              </div>
              <form onSubmit={handleUpdatePatient} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={editingPatient.name} onChange={e => setEditingPatient({...editingPatient, name: e.target.value})} required />
                  </div>
                  <div>
                    <label className="form-label">Aadhaar No. (12 Digits) <span className="text-red-500">*</span></label>
                    <input className="form-input" value={editingPatient.aadhaar} onChange={e => setEditingPatient({...editingPatient, aadhaar: e.target.value.replace(/\D/g, '').slice(0, 12)})} minLength={12} maxLength={12} required />
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={editingPatient.phone} onChange={e => setEditingPatient({...editingPatient, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">ABHA ID</label>
                    <input className="form-input" value={editingPatient.abha_id || ""} onChange={e => setEditingPatient({...editingPatient, abha_id: e.target.value})} placeholder="Optional ABHA" />
                  </div>
                  <div>
                    <label className="form-label">Patient Type</label>
                    <select className="form-input" value={editingPatient.patient_type || "OP"} onChange={e => setEditingPatient({...editingPatient, patient_type: e.target.value, assigned_ward_id: e.target.value === 'OP' ? null : editingPatient.assigned_ward_id, assigned_bed_id: e.target.value === 'OP' ? null : editingPatient.assigned_bed_id})}>
                      <option value="OP">Out-Patient</option>
                      <option value="IP">In-Patient</option>
                    </select>
                  </div>
                  {editingPatient.patient_type === 'IP' && (
                    <>
                      <div className="col-span-1">
                        <label className="form-label">Assigned Ward</label>
                        <select 
                          className="form-input" 
                          value={editingPatient.assigned_ward_id || ""} 
                          onChange={e => setEditingPatient({...editingPatient, assigned_ward_id: e.target.value, assigned_bed_id: ""})}
                        >
                          <option value="">-- Change/Assign Ward --</option>
                          {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-1">
                        <label className="form-label">Assigned Bed</label>
                        <select 
                          className="form-input" 
                          value={editingPatient.assigned_bed_id || ""} 
                          onChange={e => setEditingPatient({...editingPatient, assigned_bed_id: e.target.value})}
                        >
                          <option value="">-- Change/Assign Bed --</option>
                          {beds.map(b => <option key={b.id} value={b.id}>{b.bed_number}</option>)}
                        </select>
                        {beds.length === 0 && editingPatient.assigned_ward_id && <p className="text-[10px] text-red-500 mt-1">No available beds in this ward.</p>}
                      </div>
                    </>
                  )}
                  <div className="col-span-1">
                    <label className="form-label">Assigned Doctor</label>
                    <select className="form-input" value={editingPatient.assigned_doctor_id || ""} onChange={e => setEditingPatient({...editingPatient, assigned_doctor_id: e.target.value})}>
                      <option value="">-- Unassigned --</option>
                      {doctors.map(d => <option key={d.id} value={d.id}>{d.username}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="form-label">Assigned Nurse</label>
                    <select className="form-input" value={editingPatient.assigned_nurse_id || ""} onChange={e => setEditingPatient({...editingPatient, assigned_nurse_id: e.target.value})}>
                      <option value="">-- Unassigned --</option>
                      {nurses.map(n => <option key={n.id} value={n.id}>{n.username}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full btn-primary !py-4 text-lg font-bold shadow-blue-500/30">Update Records</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
