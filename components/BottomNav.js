"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function BottomNav() {
  const pathname = usePathname()
  const role = typeof window !== "undefined" ? localStorage.getItem("role") : ""

  const navItems = [
    { href: "/dashboard", label: "Home", icon: "🏠" },
    { href: "/medication", label: "Meds", icon: "💊", roles: ["admin", "doctor"] },
    { href: "/feeding", label: "Feeding", icon: "🍼", roles: ["admin", "nurse"] },
    { href: "/vitals", label: "Vitals", icon: "❤️" },
  ]

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 pb-safe pb-4 pt-2 px-6 flex justify-between md:hidden shadow-[0_-4px_20px_rgb(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgb(0,0,0,0.5)]">
      {visibleItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive
                ? "text-blue-600 dark:text-blue-400 font-semibold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 absolute bottom-1" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
