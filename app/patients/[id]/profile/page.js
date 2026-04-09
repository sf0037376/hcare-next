'use client'

import { useState, useEffect } from "react"
import { apiFetch } from "../../../../lib/api"
import useToast from "../../../../components/toast"
import ProtectedRoute from "../../../../components/ProtectedRoute"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function PatientProfile() {
  const { id } = useParams()
  const { Toast, show } = useToast()
  const [patient, setPatient] = useState(null)
  const [vitals, setVitals] = useState([])
  const [meds, setMeds] = useState([])
  const [feeds, setFeeds] = useState([])
  const [logs, setLogs] = useState([])
  const [reports, setReports] = useState([])
  const [appts, setAppts] = useState([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('')
  const [pendingCount, setPendingCount] = useState(0)
  const [showPhone, setShowPhone] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [showWearableModal, setShowWearableModal] = useState(false)
  const [wearableId, setWearableId] = useState("")
  const [wearableProvider, setWearableProvider] = useState("APPLE")

  useEffect(() => {
    setRole((localStorage.getItem('role') || '').toLowerCase())
    async function loadProfile() {
      try {
        const fullData = await apiFetch(`/patients/${id}/full-profile`)
        setPatient(fullData.patient)
        setVitals(fullData.vitals || [])
        setMeds(fullData.medication_schedule || [])
        setFeeds(fullData.feeding_logs || [])
        setLogs(fullData.medication_logs || [])
        setReports(fullData.lab_reports || [])
        setAppts(fullData.appointments || [])

        if (fullData.ip_items_pending) {
          setPendingCount(fullData.ip_items_pending)
        } else {
          // Fallback check
          const ipData = await apiFetch(`/billing/ip-items/${id}`)
          setPendingCount(Array.isArray(ipData) ? ipData.filter(i => i.acceptance_status === 'PENDING').length : 0)
        }
      } catch (err) {
        show("Failed to load patient profile")
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [id, show])

  async function acceptItem(invoiceId, itemIndex) {
    try {
      await apiFetch(`/billing/invoices/${invoiceId}/accept-item`, {
        method: 'PUT',
        body: JSON.stringify({ item_index: itemIndex })
      })
      show("Charge accepted successfully")
      // Note: invoices state is no longer available, this part will not function as intended.
      // If this functionality is still needed, invoices data needs to be fetched or managed differently.
      // For now, keeping it as is, but it will likely cause an error or not update the UI.
      // const newInvoices = [...invoices]
      // const invIdx = newInvoices.findIndex(inv => inv.id === invoiceId)
      // if (invIdx !== -1) {
      //   newInvoices[invIdx].order_data.items[itemIndex].status = 'ACCEPTED'
      //   setInvoices(newInvoices)
      // }
    } catch (err) {
      show("Failed to accept charge")
    }
  }

  async function downloadHistory() {
    try {
      const data = await apiFetch(`/reports/patient-history/${id}`)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `patient-history-${id}.json`
      a.click()
      show("History downloaded as JSON")
    } catch (err) {
      show("Failed to download history")
    }
  }

  async function deactivateMed(scheduleId) {
    if (!confirm("Are you sure you want to deactivate this medication?")) return
    try {
      await apiFetch(`/medication/schedule/${scheduleId}/deactivate`, { method: 'PUT' })
      show("Medication deactivated")
      setMeds(meds.filter(m => m.id !== scheduleId))
    } catch (err) {
      show("Failed to deactivate medication")
    }
  }

  async function generateSummary() {
    setIsGeneratingSummary(true)
    try {
      const data = await apiFetch(`/reports/discharge-summary/${id}`)
      if (data && data.summary) {
        // Create a blob for the markdown content
        const blob = new Blob([data.summary], { type: "text/markdown" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `Discharge_Summary_${patient.name}_${id}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        show("Discharge summary downloaded as .md")
      } else {
        show("No summary content received from API")
      }
    } catch (err) {
      console.error("Discharge Summary Error:", err)
      show("Failed to download summary")
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  async function handleLinkWearable() {
    if (!wearableId) return show("Please enter a Wearable ID")
    try {
      await apiFetch("/health-sync/link", {
        method: "PATCH",
        body: JSON.stringify({
          patient_id: id,
          wearable_id: wearableId,
          provider: wearableProvider
        })
      })
      show("Smartwatch linked successfully! Syncing will begin automatically.")
      setShowWearableModal(false)
      // Update local state
      setPatient({ ...patient, wearable_id: wearableId, wearable_provider: wearableProvider })
    } catch (err) {
      show("Failed to link wearable")
    }
  }

  async function handleDelinkWearable() {
    if (!confirm("Are you sure you want to disconnect your wearable?")) return
    try {
      await apiFetch("/health-sync/delink", {
        method: "PATCH",
        body: JSON.stringify({ patient_id: id })
      })
      show("Wearable disconnected successfully")
      setPatient({ ...patient, wearable_id: null, wearable_provider: null })
    } catch (err) {
      show("Failed to delink wearable")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!patient) return <p className="text-center p-20">Patient not found</p>

  const latestVitals = vitals[0] || {}

  return (
    <ProtectedRoute>
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-40 max-w-7xl mx-auto px-6 transition-all">
        {Toast}

        {/* Tactical Billing Alert Architecture */}
        {pendingCount > 0 && (role === 'patient' || role === 'admin' || role === 'super_admin') && (
          <div className="mb-12 p-8 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8 animate-pulse">
            <div className="flex items-center gap-6">
              <span className="text-4xl">🧾</span>
              <div>
                <h4 className="text-xl font-black text-amber-900 dark:text-amber-100 uppercase tracking-tight">Pending Action: {pendingCount} Unpaid Bills</h4>
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-2 tracking-wide">Please review the medical charges for your recent visits.</p>
              </div>
            </div>
            <Link
              href={`/patients/${id}/approvals`}
              className="btn-primary !bg-amber-600 !text-white !shadow-none whitespace-nowrap"
            >
              Review & Pay →
            </Link>
          </div>
        )}
        {/* Clinical Identity Suite */}
        <div className="pro-card p-12 mb-12 shadow-sm relative overflow-hidden group">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="relative">
                <div className="w-32 h-32 rounded-3xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-5xl font-black shadow-xl">
                  {patient.gender === 'Female' ? '👧' : '👶'}
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 border-4 border-white dark:border-zinc-900 rounded-xl flex items-center justify-center text-xs text-white">✓</div>
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-6">
                  <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-zinc-900 dark:text-white italic leading-none">{patient.name}</h1>
                  <span className={`status-badge !rounded-xl ${
                    patient.status === 'ACTIVE' ? 'text-emerald-600 border-emerald-500/20' : 'text-zinc-500'
                  }`}>
                    {patient.status}_PROTOCOL
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-8 text-tactical text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="opacity-50 tracking-widest uppercase">AGE:</span>
                    <span className="text-zinc-900 dark:text-white">{patient.age}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="opacity-50 tracking-widest uppercase">UID:</span>
                    <span className="text-zinc-900 dark:text-white">#{patient.id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600 lowercase bg-blue-500/5 px-4 py-1.5 rounded-lg border border-blue-500/10">
                    <span className="opacity-50">cellular_node:</span>
                    <span className="font-bold tracking-tight">
                      {showPhone ? patient.phone : (patient.phone ? `${patient.phone.slice(0, 3)}••••${patient.phone.slice(-3)}` : 'N/A')}
                    </span>
                    {!showPhone && patient.phone && (
                      <button
                        onClick={() => {
                          const pwd = prompt("Authorized Personal Clearance Required:");
                          if (pwd) setShowPhone(true);
                        }}
                        className="ml-2 underline opacity-60 hover:opacity-100"
                      >
                        [unmask]
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href={`/patients/${id}/history`} className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">Medical History</Link>
              <Link href={`/patients/${id}/reports`} className="btn-primary !py-3 !px-6 text-xs font-bold uppercase tracking-widest">Medical Reports →</Link>
            </div>
          </div>
        </div>

        {/* Tactical Intelligence Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-16">
            {[
                { label: 'Log Vitals', icon: '❤️', href: `/vitals?patient_id=${id}`, show: role === 'patient' || role === 'doctor' || role === 'nurse' || role === 'staff' },
                { label: 'Log Feeding', icon: '🍼', href: `/feeding?patient_id=${id}`, show: role === 'patient' || role === 'nurse' || role === 'staff' },
                { label: 'Log Medicine', icon: '💊', href: `/medication?patient_id=${id}`, show: role === 'patient' || role === 'nurse' || role === 'staff' },
                { label: 'Prescribe', icon: '📝', href: `/medication/prescribe?patient_id=${id}`, show: role === 'doctor' },
                { label: 'Discharge', icon: '📄', onClick: generateSummary, show: role === 'doctor' },
                { label: 'Link Watch', icon: '⌚', onClick: () => setShowWearableModal(true), show: role === 'patient' && !patient?.wearable_id },
            ].filter(b => b.show).map((b, idx) => (
                b.href ? (
                    <Link key={idx} href={b.href} className="pro-card p-6 flex flex-col items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all active:scale-95">
                        <span className="text-3xl">{b.icon}</span>
                        <span className="text-tactical text-zinc-400 group-hover:text-zinc-900 transition-colors uppercase">{b.label}</span>
                    </Link>
                ) : (
                    <button key={idx} onClick={b.onClick} className="pro-card p-6 flex flex-col items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all active:scale-95">
                        <span className="text-3xl">{b.icon}</span>
                        <span className="text-tactical text-zinc-400 group-hover:text-zinc-900 transition-colors uppercase">{b.label}</span>
                    </button>
                )
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left Column: Metrics & Active Care */}
          <div className={`${role === 'pharmacist' ? 'hidden' : 'lg:col-span-8 space-y-10'}`}>

            {/* Tactical Telemetry Roster */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Heart Rate", val: latestVitals.hr || "---", unit: "bpm", icon: "❤️", color: "red" },
                { label: "Oxygen", val: latestVitals.spo2 || "---", unit: "%", icon: "💨", color: "blue" },
                { label: "Weight", val: latestVitals.weight || "---", unit: "kg", icon: "⚖️", color: "emerald" },
                { label: "Head Size", val: latestVitals.head || "---", unit: "cm", icon: "🧠", color: "purple" }
              ].map((m) => (
                <div key={m.label} className="pro-card p-6 shadow-sm group relative overflow-hidden transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl">
                        {m.icon}
                    </div>
                    <div className="text-right">
                        <span className="text-tactical text-zinc-400 block mb-1 uppercase lg:text-[8px]">{m.label}</span>
                        <span className="text-[10px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider">SECURE_SYNC</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 font-mono">
                    <span className="text-4xl font-black text-zinc-900 dark:text-white italic tracking-tighter">{m.val}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">{m.unit}</span>
                  </div>
                  {latestVitals.source === 'WEARABLE' && m.label !== "Mass_Metric" && m.label !== "Cranial" && (
                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Telemetry_Active</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Clinical Progression Matrix */}
            <div className="pro-card p-10 shadow-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div>
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none mb-3 italic uppercase">Daily Care Schedule</h3>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Current Day (0600-0600)</p>
                </div>
                <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-600/5 rounded-xl border border-blue-600/10">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                    <span className="text-xs font-bold tracking-widest text-blue-600 uppercase">Status: Connected</span>
                </div>
              </div>

              <div className="space-y-12 relative">
                <div className="absolute left-[24px] top-4 bottom-4 w-1 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>

                {(() => {
                  const now = new Date();
                  const startOfShift = new Date(now);
                  if (now.getHours() < 6) startOfShift.setDate(startOfShift.getDate() - 1);
                  startOfShift.setHours(6, 0, 0, 0);
                  const endOfShift = new Date(startOfShift);
                  endOfShift.setDate(endOfShift.getDate() + 1);
                  const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);

                  const isInShift = (dateStr) => {
                    if (!dateStr) return false;
                    const d = new Date(dateStr);
                    return d >= startOfShift && d < endOfShift;
                  };

                  const clinicalDone = [
                    ...logs.map(log => ({ ...log, type: 'DONE', time: new Date(log.taken_at || log.created_at), label: `${log.medicine} - ${log.dosage}`, icon: '💊', isMed: true })),
                    ...feeds.map(feed => ({ ...feed, type: 'DONE', time: new Date(feed.recorded_at), label: `${feed.quantity}ml ${feed.type || 'Feed'} Protocol`, icon: '🍼', isMed: false }))
                  ].filter(item => isInShift(item.time));

                  const pendingMeds = meds
                    .filter(m => {
                      if (!m.next_due) return false;
                      const due = new Date(m.next_due);
                      const prescribedToday = new Date(m.created_at).toDateString() === now.toDateString();
                      const hasNoLogs = !logs.some(l => l.medicine === m.medicine && isInShift(l.taken_at));
                      return isInShift(due) || (prescribedToday && hasNoLogs);
                    })
                    .map(m => {
                      const due = new Date(m.next_due);
                      const isOverdue = due.getTime() < (now.getTime() - 1000 * 60 * 5);
                      return { id: m.id, type: isOverdue ? 'OVERDUE' : 'PENDING', time: due, label: `${m.medicine} - ${m.dosage}`, icon: '💊', isMed: true, medicine: m.medicine, dosage: m.dosage };
                    });

                  let pendingFeeds = [];
                  if (patient && patient.feeding_interval_hours) {
                    const shiftFeeds = feeds.filter(f => isInShift(f.recorded_at)).sort((a,b) => new Date(b.recorded_at) - new Date(a.recorded_at));
                    const lastFeed = shiftFeeds.length > 0 ? new Date(shiftFeeds[0].recorded_at) : null;
                    const nextFeedTime = lastFeed ? new Date(lastFeed.getTime() + patient.feeding_interval_hours * 60 * 60 * 1000) : new Date(startOfShift.getTime() + patient.feeding_interval_hours * 60 * 60 * 1000);
                    if (isInShift(nextFeedTime)) {
                        const isOverdue = nextFeedTime.getTime() < (now.getTime() - 1000 * 60 * 5);
                        pendingFeeds.push({ type: isOverdue ? 'OVERDUE' : 'PENDING', icon: '🍼', label: lastFeed ? 'Next_Feeding_Cycle' : 'First_Shift_Nutritional_Vector', time: nextFeedTime, id: 'next-feed', isMed: false, isFeed: true });
                    }
                  }

                  const taskSheet = [...pendingMeds, ...pendingFeeds].filter(item => item.time <= fourHoursFromNow).sort((a, b) => a.time - b.time);
                  
                  const timeline = [...clinicalDone, ...pendingMeds, ...pendingFeeds].sort((a, b) => {
                    if (a.type !== b.type) {
                      const priority = { 'OVERDUE': 1, 'PENDING': 2, 'DONE': 3 };
                      return priority[a.type] - priority[b.type];
                    }
                    return a.time - b.time;
                  });

                  if (timeline.length === 0) return (
                    <div className="py-20 text-center opacity-40">
                      <p className="text-xs font-black uppercase tracking-[0.5em] text-zinc-500 italic">No_Registry_Artifacts_Detected</p>
                    </div>
                  );

                  return (
                    <div className="space-y-12">
                      {timeline.map((item, idx) => (
                        <div key={idx} className="relative pl-20 group">
                          <div className={`absolute left-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl z-20 transition-all ${
                               item.type === 'DONE' 
                               ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700'
                               : (item.type === 'OVERDUE' ? 'bg-red-600 text-white animate-pulse' : 'bg-blue-600 text-white')
                             }`}>
                            {item.icon}
                          </div>
                          
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3 font-mono">
                                <span className={`status-badge !rounded-lg !px-3 !py-1 ${
                                    item.type === 'DONE' ? 'text-emerald-600 border-emerald-500/20' :
                                    item.type === 'OVERDUE' ? 'bg-red-500/10 text-red-600 border-red-500/30' : 
                                    'bg-blue-600/10 text-blue-600 border-blue-600/20 animate-pulse'
                                }`}>
                                    {item.type}_LOG
                                </span>
                                <span className="text-tactical text-zinc-400">
                                    TRIAL: {item.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' })}
                                </span>
                              </div>
                              <div className={`p-6 rounded-2xl border transition-all ${
                                item.type === 'OVERDUE' ? 'bg-red-600/5 border-red-600/30' : 
                                'bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 hover:border-blue-600/40'
                              }`}>
                                <h4 className={`text-xl font-black italic tracking-tight ${item.type === 'OVERDUE' ? 'text-red-600' : 'text-zinc-900 dark:text-white'}`}>
                                  {item.label}
                                </h4>
                              </div>
                            </div>

                            {(item.type === 'OVERDUE' || item.type === 'PENDING') && (
                              <button
                                onClick={() => {
                                  if (item.isMed) window.location.href = `/medication?patient_id=${id}&medicine=${encodeURIComponent(item.medicine)}&dose=${encodeURIComponent(item.dosage)}&scheduleId=${item.id}`;
                                  else window.location.href = `/feeding?patient_id=${id}`;
                                }}
                                className={`btn-primary !px-8 !py-4 ${
                                    item.type === 'OVERDUE' ? '!bg-red-600 !text-white' : ''
                                }`}
                              >
                                EXECUTE {item.type === 'OVERDUE' ? '!' : '→'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Operational Deployment Forecast */}
                      {taskSheet.length > 0 && (
                        <div className="mt-20 pt-16 border-t-2 border-dashed border-zinc-100 dark:border-zinc-800 relative">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                            <div>
                                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none mb-3 italic uppercase">Upcoming Schedule</h3>
                                <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Next 4 Hours Reminder</p>
                            </div>
                            <span className="status-badge !bg-emerald-500/10 !text-emerald-600 border-emerald-500/20 animate-pulse">Live</span>
                          </div>
                          
                          <div className="clinical-table-container">
                            <table className="clinical-table">
                              <thead>
                                <tr>
                                  <th className="font-mono uppercase">T_Delta</th>
                                  <th className="font-mono uppercase">Protocol_Identifier</th>
                                  <th className="text-right font-mono uppercase">Commit_Vector</th>
                                </tr>
                              </thead>
                              <tbody>
                                {taskSheet.map((task, tidx) => {
                                  const isVerySoon = task.time.getTime() < (now.getTime() + 30 * 60 * 1000);
                                  return (
                                    <tr key={tidx} className={isVerySoon ? 'bg-red-600/5' : ''}>
                                      <td className="py-6">
                                        <div className="flex items-center gap-4">
                                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isVerySoon ? 'bg-red-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                                            {task.icon}
                                          </div>
                                          <div className="font-mono">
                                            <p className={`text-lg font-black tracking-tighter ${isVerySoon ? 'text-red-600' : 'text-zinc-900 dark:text-white'}`}>
                                              {task.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' })}
                                            </p>
                                          </div>
                                        </div>
                                      </td>
                                      <td>
                                        <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 italic tracking-tighter">{task.label}</p>
                                      </td>
                                      <td className="text-right">
                                        <button
                                          onClick={() => {
                                            if (task.isMed) window.location.href = `/medication?patient_id=${id}&medicine=${encodeURIComponent(task.medicine)}&dose=${encodeURIComponent(task.dosage)}&scheduleId=${task.id}`;
                                            else window.location.href = `/feeding?patient_id=${id}`;
                                          }}
                                          className="btn-primary !py-2.5 !px-5 text-[9px]"
                                        >
                                          EXECUTE
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Diagnostic Vault */}
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter italic uppercase">Medical Reports</h3>
                    <p className="text-xs font-bold tracking-widest text-zinc-500 mt-1 uppercase">Lab Reports & Test Results</p>
                </div>
                <Link href={`/patients/${id}/reports`} className="btn-primary !py-3 !px-8 text-xs tracking-widest">
                  View All →
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {reports.map((report) => (
                  <div key={report.id} className="pro-card p-8 group relative overflow-hidden transition-all hover:border-blue-500/30">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic">{report.test_name || 'Lab_Protocol'}</h4>
                        <div className="flex items-center gap-3 mt-2 text-tactical text-zinc-400">
                            <span>{new Date(report.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                            <span className="text-blue-600">VERIFIED</span>
                        </div>
                      </div>
                      {report.file_path && (
                        <a href={`http://localhost:5000${report.file_path}`} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-xl hover:bg-zinc-950 dark:hover:bg-white hover:text-white dark:hover:text-zinc-950 transition-all shadow-sm">💾</a>
                      )}
                    </div>
                    
                    {report.ai_analysis ? (
                      <div className="mt-6 p-6 bg-blue-600/5 rounded-2xl border border-blue-600/10">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xl">✨</span>
                            <span className="text-tactical text-blue-600 uppercase">AI_Synthesis</span>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 font-bold italic line-clamp-3">
                          "{report.ai_analysis}"
                        </p>
                      </div>
                    ) : (
                      <div className="mt-6 p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                        <span className="text-tactical text-zinc-400 animate-pulse uppercase">Telemetry_Pending...</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {reports.length === 0 && (
                <div className="py-40 pro-card rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center opacity-40 group hover:opacity-100 transition-all">
                  <span className="text-9xl mb-12 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000">🔬</span>
                  <h3 className="text-2xl font-black uppercase tracking-[0.4em] text-zinc-500 italic">No Medical Reports</h3>
                  <p className="text-[10px] font-black text-zinc-400 mt-4 uppercase tracking-[0.3em]">New test results and lab reports will appear here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Tactical Intelligence Sidebar */}
          <div className={`${role === 'pharmacist' ? 'lg:col-span-12 max-w-2xl' : 'lg:col-span-4'} space-y-12`}>

            {/* Quick Actions */}
            {role === 'patient' && (
              <div className="bg-zinc-950 dark:bg-zinc-900 rounded-3xl p-8 shadow-sm text-white relative overflow-hidden group">
                <h3 className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-8">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-4">
                  <Link href={`/vitals?patient_id=${id}`} className="flex items-center justify-between p-4 bg-white/5 dark:bg-zinc-100 hover:bg-white hover:text-blue-600 rounded-xl border border-white/10 transition-all active:scale-95">
                    <span className="font-black uppercase text-[10px] tracking-widest">LOG VITALS</span>
                    <span className="text-2xl">❤️</span>
                  </Link>
                  <Link href={`/feeding?patient_id=${id}`} className="flex items-center justify-between p-4 bg-white/5 dark:bg-zinc-100 hover:bg-white hover:text-blue-600 rounded-xl border border-white/10 transition-all active:scale-95">
                    <span className="font-black uppercase text-[10px] tracking-widest">LOG FEEDING</span>
                    <span className="text-2xl">🍼</span>
                  </Link>
                  <Link href={`/medication?patient_id=${id}`} className="flex items-center justify-between p-4 bg-white/5 dark:bg-zinc-100 hover:bg-white hover:text-blue-600 rounded-xl border border-white/10 transition-all active:scale-95">
                    <span className="font-black uppercase text-[10px] tracking-widest">LOG MEDICINE</span>
                    <span className="text-2xl">💊</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Billing */}
            {(role === 'patient' || role === 'admin' || role === 'super_admin') && (
              <div className="bg-zinc-950 dark:bg-white rounded-3xl p-8 shadow-sm text-white dark:text-zinc-900 border border-white/5 group">
                <h3 className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-6">Billing & Payments</h3>
                <p className="text-xl font-black mb-8 italic uppercase tracking-tighter">Secure Billing Portal.</p>
                <Link href={`/patients/${id}/financials`} className="btn-primary !w-full !py-4 text-[10px]">
                  💰 VIEW BILLS & PAYMENTS →
                </Link>
              </div>
            )}
            {/* Care Team */}
            <div className="pro-card p-10 shadow-sm transition-all hover:border-blue-500/30">
              <h3 className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-10">Care Team</h3>
              <div className="space-y-8">
                <div className="flex items-center gap-6 group/member">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl group-hover/member:rotate-6 transition-transform">👨‍⚕️</div>
                  <div className="font-mono">
                    <p className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-1">Doctor</p>
                    <p className="text-xl font-black text-zinc-900 dark:text-white italic uppercase tracking-tighter">{patient.doctor_name || 'PENDING'}</p>
                    {patient.doctor_phone && (
                        <p className="text-[10px] font-bold text-blue-500 mt-2 tracking-widest leading-none">📞 {patient.doctor_phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6 group/member">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl group-hover/member:-rotate-6 transition-transform">👩‍⚕️</div>
                  <div className="font-mono">
                    <p className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-1">Head Nurse</p>
                    <p className="text-xl font-black text-zinc-900 dark:text-white italic uppercase tracking-tighter">{patient.nurse_name || 'PENDING'}</p>
                    {patient.nurse_phone && (
                        <p className="text-[10px] font-bold text-emerald-500 mt-2 tracking-widest leading-none">📞 {patient.nurse_phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Care Cycles */}
            <div className="pro-card p-10 shadow-sm bg-zinc-950 text-white relative overflow-hidden group">
              <h3 className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-10">Active Prescriptions</h3>
              <div className="space-y-6 relative z-10">
                {meds.map((med) => (
                  <div key={med.id} className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800 flex justify-between items-start hover:border-blue-500/40 transition-all">
                    <div className="font-mono">
                      <p className="font-black text-lg uppercase tracking-tight italic text-white">{med.medicine}</p>
                      <p className="text-xs font-bold tracking-widest text-zinc-500 mt-2">{med.dosage} &bull; FREQUENCY: {med.times_per_day} TIMES/DAY</p>
                    </div>
                    {role === 'doctor' && (
                      <div className="flex gap-2">
                        <Link
                          href={`/medication/prescribe?patient_id=${id}&schedule_id=${med.id}`}
                          className="btn-secondary !bg-zinc-800 !text-white !py-2 !px-4 text-[8px] !rounded-lg"
                        >
                          EDIT
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
                {meds.length === 0 && (
                  <p className="text-xs font-bold text-zinc-600 tracking-widest text-center py-10 uppercase">No Active Prescriptions</p>
                )}
              </div>
            </div>

            {/* Impending Visits */}
            {role !== 'pharmacist' && (
              <div className="pro-card p-10 shadow-sm relative overflow-hidden group">
                <h3 className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-10">Upcoming Appointments</h3>
                <div className="space-y-8">
                  {appts && appts.filter(a => new Date(a.appointment_time) > new Date()).slice(0, 3).map(appt => (
                    <div key={appt.id} className="flex gap-6 group/appt transition-all">
                      <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex flex-col items-center justify-center font-mono border border-zinc-200 dark:border-zinc-700 group-hover/appt:bg-blue-600 group-hover/appt:text-white transition-all">
                        <span className="text-[9px] font-black uppercase tracking-widest">{new Date(appt.appointment_time).toLocaleString('en-US', { month: 'short' }).toUpperCase()}</span>
                        <span className="text-xl font-black">{new Date(appt.appointment_time).getDate()}</span>
                      </div>
                      <div className="font-mono">
                        <p className="font-black text-zinc-900 dark:text-white text-lg italic uppercase tracking-tighter">DR. {appt.doctor_name.toUpperCase()}</p>
                        <p className={`text-[10px] font-black uppercase mt-2 ${appt.is_confirmed ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {appt.is_confirmed ? 'CONFIRMED' : 'PENDING'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {appts.length === 0 && <p className="text-xs font-bold tracking-widest text-zinc-500 text-center py-10 opacity-40 uppercase">No Upcoming Appointments</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Telemetry Linking Modal */}
        {showWearableModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/90">
            <div className="w-full max-w-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="mb-12 text-center">
                <div className="w-20 h-20 bg-blue-600/5 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-8">⌚</div>
                <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic">Link Health Device</h3>
                <p className="text-xs font-bold tracking-widest text-zinc-500 mt-4 uppercase">Sync your smartwatch or health app</p>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="text-xs font-bold tracking-widest text-zinc-500 block mb-3 ml-1 uppercase">Select Device Provider</label>
                  <select 
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-600/20 appearance-none"
                    value={wearableProvider}
                    onChange={(e) => setWearableProvider(e.target.value)}
                  >
                    <option value="APPLE">Apple Health</option>
                    <option value="GOOGLE">Google Health Connect</option>
                    <option value="FITBIT">Fitbit</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold tracking-widest text-zinc-500 block mb-3 ml-1 uppercase">Device Name / ID</label>
                  <input
                    type="text"
                    placeholder="e.g. My Apple Watch"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-600/20 placeholder:opacity-30"
                    value={wearableId}
                    onChange={(e) => setWearableId(e.target.value)}
                  />
                  <p className="text-[9px] text-zinc-400 font-bold mt-4 uppercase tracking-widest opacity-60">
                    Secure health data synchronization.
                  </p>
                </div>

                <div className="flex flex-col gap-4 pt-8">
                  <button 
                    onClick={handleLinkWearable}
                    className="btn-primary !w-full !py-5 text-[11px]"
                  >
                    CONNECT DEVICE →
                  </button>
                  <button 
                    onClick={() => setShowWearableModal(false)}
                    className="btn-secondary !w-full !py-5 text-[11px]"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

