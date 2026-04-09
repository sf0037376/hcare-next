"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { apiFetch } from "../lib/api"
import { Home, Users, BarChart3, Pill, Baby, Activity, Calendar, Bell, Hospital, DollarSign, FileText, CreditCard, CheckCircle, Settings, LogOut } from "lucide-react"

/* 
 * NeoCare Elite Sidebar Component v3.0
 * Solid-state tactical navigation for high-performance clinical operations.
 */

export default function Sidebar() {
  const pathname = usePathname()
  const [role, setRole] = useState("")
  const [userName, setUserName] = useState("")
  const [pendingCount, setPendingCount] = useState(0)
  const [unreadAlerts, setUnreadAlerts] = useState(0)
  const [patientId, setPatientId] = useState("")

  useEffect(() => {
    const savedRole = (localStorage.getItem("role") || "").toLowerCase()
    setRole(savedRole)
    const savedName = localStorage.getItem("username") || localStorage.getItem("name") || ""
    setUserName(savedName)
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

    const fetchUnread = () => {
      apiFetch("/notifications/unread-count").then(data => {
        setUnreadAlerts(data.count || 0)
      }).catch(() => {})
    }
    
    fetchUnread()
    window.addEventListener('refresh-notifications', fetchUnread)
    return () => window.removeEventListener('refresh-notifications', fetchUnread)
  }, [])

  const getDashboardHref = () => {
    if (role === "doctor") return "/doctor-dashboard"
    if (role === "nurse" || role === "staff" || role === "attender") return "/staff-dashboard"
    if (role === "pharmacist") return "/pharmacy/fulfillment"
    return "/dashboard"
  }

  const navItems = [
    { href: getDashboardHref(), label: "Dashboard", icon: <Home size={18} /> },
    { href: "/patients", label: "Patients", icon: <Users size={18} />, roles: ["admin", "super_admin", "doctor"] },
    { href: "/billing/orders", label: "Audit Logs", icon: <BarChart3 size={18} />, roles: ["admin", "super_admin"] },
    { href: "/medication", label: "Medication", icon: <Pill size={18} />, roles: ["doctor", "nurse", "super_admin"] },
    { href: "/feeding", label: "Feeding", icon: <Baby size={18} />, roles: ["nurse"] },
    { href: "/vitals", label: "Vitals", icon: <Activity size={18} />, roles: ["nurse", "staff"] },
    { href: "/appointments", label: "Appointments", icon: <Calendar size={18} />, roles: ["admin", "super_admin", "doctor"] },
    { href: "/availability", label: (role === 'admin' || role === 'super_admin') ? "Manage Shifts" : "My Schedule", icon: <Calendar size={18} />, roles: ["doctor", "nurse", "admin", "super_admin"] },
    { href: "/alerts", label: "Alerts", icon: <Bell size={18} /> },
    { href: "/pharmacy/fulfillment", label: "Pharmacy", icon: <Hospital size={18} />, roles: ["admin", "super_admin", "pharmacist"] },
    { href: "/billing", label: "Billing", icon: <DollarSign size={18} />, roles: ["admin", "super_admin", "pharmacist"] },
    { href: "/masters", label: "Masters", icon: <Settings size={18} />, roles: ["admin", "super_admin"] },
  ]
  
  const adminItems = [
    { href: "/users/admission", label: "Admission", icon: <FileText size={18} /> },
    { href: "/users/manage", label: "Manage Staff", icon: <Users size={18} /> },
  ]

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  )

  return (
    <div className="hidden md:flex w-72 flex-col fixed inset-y-0 left-0 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 p-8 z-50">
      {/* Brand Header */}
      <div className="flex items-center gap-4 mb-12 px-2">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-xl shadow-lg">
          🏥
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic">NEOCARE</h2>
          <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.3em] font-mono">ELITE_NODE_v3</p>
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 space-y-10 overflow-y-auto no-scrollbar">
        <div>
          <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.4em] mb-6 px-4 italic">Mission_Center</h3>
          <nav className="space-y-1">
            {visibleItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                    isActive
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl shadow-zinc-500/10 font-bold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <span className={`${isActive ? 'text-blue-500' : 'text-zinc-400 group-hover:text-blue-500'}`}>
                    {item.icon}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono">{item.label}</span>
                  {(item.label === "Alerts" && unreadAlerts > 0) && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-500/10" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {(role === "admin" || role === "super_admin") && (
          <div>
            <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.4em] mb-6 px-4 italic">Institutional</h3>
            <nav className="space-y-1">
              {adminItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                      isActive
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    <span className={`${isActive ? 'text-blue-500' : 'text-zinc-400 group-hover:text-blue-500'}`}>
                      {item.icon}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Identity Block */}
      <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-4 px-4 py-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-100 dark:border-zinc-800 group hover:border-blue-500/20 transition-all cursor-default">
          <div className="w-10 h-10 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-md">
            <img src={`https://ui-avatars.com/api/?name=${userName || 'User'}&background=random`} className="w-full h-full rounded-full grayscale" alt="User" />
          </div>
          <div className="min-w-0 font-mono">
            <p className="text-[11px] font-black text-zinc-900 dark:text-white truncate uppercase tracking-tighter italic">{userName || 'User'}</p>
            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-0.5 opacity-60 italic">{role}_MODE</p>
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.href = "/"; }}
            className="ml-auto p-2 text-zinc-400 hover:text-red-500 transition-all active:scale-75"
            title="Logic_Override: Sign_Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
