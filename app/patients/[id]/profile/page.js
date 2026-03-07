'use client'

import { useState, useEffect } from "react"
import { apiFetch } from "../../../../lib/api"
import useToast from "../../../../components/toast"
import ProtectedRoute from "../../../../components/ProtectedRoute"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function PatientProfile() {
  const { id } = useParams()
  const { Toast, show } = useToast()
  const [data, setData] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('')

  useEffect(() => {
    setRole((localStorage.getItem('role') || '').toLowerCase())
    async function loadProfile() {
      try {
        const [profileData, invoiceData, paymentData, balanceData] = await Promise.all([
          apiFetch(`/patients/${id}/full-profile`),
          apiFetch(`/billing/invoices/patient/${id}`).catch(() => []),
          apiFetch(`/billing/payments/patient/${id}`).catch(() => []),
          apiFetch(`/billing/balance/${id}`).catch(() => ({ net_balance: 0, pending_charges: 0 }))
        ])
        setData(profileData)
        setInvoices(Array.isArray(invoiceData) ? invoiceData : [])
        setPayments(Array.isArray(paymentData) ? paymentData : [])
        setBalance(balanceData)
      } catch (err) {
        show("Failed to load patient 360 view")
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [id, show])

  async function acceptItem(invoiceId, itemIndex) {
    try {
      await apiFetch(`/billing/invoices/${invoiceId}/accept-item`, {
        method: 'PUT',
        body: JSON.stringify({ item_index: itemIndex })
      })
      show("Charge accepted successfully")
      const newInvoices = [...invoices]
      const invIdx = newInvoices.findIndex(inv => inv.id === invoiceId)
      if (invIdx !== -1) {
        newInvoices[invIdx].order_data.items[itemIndex].status = 'ACCEPTED'
        setInvoices(newInvoices)
      }
    } catch (err) {
      show("Failed to accept charge")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) return <p className="text-center p-20">Patient not found</p>

  const { patient, vitals, medication_logs, medication_schedule, feeding_logs, lab_reports, appointments } = data
  const latestVitals = vitals[0] || {}

  return (
    <ProtectedRoute>
      <div className="animate-in fade-in duration-700 pb-24 max-w-7xl mx-auto px-4 sm:px-6">
        {Toast}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-blue-600 flex items-center justify-center text-4xl text-white shadow-xl shadow-blue-500/20">
              {patient.gender === 'Female' ? '👧' : '👶'}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white uppercase">{patient.name}</h1>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">
                  {patient.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-zinc-500 dark:text-zinc-400">
                <span>Age: {patient.age}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                <span>ID: #{patient.id}</span>
                {patient.abha_id && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                    <span className="text-blue-600 dark:text-blue-400">ABHA: {patient.abha_id}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {role !== 'pharmacist' && (
            <div className="flex flex-wrap gap-3">
              <Link href={`/patients/${id}/history`} className="btn-secondary px-4 py-2 sm:px-6 sm:py-3 rounded-2xl font-bold text-xs uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800">History Log</Link>
              <Link href={`/patients/${id}/reports`} className="btn-primary px-4 py-2 sm:px-6 sm:py-3 rounded-2xl font-bold text-xs uppercase tracking-widest bg-blue-600 shadow-blue-500/20">Lab Reports</Link>
              
              {role === 'patient' && (
                <>
                  <Link href={`/vitals?patient_id=${id}`} className="bg-red-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-105 transition-transform flex items-center gap-2">
                    <span>❤️</span> Log Vitals
                  </Link>
                  <Link href={`/feeding?patient_id=${id}`} className="bg-emerald-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform flex items-center gap-2">
                    <span>🍼</span> Log Feed
                  </Link>
                  <Link href={`/medication?patient_id=${id}`} className="bg-purple-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform flex items-center gap-2">
                    <span>💊</span> Log Meds
                  </Link>
                </>
              )}
              {role === 'doctor' && (
                <Link href={`/medication/prescribe?patient_id=${id}`} className="bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform flex items-center gap-2">
                  <span>💊</span> Prescribe Medicines
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Metrics & Active Care */}
          <div className={`${role === 'pharmacist' ? 'hidden' : 'lg:col-span-8 space-y-10'}`}>
            
            {/* Latest Vitals Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Heart Rate", val: latestVitals.hr || "--", unit: "bpm", icon: "❤️", color: "red" },
                { label: "SpO2", val: latestVitals.spo2 || "--", unit: "%", icon: "💨", color: "blue" },
                { label: "Weight", val: latestVitals.weight || "--", unit: "kg", icon: "⚖️", color: "emerald" },
                { label: "Head Circ.", val: latestVitals.head || "--", unit: "cm", icon: "🧠", color: "purple" }
              ].map((m) => (
                <div key={m.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm group hover:border-zinc-400 dark:hover:border-zinc-500 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-2xl">{m.icon}</span>
                    <span className={`text-[10px] font-black text-${m.color}-500 uppercase tracking-widest opacity-60`}>{m.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-zinc-900 dark:text-white font-mono">{m.val}</span>
                    <span className="text-xs font-bold text-zinc-400">{m.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Clinical Timeline (Medications & Feeding) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-8 shadow-sm">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-8 tracking-tight flex items-center gap-3">
                 Recent Clinical Activity <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">(24h)</span>
              </h3>
              
              <div className="space-y-8 relative">
                <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-zinc-100 dark:bg-zinc-800"></div>
                
                {/* Unified List logic */}
                {[...medication_logs, ...feeding_logs]
                  .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
                  .slice(0, 10)
                  .map((log, idx) => {
                    const isMed = 'medicine' in log;
                    return (
                      <div key={idx} className="relative pl-14 group">
                        <div className={`absolute left-0 w-12 h-12 rounded-2xl flex items-center justify-center text-xl z-10 transition-transform group-hover:scale-110 shadow-sm ${
                          isMed ? 'bg-purple-100 dark:bg-purple-900/30 font-bold' : 'bg-orange-100 dark:bg-orange-900/30'
                        }`}>
                          {isMed ? '💊' : '🍼'}
                        </div>
                        <div>
                          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                            {new Date(log.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                          <div className="inline-block px-4 py-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                             <span className="font-bold text-zinc-900 dark:text-zinc-100">
                               {isMed ? `${log.medicine} - ${log.dosage || log.dose}` : `${log.type} Feed - ${log.quantity}ml`}
                             </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {medication_logs.length === 0 && feeding_logs.length === 0 && (
                    <div className="py-10 text-center text-zinc-400 italic">No clinical logs in the last 24 hours.</div>
                  )}
              </div>
            </div>

            {/* Lab Reports Section */}
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-6 px-2">Lab Diagnostics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lab_reports.map((report) => (
                  <div key={report.id} className="bg-zinc-100 dark:bg-zinc-900/50 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 group hover:bg-white dark:hover:bg-zinc-900 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">{report.test_name || 'Standard Lab Panel'}</p>
                        <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest underline decoration-blue-500/30 decoration-2">
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {report.file_path && (
                          <a 
                            href={`http://localhost:5000${report.file_path}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/40 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors"
                          >
                            ⬇️ Download
                          </a>
                        )}
                      </div>
                    </div>
                    {report.ai_analysis ? (
                      <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/10">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1">✨ AI Insight</p>
                        <p className="text-xs text-blue-900 dark:text-blue-100 leading-relaxed font-medium line-clamp-3">
                          {report.ai_analysis}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 italic mt-4 px-2">Analysis pending...</p>
                    )}
                  </div>
                ))}
                {lab_reports.length === 0 && (
                  <div className="col-span-full py-10 rounded-[40px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center opacity-40">
                    <span className="text-4xl mb-4">🔬</span>
                    <p className="text-sm font-bold uppercase tracking-widest">No lab data recorded</p>
                  </div>
                )}
              </div>
              
              {/* Upload Report Button */}
              <div className="mt-6 flex justify-end">
                <Link 
                  href={`/patients/${id}/reports`} 
                  className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 flex items-center gap-2 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:scale-[1.02] transition-transform"
                >
                  <span className="text-base">📤</span> Upload New Report
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Case Info & Schedule */}
          <div className={`${role === 'pharmacist' ? 'lg:col-span-12 max-w-2xl' : 'lg:col-span-4'} space-y-10`}>
            
            {/* Quick Actions (Patient Only) */}
            {role === 'patient' && (
              <div className="bg-blue-600 rounded-[40px] p-8 shadow-xl text-white">
                <h3 className="text-xs font-black text-blue-200 uppercase tracking-[.25em] mb-6">Quick Log Actions</h3>
                <div className="grid grid-cols-1 gap-3">
                  <Link href={`/vitals?patient_id=${id}`} className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all group">
                    <span className="font-bold">Log Vitals</span>
                    <span className="text-xl group-hover:translate-x-1 transition-transform">❤️</span>
                  </Link>
                  <Link href={`/feeding?patient_id=${id}`} className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all group">
                    <span className="font-bold">Log Feed</span>
                    <span className="text-xl group-hover:translate-x-1 transition-transform">🍼</span>
                  </Link>
                  <Link href={`/medication?patient_id=${id}`} className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all group">
                    <span className="font-bold">Log Meds</span>
                    <span className="text-xl group-hover:translate-x-1 transition-transform">💊</span>
                  </Link>
                </div>
              </div>
            )}
            
            {/* Financial Summary (Admin/Patient Only) */}
            {(role === 'admin' || role === 'patient') && balance && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-8 shadow-sm">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[.25em] mb-8">Financial Summary</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Advance Balance</p>
                      <p className={`text-2xl font-black ${balance.net_balance > 0 ? 'text-emerald-500' : 'text-zinc-900 dark:text-white'}`}>
                        ₹{Math.max(0, balance.net_balance).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Pending Dues</p>
                      <p className={`text-2xl font-black ${balance.pending_charges > 10000 ? 'text-red-500' : 'text-zinc-900 dark:text-white'}`}>
                        ₹{balance.pending_charges.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {balance.pending_charges > 10000 && role === 'admin' && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-2xl flex items-center gap-3 animate-pulse">
                      <span className="text-xl">🚨</span>
                      <div>
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">THRESHOLD EXCEEDED</p>
                        <p className="text-xs font-bold text-red-900 dark:text-red-100 mt-0.5">Un-invoiced charges &gt; ₹10,000</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-sm font-bold">
                    <span className="text-zinc-500">Net Position</span>
                    <span className={balance.net_balance - balance.pending_charges >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                      ₹{(balance.net_balance - balance.pending_charges).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Care Team */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-8 shadow-sm">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[.25em] mb-8">Medical Team</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all">👨‍⚕️</div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Assigned Doctor</p>
                    <p className="font-bold text-zinc-900 dark:text-white">{patient.doctor_name || 'Unassigned'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all">👩‍⚕️</div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Assigned Nurse</p>
                    <p className="font-bold text-zinc-900 dark:text-white">{patient.nurse_name || 'Unassigned'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Medication Schedule (Active) */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 dark:border dark:border-zinc-800 rounded-[40px] p-8 shadow-2xl text-white">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[.25em] mb-8">Prescribed Regimen</h3>
              
              {/* Reminder Highlight (Patient Only) */}
              {role === 'patient' && medication_schedule.length > 0 && (
                <div className="mb-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Upcoming Reminder</p>
                  <p className="text-sm font-bold text-white">Next doses due at intervals of {medication_schedule[0].interval_minutes} mins.</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="w-1/3 h-full bg-blue-500 animate-pulse"></div>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">3h left</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {medication_schedule.map((med) => (
                  <div key={med.id} className="p-4 bg-zinc-800/40 rounded-2xl border border-zinc-800 group hover:border-blue-500/50 transition-all flex justify-between items-start">
                    <div>
                      <p className="font-black text-sm group-hover:text-blue-400 transition-colors uppercase tracking-tight">{med.medicine}</p>
                      <p className="text-xs text-zinc-400 font-bold mt-1 uppercase tracking-widest opacity-80">{med.dosage} • {med.times_per_day} times/day</p>
                    </div>
                    {role === 'doctor' && (
                      <Link 
                        href={`/medication/prescribe?patient_id=${id}&schedule_id=${med.id}`}
                        className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-blue-400 transition-colors bg-zinc-900/50 px-2 py-1 rounded-lg border border-zinc-800"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                ))}
                {medication_schedule.length === 0 && (
                  <p className="text-xs text-zinc-500 italic text-center py-4">No active prescriptions.</p>
                )}
              </div>
            </div>

            {/* Upcoming Appointments */}
            {role !== 'pharmacist' && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-8 shadow-sm">
                 <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[.25em] mb-8">Next Consults</h3>
                 <div className="space-y-6">
                   {appointments && appointments.filter(a => new Date(a.appointment_time) > new Date()).slice(0, 3).map(appt => (
                     <div key={appt.id} className="flex gap-4 group">
                       <div className="flex flex-col items-center justify-center w-12 h-14 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                          <span className="text-[10px] font-black uppercase text-blue-600">{new Date(appt.appointment_time).toLocaleString('en-US', { month: 'short' })}</span>
                          <span className="text-lg font-black text-blue-900 dark:text-blue-100 leading-none">{new Date(appt.appointment_time).getDate()}</span>
                       </div>
                       <div>
                          <p className="font-bold text-zinc-900 dark:text-white text-sm">Consult with Dr. {appt.doctor_name}</p>
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
                            {appt.is_confirmed ? '✅ Confirmed' : '⏳ Pending'}
                          </p>
                       </div>
                     </div>
                   ))}
                   {appointments.length === 0 && <p className="text-xs text-zinc-400 italic text-center py-2">No upcoming visits.</p>}
                 </div>
              </div>
            )}

            {/* Pending Approvals Widget (IP Only) */}
            {role === 'patient' && invoices.some(inv => inv.invoice_data?.is_ip_approval_required && inv.order_data?.items?.some(i => i.status === 'PENDING_APPROVAL')) && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-[40px] p-8 shadow-sm">
                <h3 className="text-xs font-black text-amber-600 uppercase tracking-[.25em] mb-6 flex items-center gap-2">
                  <span className="animate-pulse">⚠️</span> Review Pending Charges
                </h3>
                <div className="space-y-3">
                  {invoices.filter(inv => inv.invoice_data?.is_ip_approval_required).map(inv => (
                    inv.order_data?.items?.map((item, idx) => (
                      item.status === 'PENDING_APPROVAL' && (
                        <div key={`${inv.id}-${idx}`} className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-amber-100 dark:border-amber-800 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{item.description}</p>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">₹{item.price} x {item.quantity}</p>
                          </div>
                          <button 
                            onClick={() => acceptItem(inv.id, idx)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/10"
                          >
                            Accept
                          </button>
                        </div>
                      )
                    ))
                  ))}
                </div>
              </div>
            )}

             {/* Transaction History (Unified Payments & Invoices) */}
              {(role === 'patient' || role === 'admin' || role === 'super_admin') && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-8 shadow-sm mt-10">
                   <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[.25em] mb-8 flex justify-between items-center">
                     <span>Transaction History</span>
                     <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded text-[8px]">LEDGER</span>
                   </h3>
                   <div className="space-y-4">
                     {[...invoices.map(i => ({...i, type: 'INVOICE', date: i.created_at})), 
                       ...payments.map(p => ({...p, type: 'PAYMENT', date: p.created_at}))]
                       .sort((a, b) => new Date(b.date) - new Date(a.date))
                       .map((item, idx) => (
                       <div key={`${item.type}-${item.id}`} className={`p-5 rounded-3xl border flex justify-between items-center transition-all ${
                         item.type === 'PAYMENT' 
                         ? 'bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-900/20'
                         : 'bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-100 dark:border-zinc-800'
                       }`}>
                          <div>
                             <div className="flex items-center gap-2 mb-1">
                               <p className="font-black text-zinc-900 dark:text-white text-lg">
                                 {item.type === 'PAYMENT' ? '+' : '-'} ₹{item.type === 'PAYMENT' ? (item.amount || 0) : (item.invoice_data?.total || 0)}
                               </p>
                               <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ${
                                 item.type === 'PAYMENT' ? 'bg-emerald-500 text-white' : 'bg-zinc-500 text-white'
                               }`}>
                                 {item.type}
                               </span>
                             </div>
                             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                               {new Date(item.date).toLocaleDateString()} • {item.type === 'PAYMENT' ? item.payment_method : (item.invoice_data?.status || 'Billed')}
                             </p>
                          </div>
                          <div className="text-right">
                             {item.type === 'INVOICE' && (
                               <button className="text-[10px] uppercase font-black tracking-widest text-zinc-400 hover:text-blue-500 transition-colors">
                                  View Invoice
                               </button>
                             )}
                             {item.type === 'PAYMENT' && (
                               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                                 Receipt Generated
                               </span>
                             )}
                          </div>
                       </div>
                     ))}
                     {invoices.length === 0 && payments.length === 0 && (
                       <p className="text-xs text-zinc-400 italic text-center py-2">No transactions found.</p>
                     )}
                   </div>
                </div>
              )}

          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
