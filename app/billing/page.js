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
  const [patientSearch, setPatientSearch] = useState("")
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false)
  const [insurance, setInsurance] = useState({ provider: "", policy_number: "", covered_amount: 0 })
  const [role, setRole] = useState("")
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [manualDiscount, setManualDiscount] = useState(0)
  const [couponCode, setCouponCode] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [panNumber, setPanNumber] = useState("")
  const [transactionRef, setTransactionRef] = useState("")
  const [billingType, setBillingType] = useState("One-Time") // Daily or One-Time
  const [submitting, setSubmitting] = useState(false)

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

  async function fetchApprovedLogs() {
    if (!selectedPatientId) return show("Select a patient first")
    try {
      const data = await apiFetch(`/billing/ip-items/${selectedPatientId}`)
      const approved = data.filter(i => i.acceptance_status === 'ACCEPTED')
      if (approved.length === 0) return show("No approved (Accepted) charges found for this patient")
      
      const mappedItems = approved.map(i => ({
        description: i.description,
        quantity: i.quantity,
        price: i.unit_price,
        serviceId: "custom",
        id: i.id // Keep track of the original log ID for cleanup
      }))
      
      setItems(mappedItems)
      show(`Imported ${approved.length} approved logs`)
    } catch (err) {
      show("Failed to fetch logs")
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
    
    if (!transactionRef) {
      return show("Transaction Reference/UTR is mandatory for all transactions")
    }
    const finalDue = Math.max(0, total - (insurance.covered_amount || 0))
    if (paymentMethod === "Cash" && finalDue > 200000 && !panNumber) {
      return show("PAN number is mandatory for cash payments over ₹2,00,000")
    }

    setSubmitting(true)

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
        transaction_ref: transactionRef,
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

      // If we used IP logs, clean them up
      const logIds = items.filter(i => i.id).map(i => i.id)
      if (logIds.length > 0) {
        await apiFetch("/billing/ip-items/cleanup-invoiced", {
          method: "POST",
          body: JSON.stringify({ patient_id: selectedPatientId, ids: logIds })
        })
      }

      show("Invoice generated successfully")
      
      // RESET FORM
      setItems([{ description: "", quantity: 1, price: 0, serviceId: "", doctorId: "", searchQuery: "", showSuggestions: false }])
      setInsurance({ provider: "", policy_number: "", covered_amount: 0 })
      setSelectedPatientId("")
      setPatientSearch("")
      setManualDiscount(0)
      setCouponDiscount(0)
      setCouponCode("")
      setPanNumber("")
      setTransactionRef("")
      setPaymentMethod("Cash")
    } catch (err) {
      show(err.message || "Failed to generate invoice")
    } finally {
      setSubmitting(false)
    }
  }

  async function logAdvance() {
    if (!selectedPatientId) return show("Select a patient first to log advance payment")
    const amt = prompt("Enter Advance Deposit / Payment Amount (₹):")
    if (!amt || isNaN(parseFloat(amt))) return

    const amountNum = parseFloat(amt)
    if (!transactionRef) return show("Please enter a Transaction Reference (UTR/Ref) first")

    setSubmitting(true)

    try {
      await apiFetch("/billing/payments", {
        method: "POST",
        body: JSON.stringify({
          patient_id: selectedPatientId,
          amount: amountNum,
          payment_method: paymentMethod,
          pan_number: panNumber || null,
          transaction_ref: transactionRef,
          status: "SUCCESS"
        })
      })
      show(`₹${amountNum} advance payment logged successfully`)
      setPanNumber("")
      setTransactionRef("")
    } catch (err) {
      show(err.message || "Failed to log payment")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProtectedRoute roles={["admin", "pharmacist"]}>
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-[1600px] mx-auto pb-40 px-4 lg:px-8 transition-all">
        {Toast}
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20 py-8 relative">
          <div className="space-y-4">
            <h2 className="text-6xl md:text-8xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic leading-none premium-text-gradient">Financial_Nexus</h2>
            <div className="flex items-center gap-6">
              <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse shadow-lg shadow-blue-600/50"></span>
              <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.5em] font-mono italic">Sector_Status: Revenue_Cycle_Active</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 px-10 py-6 rounded-[3rem] glass-card border-white/5 shadow-2xl relative overflow-hidden group/status">
               <span className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)] relative z-10"></span>
               <span className="text-[11px] font-black uppercase tracking-[0.5em] font-mono text-zinc-600 dark:text-zinc-200 relative z-10 italic">Ledger_Sync: Nominal</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 font-mono">
          <div className="xl:col-span-8 space-y-16">
            {/* Patient Attribution & Core Entry */}
            <div className="glass-card rounded-[5rem] p-12 md:p-20 shadow-2xl border border-white/5 relative overflow-hidden group/attribution">
              <div className="absolute top-0 right-0 p-24 opacity-[0.03] grayscale -rotate-12 scale-150 select-none pointer-events-none group-hover/attribution:rotate-0 transition-transform duration-1000">💳</div>
              
              <div className="relative z-10 mb-20 space-y-8">
                  <label className="text-[11px] font-black uppercase tracking-[0.6em] text-zinc-400 block ml-6 italic">Patient_Attribution_Target</label>
                  <div className="relative group/search">
                    <input 
                      type="text"
                      className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[3rem] px-12 py-10 text-3xl md:text-4xl font-black italic tracking-tighter focus:ring-4 ring-blue-500/10 transition-all placeholder:text-zinc-500/30"
                      placeholder="SEARCH_IDENTITY_BY_NAME_OR_TELEMETRY_ID..."
                      value={patientSearch}
                      onChange={e => {
                        setPatientSearch(e.target.value)
                        setShowPatientSuggestions(true)
                        if (!e.target.value) setSelectedPatientId("")
                      }}
                      onFocus={() => setShowPatientSuggestions(true)}
                    />
                    <div className="absolute right-12 top-1/2 -translate-y-1/2 text-4xl opacity-20 group-focus-within/search:opacity-100 group-focus-within/search:text-blue-500 transition-all pointer-events-none">🔍</div>
                    
                    {showPatientSuggestions && patientSearch && (
                      <div className="absolute z-50 w-full mt-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] max-h-[500px] overflow-y-auto custom-scrollbar animate-in slide-in-from-top-6 duration-700">
                        {patients
                          .filter(p => 
                            p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
                            (p.phone || "").includes(patientSearch)
                          )
                          .map(p => (
                            <div 
                              key={p.id}
                              className="px-12 py-8 hover:bg-blue-500/5 cursor-pointer border-b border-zinc-100 dark:border-zinc-800 last:border-0 transition-all group/item"
                              onClick={() => {
                                handlePatientSelect(p.id)
                                setPatientSearch(`${p.name.toUpperCase()} [UID:#${p.id.toString().padStart(4, '0')}]`)
                                setShowPatientSuggestions(false)
                              }}
                            >
                              <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-black text-2xl text-zinc-900 dark:text-white tracking-tighter italic group-hover/item:text-blue-600 transition-colors uppercase">{p.name}</p>
                                    <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.4em] mt-2 italic">{p.phone} • SEGMENT: {p.patient_type || 'OP'}</p>
                                  </div>
                                  <div className="w-12 h-12 rounded-full border-2 border-zinc-100 dark:border-zinc-800 flex items-center justify-center opacity-0 group-hover/item:opacity-100 group-hover/item:border-blue-500/50 transition-all duration-500 text-blue-500">→</div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
              </div>

              {/* Transactional Line Items */}
              <div className="relative z-10 space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-6">
                   <div className="space-y-2">
                        <h4 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic leading-none">Clinical_Protocol_Matrix</h4>
                        <div className="flex items-center gap-4">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.5em] italic">Enumeration: Active</p>
                        </div>
                   </div>
                  {selectedPatientType === 'IP' && (
                    <button 
                      onClick={fetchApprovedLogs}
                      className="px-10 py-5 rounded-[2rem] bg-emerald-600/10 border border-emerald-600/20 text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-2xl shadow-emerald-600/5 animate-pulse italic"
                    >
                      ✨ SYNC_ACCEPTED_LOGS
                    </button>
                  )}
                </div>

                <div className="space-y-8">
                    {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start p-10 bg-zinc-100/50 dark:bg-white/5 rounded-[4rem] border border-white/5 group transition-all duration-700 hover:border-blue-500/30">
                        <div className="lg:col-span-7 relative space-y-4">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.5em] block ml-6 italic">Protocol_Definition</label>
                            <input 
                            className="w-full bg-white dark:bg-zinc-950 border-none rounded-[2rem] px-8 py-6 text-lg font-black italic tracking-tight focus:ring-4 ring-blue-500/10 transition-all placeholder:text-zinc-500/20"
                            placeholder={role === 'pharmacist' ? "Select medication protocol..." : "Enter diagnostic service..."}
                            value={item.searchQuery !== undefined ? item.searchQuery : (pricingMaster.find(p => p.id === parseInt(item.serviceId))?.service_name || item.description || "")}
                            onChange={e => {
                            updateItem(index, 'searchQuery', e.target.value)
                            updateItem(index, 'showSuggestions', true)
                            }}
                            onFocus={() => updateItem(index, 'showSuggestions', true)}
                            onBlur={() => setTimeout(() => updateItem(index, 'showSuggestions', false), 200)}
                        />
                        {item.showSuggestions && item.searchQuery && (
                            <div className="absolute z-50 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mt-6 max-h-[400px] overflow-y-auto rounded-[3.5rem] shadow-[0_45px_100px_-20px_rgba(0,0,0,0.5)] custom-scrollbar animate-in zoom-in-95 duration-500">
                                {getSuggestions(item.searchQuery).map(p => (
                                <div 
                                    key={p.id} 
                                    className="px-10 py-8 hover:bg-blue-500/5 cursor-pointer border-b border-zinc-100 dark:border-zinc-800 last:border-0 transition-all group/sugg"
                                    onClick={() => handleSelectService(index, p)}
                                >
                                    <div className="font-black text-lg text-zinc-900 dark:text-white tracking-tighter uppercase italic group-hover/sugg:text-blue-500 transition-colors">{p.service_name}</div>
                                    <div className="flex justify-between items-center mt-4">
                                        <span className="text-[8px] font-black px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 uppercase tracking-[0.4em] italic">{p.category}</span>
                                        <span className="text-xl font-black text-blue-600 italic tracking-tighter">₹{p.base_charge}</span>
                                    </div>
                                </div>
                                ))}
                                {getSuggestions(item.searchQuery).length === 0 && role !== 'pharmacist' && (
                                    <div 
                                    className="px-10 py-8 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 flex justify-between items-center italic"
                                    onClick={() => handleSelectService(index, { id: 'custom', service_name: item.searchQuery.toUpperCase(), base_charge: 0, category: 'OTHER' })}
                                    >
                                    <span>Override: "{item.searchQuery.toUpperCase()}"</span>
                                    <span className="px-4 py-2 bg-blue-500 text-white rounded-xl">+ Apply</span>
                                    </div>
                                )}
                            </div>
                        )}
                        {item.serviceId && pricingMaster.find(p => p.id === parseInt(item.serviceId))?.category === 'CONSULTATION' && (
                            <div className="relative group/doc ml-2">
                                <select 
                                className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-[0.4em] focus:ring-4 ring-blue-500/10 italic appearance-none cursor-pointer"
                                value={item.doctorId}
                                onChange={e => updateItem(index, 'doctorId', e.target.value)}
                                >
                                <option value="">-- ATTENDING_PHYSICIAN --</option>
                                {doctors.map(d => (
                                    <option key={d.id} value={d.id}>{d.username.toUpperCase()} [FEE: ₹{d.consultation_fee || 'STD'}]</option>
                                ))}
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover/doc:opacity-100 transition-all text-[10px]">▼</div>
                            </div>
                        )}
                        </div>
                        <div className="lg:col-span-2 space-y-4">
                           <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.5em] block text-center italic">Units</label>
                           <input 
                            type="number" 
                            className="w-full bg-white dark:bg-zinc-950 border-none rounded-[2rem] px-4 py-6 text-2xl font-black italic tracking-tighter text-center focus:ring-4 ring-blue-500/10 transition-all" 
                            placeholder="0" 
                            value={item.quantity}
                            onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="lg:col-span-2 space-y-4">
                           <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.5em] block text-right italic mr-6">Rate</label>
                           <input 
                            type="number" 
                            className="w-full bg-white dark:bg-zinc-950 border-none rounded-[2rem] px-8 py-6 text-2xl font-black italic tracking-tighter text-right focus:ring-4 ring-blue-500/10 transition-all text-blue-600" 
                            placeholder="0.00" 
                            value={item.price}
                            onChange={e => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="lg:col-span-1 text-center self-end pb-4">
                            <button onClick={() => setItems(items.filter((_, i) => i !== index))} className="w-16 h-16 rounded-[1.5rem] bg-red-600/5 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-500 flex items-center justify-center font-black group/del shadow-2xl">
                                <span className="text-2xl group-hover:scale-125 transition-transform duration-500">×</span>
                            </button>
                        </div>
                    </div>
                    ))}
                    <button onClick={addItem} className="w-full py-12 border-4 border-dashed border-zinc-100 dark:border-white/5 rounded-[4rem] text-[11px] font-black uppercase tracking-[0.8em] text-zinc-400 hover:text-blue-500 hover:border-blue-500/20 hover:bg-blue-500/5 transition-all duration-1000 italic group/add">
                        <span className="opacity-40 group-hover/add:opacity-100 transition-opacity">APPEND_TRANSACTION_PROTOCOL [ + ]</span>
                    </button>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-4 space-y-16">
            {/* Financial Recital & Summary */}
            <div className="glass-card rounded-[5rem] p-12 md:p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden group/summary font-mono">
              <div className="relative z-10 flex flex-col h-full space-y-16">
                  <div className="text-center space-y-4">
                      <h3 className="text-3xl font-black tracking-tighter uppercase premium-text-gradient leading-none italic">Protocol_Yield</h3>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] italic leading-none">Institutional_Settlement_Cycle</p>
                  </div>
                
                  <div className="space-y-8 flex-1">
                    <div className="flex justify-between items-end border-b border-zinc-100 dark:border-white/5 pb-8">
                        <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.6em] italic">Gross_Protocol_Val</span>
                        <span className="text-3xl font-black tracking-tighter italic">₹{subtotal.toFixed(2)}</span>
                    </div>

                    <div className="space-y-4 px-6 py-8 bg-zinc-100 dark:bg-white/5 rounded-[2.5rem] border border-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] italic">Regulatory_GST (%)</span>
                            <div className="relative">
                                <input 
                                type="number" 
                                className="w-20 bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-center font-black py-3 shadow-2xl skew-x-[-10deg] border-none focus:ring-4 ring-blue-500/20" 
                                value={gstRate}
                                onChange={e => setGstRate(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] italic">GST_Accumulation</span>
                            <span className="font-black italic text-zinc-400">₹{gstAmount.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div className="space-y-10">
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.6em] block ml-6 italic">Protocol_Reduction (₹)</label>
                            <input 
                                type="number"
                                className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[3rem] px-10 py-8 text-2xl font-black italic tracking-tighter text-emerald-600 focus:ring-4 ring-emerald-500/10 transition-all placeholder:text-zinc-400/20" 
                                placeholder="0.00"
                                value={manualDiscount}
                                onChange={e => setManualDiscount(parseFloat(e.target.value) || 0)}
                            />
                        </div>

                        {selectedPatientType === 'IP' && (
                            <div className="p-3 bg-zinc-950 dark:bg-zinc-800/50 rounded-[3rem] flex gap-3 shadow-2xl border border-white/5">
                                <button 
                                    type="button"
                                    onClick={() => setBillingType("Daily")}
                                    className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.4em] rounded-[2rem] transition-all duration-700 italic ${billingType === 'Daily' ? 'bg-blue-600 text-white shadow-2xl scale-105' : 'text-zinc-500'}`}
                                >Daily_Cycle</button>
                                <button 
                                    type="button"
                                    onClick={() => setBillingType("One-Time")}
                                    className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.4em] rounded-[2rem] transition-all duration-700 italic ${billingType === 'One-Time' ? 'bg-blue-600 text-white shadow-2xl scale-105' : 'text-zinc-500'}`}
                                >One_Time</button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6 p-4 bg-zinc-100/50 dark:bg-white/5 rounded-[3.5rem] border border-white/5 shadow-xl">
                            {['Cash', 'UPI', 'Card', 'Bank'].map(method => (
                                <button
                                    key={method}
                                    onClick={() => setPaymentMethod(method)}
                                    className={`py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] border-2 transition-all duration-500 italic ${
                                    paymentMethod === method 
                                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] scale-105' 
                                    : 'bg-transparent text-zinc-500 border-zinc-100 dark:border-white/5'
                                    }`}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-12 border-t-4 border-zinc-950 dark:border-white/10 space-y-10 group/terminal">
                        <div className="space-y-4">
                            <label className="text-[11px] font-black uppercase tracking-[0.6em] text-zinc-500 block ml-6 italic">Txn_Auth_Reference (UTR)</label>
                            <input 
                                className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-[2.5rem] px-10 py-8 font-black tracking-tighter text-2xl uppercase italic focus:ring-4 ring-blue-500/10 transition-all placeholder:opacity-20 transition-all" 
                                placeholder="ENTER_AUTH_REF_ID..."
                                value={transactionRef}
                                onChange={(e) => setTransactionRef(e.target.value)}
                            />
                            {!transactionRef && <p className="text-[9px] text-red-500 font-black mt-4 animate-pulse flex items-center justify-center gap-4 italic uppercase tracking-widest bg-red-500/10 py-3 rounded-2xl">⚠️ SYSTEM_BLOCK: REF_ID_NULL</p>}
                        </div>

                        <div className="py-12 bg-zinc-950 dark:bg-white rounded-[4rem] flex flex-col items-center gap-4 shadow-2xl border-white/10 group-hover/terminal:scale-105 transition-transform duration-1000">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.8em] italic leading-none opacity-40">Final_Settlement_Engaged</span>
                            <span className="text-7xl md:text-8xl font-black italic tracking-tighter text-white dark:text-zinc-950 scale-x-95">₹{Math.max(0, total - (insurance.covered_amount || 0)).toFixed(0)}</span>
                        </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {selectedPatientType === 'IP' ? (
                      <>
                        <button 
                          onClick={() => generateInvoice(false)}
                          disabled={submitting}
                          className="w-full py-10 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-[11px] font-black uppercase tracking-[0.8em] rounded-[3rem] shadow-[0_45px_100px_-15px_rgba(0,0,0,0.4)] active:scale-95 hover:scale-[1.02] transition-all duration-1000 italic disabled:opacity-50 relative overflow-hidden group/daily"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/10 to-transparent translate-x-[-100%] group-hover/daily:translate-x-[100%] transition-transform duration-1000"></div>
                          {submitting ? "PROCESSING_CYCLE..." : "ISSUE_DAILY_RECITAL 📑"}
                        </button>
                        <button 
                          onClick={() => generateInvoice(true)}
                          disabled={submitting}
                          className="w-full py-10 border-4 border-blue-600 text-blue-600 text-[11px] font-black uppercase tracking-[0.8em] rounded-[3rem] hover:bg-blue-600 hover:text-white transition-all duration-700 active:scale-95 italic disabled:opacity-50"
                        >
                          {submitting ? "EXECUTING_FINAL..." : "FINAL_DISCHARGE 🏁"}
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => generateInvoice(true)}
                        disabled={submitting}
                        className="w-full py-12 bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-black uppercase tracking-[1em] rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] active:scale-95 hover:scale-[1.01] transition-all duration-1000 italic disabled:opacity-50 relative overflow-hidden group/exec"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/0 via-white/10 to-transparent translate-x-[-100%] group-hover/exec:translate-x-[100%] transition-transform duration-1000"></div>
                        {submitting ? "AUTHORIZING_SETTLEMENT..." : "EXECUTE_INVOICE 💳"}
                      </button>
                    )}
                    <button 
                       onClick={logAdvance}
                       disabled={submitting}
                       className="w-full py-6 text-[10px] font-black uppercase tracking-[0.6em] text-zinc-500 hover:text-blue-500 transition-all border border-transparent hover:border-blue-500/20 rounded-[2rem] italic opacity-40 hover:opacity-100 duration-1000"
                    >
                        [ ENROLL_ADVANCE_SETTLEMENT ]
                    </button>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
