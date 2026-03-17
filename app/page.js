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
      else if (["nurse", "staff"].includes(userRole)) window.location.href = "/staff-dashboard"
      else window.location.href = "/dashboard"
    } catch (err) {
      show(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black selection:bg-blue-500 selection:text-white overflow-x-hidden">
      {Toast}

      {/* SEO & Meta Simulation */}
      <title>NEOCARE | Premium Patient Care & Remote Monitoring</title>
      <meta name="description" content="Next-generation healthcare platform for neonatal, pediatric, and dialysis care. Monitor your loved ones remotely with real-time vitals and expert care teams." />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏥</span>
            <span className="text-xl font-black tracking-tighter uppercase italic dark:text-white">NEOCARE<span className="text-blue-600">.</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#care" className="hover:text-blue-600 transition-colors">Specialties</a>
            <a href="#monitoring" className="hover:text-blue-600 transition-colors">Remote Monitoring</a>
          </div>
          <button 
            onClick={() => setShowLogin(true)}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative z-10 animate-in fade-in slide-in-from-left-8 duration-700">
            <span className="inline-block px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-6 border border-blue-100 dark:border-blue-800">
              Transforming Healthcare Excellence
            </span>
            <h1 className="text-6xl md:text-8xl font-black text-zinc-900 dark:text-white leading-[0.9] tracking-tighter mb-8">
              Expert Care, <br />
              <span className="text-blue-600 italic">Closer than ever.</span>
            </h1>
            <p className="text-xl text-zinc-500 dark:text-zinc-400 font-bold mb-10 leading-relaxed max-w-xl">
              Experience a healthcare revolution designed for families. Monitor your loved ones from anywhere in the world with real-time clinical insights and elite medical professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register-patient" className="px-10 py-5 bg-blue-600 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-2xl shadow-blue-500/20 hover:scale-[1.02] transition-all text-center">
                Enroll Your Patient Now
              </Link>
              <button 
                onClick={() => setShowLogin(true)}
                className="px-10 py-5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-[32px] font-black uppercase text-xs tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-center"
              >
                Access Dashboard
              </button>
            </div>
          </div>
          
          <div className="relative animate-in fade-in zoom-in duration-1000">
            <div className="aspect-square bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-[80px] blur-3xl absolute inset-0"></div>
            <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[60px] p-8 shadow-2xl transform lg:rotate-3 hover:rotate-0 transition-transform duration-700">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-xl">❤️</div>
                <div>
                  <p className="text-[10px] font-black uppercase text-zinc-400">Live Vitals</p>
                  <p className="text-2xl font-black dark:text-white">98 <span className="text-sm text-zinc-500">% SpO2</span></p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-full"></div>
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-3/4"></div>
                <div className="h-40 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800 flex items-center justify-center italic text-blue-600 font-bold">
                  Clinical Graph Simulation
                </div>
              </div>
            </div>
            {/* Float Badge */}
            <div className="absolute -bottom-10 -left-10 bg-white dark:bg-zinc-800 p-6 rounded-[32px] shadow-2xl border border-zinc-100 dark:border-zinc-700 animate-bounce duration-[3000ms]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">✨</div>
                <p className="text-[10px] font-black uppercase tracking-widest dark:text-zinc-100">Remote Family Access</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section id="care" className="py-32 px-6 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-20 uppercase tracking-tighter italic dark:text-white">Specialized for Every Need</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { title: "Neonatal ICU", desc: "Expert care for the most precious beginnings with advanced monitoring.", icon: "👶" },
              { title: "Pediatric Care", desc: "Focused healing and medical attention for children is our priority.", icon: "👧" },
              { title: "Dialysis Unit", desc: "Premium facilities for ongoing renal health and comfortable sessions.", icon: "🩸" }
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 p-10 rounded-[40px] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group">
                <div className="text-5xl mb-8 group-hover:rotate-12 transition-transform">{s.icon}</div>
                <h3 className="text-xl font-black mb-4 uppercase tracking-tight dark:text-white">{s.title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Remote Monitoring Sales Pitch */}
      <section id="monitoring" className="py-32 px-6 bg-blue-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 font-black text-[30rem] select-none pointer-events-none rotate-12 -mt-20">LIVE</div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter mb-10">Monitor your family from anywhere.</h2>
          <p className="text-xl font-bold opacity-80 mb-12">No more distance between you and your loved ones' health. Our real-time portal keeps you informed every second, whether you are across the street or across the ocean.</p>
          <div className="inline-flex gap-10 items-center justify-center flex-wrap">
            <div className="text-center">
              <p className="text-4xl font-black mb-1">100%</p>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Real-time Data</p>
            </div>
            <div className="w-px h-10 bg-white/20"></div>
            <div className="text-center">
              <p className="text-4xl font-black mb-1">24/7</p>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Doctor Access</p>
            </div>
          </div>
        </div>
      </section>

      {/* Login Overlay (Standalone Simulation) */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-2xl" onClick={() => setShowLogin(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[48px] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowLogin(false)}
              className="absolute top-8 right-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-2xl font-bold transition-colors"
            >
              &times;
            </button>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black uppercase tracking-tighter italic dark:text-white">Sign In</h2>
              <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mt-2">Access your medical portal</p>
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
                className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-500/40 active:scale-95 transition-all"
              >
                {loading ? "Authenticating..." : "Enter Portal →"}
              </button>
            </form>
            <p className="mt-8 text-center text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              New to NEOCARE? <Link href="/register-patient" className="text-blue-600 underline">Register Now</Link>
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-zinc-100 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-center md:text-left">
            <span className="text-2xl font-black tracking-tighter uppercase italic dark:text-white">NEOCARE.</span>
            <p className="text-xs text-zinc-500 font-bold mt-2 uppercase tracking-widest">© 2026 Global Healthcare Solutions Inc.</p>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white">Privacy</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white">Terms</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
