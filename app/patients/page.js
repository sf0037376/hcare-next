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
      <div className="animate-in fade-in slide-in-from-bottom-5 duration-1000 max-w-7xl mx-auto pb-40 px-6 transition-all">
        {Toast}
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12 py-8">
          <div className="space-y-2">
            <h2 className="page-title">clinical_records</h2>
            <p className="page-subtitle">Sector_Operational: Identity_Registry</p>
          </div>
          {isAdmin && (
            <Link href="/users/admission" className="btn-primary">
              Execute_Entry_Protocol →
            </Link>
          )}
        </div>

        {/* Global Intelligence Search Vector */}
        {/* Search Sector */}
        <div className="pro-card p-10 mb-12 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="relative flex-1 w-full">
              <input 
                type="text" 
                placeholder="EXECUTE_SCAN: NAME || PHONE || UID..." 
                className="form-input !pl-16 italic"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl opacity-30">🔍</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
               <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
               <span className="text-tactical text-blue-600">{filteredPatients.length}_Records_Matched</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-60 relative overflow-hidden">
            <div className="w-16 h-16 border-8 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-10 shadow-2xl shadow-blue-500/20"></div>
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-500 animate-pulse italic font-mono">Synchronizing_Clinical_Continuum_Registry...</p>
          </div>
        ) : (
          <div className="space-y-12 pb-32">
            {/* Desktop Tactical Registry Matrix */}
            <div className="clinical-table-container">
                <table className="clinical-table">
                    <thead>
                        <tr>
                            <th>Node_Identity</th>
                            <th>Care_Protocol</th>
                            <th>Ident_Vectors</th>
                            <th className="text-right">Execution</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/20">
                        {filteredPatients.map(p => (
                            <tr key={p.id}>
                                <td>
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-xl bg-zinc-950 dark:bg-zinc-800 text-white flex items-center justify-center text-xl font-black">
                                            {p.name?.[0]?.toUpperCase() || "#"}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight italic">{p.name}</h4>
                                            <p className="text-tactical opacity-50">NODE_ID: #{p.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex flex-col gap-2">
                                        <span className="status-badge text-emerald-600 border-emerald-500/20">
                                            {p.status || 'ACTIVE'}
                                        </span>
                                        <span className={`status-badge ${p.patient_type === 'IP' ? 'text-orange-600 border-orange-500/20' : 'text-blue-600 border-blue-500/20'}`}>
                                            {p.patient_type === 'IP' ? 'IN-PATIENT' : 'OUT-PATIENT'}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div className="space-y-1 font-mono">
                                        <p className="text-tactical"><span className="opacity-40 uppercase">CELL:</span> {p.phone}</p>
                                        <p className="text-tactical"><span className="opacity-40 uppercase">ID:</span> {p.aadhaar || 'Protocol_Wait'}</p>
                                    </div>
                                </td>
                                <td className="text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <Link href={`/patients/${p.id}/profile`} className="btn-secondary !py-2 !px-4 !rounded-lg text-[9px]">VIEW_VAULT →</Link>
                                        {isAdmin && (
                                            <button 
                                                onClick={() => setEditingPatient({...p})}
                                                className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 transition-all border border-zinc-200 dark:border-zinc-700"
                                            >
                                                ⚙️
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                       {/* Mobile Field Deployment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-6">
                {filteredPatients.map(p => (
                <div key={p.id} className="pro-card p-8 shadow-sm relative overflow-hidden transition-all">
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-xl font-black">
                                {p.name?.[0]?.toUpperCase() || "#"}
                            </div>
                            <div>
                                <h4 className="font-black text-xl text-zinc-900 dark:text-white uppercase italic">{p.name}</h4>
                                <p className="text-tactical opacity-50">NODE: #{p.id}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 mb-10 font-mono">
                        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
                            <span className="text-tactical opacity-40">PROTOCOL</span>
                            <span className={`status-badge ${p.patient_type === 'IP' ? 'text-orange-600' : 'text-blue-600'}`}>
                                {p.patient_type || 'OP'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-tactical opacity-40">VERIFIED_ID</span>
                            <span className="text-tactical">{p.aadhaar || 'PENDING'}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Link href={`/patients/${p.id}/profile`} className="btn-primary !py-4 text-center">ACCESS</Link>
                        {isAdmin && (
                            <button onClick={() => setEditingPatient({...p})} className="btn-secondary !py-4">EDIT</button>
                        )}
                    </div>
                </div>
                ))}
            </div>
   </div>
            {filteredPatients.length === 0 && !loading && (
                <div className="py-60 flex flex-col items-center justify-center opacity-40 group hover:opacity-100 transition-all duration-1000">
                    <span className="text-[12rem] mb-12 grayscale group-hover:grayscale-0 group-hover:rotate-12 transition-all duration-1000">📂</span>
                    <h3 className="text-3xl font-black uppercase tracking-[0.4em] text-zinc-500 italic">Registry_Subset_Null</h3>
                    <p className="text-[11px] font-black text-zinc-400 mt-6 uppercase tracking-[0.3em] font-mono italic">Adjust_Search_Vectors_to_Populate_Match_Nodes.</p>
                </div>
            )}
          </div>
        )}

        {/* Secure Registry Override Modal */}
        {editingPatient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/80 transition-all">
            <div className="pro-card w-full max-w-5xl p-12 shadow-2xl animate-elite-zoom relative overflow-y-auto max-h-[95vh]">
              <button 
                onClick={() => setEditingPatient(null)} 
                className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-xl text-3xl font-light hover:bg-zinc-950 dark:hover:bg-white hover:text-white dark:hover:text-zinc-950 transition-all z-20"
                >&times;</button>
              
              <div className="mb-12">
                <h3 className="text-4xl font-black tracking-tighter uppercase italic text-zinc-900 dark:text-white leading-tight mb-4">Registry_Override</h3>
                <p className="text-tactical text-zinc-500 italic">MOD_IDENT: {editingPatient.name} || NODE_UID: #{editingPatient.id}</p>
              </div>

              <form onSubmit={handleUpdatePatient} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="col-span-2">
                    <label className="form-label">Clinical_Identity_Nexus</label>
                    <input className="form-input text-2xl font-black italic" value={editingPatient.name} onChange={e => setEditingPatient({...editingPatient, name: e.target.value})} required />
                  </div>
                  <div>
                    <label className="form-label">Aadhaar_Document_Identifier</label>
                    <input className="form-input font-mono !py-4" value={editingPatient.aadhaar} onChange={e => setEditingPatient({...editingPatient, aadhaar: e.target.value.replace(/\D/g, '').slice(0, 12)})} minLength={12} maxLength={12} required />
                  </div>
                  <div>
                    <label className="form-label">Primary_Contact_Phone</label>
                    <input className="form-input font-mono !py-4" value={editingPatient.phone} onChange={e => setEditingPatient({...editingPatient, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">ABHA_Health_ID</label>
                    <input className="form-input font-mono !py-4" value={editingPatient.abha_id || ""} onChange={e => setEditingPatient({...editingPatient, abha_id: e.target.value})} placeholder="UNLINKED" />
                  </div>
                  <div>
                    <label className="form-label">Operational_Sector</label>
                    <select className="form-input !py-4" value={editingPatient.patient_type || "OP"} onChange={e => setEditingPatient({...editingPatient, patient_type: e.target.value, assigned_ward_id: e.target.value === 'OP' ? null : editingPatient.assigned_ward_id, assigned_bed_id: e.target.value === 'OP' ? null : editingPatient.assigned_bed_id})}>
                        <option value="OP">OUT-PATIENT_UNIT</option>
                        <option value="IP">IN-PATIENT_ADMISSION</option>
                    </select>
                  </div>
                  {editingPatient.patient_type === 'IP' && (
                    <>
                      <div>
                        <label className="form-label">Clinical_Sector</label>
                        <select className="form-input !py-4" value={editingPatient.assigned_ward_id || ""} onChange={e => setEditingPatient({...editingPatient, assigned_ward_id: e.target.value, assigned_bed_id: ""})}>
                          <option value="">-- WARD_SELECT --</option>
                          {wards.map(w => <option key={w.id} value={w.id}>{w.name.toUpperCase()}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Bed_Telemetry_Node</label>
                        <select className="form-input !py-4" value={editingPatient.assigned_bed_id || ""} onChange={e => setEditingPatient({...editingPatient, assigned_bed_id: e.target.value})}>
                          <option value="">-- BED_SELECT --</option>
                          {beds.map(b => <option key={b.id} value={b.id}>NODE_{b.bed_number}</option>)}
                        </select>
                        {beds.length === 0 && editingPatient.assigned_ward_id && <p className="text-[10px] text-red-600 mt-2 font-black uppercase tracking-widest italic animate-pulse">CRITICAL: ALL_NODES_BOOKED</p>}
                      </div>
                    </>
                  )}
                  <div>
                    <label className="form-label">Lead_Clinical_Officer</label>
                    <select className="form-input !py-4" value={editingPatient.assigned_doctor_id || ""} onChange={e => setEditingPatient({...editingPatient, assigned_doctor_id: e.target.value})}>
                        <option value="">-- DOCTOR_SELECT --</option>
                        {doctors.map(d => <option key={d.id} value={d.id}>DR_{d.username.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Nursing_Nexus_Lead</label>
                    <select className="form-input !py-4" value={editingPatient.assigned_nurse_id || ""} onChange={e => setEditingPatient({...editingPatient, assigned_nurse_id: e.target.value})}>
                        <option value="">-- NURSE_SELECT --</option>
                        {nurses.map(n => <option key={n.id} value={n.id}>STAFF_{n.username.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>
                <div className="pt-8">
                    <button type="submit" className="w-full btn-primary !py-8 text-sm tracking-[0.3em]">Synchronize_Record_Override →</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>

  )
}
