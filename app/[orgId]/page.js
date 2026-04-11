"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Cookies from "js-cookie"
import { apiFetch } from "@/lib/api"
import useToast from "@/components/toast"

export default function BrandedLandingPage() {
  const { orgId } = useParams()
  const router = useRouter()
  const { Toast, show } = useToast()
  
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  useEffect(() => {
    async function fetchBranding() {
      try {
        const data = await apiFetch(`/auth/orgs/${orgId}`)
        setOrg(data)
      } catch (err) {
        console.error("Failed to fetch branding", err)
        // Fallback or redirect if not found
      } finally {
        setLoading(false)
      }
    }
    if (orgId) fetchBranding()
  }, [orgId])

  async function handleLogin(e) {
    if (e) e.preventDefault()
    if (!username || !password) {
      show("Enter username and password")
      return
    }

    setLoginLoading(true)
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
      setLoginLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const primaryColor = org?.primary_color || "#2563eb"
  const secondaryColor = org?.secondary_color || "#4f46e5"

  return (
    <div className="min-h-screen bg-white dark:bg-black selection:bg-blue-600 selection:text-white overflow-x-hidden font-sans antialiased text-zinc-900 dark:text-zinc-100" style={{ "--primary": primaryColor, "--secondary": secondaryColor }}>
      {Toast}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-3xl border-b border-zinc-100 dark:border-zinc-800 px-8 md:px-16 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            {org?.logo_url ? (
               <img src={org.logo_url} alt={org.name} className="h-10 w-auto object-contain" />
            ) : (
               <span className="text-2xl" aria-hidden="true">🏥</span>
            )}
            <span className="text-xl font-black tracking-tighter uppercase italic dark:text-white">
              {org?.name || "RCHI"}<span style={{ color: primaryColor }}>.</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowLogin(true)}
              className="px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-8 md:px-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative z-10 animate-in fade-in slide-in-from-left-8 duration-700">
            <span className="inline-block px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full mb-8 border"
                  style={{ backgroundColor: `${primaryColor}10`, color: primaryColor, borderColor: `${primaryColor}30` }}>
              Official Healthcare Partner
            </span>
            <h1 className="text-7xl md:text-9xl font-black text-zinc-900 dark:text-white leading-[0.85] tracking-tighter mb-10 italic">
              {org?.name?.split(' ')[0] || "Expert"} <br />
              <span style={{ color: primaryColor }}>Care.</span>
            </h1>
            <p className="text-2xl text-zinc-500 dark:text-zinc-400 font-bold mb-12 leading-tight max-w-xl">
              {org?.description || "Providing premium medical attention and remote monitoring for your loved ones."}
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link href={`/register-patient?orgId=${orgId}`} 
                    className="px-10 py-6 text-white rounded-[32px] font-black uppercase text-xs tracking-[0.1em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-center"
                    style={{ backgroundColor: primaryColor, shadowColor: `${primaryColor}50` }}>
                Enroll New Patient
              </Link>
              <Link href="/contact" className="px-10 py-6 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-[32px] font-black uppercase text-xs tracking-[0.1em] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-center">
                Contact Us
              </Link>
            </div>
          </div>
          
          <div className="relative animate-in fade-in zoom-in duration-1000">
            <div className="aspect-[4/5] rounded-[100px] blur-[100px] absolute -inset-20 opacity-20"
                 style={{ background: `linear-gradient(to top right, ${primaryColor}, ${secondaryColor})` }}></div>
            
            {org?.banner_url ? (
               <img src={org.banner_url} alt="Hospital Banner" className="relative w-full h-auto rounded-[80px] shadow-2xl transform lg:rotate-1 hover:rotate-0 transition-transform duration-1000 ease-out" />
            ) : (
              <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[80px] p-12 shadow-2xl transform lg:rotate-1 hover:rotate-0 transition-transform duration-1000 ease-out">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[24px] bg-emerald-500 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">❤️</div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Real-time Safety</p>
                      <p className="text-3xl font-black dark:text-white">Active <span className="text-sm text-zinc-500 font-bold">Monitoring</span></p>
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                </div>
                <div className="space-y-6">
                  <div className="h-48 bg-zinc-50 dark:bg-zinc-950 rounded-[40px] border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center">
                     <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Hospital Infrastructure</p>
                     <div className="text-4xl">🏥</div>
                  </div>
                </div>
              </div>
            )}
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
            >
              &times;
            </button>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black uppercase tracking-tighter italic dark:text-white">Sign In</h2>
              <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mt-2">{org?.name} Portal</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Username / Email</label>
                <input 
                  className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 font-bold focus:ring-4 transition-all outline-none"
                  style={{ "--tw-ring-color": `${primaryColor}20`, focusBorderColor: primaryColor }}
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
                  className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 font-bold focus:ring-4 transition-all outline-none"
                  style={{ "--tw-ring-color": `${primaryColor}20`, focusBorderColor: primaryColor }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={loginLoading}
                className="w-full py-5 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all text-center"
                style={{ backgroundColor: primaryColor, shadowColor: `${primaryColor}40` }}
              >
                {loginLoading ? "Authenticating..." : "Enter Portal →"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-24 px-8 md:px-16 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-20">
          <div className="text-center md:text-left flex-1">
            <span className="text-2xl font-black tracking-tighter uppercase italic dark:text-white">{org?.name}.</span>
            <p className="text-zinc-500 font-bold mt-4 uppercase tracking-widest text-[10px] max-w-xs mx-auto md:mx-0 leading-relaxed">
              {org?.address || "Premium healthcare infrastructure powered by NeoCare."}
            </p>
          </div>
          <div className="text-xs font-black uppercase tracking-widest text-zinc-400">
             © 2026 {org?.name}
          </div>
        </div>
      </footer>
    </div>
  )
}
