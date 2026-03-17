"use client"

import Link from "next/link"

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white dark:bg-black selection:bg-blue-600 selection:text-white pb-20">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏥</span>
            <span className="text-xl font-black tracking-tighter uppercase italic dark:text-white">NEOCARE<span className="text-blue-600">.</span></span>
          </Link>
          <Link href="/" className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl">Back to Home</Link>
        </div>
      </nav>

      <main className="pt-40 px-6 max-w-4xl mx-auto">
        <span className="inline-block px-4 py-1.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-full mb-6 border border-zinc-100 dark:border-zinc-700">
          Last Updated: March 2026
        </span>
        <h1 className="text-6xl font-black text-zinc-900 dark:text-white leading-[0.9] tracking-tighter mb-12 italic uppercase">
          Terms & <br />
          <span className="text-blue-600">Conditions.</span>
        </h1>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-12">
          <section>
            <h2 className="text-2xl font-black uppercase tracking-tight italic">1. Overview</h2>
            <p className="text-zinc-500 font-bold leading-relaxed">By accessing and using NEOCARE, you agree to bound by these terms. Our platform provides medical information and management tools for patients, families, and healthcare professionals.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black uppercase tracking-tight italic">2. Patient Privacy & Data</h2>
            <p className="text-zinc-500 font-bold leading-relaxed">Healthcare data is sacred. NEOCARE implements industry-standard encryption for real-time vitals and history. However, users are responsible for securing their login credentials.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black uppercase tracking-tight italic">3. Medical Disclaimer</h2>
            <p className="p-8 bg-zinc-50 dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-white font-black italic">
              NEOCARE is a monitoring and management tool. It does NOT provide medical advice. In case of emergency, always contact your doctor directly or call emergency services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black uppercase tracking-tight italic">4. Subscription Fees</h2>
            <p className="text-zinc-500 font-bold leading-relaxed">Access to premium modules (Remote Monitoring, AI Lab Analysis) is subject to annual subscription fees as disclosed during patient enrollment.</p>
          </section>
        </div>
      </main>

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
