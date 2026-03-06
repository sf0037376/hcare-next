"use client"

import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"

export default function NotificationsPage() {
  const { Toast, show } = useToast()

  async function submit(e) {
    e.preventDefault()

    const body = {
      user_id: e.target.user_id.value,
      title: e.target.title.value,
      message: e.target.message.value,
    }

    try {
      await apiFetch("/notifications/send", {
        method: "POST",
        body: JSON.stringify(body),
      })
      show("Notification queued")
      e.target.reset()
    } catch (e) {
      show("Failed to queue notification")
    }
  }

  return (
    <ProtectedRoute>
      <div className="animate-in fade-in duration-500 max-w-2xl mx-auto">
        {Toast}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Push Notification</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Send an alert or reminder to a specific user.</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-5 pointer-events-none">
            <span className="text-9xl">🔔</span>
          </div>
          
          <form onSubmit={submit} className="relative z-10 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Recipient User ID</label>
              <input
                className="block w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                name="user_id"
                placeholder="Enter User ID"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Notification Title</label>
              <input
                className="block w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                name="title"
                placeholder="e.g. Schedule Update"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Message</label>
              <textarea
                className="block w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium min-h-[120px] resize-y"
                name="message"
                placeholder="Type your message here..."
                required
              />
            </div>
            
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button 
                type="submit"
                className="w-full flex justify-center py-4 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 dark:focus:ring-white transition-all duration-200"
              >
                Send Notification
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}

