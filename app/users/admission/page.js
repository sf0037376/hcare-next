"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "../../../lib/api"
import useToast from "../../../components/toast"
import ProtectedRoute from "../../../components/ProtectedRoute"
import Link from "next/link"

export default function PatientAdmission() {
  const { Toast, show } = useToast()
  const router = useRouter()
  
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Other",
    contact_number: "",
    address: "",
    admission_date: new Date().toISOString().slice(0, 16),
    condition_description: "",
    organization_id: "", 
    initial_payment_amount: "",
    payment_method: "Cash",
    assigned_doctor_id: "",
    assigned_nurse_id: "",
    abha_id: "",
    abha_address: "",
    aadhaar: "",
    email: "",
    create_login: false,
    patient_type: "OP",
    assigned_ward_id: "",
    assigned_bed_id: ""
  })

  const [doctors, setDoctors] = useState([])
  const [nurses, setNurses] = useState([])
  const [wards, setWards] = useState([])
  const [beds, setBeds] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadStaff() {
      try {
        const users = await apiFetch("/users")
        setDoctors(users.filter(u => u.role.toLowerCase() === "doctor"))
        setNurses(users.filter(u => u.role.toLowerCase() === "nurse"))
        
        const wardsData = await apiFetch("/wards")
        setWards(wardsData)
      } catch (err) {
        console.error("Failed to load setup data", err)
      }
    }
    loadStaff()
  }, [])

  useEffect(() => {
    if (form.assigned_ward_id) {
      async function loadBeds() {
        try {
          const data = await apiFetch(`/wards/${form.assigned_ward_id}/beds`)
          setBeds(data.filter(b => b.status === "AVAILABLE"))
        } catch (err) { console.error(err) }
      }
      loadBeds()
    } else {
      setBeds([])
    }
  }, [form.assigned_ward_id])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      // 1. Create Patient
      const patient = await apiFetch("/patients", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          age: parseInt(form.age),
          gender: form.gender,
          contact_number: form.contact_number,
          address: form.address,
          admission_date: form.admission_date,
          condition_description: form.condition_description,
          organization_id: form.organization_id || 1,
          assigned_doctor_id: form.assigned_doctor_id,
          assigned_nurse_id: form.assigned_nurse_id,
          abha_id: form.abha_id,
          abha_address: form.abha_address,
          aadhaar: form.aadhaar,
          email: form.email,
          create_login: form.create_login,
          patient_type: form.patient_type,
          assigned_ward_id: form.patient_type === 'IP' ? form.assigned_ward_id : null,
          assigned_bed_id: form.patient_type === 'IP' ? form.assigned_bed_id : null
        })
      })

      // 2. Create Initial Billing/Payment Entry (Mocking for now until billing schema is ready)
      if (form.initial_payment_amount) {
        show(`Patient admitted and payment of ${form.initial_payment_amount} recorded`)
      } else {
        show("Patient admitted successfully")
      }

      setTimeout(() => router.push("/patients"), 2000)
    } catch (err) {
      show(err.message || "Failed to admit patient")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProtectedRoute roles={["admin"]}>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto pb-20">
        {Toast}
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Patient Admission</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Register a new patient and set up initial billing.</p>
          </div>
          <Link href="/dashboard" className="btn-secondary text-sm">Cancel</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm">1</span>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Enter patient's full name"
                  required
                />
              </div>
              <div>
                <label className="form-label">Age (Days/Months/Years)</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.age}
                  onChange={e => setForm({...form, age: e.target.value})}
                  placeholder="e.g. 5"
                  required
                />
              </div>
              <div>
                <label className="form-label">Gender</label>
                <select 
                  className="form-input"
                  value={form.gender}
                  onChange={e => setForm({...form, gender: e.target.value})}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="form-label">Phone Number</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={form.contact_number}
                  onChange={e => setForm({...form, contact_number: e.target.value})}
                />
              </div>
              <div>
                <label className="form-label text-blue-600">ABHA ID (Optional - 14 digits)</label>
                <input 
                  type="text" 
                  className="form-input border-blue-200"
                  placeholder="1234-5678-9012-34"
                  value={form.abha_id}
                  onChange={e => setForm({...form, abha_id: e.target.value})}
                />
              </div>
              <div>
                <label className="form-label text-blue-600">ABHA Address</label>
                <input 
                  type="text" 
                  className="form-input border-blue-200"
                  placeholder="user@abdm"
                  value={form.abha_address}
                  onChange={e => setForm({...form, abha_address: e.target.value})}
                />
              </div>
              <div>
                <label className="form-label">Aadhaar No. (12 Digits) <span className="text-red-500">*</span></label>
                <input 
                  className="form-input" 
                  placeholder="Enter 12 digit Aadhaar"
                  value={form.aadhaar}
                  onChange={e => setForm({...form, aadhaar: e.target.value.replace(/\D/g, '').slice(0, 12)})}
                  minLength={12}
                  maxLength={12}
                  required
                />
              </div>
              <div>
                <label className="form-label">Address</label>
                <input
                  className="form-input"
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  placeholder="Full address"
                />
              </div>
            </div>
          </div>

          {/* Patient Type & Facility */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-sm">2</span>
              Patient Type & Facility
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="form-label">Admission Type</label>
                <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-fit">
                  <button 
                    type="button" 
                    onClick={() => setForm({...form, patient_type: "OP"})}
                    className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${form.patient_type === "OP" ? "bg-white dark:bg-zinc-900 shadow-sm text-blue-600" : "text-zinc-500"}`}
                  >
                    Out-Patient (OP)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setForm({...form, patient_type: "IP"})}
                    className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${form.patient_type === "IP" ? "bg-white dark:bg-zinc-900 shadow-sm text-blue-600" : "text-zinc-500"}`}
                  >
                    In-Patient (IP)
                  </button>
                </div>
              </div>

              {form.patient_type === "IP" && (
                <>
                  <div>
                    <label className="form-label">Select Ward</label>
                    <select 
                      className="form-input"
                      value={form.assigned_ward_id}
                      onChange={e => setForm({...form, assigned_ward_id: e.target.value, assigned_bed_id: ""})}
                      required
                    >
                      <option value="">-- Choose Ward --</option>
                      {wards.map(w => (
                        <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Select Bed</label>
                    <select 
                      className="form-input"
                      value={form.assigned_bed_id}
                      onChange={e => setForm({...form, assigned_bed_id: e.target.value})}
                      required
                    >
                      <option value="">-- Choose Bed --</option>
                      {beds.map(b => (
                        <option key={b.id} value={b.id}>{b.bed_number} (₹{b.daily_charge}/day)</option>
                      ))}
                    </select>
                    {beds.length === 0 && form.assigned_ward_id && <p className="text-[10px] text-red-500 mt-1">No available beds in this ward.</p>}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Admission Details */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm">3</span>
              Clinical Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Admission Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={form.admission_date}
                  onChange={e => setForm({...form, admission_date: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="form-label">Assigned Doctor</label>
                <select 
                  className="form-input"
                  value={form.assigned_doctor_id}
                  onChange={e => setForm({...form, assigned_doctor_id: e.target.value})}
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Assigned Nurse</label>
                <select 
                  className="form-input"
                  value={form.assigned_nurse_id}
                  onChange={e => setForm({...form, assigned_nurse_id: e.target.value})}
                >
                  <option value="">Select Nurse</option>
                  {nurses.map(n => (
                    <option key={n.id} value={n.id}>{n.username}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="form-label">Condition Summary</label>
                <textarea
                  className="form-input min-h-[100px]"
                  value={form.condition_description}
                  onChange={e => setForm({...form, condition_description: e.target.value})}
                  placeholder="Reason for admission and initial assessment..."
                />
              </div>
            </div>
          </div>

          {/* Billing & Payment */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm border-l-4 border-l-emerald-500">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm">4</span>
              Initial Billing & Payment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Initial Payment Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                  <input
                    type="number"
                    className="form-input pl-8"
                    value={form.initial_payment_amount}
                    onChange={e => setForm({...form, initial_payment_amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Payment Method</label>
                <select 
                  className="form-input"
                  value={form.payment_method}
                  onChange={e => setForm({...form, payment_method: e.target.value})}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / Digital</option>
                  <option value="Card">Card</option>
                  <option value="Insurance">Insurance</option>
                </select>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg text-sm">🔑</span>
                Digital Access
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Patient Email (Required for login)</label>
                  <input 
                    type="email" 
                    className="form-input"
                    placeholder="patient@example.com"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                  />
                </div>
                <div className="flex items-center gap-3 pt-8">
                  <input 
                    type="checkbox"
                    className="w-5 h-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    checked={form.create_login}
                    onChange={e => setForm({...form, create_login: e.target.checked})}
                  />
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Create Patient User Account
                  </label>
                </div>
              </div>
              {form.create_login && (
                <p className="text-xs text-zinc-500 mt-2 italic">
                  * A login will be created with username as email and default password 'patient123'.
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={submitting} className="flex-1 btn-primary py-4 text-lg shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {submitting ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Complete Admission"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  )
}
