"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../../../lib/api"
import useToast from "../../../../components/toast"
import ProtectedRoute from "../../../../components/ProtectedRoute"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

export default function DischargeSummary() {
  const { id } = useParams()
  const router = useRouter()
  const { Toast, show } = useToast()
  
  const [patient, setPatient] = useState(null)
  const [summary, setSummary] = useState("")
  const [totalDues, setTotalDues] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [approvals, setApprovals] = useState({ doctor_approval: false, admin_approval: false })
  const [role, setRole] = useState("")
  const [userId, setUserId] = useState("")

  useEffect(() => {
    async function loadData() {
      try {
        const [fullData, invoices, balanceData, approvalData] = await Promise.all([
          apiFetch(`/patients/${id}/full-profile`),
          apiFetch(`/billing/invoices/patient/${id}`).catch(() => []),
          apiFetch(`/billing/balance/${id}`).catch(() => ({ net_balance: 0 })),
          apiFetch(`/billing/discharge-approvals/${id}`).catch(() => ({ doctor_approval: false, admin_approval: false }))
        ])
        
        setPatient(fullData.patient)
        setApprovals(approvalData)
        setRole((localStorage.getItem("role") || "").toLowerCase())
        setUserId(localStorage.getItem("userId") || "")

        // Calculate unpaid dues minus advance credits
        const invoiceDues = (Array.isArray(invoices) ? invoices : []).reduce((sum, inv) => {
          if (inv.invoice_data?.status !== 'Paid' && inv.invoice_data?.status !== 'paid') {
            return sum + (parseFloat(inv.invoice_data?.final_due || inv.invoice_data?.total) || 0)
          }
          return sum
        }, 0)
        
        const advanceCredit = Math.max(0, balanceData.net_balance)
        const netDues = Math.max(0, invoiceDues - advanceCredit)
        setTotalDues(netDues)
        
        const latestVitals = fullData.vitals[0] || {}
        const meds = fullData.medication_schedule.map(m => m.medicine).join(", ")
        const lastFeed = fullData.feeding_logs[0] || {}
        
        const draft = `DISCHARGE SUMMARY: ${fullData.patient.name}
--------------------------------------------------
Clinical Course: Stable clinical condition observed during the stay.
Latest Vitals (at discharge): HR: ${latestVitals.hr || '--'} bpm, SpO2: ${latestVitals.spo2 || '--'}%.
Nutrition: Last feed recorded as ${lastFeed.type || '--'} (${lastFeed.quantity || '--'}ml).

Prescribed Medications on Discharge:
- ${meds || 'None'}

Advice:
- Continue above medications as scheduled.
- Maintain hygiene and monitor temperature.
- Follow-up in OPD after 1 week.`
        
        setSummary(draft)
      } catch (err) {
        show("Failed to load clinical profile")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, show])

  async function approveDischarge() {
    try {
      await apiFetch(`/billing/discharge-approvals/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ role, user_id: userId })
      })
      show("Approval recorded")
      // Refresh approvals
      const approvalData = await apiFetch(`/billing/discharge-approvals/${id}`)
      setApprovals(approvalData)
    } catch (err) {
      show("Failed to approve")
    }
  }

  async function handleDischarge() {
    if (!approvals.doctor_approval || !approvals.admin_approval) {
      return show("Both Doctor and Admin must approve before discharge")
    }
    setSubmitting(true)
    try {
      await apiFetch(`/patients/${id}/discharge`, {
        method: "POST",
        body: JSON.stringify({ summary })
      })
      show("Patient discharged successfully!")
      setTimeout(() => router.push("/patients"), 2000)
    } catch (err) {
      show("Failed to complete discharge")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProtectedRoute roles={["admin"]}>
      <div className="animate-in fade-in duration-500 pb-safe max-w-2xl mx-auto">
        {Toast}
        
        <div className="mb-6">
          <Link href={`/patients/${id}/profile`} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-medium text-sm flex items-center gap-1 transition-colors">
            &larr; Back to Profile
          </Link>
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-4">Discharge Summary</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Finalize clinical notes for {patient?.name}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm">
          <div className="mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Patient Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Name</p>
                <p className="font-bold">{patient?.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Admission ID</p>
                <p className="font-bold">#ADM-{patient?.id}</p>
              </div>
            </div>
          </div>

          <div className="mb-8 text-zinc-900 dark:text-white">
            <label className="form-label mb-3">Clinical Summary & Advise</label>
            <textarea 
              className="form-input min-h-[200px] !py-4"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Enter detailed discharge instructions..."
            />
          </div>

          {/* Dual Approval Section */}
          <div className="mb-8 p-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-[32px] border border-zinc-100 dark:border-zinc-800">
            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6">Discharge Clearances</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Doctor Approval */}
              <div className={`p-4 rounded-2xl border transition-all ${approvals.doctor_approval ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-zinc-200'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Clinical Approval</span>
                  {approvals.doctor_approval ? <span className="text-emerald-500 font-bold text-[10px]">APPROVED ✓</span> : <span className="text-amber-500 font-bold text-[10px]">PENDING</span>}
                </div>
                <p className="text-xs font-bold text-zinc-900 mb-4">Verification by Assigned Doctor</p>
                {role === 'doctor' && !approvals.doctor_approval && (
                  <button onClick={approveDischarge} className="w-full py-2 bg-zinc-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform">Authorize Discharge</button>
                )}
              </div>

              {/* Admin Approval */}
              <div className={`p-4 rounded-2xl border transition-all ${approvals.admin_approval ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-zinc-200'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Admin/Financial Clearance</span>
                  {approvals.admin_approval ? <span className="text-emerald-500 font-bold text-[10px]">CLEARED ✓</span> : <span className="text-amber-500 font-bold text-[10px]">WAITING</span>}
                </div>
                <p className="text-xs font-bold text-zinc-900 mb-4">Verification by Hospital Admin</p>
                {(role === 'admin' || role === 'super_admin') && !approvals.admin_approval && (
                  <button onClick={approveDischarge} className="w-full py-2 bg-zinc-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform">Authorize Clearance</button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleDischarge}
              disabled={submitting || totalDues > 0 || !approvals.doctor_approval || !approvals.admin_approval}
              className={`btn-primary !py-4 w-full shadow-blue-500/20 flex items-center justify-center gap-2 ${
                (totalDues > 0 || !approvals.doctor_approval || !approvals.admin_approval) ? 'opacity-50 grayscale cursor-not-allowed' : ''
              }`}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (totalDues > 0 || !approvals.doctor_approval || !approvals.admin_approval) ? "❌ Discharge Blocked" : "📜 Finalize & Discharge"}
            </button>
            <button 
              onClick={() => window.print()}
              className="py-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              🖨️ Print Preview
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
