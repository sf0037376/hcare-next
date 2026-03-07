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
  const [role, setRole] = useState("")
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [manualDiscount, setManualDiscount] = useState(0)
  const [couponCode, setCouponCode] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [panNumber, setPanNumber] = useState("")
  const [billingType, setBillingType] = useState("Total") // Daily or Total

  useEffect(() => {
    async function loadData() {
      const userRole = (localStorage.getItem("role") || "").toLowerCase()
      setRole(userRole)
      try {
        const [pts, prc, drs, inv] = await Promise.all([
          apiFetch("/patients"),
          apiFetch("/pricing"),
          apiFetch("/users"),
          userRole === 'pharmacist' ? apiFetch("/pharmacy/inventory") : Promise.resolve([])
        ])
        setPatients(Array.isArray(pts) ? pts : [])
        
        if (userRole === 'pharmacist') {
          // Map inventory to pricingMaster structure
          const mappedInv = Array.isArray(inv) ? inv.map(i => ({
            id: i.id,
            service_name: i.medicine,
            base_charge: i.price,
            category: 'PHARMACY',
            patient_type: 'BOTH'
          })) : []
          setPricingMaster(mappedInv)
        } else {
          setPricingMaster(Array.isArray(prc) ? prc : [])
        }
        
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
  const discountAmount = parseFloat(couponDiscount || 0) + parseFloat(manualDiscount || 0)
  const discountedSubtotal = Math.max(0, subtotal - discountAmount)
  const gstAmount = (discountedSubtotal * gstRate) / 100
  const total = discountedSubtotal + gstAmount

  function applyCoupon() {
    const code = couponCode.toUpperCase().trim()
    if (!subtotal) return show("Add items first to apply a coupon")
    if (code === 'HCARE10') {
      setCouponDiscount((subtotal * 0.10).toFixed(2))
      show("10% discount applied!")
    } else if (code === 'FLAT500') {
      setCouponDiscount(500)
      show("₹500 flat discount applied!")
    } else if (code === 'STAFF25') {
      setCouponDiscount((subtotal * 0.25).toFixed(2))
      show("25% staff discount applied!")
    } else {
      setCouponDiscount(0)
      show("Invalid or expired coupon code")
    }
  }

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

  async function generateInvoice(isFinal = false) {
    if (!selectedPatientId) return show("Select a patient")
    
    const finalDue = Math.max(0, total - (insurance.covered_amount || 0))
    if (paymentMethod === "Cash" && finalDue > 200000 && !panNumber) {
      return show("PAN number is mandatory for cash payments over ₹2,00,000")
    }

    try {
      const isIP = selectedPatientType === "IP"
      const orderData = { 
        items: items.map(item => ({
          ...item,
          status: isIP ? "PENDING_APPROVAL" : "ACCEPTED"
        }))
      }
      const invoiceData = { 
        subtotal, 
        discount_amount: discountAmount || 0,
        coupon_applied: couponCode || null,
        discounted_subtotal: discountedSubtotal,
        gstRate, 
        gstAmount, 
        total,
        final_due: finalDue,
        currency: "INR",
        status: isIP ? (isFinal ? "Final" : "Pending") : "Paid",
        payment_method: paymentMethod,
        pan_number: panNumber || null,
        billing_frequency: billingType,
        is_final: isFinal,
        is_ip_approval_required: isIP
      }

      await apiFetch("/billing/invoices", {
        method: "POST",
        body: JSON.stringify({
          patient_id: selectedPatientId,
          organization_id: 1,
          order_data: orderData,
          invoice_data: invoiceData,
          insurance: insurance.covered_amount > 0 ? insurance : undefined
        })
      })
      show("Invoice generated successfully")
      
      // RESET FORM
      setItems([{ description: "", quantity: 1, price: 0, serviceId: "", doctorId: "", searchQuery: "", showSuggestions: false }])
      setInsurance({ provider: "", policy_number: "", covered_amount: 0 })
      setSelectedPatientId("")
      setManualDiscount(0)
      setCouponDiscount(0)
      setCouponCode("")
      setPanNumber("")
      setPaymentMethod("Cash")
    } catch (err) {
      show("Failed to generate invoice")
    }
  }

  async function logAdvance() {
    if (!selectedPatientId) return show("Select a patient first to log advance payment")
    const amt = prompt("Enter Advance Deposit / Payment Amount (₹):")
    if (!amt || isNaN(parseFloat(amt))) return

    const amountNum = parseFloat(amt)
    if (paymentMethod === "Cash" && amountNum > 200000 && !panNumber) {
      return show("PAN number is mandatory for cash payments over ₹2,00,000")
    }

    try {
      await apiFetch("/billing/payments", {
        method: "POST",
        body: JSON.stringify({
          patient_id: selectedPatientId,
          amount: amountNum,
          payment_method: paymentMethod,
          pan_number: panNumber || null,
          status: "SUCCESS"
        })
      })
      show(`₹${amountNum} advance payment logged successfully`)
      setPanNumber("")
    } catch (err) {
      show("Failed to log payment")
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
                          placeholder={role === 'pharmacist' ? "Type medicine name..." : "Type service name to search (Enter to add)..."}
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
                               } else if (role !== 'pharmacist') {
                                   handleSelectService(index, { id: 'custom', service_name: query, base_charge: 0, category: 'OTHER' })
                               }
                               if (role !== 'pharmacist' || (suggestions.length > 0)) {
                                   addItem()
                               }
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
                             {getSuggestions(item.searchQuery).length === 0 && role !== 'pharmacist' && (
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
                
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-6">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white flex justify-between uppercase tracking-wider text-[10px]">
                    Discounts & Invoicing
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Manual Discount (₹)</label>
                      <input 
                        type="number"
                        className="form-input !py-3" 
                        placeholder="0.00"
                        value={manualDiscount}
                      onChange={e => setManualDiscount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Frequency</label>
                      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 h-[46px] items-center">
                        <button 
                          type="button"
                          onClick={() => setBillingType("Daily")}
                          className={`flex-1 h-full text-[10px] font-bold uppercase rounded-lg transition-all ${billingType === 'Daily' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600' : 'text-zinc-500'}`}
                        >Daily</button>
                        <button 
                          type="button"
                          onClick={() => setBillingType("Total")}
                          className={`flex-1 h-full text-[10px] font-bold uppercase rounded-lg transition-all ${billingType === 'Total' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600' : 'text-zinc-500'}`}
                        >Total</button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Coupon Code</label>
                    <div className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        className="form-input text-xs flex-1 uppercase" 
                        placeholder="e.g. SAVE10" 
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value)}
                      />
                      <button onClick={applyCoupon} className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold rounded-xl transition-all">
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider text-[10px]">Payment Method</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['Cash', 'UPI', 'Card', 'Bank Transfer'].map(method => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 px-4 rounded-xl text-xs font-bold transition-all border ${
                          paymentMethod === method 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' 
                          : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === 'Cash' && total > 200000 && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                      <label className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-2">PAN Number Required (&gt; 2 Lakh Cash)</label>
                      <input 
                        className="form-input !border-red-200 focus:!ring-red-500 !py-3 font-mono" 
                        placeholder="ABCDE1234F"
                        value={panNumber}
                        onChange={e => setPanNumber(e.target.value.toUpperCase())}
                        maxLength={10}
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between font-bold text-xl text-zinc-900 dark:text-white">
                  <span>{selectedPatientType === 'IP' ? 'Estimate Current Due' : 'Patient Due'}</span>
                  <span>₹{Math.max(0, total - (insurance.covered_amount || 0)).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3 mt-8">
                {selectedPatientType === 'IP' ? (
                  <>
                    <button 
                      onClick={() => generateInvoice(false)}
                      className="w-full btn-primary py-4 shadow-xl shadow-blue-500/20 bg-emerald-600 hover:bg-emerald-700"
                    >
                      📄 Generate Daily Summary Receipt
                    </button>
                    <button 
                      onClick={() => generateInvoice(true)}
                      className="w-full py-4 border-2 border-blue-600 text-blue-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-all"
                    >
                      🏦 Generate Final Discharge Invoice
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => generateInvoice(true)}
                    className="w-full btn-primary py-4 shadow-xl shadow-blue-500/20"
                  >
                    Generate Final Invoice
                  </button>
                )}
                <button 
                  onClick={logAdvance}
                  className="w-full py-3.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
                >
                  ➕ Log Advance Payment
                </button>
                <button 
                  onClick={() => {
                    setItems([{ description: "", quantity: 1, price: 0, serviceId: "", doctorId: "", searchQuery: "", showSuggestions: false }])
                    setInsurance({ provider: "", policy_number: "", covered_amount: 0 })
                    setSelectedPatientId("")
                  }}
                  className="w-full text-[10px] font-black uppercase text-zinc-400 hover:text-red-500 transition-colors py-2"
                >
                  Reset / Clear Form
                </button>
              </div>
              <p className="text-[10px] text-zinc-400 mt-4 text-center">Invoices are saved as JSON snapshots in <code>hcare_dev_billing</code></p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
