"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { apiFetch } from "../../../../lib/api"
import useToast from "../../../../components/toast"
import ProtectedRoute from "../../../../components/ProtectedRoute"
import Link from "next/link"

export default function PatientApprovals() {
  const { id } = useParams()
  const { Toast, show } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadItems()
  }, [id])

  async function loadItems() {
    try {
      const data = await apiFetch(`/billing/ip-items/${id}`)
      setItems(Array.isArray(data) ? data.filter(i => i.acceptance_status === 'PENDING') : [])
    } catch (err) {
      show("Failed to load pending charges")
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(itemId, status) {
    try {
      await apiFetch(`/billing/ip-items/${itemId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status })
      })
      show(`Charge ${status.toLowerCase()}`)
      loadItems()
    } catch (err) {
      show("Failed to update status")
    }
  }

  async function approveAll() {
    try {
      await apiFetch("/billing/ip-items/bulk-approve", {
        method: "POST",
        body: JSON.stringify({ patient_id: id })
      })
      show("All charges approved")
      loadItems()
    } catch (err) {
      show("Failed to approve all")
    }
  }

  if (loading) return <div className="p-10 text-center font-bold">Loading Approvals...</div>

  return (
    <ProtectedRoute roles={["patient", "admin", "super_admin"]}>
      <div className="p-6 md:p-12 animate-in fade-in duration-500 max-w-4xl mx-auto">
        {Toast}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <Link href={`/patients/${id}/financials`} className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline mb-2 block">← Back to Financials</Link>
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight italic">Pending Approvals</h1>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2 italic">Review clinical & service charges for your active stay</p>
          </div>
          {items.length > 0 && (
            <button 
              onClick={approveAll}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-emerald-500/20"
            >
              ✓ Approve All Charges
            </button>
          )}
        </div>

        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[32px] flex justify-between items-center group hover:border-zinc-400 transition-all shadow-sm">
              <div>
                <p className="font-bold text-lg text-zinc-900 dark:text-white">{item.description}</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    {item.quantity} x ₹{item.unit_price}
                  </p>
                  <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic font-serif">Logged on {new Date(item.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <p className="font-black text-2xl text-zinc-900 dark:text-white font-mono">₹{item.total_amount}</p>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => updateStatus(item.id, 'ACCEPTED')}
                    className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all border border-emerald-100 shadow-sm"
                   >
                    ✓
                   </button>
                   <button 
                    onClick={() => updateStatus(item.id, 'REJECTED')}
                    className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm"
                   >
                    ✕
                   </button>
                </div>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="py-32 bg-zinc-50 dark:bg-zinc-800/20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[48px] flex flex-col items-center justify-center opacity-40">
               <span className="text-6xl mb-6">✨</span>
               <p className="text-lg font-black uppercase tracking-[0.2em] italic">All Charges have been reviewed</p>
               <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">No pending items at this moment</p>
            </div>
          )}
        </div>

        <div className="mt-12 bg-zinc-900 rounded-[40px] p-8 text-white relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h4 className="text-xl font-black italic mb-2 tracking-tight">Need help with a charge?</h4>
              <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-md">If you don't recognize a service or have a question about the pricing, please contact the Billing Desk or mark the item as Rejected for review.</p>
            </div>
            <button className="px-6 py-3 border-2 border-zinc-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-zinc-500 hover:bg-zinc-800 transition-all whitespace-nowrap">📞 Contact Billing</button>
          </div>
          <div className="absolute -bottom-8 -right-8 text-8xl opacity-5 grayscale group-hover:rotate-12 transition-transform duration-1000 select-none">💬</div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
