"use client"

import { useState } from "react"
import Link from "next/link"
import { apiFetch } from "@/lib/api"
import useToast from "@/components/toast"

export default function ContactUs() {
  const { Toast, show } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" })

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/patients/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      show("Message sent! We will contact you shortly.")
      setForm({ name: "", email: "", phone: "", message: "" })
    } catch (err) {
      show("Failed to send message. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black selection:bg-blue-600 selection:text-white pb-20">
      {Toast}

      {/* Persistent Navigation for Public Pages */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏥</span>
            <span className="text-xl font-black tracking-tighter uppercase italic dark:text-white">NEOCARE<span className="text-blue-600">.</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-xs font-black uppercase tracking-widest text-zinc-500">
             <Link href="/#features" className="hover:text-blue-600 transition-colors">Features</Link>
             <Link href="/#specialties" className="hover:text-blue-600 transition-colors">Specialties</Link>
          </div>
          <Link href="/" className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl">Back to Home</Link>
        </div>
      </nav>

      <main className="pt-40 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div>
            <span className="inline-block px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-6 border border-blue-100 dark:border-blue-800">
              Contact NEOCARE
            </span>
            <h1 className="text-6xl md:text-8xl font-black text-zinc-900 dark:text-white leading-[0.9] tracking-tighter mb-8 italic">
              Let's Talk <br />
              <span className="text-blue-600">Care.</span>
            </h1>
            <p className="text-xl text-zinc-500 dark:text-zinc-400 font-bold mb-12 leading-relaxed max-w-md">
              Whether you are an individual seeking home care or a hospital looking for a premium management platform, we are ready to assist.
            </p>

            <div className="space-y-8">
               <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl">📧</div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Email Us</p>
                    <p className="text-lg font-black dark:text-white">hello@neocare.hospital</p>
                  </div>
               </div>
               <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl">📍</div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Headquarters</p>
                    <p className="text-lg font-black dark:text-white max-w-xs">NEOCARE Tech Park, Sector 44, Bengaluru, India</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-[60px] p-8 sm:p-12 shadow-2xl overflow-hidden relative group">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-10 dark:text-white">Request a Callback</h2>
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Full Name</label>
                <input required className="w-full px-6 py-4 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 font-bold focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Patient or Provider Name" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Email address</label>
                  <input required type="email" className="w-full px-6 py-4 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 font-bold focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="name@email.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Phone Number</label>
                  <input required className="w-full px-6 py-4 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 font-bold focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91 00000 00000" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">How can we help?</label>
                <textarea className="w-full px-6 py-4 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 font-bold focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none min-h-[120px]" value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Interest in Home Care, Neonatal ICU setups, etc."></textarea>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-600/30 active:scale-95 transition-all"
              >
                {loading ? "Sending..." : "Submit Inquiry →"}
              </button>
            </form>
            <div className="absolute -bottom-20 -right-20 text-[20rem] font-black opacity-[0.03] rotate-12 select-none">LEAD</div>
          </div>
        </div>
      </main>

      {/* Footer Simulation for Public Pages */}
      <footer className="mt-32 py-20 px-6 border-t border-zinc-100 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-center md:text-left">
            <span className="text-2xl font-black tracking-tighter uppercase italic dark:text-white">NEOCARE.</span>
            <p className="text-xs text-zinc-500 font-bold mt-2 uppercase tracking-widest">© 2026 Global Healthcare Solutions Inc.</p>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">
            <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms of Use</Link>
            <Link href="/contact" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
