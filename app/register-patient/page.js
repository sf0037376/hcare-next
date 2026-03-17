"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPatient() {
  const { Toast, show } = useToast()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [orgs, setOrgs] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    age: "",
    gender: "MALE",
    organisation_id: "",
    medical_help_type: "General Care",
    assigned_doctor_id: "",
    abha_id: ""
  })

  useEffect(() => {
    async function init() {
      try {
        const orgData = await apiFetch("/auth/orgs")
        setOrgs(orgData)
        const docData = await apiFetch("/auth/doctors")
        setDoctors(docData)
      } catch (err) {
        show("Failed to load registration metadata")
      }
    }
    init()
  }, [show])

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await apiFetch("/patients/register", {
        method: "POST",
        body: JSON.stringify(form)
      })
      show("Registration successful! Please login.")
      setTimeout(() => router.push("/login"), 2000)
    } catch (err) {
      show(err.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => setStep(s => s + 1)
  const prevStep = () => setStep(s => s - 1)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 sm:p-12">
      {Toast}
      
      <div className="max-w-xl w-full">
        <div className="mb-12 text-center">
            <h1 className="text-5xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic">Join NEOCARE</h1>
            <p className="text-zinc-500 mt-2 font-bold uppercase tracking-widest text-xs">Standalone Patient Enrollment System</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          
          {/* Progress Bar */}
          <div className="flex gap-2 mb-12">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-blue-600' : 'bg-zinc-100 dark:bg-zinc-800'}`}></div>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-10">
            
            {step === 1 && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Select Medical Facility</label>
                  <select 
                    className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border border-zinc-100 dark:border-zinc-800 font-bold"
                    value={form.organisation_id}
                    onChange={e => setForm({...form, organisation_id: e.target.value})}
                    required
                  >
                    <option value="">-- Choose Hospital/Clinic --</option>
                    {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Type of Medical Help</label>
                  <select 
                    className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border border-zinc-100 dark:border-zinc-800 font-bold"
                    value={form.medical_help_type}
                    onChange={e => setForm({...form, medical_help_type: e.target.value})}
                  >
                    <option>General Care</option>
                    <option>Pediatric Care</option>
                    <option>Neonatal Care</option>
                    <option>Dialysis</option>
                    <option>Homecare Giver</option>
                  </select>
                </div>
                <button type="button" onClick={nextStep} className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Continue →</button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Preferred Healthcare Provider</label>
                  <select 
                    className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border border-zinc-100 dark:border-zinc-800 font-bold"
                    value={form.assigned_doctor_id}
                    onChange={e => setForm({...form, assigned_doctor_id: e.target.value})}
                  >
                    <option value="">-- Select Doctor/Nurse --</option>
                    {doctors.map(d => <option key={d.id} value={d.user_id}>Dr. {d.doctor_name || d.name} ({d.specialization})</option>)}
                  </select>
                </div>
                <div className="p-6 bg-zinc-900 rounded-3xl text-white">
                  <p className="text-[10px] font-black uppercase text-zinc-500 mb-2">Registration Fee</p>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold opacity-60 italic">Platform Subscription (Annual)</span>
                    <span className="text-3xl font-black">₹999</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={prevStep} className="flex-1 py-5 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl font-black uppercase text-xs tracking-widest">Back</button>
                  <button type="button" onClick={nextStep} className="flex-[2] py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Proceed to Details</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-100 dark:border-zinc-800 font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input type="email" className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-100 dark:border-zinc-800 font-bold" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-100 dark:border-zinc-800 font-bold" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Create Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-100 dark:border-zinc-800 font-bold" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Age</label>
                    <input type="number" className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-100 dark:border-zinc-800 font-bold" value={form.age} onChange={e => setForm({...form, age: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Gender</label>
                    <select className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-100 dark:border-zinc-800 font-bold" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">ABHA ID (Optional)</label>
                  <input className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-100 dark:border-zinc-800 font-bold" placeholder="1234-5678-9012-34" value={form.abha_id} onChange={e => setForm({...form, abha_id: e.target.value})} />
                </div>
                
                <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex gap-4">
                  <button type="button" onClick={prevStep} className="flex-1 py-5 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl font-black uppercase text-xs tracking-widest">Back</button>
                  <button type="submit" disabled={loading} className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                    {loading ? "Processing..." : "Pay ₹999 & Register"}
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
        
        <p className="mt-8 text-center text-xs font-bold text-zinc-500 uppercase tracking-widest">
            Already have an account? <Link href="/?login=true" className="text-blue-600 underline">Sign In instead</Link>
        </p>
      </div>
    </div>
  )
}
