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
        
        // Handle pre-selected orgId from query
        const urlParams = new URLSearchParams(window.location.search)
        const preSelectedOrgId = urlParams.get('orgId')
        if (preSelectedOrgId) {
          setForm(prev => ({ ...prev, organisation_id: preSelectedOrgId }))
        }
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 sm:p-12 transition-colors duration-1000">
      {Toast}
      
      <div className="max-w-3xl w-full animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="mb-16 py-8 relative">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic leading-none premium-text-gradient">Admission_Nexus</h2>
            <div className="flex items-center gap-4">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shadow-lg shadow-blue-600/50"></span>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] font-mono italic">Sector_Status: Onboarding_Cycle_Active</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 hidden md:flex items-center gap-4 px-8 py-4 rounded-[2rem] glass-card border-white/5 shadow-2xl relative overflow-hidden group/status mt-4">
               <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] relative z-10"></span>
               <span className="text-[10px] font-black uppercase tracking-[0.4em] font-mono text-zinc-600 dark:text-zinc-200 relative z-10 italic">Protocol_Sync: Ready</span>
          </div>
        </div>

        <div className="glass-card rounded-[5rem] p-12 md:p-20 relative overflow-hidden group shadow-2xl border border-white/5">
          <div className="absolute top-0 right-0 p-24 opacity-[0.05] grayscale -rotate-12 scale-150 select-none pointer-events-none group-hover:rotate-0 transition-transform duration-1000">👤</div>
          
          {/* Progress Architecture */}
          <div className="flex gap-4 mb-20 relative z-10">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-1000 ${step >= i ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-zinc-100 dark:bg-zinc-800'}`}></div>
            ))}
          </div>

          <form onSubmit={handleRegister} className="relative z-10 space-y-16 font-mono">
            
            {step === 1 && (
              <div className="space-y-12 animate-in slide-in-from-right-12 duration-700">
                <div className="space-y-6">
                  <label className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 block ml-4 italic">Institutional_Selection</label>
                  <div className="relative group/select">
                    <select 
                      className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2.5rem] px-10 py-8 text-[12px] font-black uppercase tracking-[0.4em] focus:ring-4 ring-blue-500/10 transition-all appearance-none cursor-pointer italic pr-20"
                      value={form.organisation_id}
                      onChange={e => setForm({...form, organisation_id: e.target.value})}
                      required
                    >
                      <option value="">-- SELECT_MEDICAL_FACILITY --</option>
                      {orgs.map(o => <option key={o.id} value={o.id}>{o.name.toUpperCase()}</option>)}
                    </select>
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover/select:opacity-100 group-hover/select:text-blue-500 transition-all italic">▼</div>
                  </div>
                </div>
                <div className="space-y-6">
                  <label className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 block ml-4 italic">Medical_Assistance_Vector</label>
                  <div className="relative group/help">
                    <select 
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2.5rem] px-10 py-8 text-[12px] font-black uppercase tracking-[0.4em] focus:ring-4 ring-blue-500/10 transition-all appearance-none cursor-pointer italic pr-20"
                        value={form.medical_help_type}
                        onChange={e => setForm({...form, medical_help_type: e.target.value})}
                    >
                        <option>GENERAL CARE</option>
                        <option>PEDIATRIC CARE</option>
                        <option>NEONATAL CARE</option>
                        <option>DIALYSIS</option>
                        <option>HOMECARE GIVER</option>
                    </select>
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover/help:opacity-100 group-hover/help:text-blue-500 transition-all italic">▼</div>
                  </div>
                </div>
                <button type="button" onClick={nextStep} className="w-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 py-10 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.8em] shadow-[0_45px_100px_-15px_rgba(0,0,0,0.4)] active:scale-95 hover:scale-[1.01] transition-all duration-700 italic flex items-center justify-center gap-6 group/btn">
                    INITIATE_ONBOARDING_CYCLE
                    <span className="group-hover:translate-x-2 transition-transform duration-500">→</span>
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-12 animate-in slide-in-from-right-12 duration-700">
                <div className="space-y-6">
                  <label className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 block ml-4 italic">Preferred_Healthcare_Node</label>
                  <div className="relative group/doc">
                    <select 
                      className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2.5rem] px-10 py-8 text-[12px] font-black uppercase tracking-[0.4em] focus:ring-4 ring-blue-500/10 transition-all appearance-none cursor-pointer italic pr-20"
                      value={form.assigned_doctor_id}
                      onChange={e => setForm({...form, assigned_doctor_id: e.target.value})}
                    >
                      <option value="">-- SELECT_PHYSICIAN_NODE --</option>
                      {doctors.map(d => <option key={d.id} value={d.user_id}>DR. { (d.doctor_name || d.name).toUpperCase() } ({d.specialization.toUpperCase()})</option>)}
                    </select>
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover/doc:opacity-100 group-hover/doc:text-blue-500 transition-all italic">▼</div>
                  </div>
                </div>
                <div className="p-12 bg-zinc-950 dark:bg-white rounded-[3rem] text-white dark:text-zinc-900 shadow-2xl relative overflow-hidden group/fee">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/5 to-transparent translate-x-[-100%] group-hover/fee:translate-x-[100%] transition-transform duration-1000"></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-500 mb-4 italic">Institutional_Subscription_Fee</p>
                  <div className="flex justify-between items-baseline relative z-10">
                    <span className="text-sm font-black italic opacity-60 tracking-widest">PLATFORM_ACCESS_PROTOCOL (ANNUAL)</span>
                    <span className="text-5xl font-black italic tracking-tighter premium-text-gradient">₹999</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-8">
                  <button type="button" onClick={prevStep} className="flex-1 py-8 border-2 border-zinc-100 dark:border-white/5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] italic hover:bg-zinc-100 dark:hover:bg-white/5 transition-all">REVERT_PHASE</button>
                  <button type="button" onClick={nextStep} className="flex-[2] bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 py-8 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-xl active:scale-95 transition-all italic group/btn">
                    PROCEED_TO_IDENTITY_DEFINITION
                    <span className="ml-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-2 transition-all">→</span>
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-10 animate-in slide-in-from-right-12 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-center">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.6em] italic">Full_Identity_Name</label>
                    <input className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] px-8 py-6 text-lg font-black italic tracking-tight focus:ring-4 ring-blue-500/10 transition-all uppercase placeholder:opacity-20" placeholder="LEGAL_NAME" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.6em] italic">Communication_Link</label>
                    <input type="email" className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] px-8 py-6 text-lg font-black italic tracking-tight focus:ring-4 ring-blue-500/10 transition-all placeholder:opacity-20" placeholder="EMAIL_ADDRESS" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-center">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.6em] italic">Telemetry_Phone</label>
                    <input className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] px-8 py-6 text-lg font-black italic tracking-tight focus:ring-4 ring-blue-500/10 transition-all placeholder:opacity-20" placeholder="MOBILE_NETWORK_ID" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.6em] italic">Access_Key_Gen</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] px-8 py-6 text-lg font-black italic tracking-tight focus:ring-4 ring-blue-500/10 transition-all" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-center">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.6em] italic">Unit_Age</label>
                    <input type="number" className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] px-8 py-6 text-lg font-black italic tracking-tight focus:ring-4 ring-blue-500/10 transition-all" value={form.age} onChange={e => setForm({...form, age: e.target.value})} required />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.6em] italic">Biological_Class</label>
                    <select className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] px-8 py-6 text-[12px] font-black uppercase tracking-[0.4em] focus:ring-4 ring-blue-500/10 transition-all italic appearance-none cursor-pointer" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                      <option value="MALE">MALE_SPECIMEN</option>
                      <option value="FEMALE">FEMALE_SPECIMEN</option>
                      <option value="OTHER">NON_BINARY_SPECIMEN</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-4 text-center">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.6em] italic block">Universal_Health_ID (ABHA)</label>
                  <input className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2.5rem] px-8 py-8 text-xl font-black italic tracking-widest text-center focus:ring-4 ring-emerald-500/10 transition-all placeholder:opacity-20" placeholder="1234-5678-9012-34" value={form.abha_id} onChange={e => setForm({...form, abha_id: e.target.value})} />
                </div>
                
                <div className="pt-12 border-t border-zinc-100 dark:border-white/5 flex flex-col sm:flex-row gap-8">
                  <button type="button" onClick={prevStep} className="flex-1 py-8 border-2 border-zinc-100 dark:border-white/5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] italic hover:bg-zinc-100 dark:hover:bg-white/5 transition-all">REVERT_PHASE</button>
                  <button type="submit" disabled={loading} className="flex-[2] bg-blue-600 text-white dark:text-zinc-950 dark:bg-white py-8 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.8em] shadow-[0_45px_100px_-15px_rgba(37,99,235,0.4)] active:scale-95 transition-all italic relative overflow-hidden group/final">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700/0 via-white/10 to-transparent translate-x-[-100%] group-hover/final:translate-x-[100%] transition-transform duration-1000"></div>
                    {loading ? "SYNCHRONIZING..." : "FINALIZE_ADMISSION 💳"}
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
        
        <p className="mt-12 text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.6em] italic">
            IDENTITY_EXISTS? <Link href={form.organisation_id ? `/${form.organisation_id}?login=true` : "/?login=true"} className="text-blue-600 hover:tracking-[0.8em] transition-all duration-700">ENGAGE_LOGIN_PROTOCOL</Link>
        </p>
      </div>
    </div>
  )
}
