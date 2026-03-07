"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { apiFetch } from "../../../../lib/api"
import useToast from "../../../../components/toast"
import ProtectedRoute from "../../../../components/ProtectedRoute"
import Link from "next/link"

export default function PatientFinancials() {
  const { id } = useParams()
  const { Toast, show } = useToast()
  const [role, setRole] = useState("")
  const [balance, setBalance] = useState({ total_paid: 0, total_invoiced: 0, pending_charges: 0, net_balance: 0, is_above_threshold: false })
  const [ledger, setLedger] = useState([])
  const [ipItems, setIpItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setRole((localStorage.getItem("role") || "").toLowerCase())
    loadData()
  }, [id])

  async function loadData() {
    try {
      const [balanceData, invoices, payments, items] = await Promise.all([
        apiFetch(`/billing/balance/${id}`),
        apiFetch(`/billing/invoices/patient/${id}`).catch(() => []),
        apiFetch(`/billing/payments/patient/${id}`).catch(() => []),
        apiFetch(`/billing/ip-items/${id}`).catch(() => [])
      ])
      
      setBalance(balanceData)
      setIpItems(items)
      
      const combined = [
        ...invoices.map(i => ({ ...i, type: 'INVOICE', date: i.created_at, amount: i.invoice_data?.total || 0, ref: i.id })),
        ...payments.map(p => ({ ...p, type: 'PAYMENT', date: p.created_at, amount: p.amount, ref: p.transaction_ref }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date))
      
      setLedger(combined)
    } catch (err) {
      show("Failed to load financial records")
    } finally {
      setLoading(false)
    }
  }

  async function updateItemStatus(itemId, status) {
    try {
      await apiFetch(`/billing/ip-items/${itemId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status })
      })
      show(`Charge ${status.toLowerCase()}`)
      loadData()
    } catch (err) {
      show("Failed to update status")
    }
  }

  if (loading) return <div className="p-10 text-center font-bold">Loading Financials...</div>

  return (
    <ProtectedRoute>
      <div className="p-6 md:p-12 animate-in fade-in duration-500">
        {Toast}
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <Link href={`/patients/${id}/profile`} className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline mb-2 block">← Back to Profile</Link>
              <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight italic">Financial Statement</h1>
            </div>
            {balance.is_above_threshold && (role === 'admin' || role === 'super_admin') && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-3xl flex items-center gap-3 animate-pulse">
                <span className="text-2xl">🚨</span>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">THRESHOLD EXCEEDED (&gt; ₹10k)</p>
              </div>
            )}
          </div>

          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-zinc-900 dark:bg-zinc-800 rounded-[40px] p-8 text-white shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Net Position</p>
              <h2 className={`text-4xl font-black italic font-mono ${balance.net_balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {balance.net_balance >= 0 ? '+' : ''}₹{balance.net_balance.toLocaleString()}
              </h2>
              <p className="text-[10px] mt-2 text-zinc-500 uppercase font-bold tracking-widest">Advances vs Final Bills</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-8 shadow-sm">
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Advance Credit</p>
              <h2 className="text-4xl font-black text-zinc-900 dark:text-white font-mono">₹{balance.total_paid.toLocaleString()}</h2>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-8 shadow-sm">
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Pending In-Patient Dues</p>
              <h2 className="text-4xl font-black text-zinc-900 dark:text-white font-mono">₹{balance.pending_charges.toLocaleString()}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* IP Billing Items (Active) */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[.25em] flex justify-between items-center">
                <span>Un-invoiced Items (IP)</span>
                <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded text-[8px]">PENDING APPROVAL</span>
              </h3>
              <div className="space-y-3">
                {ipItems.filter(item => item.acceptance_status === 'PENDING').map(item => (
                  <div key={item.id} className="p-5 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 rounded-3xl flex justify-between items-center group transition-all hover:bg-zinc-100">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white text-sm">{item.description}</p>
                      <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">{item.quantity} x ₹{item.unit_price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <p className="font-black text-zinc-900 dark:text-white mr-3">₹{item.total_amount}</p>
                       <button onClick={() => updateItemStatus(item.id, 'ACCEPTED')} className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">✓</button>
                       <button onClick={() => updateItemStatus(item.id, 'REJECTED')} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-red-500/20">✕</button>
                    </div>
                  </div>
                ))}
                {ipItems.filter(item => item.acceptance_status === 'PENDING').length === 0 && (
                  <p className="text-center text-zinc-400 text-xs py-10 italic bg-zinc-50 dark:bg-zinc-800/20 rounded-[40px] border border-dashed border-zinc-200 dark:border-zinc-800">No pending items to review.</p>
                )}
              </div>
            </div>

            {/* Ledger / Transaction History */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[.25em] flex justify-between items-center">
                <span>Transaction Ledger</span>
                <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded text-[8px]">AUDITED</span>
              </h3>
              <div className="space-y-3">
                {ledger.map(item => (
                  <div key={`${item.type}-${item.id}`} className={`p-4 rounded-3xl border flex justify-between items-center transition-all ${
                    item.type === 'PAYMENT' ? 'bg-emerald-50/20 border-emerald-100' : 'bg-white border-zinc-100'
                  }`}>
                    <div>
                      <p className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-2">
                        {item.type === 'PAYMENT' ? 'Advance Payment' : 'Final Bill #'+item.id}
                        <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase ${item.type === 'PAYMENT' ? 'bg-emerald-500 text-white' : 'bg-zinc-500 text-white'}`}>
                          {item.type}
                        </span>
                      </p>
                      <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest">
                        {new Date(item.date).toLocaleDateString()} • REF: {item.ref || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-lg font-mono ${item.type === 'PAYMENT' ? 'text-emerald-600' : 'text-zinc-900'}`}>
                        {item.type === 'PAYMENT' ? '+' : '-'} ₹{item.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
