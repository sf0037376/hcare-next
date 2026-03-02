"use client"
import Link from "next/link"

export default function Sidebar() {
  const role = typeof window !== "undefined" ? localStorage.getItem("role") : ""

  return (
    <div className="sidebar">
      <h2>🏥 HomeCare</h2>

      <Link href="/dashboard">Dashboard</Link>

      {(role === "admin" || role === "nurse") && (
        <Link href="/feeding">Feeding</Link>
      )}

      {(role === "admin" || role === "doctor") && (
        <Link href="/medication">Medication</Link>
      )}

      <Link href="/vitals">Vitals</Link>

      {role === "admin" && (
        <>
          <Link href="/users">Users</Link>
          <Link href="/patients">Patients</Link>
          <Link href="/notifications">Notifications</Link>
        </>
      )}
    </div>
  )
}
