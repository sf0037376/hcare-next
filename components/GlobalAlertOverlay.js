"use client"

import { useState } from "react"
import { Check, AlertTriangle, Bell } from "lucide-react"

export default function GlobalAlertOverlay({ alert, onAcknowledge }) {
  const [confirmed, setConfirmed] = useState(false)

  if (!alert) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border-4 border-red-500 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-red-500 p-6 flex items-center gap-4 text-white">
          <div className="bg-white/20 p-3 rounded-2xl animate-pulse">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight leading-tight">
              {alert.title || "Critical Alert"}
            </h2>
            <p className="text-red-100 font-medium text-sm">Action Required Immediately</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Message Details
            </label>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 leading-snug">
              {alert.message || alert.body}
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
              "By acknowledging this alert, you confirm that the necessary clinical intervention or verification has been performed for this patient."
            </p>
          </div>

          {/* Action Checkbox */}
          <button 
            onClick={() => setConfirmed(!confirmed)}
            className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
              confirmed 
                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-900 dark:text-emerald-400" 
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              confirmed ? "bg-emerald-500 text-white" : "bg-zinc-100 dark:bg-zinc-800"
            }`}>
              {confirmed && <Check className="w-5 h-5 stroke-[3]" />}
            </div>
            <span className="font-bold">I have attended to this due and performed the action.</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
          <button
            disabled={!confirmed}
            onClick={() => {
              onAcknowledge(alert.id);
              setConfirmed(false);
            }}
            className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 ${
              confirmed 
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20" 
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
            }`}
          >
            <Bell className="w-5 h-5" />
            Acknowledge & Submit
          </button>
        </div>
      </div>
    </div>
  )
}
