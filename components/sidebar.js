"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Sidebar() {
  const pathname = usePathname()
  const [role, setRole] = useState("")
  const [userName, setUserName] = useState("")
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const savedRole = (localStorage.getItem("role") || "").toLowerCase()
    setRole(savedRole)
    const savedName = localStorage.getItem("name") || ""
    setUserName(savedName)

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

  const getDashboardHref = () => {
    if (role === "doctor") return "/doctor-dashboard"
    if (role === "nurse" || role === "staff" || role === "attender") return "/staff-dashboard"
    return "/dashboard"
  }

  const navItems = [
    { href: getDashboardHref(), label: "Dashboard", icon: "🏠" },
    { href: "/patients", label: "Patients", icon: "👥", roles: ["admin"] },
    { href: "/billing/orders", label: "Audit Logs", icon: "📋", roles: ["admin"] },
    { href: "/medication", label: "Medication", icon: "💊", roles: ["doctor"] },
    { href: "/feeding", label: "Feeding", icon: "🍼", roles: ["doctor", "nurse"] },
    { href: "/vitals", label: "Vitals", icon: "❤️", roles: ["doctor", "nurse", "staff"] },
    { href: "/appointments", label: "Appointments", icon: "📅", roles: ["admin", "doctor"] },
    { href: "/availability", label: "My Schedule", icon: "⏰", roles: ["doctor", "nurse", "admin"] },
    { href: "/pharmacy/inventory", label: "Pharmacy", icon: "🏥", roles: ["admin", "pharmacist"] },
    { href: "/billing", label: "Billing", icon: "💰", roles: ["admin", "pharmacist"] },
    { href: "/billing/ip-logs", label: "IP Billing Log", icon: "📑", roles: ["admin"] },
    { href: "/patients/financials", label: "Financials", icon: "💳", roles: ["patient"] },
    { href: `/patients/${typeof window !== 'undefined' ? localStorage.getItem('patientId') : ''}/approvals`, label: "Approvals", icon: "✅", roles: ["patient"] },
    { href: "/masters", label: "Masters", icon: "⚙️", roles: ["admin"] },
  ]
  
  const adminItems = [
    { href: "/users/admission", label: "Admission", icon: "📝" },
    { href: "/users/manage", label: "Manage Staff", icon: "👥" },
    { href: "/notifications", label: "Alerts", icon: "🔔" },
  ]

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  )

  return (
    <div className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 p-6 z-40 transition-all duration-300">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-lg shadow-blue-500/30">
          🏥
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">NeoCare</h2>
          <p className="text-xs text-zinc-500 font-medium">Hospital Management</p>
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
                </Link>
              )
            })}
          </nav>
        </div>

        {role === "admin" && (
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

      <div className="mt-auto pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 px-3">
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            👨‍⚕️
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[120px]">{userName || 'User'}</p>
            <p className="text-xs font-medium text-zinc-500 capitalize">{role}</p>
            <p className="text-[10px] text-zinc-400 cursor-pointer hover:text-red-500 mt-1 uppercase tracking-wider font-bold" onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}>Sign Out</p>
          </div>
        </div>
      </div>
    </div>
  )
}
