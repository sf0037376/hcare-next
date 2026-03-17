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
  
  // Login State
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('login') === 'true') {
      setShowLogin(true)
    }
  }, [])

  async function handleLogin(e) {
    if (e) e.preventDefault()
    if (!username || !password) {
      show("Enter username and password")
      return
    }

    setLoading(true)
    try {
      const data = await apiFetch(`/auth/login`, {
        method: "POST",
        body: JSON.stringify({ username, password }),
      })

      if (!data?.token) throw new Error("Invalid login response")

      Cookies.set("token", data.token, { expires: 7, path: "/" })
      localStorage.setItem("token", data.token)
      localStorage.setItem("role", data.role || "")
      localStorage.setItem("username", data.username || data.name || username)
      localStorage.setItem("userId", String(data.user_id))
      localStorage.setItem("orgId", String(data.organisation_id))
      if (data.patient_id) localStorage.setItem("patientId", String(data.patient_id))

      const userRole = (data.role || "").toLowerCase()
      if (userRole === "doctor") window.location.href = "/doctor-dashboard"
      else if (["nurse", "staff", "attender"].includes(userRole)) window.location.href = "/staff-dashboard"
      else window.location.href = "/dashboard"
    } catch (err) {
      show(err.message || "Login failed")
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
    "description": "Premium remote patient monitoring and hospital management system specialized in Neonatal, Pediatric, Dialysis, and General Home Care."
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black selection:bg-blue-600 selection:text-white overflow-x-hidden font-sans antialiased text-zinc-900 dark:text-zinc-100">
      {Toast}

      {/* SEO & Meta Simulation */}
      <title>NEOCARE | Premium Remote Patient Monitoring & Home Care Ecosystem</title>
      <meta name="description" content="NEOCARE: The ultimate platform for remote healthcare. Monitor vitals, feeds, and medications from anywhere. Specialized for Neonatal, Pediatric, Dialysis and General Home Care." />
      <meta property="og:title" content="NEOCARE | Expert Care, Closer than ever." />
      <meta property="og:description" content="World-class patient monitoring and analytics platform." />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-3xl border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🏥</span>
            <span className="text-xl font-black tracking-tighter uppercase italic dark:text-white">NEOCARE<span className="text-blue-600">.</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <a href="#specialties" className="hover:text-blue-600 transition-colors">Specialties</a>
            <a href="#monitoring" className="hover:text-blue-600 transition-colors">Monitoring</a>
            <a href="#experience" className="hover:text-blue-600 transition-colors">The App</a>
            <Link href="/contact" className="hover:text-blue-600 transition-colors">Support</Link>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowLogin(true)}
              className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative z-10 animate-in fade-in slide-in-from-left-8 duration-700">
            <span className="inline-block px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-8 border border-blue-100 dark:border-blue-800">
              Trusted by 100+ Hospitals Worldwide
            </span>
            <h1 className="text-7xl md:text-9xl font-black text-zinc-900 dark:text-white leading-[0.85] tracking-tighter mb-10 italic">
              Care. <br />
              <span className="text-blue-600">Unified.</span>
            </h1>
            <p className="text-2xl text-zinc-500 dark:text-zinc-400 font-bold mb-12 leading-tight max-w-xl">
              From neonatal ICU to specialized home care, NEOCARE bridges the gap between clinical excellence and remote family peace of mind.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link href="/register-patient" className="px-10 py-6 bg-blue-600 text-white rounded-[32px] font-black uppercase text-xs tracking-[0.1em] shadow-2xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all text-center">
                Enroll New Patient
              </Link>
              <Link href="/contact" className="px-10 py-6 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-[32px] font-black uppercase text-xs tracking-[0.1em] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-center">
                Request Demo
              </Link>
            </div>
          </div>
          
          <div className="relative animate-in fade-in zoom-in duration-1000">
            <div className="aspect-[4/5] bg-gradient-to-tr from-blue-600/40 to-indigo-600/40 rounded-[100px] blur-[100px] absolute -inset-20 opacity-20"></div>
            <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[80px] p-12 shadow-2xl transform lg:rotate-6 hover:rotate-0 transition-transform duration-1000 ease-out">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[24px] bg-emerald-500 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">❤️</div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Real-time Vitals</p>
                    <p className="text-3xl font-black dark:text-white">98 <span className="text-sm text-zinc-500 font-bold">% SpO2</span></p>
                  </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
              </div>
              <div className="space-y-6">
                <div className="flex gap-4 items-center">
                   <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm">🍼</div>
                   <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-blue-600 rounded-full"></div>
                   </div>
                   <p className="text-[10px] font-black text-zinc-400">120ml Feed</p>
                </div>
                <div className="h-48 bg-zinc-50 dark:bg-zinc-950 rounded-[40px] border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Health Trend View</p>
                   <div className="flex gap-2 items-end h-20">
                      {[40, 70, 45, 90, 60, 80, 50, 95].map((h, i) => (
                        <div key={i} className="w-3 bg-blue-600/20 rounded-t-lg transition-all hover:bg-blue-600" style={{ height: `${h}%` }}></div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
            {/* Remote Info Tooltip */}
            <div className="absolute top-20 -right-10 bg-white dark:bg-zinc-800 p-5 rounded-[24px] shadow-2xl border border-zinc-100 dark:border-zinc-700 animate-bounce cursor-pointer">
              <div className="flex items-center gap-3">
                 <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                   <span className="text-[10px]">✨</span>
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest dark:text-zinc-100">AI Alerts Active</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties Breakdown */}
      <section id="specialties" className="py-40 px-6 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-6 dark:text-white">Expertise in every <span className="text-blue-600">Ward.</span></h2>
            <p className="text-zinc-500 dark:text-zinc-400 font-bold text-xl max-w-2xl mx-auto">From critical care to recovery at home, we provide the digital infrastructure for elite medical attention.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              { title: "Neonatal ICU", desc: "Specialized monitoring for the first fragile moments.", icon: "👶", color: "blue" },
              { title: "Pediatric Care", desc: "Digital health tools for child-focused recovery.", icon: "🧒", color: "purple" },
              { title: "Dialysis Unit", desc: "Streamlined data for ongoing renal treatments.", icon: "🩸", color: "red" },
              { title: "General Home Care", desc: "Premium monitoring from the comfort of home.", icon: "🏠", color: "emerald" }
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 p-10 rounded-[48px] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-2xl hover:-translate-y-4 transition-all duration-500 group">
                <div className="text-6xl mb-10 group-hover:scale-120 transition-transform">{s.icon}</div>
                <h3 className="text-xl font-black mb-4 uppercase tracking-tighter dark:text-white">{s.title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm leading-relaxed">{s.desc}</p>
                <div className={`mt-8 w-10 h-1 bg-${s.color}-600 rounded-full`}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deep Dive: Remote Monitoring */}
      <section id="monitoring" className="py-40 px-6 bg-white dark:bg-black overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 items-center">
           <div className="flex-1 order-2 lg:order-1">
              <div className="relative">
                 <div className="absolute -inset-10 bg-blue-600/10 rounded-[100px] blur-3xl"></div>
                 <div className="relative grid grid-cols-2 gap-6">
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-8 rounded-[48px] border border-zinc-100 dark:border-zinc-800">
                       <p className="text-3xl mb-4">🌡️</p>
                       <h4 className="font-black uppercase text-xs tracking-widest mb-2">Live Vitals</h4>
                       <p className="text-[10px] font-bold text-zinc-500 leading-relaxed">Continuous HR, SpO2, and BP syncing.</p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-8 rounded-[48px] border border-zinc-100 dark:border-zinc-800 mt-12">
                       <p className="text-3xl mb-4">🍼</p>
                       <h4 className="font-black uppercase text-xs tracking-widest mb-2">Feeding Logs</h4>
                       <p className="text-[10px] font-bold text-zinc-500 leading-relaxed">Automated timers for feeds & durations.</p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-8 rounded-[48px] border border-zinc-100 dark:border-zinc-800">
                       <p className="text-3xl mb-4">🔔</p>
                       <h4 className="font-black uppercase text-xs tracking-widest mb-2">Smart Meds</h4>
                       <p className="text-[10px] font-bold text-zinc-500 leading-relaxed">Timely alerts for clinical accuracy.</p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-8 rounded-[48px] border border-zinc-100 dark:border-zinc-800 mt-12">
                       <p className="text-3xl mb-4">📱</p>
                       <h4 className="font-black uppercase text-xs tracking-widest mb-2">Family Hub</h4>
                       <p className="text-[10px] font-bold text-zinc-500 leading-relaxed">Real-time snapshots from any location.</p>
                    </div>
                 </div>
              </div>
           </div>
           <div className="flex-1 order-1 lg:order-2">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em] mb-4 block">Ecosystem Overview</span>
              <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] italic mb-10 dark:text-white">Everything, <br />Everywhere.</h2>
              <p className="text-xl text-zinc-500 font-bold mb-10 leading-relaxed">Distance is no longer a barrier to safety. Our 24/7 hub ensures every vital sign is tracked and every Clinical need is met, providing peace of mind for families and precision for providers.</p>
              <div className="flex gap-10">
                 <div>
                    <p className="text-5xl font-black text-blue-600 italic">0.2s</p>
                    <p className="text-[10px] font-black uppercase text-zinc-400 mt-2">Data Latency</p>
                 </div>
                 <div className="w-px h-20 bg-zinc-100 dark:bg-zinc-800"></div>
                 <div>
                    <p className="text-5xl font-black text-blue-600 italic">100%</p>
                    <p className="text-[10px] font-black uppercase text-zinc-400 mt-2">Compliance</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* The App Experience */}
      <section id="experience" className="py-40 px-6 bg-blue-600 text-white relative">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 items-center">
           <div className="flex-1">
              <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] italic mb-10">One Portal <br />to rule them all.</h2>
              <div className="space-y-12 mt-12">
                 {[
                   { title: "AI Lab Analysis", desc: "Get intelligent breakdowns of lab reports instantly.", icon: "🧪" },
                   { title: "One-Click Appointments", desc: "Secure sessions with consultants in seconds.", icon: "📅" },
                   { title: "Automated Prescriptions", desc: "Schedules created automatically from doctor notes.", icon: "📝" }
                 ].map((feat, i) => (
                    <div key={i} className="flex gap-8 group">
                       <span className="text-4xl opacity-50 contrast-125 group-hover:opacity-100 group-hover:scale-125 transition-all">{feat.icon}</span>
                       <div>
                          <h4 className="text-2xl font-black uppercase tracking-tight mb-2 italic">{feat.title}</h4>
                          <p className="text-lg font-bold opacity-60 leading-relaxed">{feat.desc}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
           <div className="flex-1 relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-[200px]"></div>
              <div className="relative p-1 bg-white/10 border border-white/20 rounded-[60px] backdrop-blur-3xl lg:translate-x-10">
                 <div className="bg-white dark:bg-zinc-950 rounded-[58px] overflow-hidden p-10">
                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-10">Patient Dashboard 2.0</p>
                    <div className="space-y-6">
                       <div className="h-20 bg-zinc-50 dark:bg-zinc-900 rounded-3xl flex items-center px-8 justify-between">
                          <p className="font-black text-zinc-900 dark:text-white uppercase tracking-widest text-[10px]">Upcoming Appointment</p>
                          <span className="px-4 py-2 bg-blue-600 rounded-full text-[10px] font-black">14:00 PM</span>
                       </div>
                       <div className="h-40 bg-zinc-50 dark:bg-zinc-900 rounded-[40px] p-8">
                          <p className="text-[10px] font-black uppercase text-zinc-400 mb-4">Medication Due</p>
                          <div className="flex justify-between items-center">
                             <p className="text-xl font-black text-zinc-900 dark:text-white italic">Paracetamol 500mg</p>
                             <button className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-sm shadow-lg">✓</button>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Login Overlay */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-2xl" onClick={() => setShowLogin(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[48px] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowLogin(false)}
              className="absolute top-8 right-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-2xl font-bold transition-colors"
              aria-label="Close Modal"
            >
              &times;
            </button>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black uppercase tracking-tighter italic dark:text-white">Sign In</h2>
              <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mt-2">Access NEOCARE Portal</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Username / Email</label>
                <input 
                  className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="name@email.com"
                  required
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Password</label>
                <input 
                  type="password"
                  className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-500/40 active:scale-95 transition-all text-center"
              >
                {loading ? "Authenticating..." : "Enter Portal →"}
              </button>
            </form>
            <p className="mt-8 text-center text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-relaxed">
              New to NEOCARE? <Link href="/register-patient" className="text-blue-600 underline">Enroll Now</Link>
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-20">
          <div className="text-center md:text-left flex-1">
            <span className="text-2xl font-black tracking-tighter uppercase italic dark:text-white">NEOCARE.</span>
            <p className="text-zinc-500 font-bold mt-4 uppercase tracking-widest text-[10px] max-w-xs mx-auto md:mx-0 leading-relaxed">Global digital infrastructure for premium patient care. Made for families, loved by doctors.</p>
            <p className="text-[9px] text-zinc-300 dark:text-zinc-700 font-black mt-8 uppercase tracking-[0.2em]">© 2026 Global Healthcare Solutions Inc.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-16 flex-[2]">
             <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-6 border-b border-zinc-100 dark:border-zinc-900 pb-2">Product</p>
                <div className="space-y-4 flex flex-col text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                   <a href="#specialties" className="hover:text-blue-600 transition-colors">Specialties</a>
                   <a href="#monitoring" className="hover:text-blue-600 transition-colors">Remote Care</a>
                   <a href="#experience" className="hover:text-blue-600 transition-colors">Lab Analysis</a>
                </div>
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-6 border-b border-zinc-100 dark:border-zinc-900 pb-2">Company</p>
                <div className="space-y-4 flex flex-col text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                   <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms of Use</Link>
                   <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
                   <Link href="/contact" className="hover:text-blue-600 transition-colors">Careers</Link>
                </div>
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-6 border-b border-zinc-100 dark:border-zinc-900 pb-2">Support</p>
                <div className="space-y-4 flex flex-col text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                   <Link href="/contact" className="hover:text-blue-600 transition-colors">Help Center</Link>
                   <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact Sales</Link>
                   <Link href="/contact" className="hover:text-blue-600 transition-colors">System Status</Link>
                </div>
             </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
