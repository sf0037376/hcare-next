"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { apiFetch } from "../lib/api"
import { Home, Users, BarChart3, Pill, Baby, Activity, Calendar, Bell, Hospital, DollarSign, FileText, CreditCard, CheckCircle, Settings, LogOut } from "lucide-react"

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

    // Fetch unread alerts for all roles
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
    { href: getDashboardHref(), label: "Dashboard", icon: <Home size={20} /> },
    { href: "/patients", label: "Patients", icon: <Users size={20} />, roles: ["admin", "super_admin", "doctor"] },
    { href: "/vaccinations", label: "Vaccinations", icon: "💉", roles: ["doctor", "nurse", "admin", "super_admin"] },
    { href: "/billing/orders", label: "Audit Logs", icon: <BarChart3 size={20} />, roles: ["admin", "super_admin"] },
    { href: "/medication", label: "Medication", icon: <Pill size={20} />, roles: ["doctor", "nurse", "super_admin"] },
    { href: "/feeding", label: "Feeding", icon: <Baby size={20} />, roles: ["nurse"] },
    { href: "/vitals", label: "Vitals", icon: <Activity size={20} />, roles: ["nurse", "staff"] },
    { href: "/appointments", label: "Appointments", icon: <Calendar size={20} />, roles: ["admin", "super_admin", "doctor"] },
    { href: "/availability", label: (role === 'admin' || role === 'super_admin') ? "Manage Staff Shifts" : "My Schedule", icon: <Calendar size={20} />, roles: ["doctor", "nurse", "admin", "super_admin"] },
    { href: "/alerts", label: "Alerts", icon: <Bell size={20} /> },
    { href: "/pharmacy/fulfillment", label: "Pharmacy Counter", icon: <Hospital size={20} />, roles: ["admin", "super_admin", "pharmacist"] },
    { href: "/pharmacy/inventory", label: "Drug Inventory", icon: <Pill size={20} />, roles: ["admin", "super_admin", "pharmacist"] },
    { href: "/billing", label: "Billing", icon: <DollarSign size={20} />, roles: ["admin", "super_admin", "pharmacist"] },
    { href: "/billing/ip-logs", label: "IP Billing Log", icon: <FileText size={20} />, roles: ["admin", "super_admin", "nurse"] },
    { href: "/patients/financials", label: "Financials", icon: <CreditCard size={20} />, roles: ["patient"] },
    { href: `/patients/${patientId}/approvals`, label: "Approvals", icon: <CheckCircle size={20} />, roles: ["patient"] },
    { href: "/masters", label: "Masters", icon: <Settings size={20} />, roles: ["admin", "super_admin"] },
  ]
  
  const adminItems = [
    { href: "/users/admission", label: "Admission", icon: "📝" },
    { href: "/users/manage", label: "Manage Staff", icon: "👥" },
  ]

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  )

  return (
    <div className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 glass border-r border-white/10 dark:border-white/5 p-6 z-40 transition-all duration-300">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-xl shadow-blue-500/20">
          🏥
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase leading-tight">RCHI</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest opacity-70">Powered by NeoCare</p>
        </div>
      </div>

      <div className="flex-1 space-y-8">
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 px-3">Overview</h3>
          <nav className="space-y-1">
            {visibleItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                  {item.label === "Approvals" && pendingCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                      {pendingCount}
                    </span>
                  )}
                  {item.label === "Alerts" && unreadAlerts > 0 && (
                    <span className="ml-auto bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {unreadAlerts}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {(role === "admin" || role === "super_admin") && (
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 px-3">Administration</h3>
            <nav className="space-y-1">
              {adminItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </div>

      <div className="mt-auto pt-6 border-t border-white/10 dark:border-white/5">
        <div className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-2xl border border-white/5 grayscale hover:grayscale-0 transition-all cursor-default">
          <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/10">
            <img src={`https://ui-avatars.com/api/?name=${userName || 'User'}&background=random`} className="w-full h-full rounded-full" alt="User" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{userName || 'User'}</p>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{role}</p>
          </div>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
            className="ml-auto p-2 text-zinc-400 hover:text-red-500 transition-colors"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
