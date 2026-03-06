"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"

export default function BillingPage() {
  const { Toast, show } = useToast()
  const [patients, setPatients] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [items, setItems] = useState([{ description: "", quantity: 1, price: 0, serviceId: "", doctorId: "", searchQuery: "", showSuggestions: false }])
  const [gstRate, setGstRate] = useState(18) // Default 18% GST
  const [pricingMaster, setPricingMaster] = useState([])
  const [doctors, setDoctors] = useState([])
  const [selectedPatientType, setSelectedPatientType] = useState("OP")
  const [insurance, setInsurance] = useState({ provider: "", policy_number: "", covered_amount: 0 })

  useEffect(() => {
    async function loadData() {
      try {
        const [pts, prc, drs] = await Promise.all([
          apiFetch("/patients"),
          apiFetch("/pricing"),
          apiFetch("/users") // assuming this returns doctors too, or use /doctors if exists
        ])
        setPatients(Array.isArray(pts) ? pts : [])
        setPricingMaster(Array.isArray(prc) ? prc : [])
        setDoctors(Array.isArray(drs) ? drs.filter(u => u.role === 'DOCTOR') : [])
      } catch (err) {
        show("Failed to load setup data")
      }
    }
    loadData()
  }, [show])

  function handlePatientSelect(id) {
    setSelectedPatientId(id)
    const patient = patients.find(p => p.id === parseInt(id))
    if (patient) {
      setSelectedPatientType(patient.patient_type || "OP")
    }
  }

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  const gstAmount = (subtotal * gstRate) / 100
  const total = subtotal + gstAmount

  function addItem() {
    setItems([...items, { description: "", quantity: 1, price: 0, serviceId: "", doctorId: "", searchQuery: "", showSuggestions: false }])
  }

  function updateItem(index, field, value) {
    const newItems = [...items]
    if (field === 'serviceId') {
      const service = pricingMaster.find(p => p.id === parseInt(value))
      if (service) {
        newItems[index].description = service.service_name
        newItems[index].price = parseFloat(service.base_charge)
        newItems[index].serviceId = value
        
        // If it's a consultation, and we have a doctor selected, use their fee
        if (service.category === 'CONSULTATION' && newItems[index].doctorId) {
          const doc = doctors.find(d => d.id === parseInt(newItems[index].doctorId))
          if (doc && doc.consultation_fee) newItems[index].price = parseFloat(doc.consultation_fee)
        }
      } else {
        newItems[index].serviceId = ""
      }
    } else if (field === 'doctorId') {
      newItems[index].doctorId = value
      const service = pricingMaster.find(p => p.id === parseInt(newItems[index].serviceId))
      if (service && service.category === 'CONSULTATION') {
        const doc = doctors.find(d => d.id === parseInt(value))
        if (doc && doc.consultation_fee) newItems[index].price = parseFloat(doc.consultation_fee)
      }
    } else {
      newItems[index][field] = value
    }
    setItems(newItems)
  }

  function handleSelectService(index, service) {
    const newItems = [...items]
    if (service.id === 'custom') {
      newItems[index].serviceId = 'custom'
      newItems[index].description = service.service_name
      newItems[index].price = 0
    } else {
      newItems[index].serviceId = service.id.toString()
      newItems[index].description = service.service_name
      newItems[index].price = parseFloat(service.base_charge)
    }
    newItems[index].searchQuery = service.service_name
    newItems[index].showSuggestions = false
    setItems(newItems)
  }

  function getSuggestions(query) {
    if (!query) return []
    const q = query.toLowerCase()
    return pricingMaster
      .filter(p => p.patient_type === 'BOTH' || p.patient_type === selectedPatientType)
      .filter(p => p.service_name.toLowerCase().includes(q))
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
          invoice_data: invoiceData,
          insurance: insurance.covered_amount > 0 ? insurance : undefined
        })
      })
      show("Invoice generated and saved to audit logs")
      setItems([{ description: "", quantity: 1, price: 0, serviceId: "", doctorId: "", searchQuery: "", showSuggestions: false }])
      setInsurance({ provider: "", policy_number: "", covered_amount: 0 })
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
                  onChange={e => handlePatientSelect(e.target.value)}
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_type || 'OP'})</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h4 className="font-semibold text-zinc-900 dark:text-white uppercase tracking-wider text-xs">Line Items</h4>
                </div>
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-6 relative">
                      <input 
                        className="form-input text-sm"
                        placeholder="Type service name to search (Enter to add)..."
                        value={item.searchQuery !== undefined ? item.searchQuery : (pricingMaster.find(p => p.id === parseInt(item.serviceId))?.service_name || item.description || "")}
                        onChange={e => {
                          updateItem(index, 'searchQuery', e.target.value)
                          updateItem(index, 'showSuggestions', true)
                        }}
                        onFocus={() => updateItem(index, 'showSuggestions', true)}
                        onBlur={() => setTimeout(() => updateItem(index, 'showSuggestions', false), 200)}
                        onKeyDown={e => {
                           if (e.key === 'Enter') {
                               e.preventDefault()
                               const query = item.searchQuery || ""
                               if (query.trim() === "") return
                               const suggestions = getSuggestions(query)
                               if (suggestions.length > 0) {
                                   handleSelectService(index, suggestions[0])
                               } else {
                                   handleSelectService(index, { id: 'custom', service_name: query, base_charge: 0, category: 'OTHER' })
                               }
                               addItem()
                           }
                        }}
                      />
                      {item.showSuggestions && item.searchQuery && (
                         <div className="absolute z-10 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mt-1 max-h-60 overflow-y-auto rounded-xl shadow-2xl">
                            {getSuggestions(item.searchQuery).map(p => (
                               <div 
                                 key={p.id} 
                                 className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer border-b border-zinc-100 dark:border-zinc-700/50 last:border-0"
                                 onClick={() => handleSelectService(index, p)}
                               >
                                 <div className="font-semibold text-sm text-zinc-900 dark:text-white">{p.service_name}</div>
                                 <div className="text-[10px] text-zinc-500 flex justify-between mt-1">
                                    <span className="font-bold tracking-wider">{p.category}</span>
                                    <span className="text-blue-600 dark:text-blue-400 font-bold">₹{p.base_charge}</span>
                                 </div>
                               </div>
                            ))}
                            {getSuggestions(item.searchQuery).length === 0 && (
                               <div 
                                 className="px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer text-sm text-blue-600 font-medium"
                                 onClick={() => handleSelectService(index, { id: 'custom', service_name: item.searchQuery, base_charge: 0, category: 'OTHER' })}
                               >
                                 + Add "{item.searchQuery}" as Custom Item
                               </div>
                            )}
                         </div>
                      )}
                      {item.serviceId && pricingMaster.find(p => p.id === parseInt(item.serviceId))?.category === 'CONSULTATION' && (
                        <select 
                          className="form-input text-[10px] mt-1 py-1"
                          value={item.doctorId}
                          onChange={e => updateItem(index, 'doctorId', e.target.value)}
                        >
                          <option value="">-- Apply Doctor Fee --</option>
                          {doctors.map(d => (
                            <option key={d.id} value={d.id}>{d.username} (₹{d.consultation_fee || 'Std'})</option>
                          ))}
                        </select>
                      )}
                      {item.serviceId === 'custom' && (
                        <input 
                          className="form-input text-xs mt-1" 
                          placeholder="Manually enter description" 
                          value={item.description}
                          onChange={e => updateItem(index, 'description', e.target.value)}
                        />
                      )}
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
                
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Insurance / Third-Party Coverage</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      className="form-input text-xs" 
                      placeholder="Provider (e.g., Star Health)" 
                      value={insurance.provider}
                      onChange={e => setInsurance({ ...insurance, provider: e.target.value })}
                    />
                    <input 
                      type="text" 
                      className="form-input text-xs" 
                      placeholder="Policy No." 
                      value={insurance.policy_number}
                      onChange={e => setInsurance({ ...insurance, policy_number: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 text-sm">
                    <span>Covered Amount</span>
                    <div className="flex items-center gap-1">
                      <span>₹</span>
                      <input 
                        type="number" 
                        className="w-24 text-right text-xs bg-zinc-50 dark:bg-zinc-800 border-none rounded p-1" 
                        placeholder="0.00"
                        value={insurance.covered_amount || ''}
                        onChange={e => setInsurance({ ...insurance, covered_amount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between font-bold text-xl text-zinc-900 dark:text-white">
                  <span>Patient Due</span>
                  <span>₹{Math.max(0, total - (insurance.covered_amount || 0)).toFixed(2)}</span>
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
