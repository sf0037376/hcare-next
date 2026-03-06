"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"

export default function BillingPage() {
  const { Toast, show } = useToast()
  const [patients, setPatients] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [items, setItems] = useState([{ description: "", quantity: 1, price: 0 }])
  const [gstRate, setGstRate] = useState(18) // Default 18% GST

  useEffect(() => {
    async function loadPatients() {
      try {
        const data = await apiFetch("/patients")
        setPatients(Array.isArray(data) ? data : [])
      } catch (err) {
        show("Failed to load patients")
      }
    }
    loadPatients()
  }, [show])

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  const gstAmount = (subtotal * gstRate) / 100
  const total = subtotal + gstAmount

  function addItem() {
    setItems([...items, { description: "", quantity: 1, price: 0 }])
  }

  function updateItem(index, field, value) {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  async function generateInvoice() {
    if (!selectedPatientId) return show("Select a patient")
    
    try {
      const orderData = { items }
      const invoiceData = { 
        subtotal, 
        gstRate, 
        gstAmount, 
        total,
        currency: "INR",
        status: "Paid"
      }

      await apiFetch("/billing/invoices", {
        method: "POST",
        body: JSON.stringify({
          patient_id: selectedPatientId,
          organization_id: 1, // Organization-linked
          order_data: orderData,
          invoice_data: invoiceData
        })
      })
      show("Invoice generated and saved to audit logs")
      setItems([{ description: "", quantity: 1, price: 0 }])
    } catch (err) {
      show("Failed to generate invoice")
    }
  }

  return (
    <ProtectedRoute roles={["admin", "pharmacist"]}>
      <div className="animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
        {Toast}
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Billing & Invoicing</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Generate invoices with GST and independent price snapshots.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
              <div className="mb-6 h-12">
                <label className="form-label">Select Patient for Invoice</label>
                <select 
                  className="form-input"
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h4 className="font-semibold text-zinc-900 dark:text-white uppercase tracking-wider text-xs">Line Items</h4>
                </div>
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-6">
                      <input 
                        className="form-input text-sm" 
                        placeholder="Service or Medicine" 
                        value={item.description}
                        onChange={e => updateItem(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <input 
                        type="number" 
                        className="form-input text-sm" 
                        placeholder="Qty" 
                        value={item.quantity}
                        onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-3">
                      <input 
                        type="number" 
                        className="form-input text-sm" 
                        placeholder="Price" 
                        value={item.price}
                        onChange={e => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-1 text-center pb-2.5">
                      <button onClick={() => setItems(items.filter((_, i) => i !== index))} className="text-red-400 hover:text-red-600">&times;</button>
                    </div>
                  </div>
                ))}
                <button onClick={addItem} className="text-sm font-medium text-blue-600 hover:underline px-2">+ Add Item</button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col h-full">
              <h3 className="text-lg font-semibold mb-8">Order Summary</h3>
              
              <div className="space-y-4 flex-1">
                <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span>GST (%)</span>
                    <input 
                      type="number" 
                      className="w-12 text-xs bg-zinc-50 dark:bg-zinc-800 border-none rounded p-1 text-center" 
                      value={gstRate}
                      onChange={e => setGstRate(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <span>₹{gstAmount.toFixed(2)}</span>
                </div>
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between font-bold text-xl text-zinc-900 dark:text-white">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={generateInvoice}
                className="w-full btn-primary py-4 mt-8 shadow-xl shadow-blue-500/20"
              >
                Generate Final Invoice
              </button>
              <p className="text-[10px] text-zinc-400 mt-4 text-center">Invoices are saved as JSON snapshots in <code>hcare_dev_billing</code></p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
