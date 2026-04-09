"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { apiFetch } from "../lib/api"
import { Home, Users, BarChart3, Pill, Calendar, Activity, Bell, DollarSign, FileText, CheckCircle, Settings, MoreHorizontal } from "lucide-react"

export default function BottomNav() {
  const pathname = usePathname()
  const [role, setRole] = useState("")
  const [showMore, setShowMore] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [unreadAlerts, setUnreadAlerts] = useState(0)
  const [patientId, setPatientId] = useState("")

  useEffect(() => {
    const savedRole = (localStorage.getItem("role") || "").toLowerCase()
    setRole(savedRole)
    // Also ensure username is set if we ever use it here

    // Fetch unread alerts for all
    apiFetch("/notifications/unread-count").then(data => {
      setUnreadAlerts(data.count || 0)
    }).catch(() => {})

    const savedPid = localStorage.getItem("patientId") || ""
    setPatientId(savedPid)

    if (savedRole === "patient") {
      const pid = savedPid
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
    { href: role === "doctor" ? "/doctor-dashboard" : role === "nurse" || role === "staff" || role === "attender" ? "/staff-dashboard" : "/dashboard", label: "Home", icon: <Home size={18} /> },
    { href: "/patients", label: "Patients", icon: <Users size={18} />, roles: ["admin"] },
    { href: "/billing/orders", label: "Audit Logs", icon: <BarChart3 size={18} />, roles: ["admin"] },
    { href: "/medication", label: "Meds", icon: <Pill size={18} />, roles: ["doctor", "nurse"] },
    { href: "/appointments", label: "Appts", icon: <Calendar size={18} />, roles: ["admin", "doctor", "nurse"] },
    { href: "/availability", label: role === 'admin' ? "Shifts" : "My Schedule", icon: <Calendar size={18} />, roles: ["doctor", "nurse", "admin"] },
    { href: "/vitals", label: "Vitals", icon: <Activity size={18} />, roles: ["doctor", "nurse", "staff"] },
    { href: "/alerts", label: "Alerts", icon: <Bell size={18} /> },
    { href: "/billing", label: "Billing", icon: <DollarSign size={18} />, roles: ["admin", "pharmacist"] },
    { href: "/billing/ip-logs", label: "IP Logs", icon: <FileText size={18} />, roles: ["admin", "nurse"] },
    { href: role === 'patient' ? "/patients/financials" : "/billing", label: "Billing", icon: <DollarSign size={18} />, roles: ["admin", "pharmacist", "patient"] },
    { href: `/patients/${patientId}/approvals`, label: "Approvals", icon: <CheckCircle size={18} />, roles: ["patient"] },
    { href: "/masters", label: "Masters", icon: <Settings size={18} />, roles: ["admin"] },
  ]

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  )

  const barItems = visibleItems.slice(0, 4) // Show up to 4 items in the bar
  const drawerItems = visibleItems.slice(4) // Show the rest in the drawer

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = "/"
  }

  return (
    <>
      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 dark:border-white/5 pb-safe md:hidden rounded-t-3xl overflow-hidden shadow-2xl">
        <div className="flex justify-around items-center h-16 md:h-18 px-1">
          {barItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all relative ${
                  isActive
                    ? "text-blue-500 font-bold"
                    : "text-zinc-500 dark:text-zinc-400 opacity-70"
                }`}
              >
                <span className={`transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-1' : ''}`}>
                  {item.icon}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-widest transition-all ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/30" />
                )}
              </Link>
            )
          })}
          
          <button
            onClick={() => setShowMore(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all text-zinc-500 dark:text-zinc-400 opacity-70`}
          >
            <MoreHorizontal size={18} />
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">More</span>
          </button>
        </div>
      </nav>

      {/* "More" Drawer Overlay (Bottom Sheet) */}
      {showMore && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setShowMore(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 rounded-t-[3.5rem] p-10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10 animate-in slide-in-from-bottom duration-500 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-10" />
            
            <div className="space-y-10">
              <div className="flex items-center gap-5 p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/10">
                  <img src={`https://ui-avatars.com/api/?name=${role || 'User'}&background=random`} className="w-full h-full rounded-full" alt="User" />
                </div>
                <div>
                  <p className="text-xl font-black text-zinc-900 dark:text-white capitalize tracking-tight leading-tight">{role || 'User'}</p>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1">Hospital Account</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {drawerItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setShowMore(false)} className={`flex items-center gap-5 p-5 rounded-[2rem] transition-all group ${
                        isActive 
                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/25' 
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}>
                      <span className={`text-xl transition-transform group-hover:scale-110`}>{item.icon}</span>
                      <span className="font-black text-sm uppercase tracking-widest">{item.label}</span>
                      {item.label === "Approvals" && pendingCount > 0 && (
                        <span className="ml-auto flex h-6 px-2 bg-red-500 text-white text-[10px] items-center justify-center rounded-full font-black animate-pulse">
                          {pendingCount}
                        </span>
                      )}
                      {item.label === "Alerts" && unreadAlerts > 0 && (
                        <span className="ml-auto w-6 h-6 bg-blue-500 text-white text-[10px] flex items-center justify-center rounded-full font-black">
                          {unreadAlerts}
                        </span>
                      )}
                    </Link>
                  )
                })}
                
                {(role === "admin" || role === "super_admin") && (
                  <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                    <p className="px-5 text-[10px] font-black text-zinc-400 uppercase tracking-[.25em] mb-4">Administration</p>
                    <Link href="/users/manage" onClick={() => setShowMore(false)} className="flex items-center gap-5 p-5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-[2rem] transition-all">
                      <span className="text-xl">👥</span>
                      <span className="font-black text-sm uppercase tracking-widest">Manage Staff</span>
                    </Link>
                    <Link href="/users/admission" onClick={() => setShowMore(false)} className="flex items-center gap-5 p-5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-[2rem] transition-all">
                      <span className="text-xl">📝</span>
                      <span className="font-black text-sm uppercase tracking-widest">Patient Admission</span>
                    </Link>
                  </div>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-5 p-5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-[2rem] transition-all w-full mt-6"
                >
                  <span className="text-xl">🚪</span>
                  <span className="font-black text-sm uppercase tracking-widest">Sign Out</span>
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setShowMore(false)}
              className="w-full mt-10 py-5 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-3xl active:scale-95 transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  )
}
