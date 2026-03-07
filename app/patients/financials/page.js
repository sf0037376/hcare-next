"use client"
import { useEffect } from "react"
import ProtectedRoute from "../../../components/ProtectedRoute"

export default function FinancialsRedirect() {
  useEffect(() => {
    const patientId = localStorage.getItem("patientId")
    if (patientId && patientId !== "undefined") {
      window.location.href = `/patients/${patientId}/financials`
    } else {
      // Fallback for non-patient roles or if ID is missing
      window.location.href = "/dashboard"
    }
  }, [])

  return (
    <ProtectedRoute>
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500 font-bold animate-pulse">Loading Financial Profile...</p>
      </div>
    </ProtectedRoute>
  )
}
