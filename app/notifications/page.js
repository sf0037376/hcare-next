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
      <div className="page">
        {Toast}
        <h2 className="page-title">Send Notification</h2>

        <form onSubmit={submit} className="form">
          <input name="user_id" placeholder="User ID" required />
          <input name="title" placeholder="Title" required />
          <textarea name="message" placeholder="Message" required />
          <button type="submit">Send</button>
        </form>
      </div>
    </ProtectedRoute>
  )
}

