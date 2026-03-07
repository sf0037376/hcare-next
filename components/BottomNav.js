"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { apiFetch } from "../lib/api"

export default function BottomNav() {
  const pathname = usePathname()
  const [role, setRole] = useState("")
  const [showMore, setShowMore] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [unreadAlerts, setUnreadAlerts] = useState(0)

  useEffect(() => {
    const savedRole = (localStorage.getItem("role") || "").toLowerCase()
    setRole(savedRole)

    // Fetch unread alerts for all
    apiFetch("/notifications/unread-count").then(data => {
      setUnreadAlerts(data.count || 0)
    }).catch(() => {})

    if (savedRole === "patient") {
      const pid = localStorage.getItem("patientId")
      if (pid) {
        apiFetch(`/billing/ip-items/${pid}`).then(data => {
          if (Array.isArray(data)) {
            setPendingCount(data.filter(i => i.acceptance_status === 'PENDING').length)
          }
        }).catch(() => {})
      }
    }
  }, [])

  const navItems = [
    { href: role === "doctor" ? "/doctor-dashboard" : role === "nurse" || role === "staff" || role === "attender" ? "/staff-dashboard" : "/dashboard", label: "Home", icon: "🏠" },
    { href: "/patients", label: "Patients", icon: "👥", roles: ["admin"] },
    { href: "/billing/orders", label: "Orders", icon: "📋", roles: ["admin"] },
    { href: "/medication", label: "Meds", icon: "💊", roles: ["doctor"] },
    { href: "/appointments", label: "Appts", icon: "📅", roles: ["admin", "doctor", "nurse"] },
    { href: "/vitals", label: "Vitals", icon: "❤️", roles: ["doctor", "nurse", "staff"] },
    { href: "/alerts", label: "Alerts", icon: "🔔" },
    { href: role === 'patient' ? "/patients/financials" : "/billing", label: "Billing", icon: "💰", roles: ["admin", "pharmacist", "patient"] },
    { href: `/patients/${typeof window !== 'undefined' ? localStorage.getItem('patientId') : ''}/approvals`, label: "Approvals", icon: "✅", roles: ["patient"] },
    { href: "/masters", label: "Masters", icon: "⚙️", roles: ["admin"] },
  ]

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  ).slice(0, 4) // Show up to 4 items in the bar

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = "/login"
  }

  return (
    <>
      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_-8px_30px_rgb(0,0,0,0.4)] md:hidden">
        <div className="flex justify-around items-center h-16 px-4">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all relative ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <span className={`text-xl transition-transform ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>{item.icon}</span>
                <span className={`text-[10px] font-bold uppercase tracking-tight transition-all ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
                {item.label === "Approvals" && pendingCount > 0 && (
                  <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black animate-pulse">
                    {pendingCount}
                  </span>
                )}
                {item.label === "Alerts" && unreadAlerts > 0 && (
                  <span className="absolute top-1 right-2 w-4 h-4 bg-blue-600 text-white text-[8px] flex items-center justify-center rounded-full font-black">
                    {unreadAlerts}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </Link>
            )
          })}
          
          <button
            onClick={() => setShowMore(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
              showMore ? "text-blue-600 dark:text-blue-400" : "text-zinc-500"
            }`}
          >
            <span className="text-xl">☰</span>
            <span className="text-[10px] font-bold uppercase tracking-tight opacity-60">More</span>
          </button>
        </div>
      </nav>

      {/* "More" Drawer Overlay */}
      {showMore && (
        <div className="fixed inset-0 z-[60] md:hidden animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMore(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-8" />
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl">
                  👤
                </div>
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white capitalize">{role || 'User'}</p>
                  <p className="text-xs text-zinc-500">Hospital Account</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {role === "admin" && (
                  <>
                    <Link href="/users/manage" onClick={() => setShowMore(false)} className="flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-2xl transition-colors">
                      <span className="text-xl">👥</span>
                      <span className="font-medium">Manage Staff</span>
                    </Link>
                    <Link href="/users/admission" onClick={() => setShowMore(false)} className="flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-2xl transition-colors">
                      <span className="text-xl">📝</span>
                      <span className="font-medium">Patient Admission</span>
                    </Link>
                  </>
                )}
                {(role === "admin" || role === "pharmacist") && (
                  <Link href="/billing" onClick={() => setShowMore(false)} className="flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-2xl transition-colors">
                    <span className="text-xl">💰</span>
                    <span className="font-medium">Billing</span>
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-4 p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-colors w-full mt-4"
                >
                  <span className="text-xl">🚪</span>
                  <span className="font-bold">Sign Out</span>
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setShowMore(false)}
              className="w-full mt-8 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold rounded-2xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
