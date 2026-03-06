"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../../lib/api"
import useToast from "../../../components/toast"
import ProtectedRoute from "../../../components/ProtectedRoute"
import Link from "next/link"

export default function BillingOrders() {
  const { Toast, show } = useToast()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function loadInvoices() {
      setLoading(true)
      try {
        let url = `/billing/invoices?page=${page}&limit=50`
        if (fromDate) url += `&from_date=${fromDate}`
        if (toDate) url += `&to_date=${toDate}`
        
        const data = await apiFetch(url)
        setInvoices(Array.isArray(data) ? data : [])
      } catch (err) {
        show("Failed to load invoices")
      } finally {
        setLoading(false)
      }
    }
    loadInvoices()
  }, [show, page, fromDate, toDate])

  function handleExportCsv() {
    let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/billing/invoices/export-csv?org_id=1`
    if (fromDate) url += `&from_date=${fromDate}`
    if (toDate) url += `&to_date=${toDate}`
    
    // Create a temporary link to download the file directly from the browser
    const a = document.createElement("a")
    a.href = url
    // If using JWT auth in headers, a simple <a> tag won't work well if auth is required for CSV route.
    // For now, assuming the export-csv is accessible or handled by cookie/session. 
    // If it requires JWT, we'd need to fetch and build blob. Let's do the fetch approach since we use JWT:
    fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "x-organisation-id": "1" } })
      .then(res => res.blob())
      .then(blob => {
        const fileUrl = window.URL.createObjectURL(blob)
        a.href = fileUrl
        a.download = `audit-logs-${Date.now()}.csv`
        a.click()
        window.URL.revokeObjectURL(fileUrl)
        show("CSV Exported ✓")
      })
      .catch(() => show("Failed to export CSV"))
  }

  return (
    <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN", "RECEPTIONIST"]}>
      <div className="animate-in fade-in duration-500 pb-safe">
        {Toast}
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Audit Logs</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Full audit trail of all hospital financial transactions.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input 
              type="date" 
              className="form-input text-sm py-2"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              title="From Date"
            />
            <span className="text-zinc-400">to</span>
            <input 
              type="date" 
              className="form-input text-sm py-2"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              title="To Date"
            />
            <button onClick={() => { setFromDate(''); setToDate(''); setPage(1); }} className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800">
              Clear
            </button>
            <button onClick={handleExportCsv} className="px-4 py-2 border border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
              Export CSV
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Invoice ID</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Patient</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Date</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {invoices.map(inv => {
                  const total = inv.invoice_data?.total || inv.invoice_data?.grand_total || 0;
                  const status = inv.invoice_data?.status || 'Paid';
                  return (
                  <tr key={inv.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                    <td className="px-6 py-5 font-bold text-zinc-900 dark:text-white">#INV-{inv.id}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold">
                          {inv.patient_name?.[0] || '?'}
                        </div>
                        <div>
                          <span className="font-semibold block">{inv.patient_name || 'Walk-in'}</span>
                          <span className="text-xs text-zinc-500">ID: {inv.patient_id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-bold text-zinc-900 dark:text-white underline decoration-zinc-200 dark:decoration-zinc-800 underline-offset-4">
                      ₹{total.toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 animate-pulse'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-zinc-500">
                      {new Date(inv.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                      <Link href={`/billing/${inv.id}`} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors font-medium text-sm text-blue-600">
                        View
                      </Link>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          {loading && (
            <div className="py-20 text-center text-zinc-500 font-medium">Loading audit logs...</div>
          )}
          {invoices.length === 0 && !loading && (
            <div className="py-20 text-center">
              <span className="text-4xl mb-4 block">📦</span>
              <p className="text-zinc-500 font-medium">No financial transactions found.</p>
            </div>
          )}
        </div>
        
        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-6">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl font-semibold disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-zinc-500">Page {page}</span>
          <button 
            disabled={invoices.length < 50} 
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </ProtectedRoute>
  )
}
