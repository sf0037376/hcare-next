"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Cookies from "js-cookie"
import { apiFetch } from "@/lib/api"
import useToast from "@/components/toast"

export default function LandingPage() {
  const router = useRouter()
  const { Toast, show } = useToast()
  
  // Intelligence State
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  
  // Institutional Branding State
  const [orgBranding, setOrgBranding] = useState(null)
  const [brandingLoading, setBrandingLoading] = useState(true)
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('login') === 'true') {
      setShowLogin(true)
    }

    // Domain-based Institutional Detection
    async function checkDomainBranding() {
      const hostname = window.location.hostname
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        setBrandingLoading(false)
        return
      }
      
      try {
        const data = await apiFetch(`/auth/orgs/by-domain?domain=${hostname}`)
        if (data && data.id) {
          setOrgBranding(data)
        }
      } catch (err) {
        console.log("No institutional branding for this node.")
      } finally {
        setBrandingLoading(false)
      }
    }
    checkDomainBranding()
  }, [])

  async function handleLogin(e) {
    if (e) e.preventDefault()
    if (!username || !password) {
      show("Enter identity credentials")
      return
    }

    setLoading(true)
    try {
      const data = await apiFetch(`/auth/login`, {
        method: "POST",
        body: JSON.stringify({ username, password }),
      })

      if (!data?.token) throw new Error("Invalid institutional response")

      Cookies.set("token", data.token, { expires: 7, path: "/" })
      localStorage.setItem("token", data.token)
      localStorage.setItem("role", data.role || "")
      localStorage.setItem("username", data.username || data.name || username)
      localStorage.setItem("userId", String(data.user_id))
      localStorage.setItem("orgId", String(data.organisation_id))
      localStorage.setItem("hospital_alarms_enabled", data.alarms_enabled ? "true" : "false")
      if (data.patient_id) localStorage.setItem("patientId", String(data.patient_id))

      const userRole = (data.role || "").toLowerCase()
      if (userRole === "doctor") window.location.href = "/doctor-dashboard"
      else if (["nurse", "staff", "attender"].includes(userRole)) window.location.href = "/staff-dashboard"
      else window.location.href = "/dashboard"
    } catch (err) {
      show(err.message || "Authentication failure")
    } finally {
      setLoading(false)
    }
  }

  // JSON-LD Structured Data for Worldwide SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    "name": "NEOCARE",
    "url": "https://neocare.hospital",
    "logo": "https://neocare.hospital/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-80-NEOCARE",
      "contactType": "customer service",
      "areaServed": "Worldwide",
      "availableLanguage": ["en", "hi"]
    },
    "description": "Premium remote clinical intelligence and hospital management system specialized in Neonatal, Pediatric, Dialysis, and General Home Care."
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 selection:bg-blue-600 selection:text-white overflow-x-hidden font-sans antialiased text-zinc-900 dark:text-zinc-100 transition-colors duration-700">
      {Toast}

      {/* SEO & Institutional Meta Architecture */}
      <title>NEOCARE | Premium Remote Clinical Intelligence & Home Care Ecosystem</title>
      <meta name="description" content="NEOCARE: The ultimate platform for remote healthcare. Monitor vitals, feeds, and medications from anywhere. Specialized for Neonatal, Pediatric, Dialysis and General Home Care." />
      <meta property="og:title" content="NEOCARE | Expert Care, Closer than ever." />
      <meta property="og:description" content="World-class patient monitoring and clinical analytics platform." />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {brandingLoading ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950">
          <div className="w-16 h-16 border-4 border-zinc-200 dark:border-zinc-800 border-t-blue-600 rounded-full animate-spin mb-8"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 animate-pulse">Initializing_Clinical_Core...</p>
        </div>
      ) : orgBranding ? (
        <BrandedView org={orgBranding} showLogin={showLogin} setShowLogin={setShowLogin} handleLogin={handleLogin} loginLoading={loading} username={username} setUsername={setUsername} password={password} setPassword={setPassword} Toast={Toast} />
      ) : (
        <>
          {/* Tactical Navigation Architecture */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 md:px-16 transition-all duration-500">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/70 dark:bg-zinc-900/70 backdrop-blur-3xl border border-white/20 dark:border-zinc-800/50 px-10 py-5 rounded-[2.5rem] shadow-2xl shadow-zinc-900/[0.03]">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">🏥</span>
            <span className="text-2xl font-black tracking-tighter uppercase italic dark:text-white">NEOCARE<span className="text-blue-600">.</span></span>
          </div>
          <div className="hidden lg:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
            <a href="#specialties" className="hover:text-blue-600 transition-all hover:tracking-[0.4em]">Specialties</a>
            <a href="#monitoring" className="hover:text-blue-600 transition-all hover:tracking-[0.4em]">Telemetry</a>
            <a href="#experience" className="hover:text-blue-600 transition-all hover:tracking-[0.4em]">Intelligence</a>
            <Link href="/contact" className="hover:text-blue-600 transition-all hover:tracking-[0.4em]">Support</Link>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowLogin(true)}
              className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all hover:scale-105"
            >
              Sign_In
            </button>
          </div>
        </div>
      </nav>

      {/* Immersive Hero Deployment */}
      <section className="pt-60 pb-40 px-8 md:px-16 relative overflow-hidden bg-white dark:bg-zinc-950 transition-colors duration-700">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <div className="relative z-10 animate-in fade-in slide-in-from-left-12 duration-1000">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-blue-500/5 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full mb-10 border border-blue-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Trusted Health Network</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-zinc-900 dark:text-white leading-[1.1] tracking-tighter mb-12 italic animate-in slide-in-from-bottom-8 duration-700">
              Better Care, <br />
              <span className="premium-text-gradient">Together.</span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 font-bold mb-16 leading-relaxed max-w-xl tracking-tight">
              Bridging the gap between expert clinical care and remote family peace of mind. Your child's health, monitored seamlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-8">
              <Link href="/register-patient" className="px-12 py-6 bg-blue-600 text-white rounded-[2.5rem] font-bold text-sm shadow-2xl shadow-blue-600/30 hover:scale-[1.05] active:scale-95 transition-all text-center">
                Sign Up
              </Link>
              <Link href="/contact" className="px-12 py-6 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-[2.5rem] font-bold text-sm tracking-wide hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-center border border-zinc-200 dark:border-zinc-700/50">
                Learn More
              </Link>
            </div>
            
            <div className="mt-20 flex items-center gap-10">
                <div>
                    <p className="text-4xl font-black italic text-zinc-900 dark:text-white tracking-tighter leading-none mb-1">2.4k+</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-none">Global_Units</p>
                </div>
                <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800"></div>
                <div>
                    <p className="text-4xl font-black italic text-zinc-900 dark:text-white tracking-tighter leading-none mb-1">0.12ms</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-none">Data_Latency</p>
                </div>
            </div>
          </div>
          
          <div className="relative animate-in fade-in zoom-in duration-1000 delay-300">
            <div className="aspect-square bg-blue-600 rounded-full blur-[150px] absolute -inset-20 opacity-10 animate-pulse"></div>
            <div className="glass-card rounded-[5rem] p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-white/10 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-16">
                    <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500 text-white flex items-center justify-center text-4xl shadow-2xl shadow-emerald-500/20 group-hover:rotate-6 transition-transform">❤️</div>
                    <div>
                        <p className="text-[11px] font-black uppercase text-zinc-400 tracking-[0.3em] mb-1">Live Health Updates</p>
                        <p className="text-5xl font-black dark:text-white font-mono tracking-tighter italic">98.4<span className="text-xl text-zinc-500 ml-1">% SpO2</span></p>
                    </div>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50"></div>
                </div>

                <div className="space-y-10">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Nutritional_Flow</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Active</span>
                        </div>
                        <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-1 border border-zinc-200 dark:border-zinc-700/50">
                            <div className="w-3/4 h-full bg-blue-600 rounded-full shadow-lg shadow-blue-500/20"></div>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Target: 160ml</p>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Logged: 120ml</p>
                        </div>
                    </div>

                    <div className="h-56 bg-zinc-50 dark:bg-zinc-950/50 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden group/chart">
                        <div className="relative z-10 flex flex-col items-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-6">Patient_Trend_Vector</p>
                            <div className="flex gap-4 items-end h-28">
                                {[40, 70, 45, 90, 60, 80, 50, 95, 65, 85].map((h, i) => (
                                    <div key={i} className="w-4 bg-blue-600/30 rounded-t-xl transition-all hover:bg-blue-600 group-hover/chart:h-[110%] duration-1000" style={{ height: `${h}%`, transitionDelay: `${i * 50}ms` }}></div>
                                ))}
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover/chart:opacity-100 transition-opacity"></div>
                    </div>
                </div>
              </div>
              
              <div className="absolute top-24 -right-12 bg-white dark:bg-zinc-800 px-8 py-5 rounded-[2.5rem] shadow-2xl border border-zinc-100 dark:border-zinc-700 animate-bounce cursor-pointer group/toast active:scale-95 transition-all">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xs shadow-lg group-hover/toast:rotate-12 transition-transform">✨</div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-900 dark:text-zinc-100 italic">AI_Oversight_Enabled</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-20 -left-20 text-[25rem] opacity-[0.03] grayscale -rotate-12 select-none pointer-events-none transition-transform duration-1000 group-hover:rotate-0">🏥</div>
          </div>
        </div>
      </section>

      {/* Specialty Operational Grid */}
      <section id="specialties" className="py-60 px-8 md:px-16 bg-zinc-50 dark:bg-zinc-900 transition-colors duration-700 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-32">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em] mb-6 block">Our Services</span>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-10 dark:text-white leading-[1.1]">Quality Care <br /><span className="text-blue-600 underline decoration-zinc-900/5 dark:decoration-white/5 underline-offset-10">for all.</span></h2>
            <p className="text-zinc-500 dark:text-zinc-400 font-bold text-xl max-w-3xl mx-auto leading-relaxed italic tracking-tight">Providing expert medical monitoring tailored specifically for pediatric and general home care needs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { title: "Newborn Care", desc: "Expert oversight and attention for the most fragile infants.", icon: "👶", color: "blue" },
              { title: "Pediatric Care", desc: "Dedicated health logs for child-focused recovery and growth.", icon: "🧒", color: "purple" },
              { title: "Kidney Care", desc: "Precision monitoring for at-home dialysis patients.", icon: "🩸", color: "red" },
              { title: "Home Care", desc: "Hospital-grade monitoring within the comfort of your home.", icon: "🏠", color: "emerald" }
            ].map((s, i) => (
              <div key={i} className="glass-card p-14 rounded-[4rem] group hover:scale-[1.05] transition-all duration-700 border-white/5 shadow-2xl shadow-zinc-900/[0.02] bg-white dark:bg-zinc-800/40">
                <div className="text-7xl mb-12 group-hover:scale-125 transition-transform group-hover:rotate-6 duration-700">{s.icon}</div>
                <h3 className="text-2xl font-black mb-6 uppercase tracking-tighter dark:text-white italic leading-none">{s.title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm leading-relaxed tracking-tight">{s.desc}</p>
                <div className={`mt-10 h-1.5 w-16 bg-${s.color}-600 rounded-full shadow-lg shadow-${s.color}-500/20 transition-all group-hover:w-full duration-700`}></div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-1/2 left-0 w-full h-px bg-zinc-200 dark:bg-zinc-800 opacity-20"></div>
      </section>

      {/* Remote Intelligence Section */}
      <section id="monitoring" className="py-60 px-8 md:px-16 bg-white dark:bg-zinc-950 overflow-hidden relative transition-colors duration-700">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-32 items-center">
           <div className="flex-1 order-2 lg:order-1 relative">
                <div className="absolute -inset-40 bg-blue-600/5 rounded-full blur-[150px] animate-pulse"></div>
                <div className="relative grid grid-cols-2 gap-8">
                {[
                    { icon: "🌡️", title: "Live_Biometrics", desc: "Continuous synced HR, SpO2, and BP telemetry.", delay: 0 },
                    { icon: "🍼", title: "Nutritional_Log", desc: "Automated verification for feed protocols.", delay: 200 },
                    { icon: "🔔", title: "Tactical_Alerts", desc: "Institutional-grade alarms for clinical rigor.", delay: 400 },
                    { icon: "📱", title: "Family_Nexus", desc: "Encrypted real-time situational snapshots.", delay: 600 }
                ].map((m, i) => (
                    <div key={i} className={`glass-card p-12 rounded-[3.5rem] border-white/5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all duration-700 group hover:scale-105 ${i % 2 === 1 ? 'mt-16' : ''}`}>
                    <p className="text-5xl mb-8 group-hover:scale-125 transition-transform duration-700">{m.icon}</p>
                    <h4 className="font-black uppercase text-xs tracking-[0.3em] mb-4 dark:text-white italic">{m.title}</h4>
                    <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed uppercase tracking-widest">{m.desc}</p>
                    </div>
                ))}
                </div>
           </div>
           <div className="flex-1 order-1 lg:order-2">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.5em] mb-8 block font-mono">Connected Health Network</span>
              <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-[1] italic mb-12 dark:text-white">Every Vital. <br /><span className="text-blue-600">Monitored.</span></h2>
              <p className="text-xl text-zinc-500 dark:text-zinc-400 font-bold mb-16 leading-relaxed tracking-tight italic">Distance is no longer a barrier. Our 24/7 care team ensures your loved ones are monitored safely, effectively, and with compassion.</p>
              <div className="flex gap-16">
                 <div>
                    <p className="text-7xl font-black text-blue-600 italic tracking-tighter">0.12<span className="text-xl">ms</span></p>
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.4em] mt-4">Node_Latencey</p>
                 </div>
                 <div className="w-px h-24 bg-zinc-200 dark:bg-zinc-800"></div>
                 <div>
                    <p className="text-7xl font-black text-blue-600 italic tracking-tighter">100<span className="text-xl">%</span></p>
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.4em] mt-4">Security_Audit</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Intelligence Dashboard Experience */}
      <section id="experience" className="py-60 px-8 md:px-16 bg-zinc-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/10 blur-[200px] rounded-full translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-40 items-center relative z-10">
           <div className="flex-1">
              <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[1] italic mb-16">Your Health <br /><span className="premium-text-gradient">Dashboard.</span></h2>
              <div className="space-y-16 mt-20">
                 {[
                   { title: "Smart Health Insights", desc: "Clear, understandable reports to help track your child's recovery.", icon: "🧪" },
                   { title: "Easy Appointments", desc: "Connect with dedicated pediatric specialists in seconds.", icon: "📅" },
                   { title: "Unified Health Records", desc: "All your medical records in one secure, accessible place.", icon: "📝" }
                 ].map((feat, i) => (
                    <div key={i} className="flex gap-10 group cursor-default">
                       <span className="text-5xl opacity-30 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700 transform hover:rotate-6">{feat.icon}</span>
                       <div>
                          <h4 className="text-2xl font-black uppercase tracking-tighter mb-4 italic group-hover:text-blue-500 transition-colors">{feat.title}</h4>
                          <p className="text-lg font-bold opacity-40 leading-relaxed tracking-tight group-hover:opacity-100 transition-opacity duration-700">{feat.desc}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
           <div className="flex-1 relative w-full lg:w-auto">
              <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-[250px] animate-pulse"></div>
              <div className="relative p-2 bg-white/5 border border-white/10 rounded-[5rem] backdrop-blur-3xl shadow-[0_100px_150px_-50px_rgba(0,0,0,0.5)]">
                 <div className="bg-zinc-900 rounded-[4.5rem] overflow-hidden p-16 border border-white/5">
                    <div className="flex items-center justify-between mb-16">
                        <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.4em] italic">Patient Dashboard</p>
                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        </div>
                    </div>
                    <div className="space-y-10">
                       <div className="h-28 bg-white/5 rounded-[2.5rem] border border-white/5 flex items-center px-10 justify-between group/item hover:bg-white/10 transition-all cursor-pointer">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">Upcoming Appointment</p>
                            <p className="text-xl font-black italic tracking-tighter">Consultation: Dr. Varma</p>
                          </div>
                          <span className="px-5 py-2.5 bg-blue-600 rounded-2xl text-[10px] font-black tracking-widest shadow-xl shadow-blue-600/30">14:00 PM</span>
                       </div>
                       <div className="bg-white/5 rounded-[3.5rem] p-10 border border-white/5 group/item hover:bg-white/10 transition-all cursor-pointer">
                          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-6">Medication Reminder</p>
                          <div className="flex justify-between items-center">
                             <div className="flex flex-col">
                                <p className="text-3xl font-black italic tracking-tighter leading-none mb-1">Curosurf 120mg</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Intratracheal Instillation</p>
                             </div>
                             <button className="w-16 h-16 rounded-[2rem] bg-emerald-500 flex items-center justify-center text-xl shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all">✓</button>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Security Gateway Overlay */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 md:p-12 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-white/20 dark:bg-zinc-950/40 backdrop-blur-3xl" onClick={() => setShowLogin(false)}></div>
          <div className="relative w-full max-w-lg glass-card rounded-[4rem] p-16 shadow-[0_80px_150px_-30px_rgba(0,0,0,0.3)] border-white/10 animate-in zoom-in-95 duration-500 md:rotate-1 hover:rotate-0 transition-all">
            <button 
              onClick={() => setShowLogin(false)}
              className="absolute top-12 right-12 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all transform hover:rotate-90 text-4xl leading-none"
              aria-label="Terminate Gateway"
            >
              &times;
            </button>
            <div className="text-center mb-16">
                <div className="text-5xl mb-8">🛡️</div>
                <h2 className="text-4xl font-black uppercase tracking-tighter italic dark:text-white mb-2">GateKeeper_V3</h2>
                <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.5em] italic">Accessing NEOCARE Clinical Node</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 ml-4 italic">User_Identity</label>
                <div className="relative group">
                    <input 
                    className="w-full px-10 py-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-700/50 font-black text-lg focus:bg-white dark:focus:bg-zinc-800 transition-all outline-none group-focus-within:border-blue-600/50"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter identity..."
                    required
                    />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-zinc-300">📧</div>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 ml-4 italic">Security_Key</label>
                <div className="relative group">
                    <input 
                    type="password"
                    className="w-full px-10 py-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-700/50 font-black text-lg focus:bg-white dark:focus:bg-zinc-800 transition-all outline-none group-focus-within:border-blue-600/50"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-zinc-300">🔑</div>
                </div>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-8 bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl active:scale-[0.98] transition-all text-center hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? "Decrypting_Core..." : "Authorize_Entry →"}
              </button>
            </form>
            <p className="mt-12 text-center text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] leading-relaxed italic">
              Unlisted Unit? <Link href="/register-patient" className="text-blue-600 underline underline-offset-4 decoration-2">Provision_Access</Link>
            </p>
          </div>
        </div>
      )}

      {/* Tactical Footer Architecture */}
      <footer className="py-40 px-8 md:px-16 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors duration-700">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-40">
          <div className="text-left flex-1">
            <div className="flex items-center gap-3 mb-8">
                <span className="text-3xl font-black tracking-tighter uppercase italic dark:text-white leading-none">NEOCARE.</span>
            </div>
            <p className="text-zinc-500 font-bold mt-4 uppercase tracking-widest text-[10px] max-w-xs leading-relaxed italic">The premium global decentralized digital infrastructure for clinical intelligence. Made for humans, driven by precision.</p>
            <div className="mt-12 flex gap-4 text-xs font-black grayscale opacity-30">
                <span>TW</span>
                <span>IN</span>
                <span>FB</span>
                <span>XT</span>
            </div>
            <p className="text-[9px] text-zinc-300 dark:text-zinc-700 font-black mt-16 uppercase tracking-[0.3em]">Institutional_Protocol: NC-F-2026-X4</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-24 flex-[2] w-full">
             <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.4em] mb-10 border-b border-zinc-100 dark:border-zinc-900 pb-4 italic">Deployment</p>
                <div className="space-y-6 flex flex-col text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                   <a href="#specialties" className="hover:text-blue-600 transition-all hover:translate-x-2">Specialties_Nodes</a>
                   <a href="#monitoring" className="hover:text-blue-600 transition-all hover:translate-x-2">Telemetry_Sync</a>
                   <a href="#experience" className="hover:text-blue-600 transition-all hover:translate-x-2">Diagnostic_Logic</a>
                </div>
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.4em] mb-10 border-b border-zinc-100 dark:border-zinc-900 pb-4 italic">Intelligence</p>
                <div className="space-y-6 flex flex-col text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                   <Link href="/terms" className="hover:text-blue-600 transition-all hover:translate-x-2">Governance_Terms</Link>
                   <Link href="/privacy" className="hover:text-blue-600 transition-all hover:translate-x-2">Privacy_Protocols</Link>
                   <Link href="/contact" className="hover:text-blue-600 transition-all hover:translate-x-2">Mission_Reports</Link>
                </div>
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.4em] mb-10 border-b border-zinc-100 dark:border-zinc-900 pb-4 italic">Support_Grid</p>
                <div className="space-y-6 flex flex-col text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                   <Link href="/contact" className="hover:text-blue-600 transition-all hover:translate-x-2">Incident_Center</Link>
                   <Link href="/contact" className="hover:text-blue-600 transition-all hover:translate-x-2">Direct_Deployment</Link>
                   <Link href="/contact" className="hover:text-blue-600 transition-all hover:translate-x-2">Node_Status</Link>
                </div>
             </div>
          </div>
        </div>
      </footer>
        </>
      )}
    </div>
  )
}

function BrandedView({ org, showLogin, setShowLogin, handleLogin, loginLoading, username, setUsername, password, setPassword, Toast }) {
  const primaryColor = org?.primary_color || "#2563eb"
  const secondaryColor = org?.secondary_color || "#4f46e5"

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-700">
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 md:px-16">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/70 dark:bg-zinc-900/70 backdrop-blur-3xl border border-white/20 dark:border-zinc-800/50 px-10 py-5 rounded-[2.5rem] shadow-2xl shadow-zinc-900/[0.03]">
          <div className="flex items-center gap-4">
            {org.logo_url ? (
               <img src={org.logo_url} alt={org.name} className="h-12 w-auto object-contain brightness-100 dark:brightness-125 transition-all" />
            ) : (
               <span className="text-3xl" aria-hidden="true">🏥</span>
            )}
            <span className="text-2xl font-black tracking-tighter uppercase italic dark:text-white">
              {org.name}<span style={{ color: primaryColor }}>.</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowLogin(true)}
              className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all text-white hover:scale-105"
              style={{ backgroundColor: primaryColor, boxShadow: `0 20px 40px -10px ${primaryColor}40` }}
            >
              Sign_In
            </button>
          </div>
        </div>
      </nav>

      <section className="pt-60 pb-40 px-8 md:px-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <div className="relative z-10 animate-in fade-in slide-in-from-left-12 duration-1000">
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full mb-10 border"
                   style={{ backgroundColor: `${primaryColor}10`, color: primaryColor, borderColor: `${primaryColor}20` }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }}></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Institutional_Operational_Gateway</span>
            </div>
            <h1 className="text-8xl md:text-[10rem] font-black text-zinc-900 dark:text-white leading-[0.8] tracking-tighter mb-12 italic">
              {org.name.split(' ')[0]} <br />
              <span style={{ color: primaryColor }}>Node_</span>
            </h1>
            <p className="text-2xl md:text-3xl text-zinc-500 dark:text-zinc-400 font-bold mb-16 leading-[1.1] max-w-xl tracking-tight">
              {org.description || "Deploying elite clinical intervention and remote telemetry for the most critical patient entities."}
            </p>
            <div className="flex flex-col sm:flex-row gap-8">
              <Link href={`/register-patient?orgId=${org.id}`} 
                    className="px-12 py-8 text-white rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl hover:scale-[1.05] active:scale-95 transition-all text-center"
                    style={{ backgroundColor: primaryColor, boxShadow: `0 30px 60px -15px ${primaryColor}40` }}>
                Provision_Unit
              </Link>
              <Link href="/contact" className="px-12 py-8 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.3em] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-center border border-zinc-200 dark:border-zinc-700/50">
                Direct_Engage
              </Link>
            </div>
          </div>
          <div className="relative animate-in fade-in zoom-in duration-1000 delay-300">
             <div className="aspect-square rounded-full blur-[150px] absolute -inset-20 opacity-20"
                  style={{ background: `linear-gradient(to top right, ${primaryColor}, ${secondaryColor})` }}></div>
             {org.banner_url ? (
                <div className="relative group">
                    <img src={org.banner_url} alt="Hospital" className="w-full h-auto rounded-[5rem] shadow-[0_80px_150px_-30px_rgba(0,0,0,0.3)] border border-white/10 transition-transform duration-1000 group-hover:scale-[1.02]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-[5rem]"></div>
                </div>
             ) : (
                <div className="glass-card rounded-[5rem] p-24 border-white/10 shadow-2xl flex items-center justify-center">
                   <div className="text-[15rem] opacity-10">🏥</div>
                </div>
             )}
          </div>
        </div>
      </section>

      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 md:p-12 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-white/20 dark:bg-zinc-950/40 backdrop-blur-3xl" onClick={() => setShowLogin(false)}></div>
          <div className="relative w-full max-w-lg glass-card rounded-[4rem] p-16 shadow-2xl border-white/10 animate-in zoom-in-95 duration-500">
            <button onClick={() => setShowLogin(false)} className="absolute top-12 right-12 text-zinc-400 hover:text-zinc-900 text-4xl transform hover:rotate-90 transition-all">&times;</button>
            <div className="text-center mb-16">
              <div className="text-5xl mb-8">🛡️</div>
              <h2 className="text-4xl font-black uppercase tracking-tighter italic mb-2">GateKeeper_V3</h2>
              <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.5em] italic">{org.name.toUpperCase()} HUB</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-10">
              <input className="w-full px-10 py-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-700/50 font-black text-lg outline-none focus:bg-white dark:focus:bg-zinc-800 transition-all" placeholder="Enter_Identity" value={username} onChange={e => setUsername(e.target.value)} required />
              <input type="password" className="w-full px-10 py-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-700/50 font-black text-lg outline-none focus:bg-white dark:focus:bg-zinc-800 transition-all" placeholder="Security_Key" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="submit" disabled={loginLoading} className="w-full py-8 text-white rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ backgroundColor: primaryColor, boxShadow: `0 30px 60px -15px ${primaryColor}50` }}>
                {loginLoading ? "Decrypting_Core..." : "Authorize_Entry →"}
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="py-40 px-8 md:px-16 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors duration-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
             {org.logo_url && <img src={org.logo_url} className="h-8 w-auto opacity-50 contrast-125" />}
             <span className="text-2xl font-black italic tracking-tighter text-zinc-900 dark:text-white">{org.name}<span style={{ color: primaryColor }}>.</span></span>
          </div>
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.3em]">© 2026 Institutional_Audit_Cleared</span>
        </div>
      </footer>
    </div>
  )
}
