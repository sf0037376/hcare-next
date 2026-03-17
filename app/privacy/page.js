"use client"

import Link from "next/link"

export default function PrivacyPolicy() {
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
        <span className="inline-block px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-6 border border-blue-100 dark:border-blue-800">
          Your Data, Protected.
        </span>
        <h1 className="text-6xl font-black text-zinc-900 dark:text-white leading-[0.9] tracking-tighter mb-12 italic uppercase">
          Privacy <br />
          <span className="text-blue-600">Policy.</span>
        </h1>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-12">
          <section>
            <h2 className="text-2xl font-black uppercase tracking-tight italic">1. Information we collect</h2>
            <p className="text-zinc-500 font-bold leading-relaxed">We collect patient vitals (HR, SpO2), feeding logs, and medication history only to provide monitoring services to assigned doctors and family members.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black uppercase tracking-tight italic">2. How we share data</h2>
            <p className="text-zinc-500 font-bold leading-relaxed">Data is shared only with authorized healthcare providers and the patient's immediate designated family. We NEVER sell medical data to third parties.</p>
          </section>

          <section className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-10 rounded-[48px]">
             <h2 className="text-2xl font-black uppercase tracking-tight italic text-emerald-900 dark:text-emerald-400">3. Encryption Ethics</h2>
             <p className="text-emerald-800/80 dark:text-emerald-300/80 font-bold leading-relaxed mt-4">All transmission of clinical data is secured via AES-256 bit encryption. Your loved ones' health records are stored with the same security standards used by global banking institutions.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black uppercase tracking-tight italic">4. Your Rights</h2>
            <p className="text-zinc-500 font-bold leading-relaxed">Patients have the right to request a full clinical summary (Discharge Summary) and can request account deactivation through their hospital administrator.</p>
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
